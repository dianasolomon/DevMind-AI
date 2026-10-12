"""
embeddings.py – Thin wrapper around sentence-transformers.

Loads the model once (on first call) and exposes a single function
that converts a list of strings into a list of embedding vectors.
"""

import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# ── Load .env so EMBEDDING_MODEL is available ────────────────────────────────
load_dotenv()

# ── Module-level singleton: the model is loaded lazily on first use ──────────
_model: SentenceTransformer | None = None

# How many texts to encode in one GPU/CPU batch
_BATCH_SIZE = 32


def _get_model() -> SentenceTransformer:
    """Return the cached model, loading it on the first call."""
    global _model
    if _model is None:
        model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
        print(f"[embeddings] Loading model '{model_name}' …")
        _model = SentenceTransformer(model_name)
        print(f"[embeddings] Model loaded  (dim={_model.get_sentence_embedding_dimension()})")
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of strings and return a list of float vectors.

    Parameters
    ----------
    texts : list[str]
        The strings to embed (code snippets, questions, etc.).

    Returns
    -------
    list[list[float]]
        One embedding vector per input string.
    """
    model = _get_model()
    # encode() returns a numpy ndarray; convert to plain Python lists
    embeddings = model.encode(texts, batch_size=_BATCH_SIZE, show_progress_bar=False)
    return embeddings.tolist()
