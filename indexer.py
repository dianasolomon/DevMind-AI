"""
indexer.py – Reads parsed code chunks from JSON, embeds them, and
upserts the vectors + metadata into a Qdrant collection.

Also exposes get_client() and get_collection_name() so other modules
(e.g. retriever.py) can share the same Qdrant connection + config.
"""

import json
import os
import uuid

from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PointStruct,
    VectorParams,
    PayloadSchemaType,
)

from embeddings import embed_texts

# ── Load .env ────────────────────────────────────────────────────────────────
load_dotenv()

# ── Qdrant client singleton ─────────────────────────────────────────────────
_client: QdrantClient | None = None


def get_client() -> QdrantClient:
    """
    Return a cached Qdrant client (shared across indexer & retriever).

    * If QDRANT_URL is set  → connect to a remote Qdrant server.
    * If QDRANT_URL is empty → use local file-based storage (no server needed).
    """
    global _client
    if _client is None:
        url = os.getenv("QDRANT_URL", "").strip()
        if url:
            print(f"[qdrant] Connecting to Qdrant at {url}")
            _client = QdrantClient(url=url)
        else:
            local_path = os.path.join(os.path.dirname(__file__), "qdrant_data")
            print(f"[qdrant] Using local Qdrant storage at {local_path}")
            _client = QdrantClient(path=local_path)
    return _client


def get_collection_name() -> str:
    """Return the Qdrant collection name from .env (shared across modules)."""
    return os.getenv("QDRANT_COLLECTION", "devmind_chunks")


def _ensure_collection(client: QdrantClient, collection_name: str) -> None:
    """Create the collection if it doesn't already exist (cosine, dim 384)."""
    existing = [c.name for c in client.get_collections().collections]
    if collection_name not in existing:
        print(f"[indexer] Creating collection '{collection_name}' (dim=384, cosine)")
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )


def _build_embed_text(chunk: dict) -> str:
    """
    Build the string that will be embedded for a single chunk.

    Format:
        File: <file_path>
        <symbol_type> <ClassName>.<symbol_name>      (class_name omitted if null)
        <code>
    """
    class_name = chunk.get("class_name")
    if class_name:
        symbol_line = f"{chunk['symbol_type']} {class_name}.{chunk['symbol_name']}"
    else:
        symbol_line = f"{chunk['symbol_type']} {chunk['symbol_name']}"

    return f"File: {chunk['file_path']}\n{symbol_line}\n{chunk['code']}"


# ── Public API ───────────────────────────────────────────────────────────────

def index_project(project_id: str, chunks_path: str) -> int:
    """
    Index code chunks for a single project.

    Parameters
    ----------
    project_id : str
        Only chunks whose ``project_id`` matches this value are indexed.
    chunks_path : str
        Path to a JSON file containing a list of chunk dicts.

    Returns
    -------
    int
        The number of chunks that were indexed.
    """
    # 1. Load chunks and filter by project_id
    with open(chunks_path, "r", encoding="utf-8") as f:
        all_chunks: list[dict] = json.load(f)

    chunks = [c for c in all_chunks if c["project_id"] == project_id]
    if not chunks:
        print(f"[indexer] No chunks found for project_id='{project_id}'")
        return 0

    print(f"[indexer] {len(chunks)} chunk(s) matched project_id='{project_id}'")

    # 2. Build the text-to-embed for each chunk
    texts = [_build_embed_text(c) for c in chunks]

    # 3. Embed all texts via sentence-transformers
    vectors = embed_texts(texts)

    # 4. Prepare Qdrant collection
    collection_name = get_collection_name()
    client = get_client()
    _ensure_collection(client, collection_name)

    # 5. Build Qdrant points and upsert
    points = []
    for chunk, vector in zip(chunks, vectors):
        # Deterministic UUID derived from chunk_id → idempotent upserts
        point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, chunk["chunk_id"]))
        points.append(
            PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "chunk_id":    chunk["chunk_id"],
                    "project_id":  chunk["project_id"],
                    "file_path":   chunk["file_path"],
                    "language":    chunk["language"],
                    "symbol_type": chunk["symbol_type"],
                    "symbol_name": chunk["symbol_name"],
                    "class_name":  chunk.get("class_name"),
                    "start_line":  chunk["start_line"],
                    "end_line":    chunk["end_line"],
                    "code":        chunk["code"],
                },
            )
        )

    client.upsert(collection_name=collection_name, points=points)
    print(f"[indexer] Upserted {len(points)} point(s) into '{collection_name}'")

    # 6. Create a payload index on project_id for fast filtered searches
    client.create_payload_index(
        collection_name=collection_name,
        field_name="project_id",
        field_schema=PayloadSchemaType.KEYWORD,
    )

    return len(points)
