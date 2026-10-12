"""
retriever.py – Embeds user queries and searches Qdrant for matching code chunks,
filtering by project_id and similarity score threshold.
"""

import os
from dotenv import load_dotenv

from embeddings import embed_texts
from indexer import get_client, get_collection_name
from qdrant_client.models import Filter, FieldCondition, MatchValue

load_dotenv()

# Default similarity score threshold, overridable via SCORE_THRESHOLD in .env
DEFAULT_SCORE_THRESHOLD: float = float(os.getenv("SCORE_THRESHOLD", "0.35"))


def search(
    project_id: str,
    question: str,
    k: int = 5,
    score_threshold: float | None = None,
) -> list[dict]:
    """
    Search for relevant code chunks matching a question within a project.

    Parameters
    ----------
    project_id : str
        Filter chunks by this project identifier.
    question : str
        The user query / question to embed and search for.
    k : int
        Number of top results to return (default 5).
    score_threshold : float | None
        Minimum similarity score threshold. If None, uses DEFAULT_SCORE_THRESHOLD (0.35).

    Returns
    -------
    list[dict]
        List of matching chunks with score >= score_threshold:
        score, chunk_id, file_path, language, symbol_type, symbol_name,
        class_name, start_line, end_line, code.
    """
    client = get_client()
    collection_name = get_collection_name()

    threshold = score_threshold if score_threshold is not None else DEFAULT_SCORE_THRESHOLD

    # 1. Embed the query question
    query_vector = embed_texts([question])[0]

    # 2. Build filter by project_id
    query_filter = Filter(
        must=[
            FieldCondition(
                key="project_id",
                match=MatchValue(value=project_id),
            )
        ]
    )

    # 3. Perform vector search in Qdrant with score threshold
    results = client.search(
        collection_name=collection_name,
        query_vector=query_vector,
        query_filter=query_filter,
        limit=k,
        score_threshold=threshold,
        with_payload=True,
    )

    # 4. Format results (with explicit threshold verification)
    hits = []
    for point in results:
        if point.score < threshold:
            continue
        payload = point.payload or {}
        hits.append({
            "score": point.score,
            "chunk_id": payload.get("chunk_id"),
            "file_path": payload.get("file_path"),
            "language": payload.get("language"),
            "symbol_type": payload.get("symbol_type"),
            "symbol_name": payload.get("symbol_name"),
            "class_name": payload.get("class_name"),
            "start_line": payload.get("start_line"),
            "end_line": payload.get("end_line"),
            "code": payload.get("code"),
        })

    return hits
