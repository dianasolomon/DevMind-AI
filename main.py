"""
main.py – FastAPI entry-point for the DevMind AI service.

Currently exposes:
  GET  /health  → liveness check
  POST /index   → index code chunks into Qdrant
  POST /search  → temporary endpoint to test retrieval
  POST /ask     → RAG answer generation with source citations
"""

import os
import re
import logging
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from dotenv import load_dotenv

from indexer import index_project
from retriever import search
from llm import generate_answer, LLMConfigError, LLMError

logger = logging.getLogger("devmind.api")

# ── Load .env into os.environ ────────────────────────────────────────────────
load_dotenv()

# ── App instance ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="DevMind AI Service",
    description="RAG backend – embeds code chunks, stores them in Qdrant, "
                "and answers developer questions with cited sources.",
    version="0.1.0",
)


# ── Request / Response schemas ───────────────────────────────────────────────
class AskRequest(BaseModel):
    """Body for POST /ask."""
    question: str            # the developer's question
    project_id: str          # scope the search to one project


class IndexRequest(BaseModel):
    """Body for POST /index."""
    project_id: str          # which project to index
    chunks_path: str         # path to the JSON file with parsed chunks


class IndexResponse(BaseModel):
    """Response for POST /index."""
    indexed: int             # number of chunks that were indexed


class SearchRequest(BaseModel):
    """Body for temporary POST /search."""
    project_id: str                 # scope search to one project
    question: str                   # user query
    k: int = 3                      # number of results to retrieve
    score_threshold: float | None = None  # optional similarity threshold override


class Source(BaseModel):
    """A single source reference returned alongside the answer."""
    file_path: str
    start_line: int
    end_line: int


class AskResponse(BaseModel):
    """Response for POST /ask."""
    answer: str
    sources: list[Source]


# Stopwords to ignore when analyzing code identifier overlap
_STOP_WORDS = {
    "public", "private", "protected", "class", "def", "return", "import", "from",
    "true", "false", "none", "null", "string", "int", "boolean", "void", "self",
    "this", "function", "const", "var", "let", "the", "and", "for", "with", "that"
}


def filter_supporting_sources(answer: str, chunks: list[dict]) -> list[Source]:
    """
    Select sources from retrieved chunks that genuinely support the generated answer.

    A chunk is considered supporting if:
    1. Its file path or base name is referenced in the answer.
    2. Its symbol name or class name is referenced in the answer.
    3. Multiple distinctive code identifiers from the snippet appear in the answer.

    If the answer is a high-level paraphrase without verbatim tokens,
    the highest-scoring chunk from the retrieved context is preserved to guarantee attribution.
    """
    if not chunks:
        return []

    answer_lower = answer.lower()
    supporting_sources: list[Source] = []
    seen_sources = set()

    for chunk in chunks:
        is_supported = False
        file_path = chunk.get("file_path", "")
        base_name = os.path.basename(file_path)
        symbol_name = chunk.get("symbol_name") or ""
        class_name = chunk.get("class_name") or ""
        code = chunk.get("code") or ""

        # 1. Mention of file path or file base name
        if file_path and file_path.lower() in answer_lower:
            is_supported = True
        elif base_name and len(base_name) > 3 and base_name.lower() in answer_lower:
            is_supported = True

        # 2. Mention of symbol or class name
        if not is_supported and symbol_name and len(symbol_name) >= 3:
            if symbol_name.lower() in answer_lower:
                is_supported = True
        if not is_supported and class_name and len(class_name) >= 3:
            if class_name.lower() in answer_lower:
                is_supported = True

        # 3. Substantive code token overlap (handles paraphrasing without verbatim names)
        if not is_supported and code:
            tokens = set(re.findall(r"[A-Za-z_][A-Za-z0-9_]{3,}", code))
            tokens = {t.lower() for t in tokens if t.lower() not in _STOP_WORDS}
            matches = sum(1 for t in tokens if t in answer_lower)
            if matches >= 2:
                is_supported = True

        if is_supported:
            key = (chunk["file_path"], chunk["start_line"], chunk["end_line"])
            if key not in seen_sources:
                seen_sources.add(key)
                supporting_sources.append(
                    Source(
                        file_path=chunk["file_path"],
                        start_line=chunk["start_line"],
                        end_line=chunk["end_line"],
                    )
                )

    # Fallback for general paraphrases: retain the top-ranked chunk provided in context
    if not supporting_sources and chunks:
        top_chunk = chunks[0]
        supporting_sources.append(
            Source(
                file_path=top_chunk["file_path"],
                start_line=top_chunk["start_line"],
                end_line=top_chunk["end_line"],
            )
        )

    return supporting_sources


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    """Simple liveness probe – returns 200 if the service is up."""
    return {"status": "ok"}


@app.post("/index", response_model=IndexResponse)
async def index(body: IndexRequest):
    """
    Index code chunks for a project.

    Reads the JSON file at ``chunks_path``, embeds the matching chunks,
    and upserts them into Qdrant.
    """
    count = index_project(body.project_id, body.chunks_path)
    return IndexResponse(indexed=count)


@app.post("/search")
async def search_endpoint(body: SearchRequest):
    """
    Temporary search endpoint to test retrieval before LLM is connected.
    """
    return search(
        project_id=body.project_id,
        question=body.question,
        k=body.k,
        score_threshold=body.score_threshold,
    )



@app.post("/ask", response_model=AskResponse)
async def ask(body: AskRequest):
    """
    Answer a question using retrieved code chunks and an LLM:
      1. Search Qdrant for top-k matching chunks in project_id.
      2. If no chunks found, return message with empty sources (no LLM call).
      3. Call the LLM with context and question.
      4. Return the generated answer and source references.
    """
    # 1. Retrieve relevant chunks with separate retrieval error handling
    try:
        chunks = search(project_id=body.project_id, question=body.question, k=5)
    except Exception as e:
        logger.exception("Retrieval failed during /ask")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval error: {str(e)}",
        )

    # 2. Return early if no relevant code was found
    if not chunks:
        return AskResponse(
            answer="No relevant code was found for this question in the selected project.",
            sources=[],
        )

    # 3. Generate answer via LLM
    try:
        answer = generate_answer(question=body.question, chunks=chunks)
    except LLMConfigError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"LLM configuration error: {str(e)}",
        )
    except LLMError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Unexpected error during answer generation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while generating the answer.",
        )

    # 4. Filter sources to those that genuinely support the generated answer
    sources = filter_supporting_sources(answer=answer, chunks=chunks)

    return AskResponse(
        answer=answer,
        sources=sources,
    )
