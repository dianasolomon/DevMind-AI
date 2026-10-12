"""
llm.py – LLM-based answer generation using LangChain and ChatOpenAI.

Reads LLM configuration from environment variables (.env) and provides
an OpenAI-compatible interface adaptable to multiple providers
(OpenAI, Groq, Ollama, OpenRouter, Azure, local vLLM, etc.).
"""

import os
import logging
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

logger = logging.getLogger("devmind.llm")


class LLMConfigError(Exception):
    """Raised when LLM configuration is missing or invalid."""
    pass


class LLMError(Exception):
    """Raised when an error occurs during LLM execution."""
    pass


SYSTEM_PROMPT = """You are DevMind AI, an assistant that helps developers understand a codebase.
Answer the developer's question based strictly on the provided code context.

Rules:
1. Rely only on the code and context provided below.
2. Do not invent details, assumptions, or behavior not present in the code.
3. If the provided context is insufficient to answer the question, clearly state that not enough information is available.
4. Reference the relevant file paths and line numbers when discussing the code.
"""


def _get_chat_model() -> ChatOpenAI:
    """
    Instantiate and return ChatOpenAI based on environment variables.

    Raises LLMConfigError if the API key is missing or set to placeholder.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key or api_key == "your-key-here":
        raise LLMConfigError(
            "OPENAI_API_KEY is not configured or still set to the placeholder value. "
            "Please configure a valid API key in .env."
        )

    model_name = os.getenv("OPENAI_MODEL_NAME") or os.getenv("LLM_MODEL") or "gpt-4o-mini"
    base_url = os.getenv("OPENAI_BASE_URL") or os.getenv("LLM_BASE_URL") or None

    kwargs = {
        "model": model_name,
        "api_key": api_key,
        "temperature": 0.0,
    }
    if base_url:
        kwargs["base_url"] = base_url

    return ChatOpenAI(**kwargs)


def _format_context(chunks: list[dict]) -> str:
    """Format retrieved code chunks into a structured prompt context."""
    sections = []
    for i, chunk in enumerate(chunks, 1):
        file_path = chunk.get("file_path", "unknown")
        start_line = chunk.get("start_line", "?")
        end_line = chunk.get("end_line", "?")
        symbol_type = chunk.get("symbol_type", "symbol")
        class_name = chunk.get("class_name")
        symbol_name = chunk.get("symbol_name", "")
        code = chunk.get("code", "")

        symbol_desc = f"{class_name}.{symbol_name}" if class_name else symbol_name

        section = (
            f"--- Context Chunk {i} ---\n"
            f"File: {file_path} (lines {start_line}-{end_line})\n"
            f"Symbol: {symbol_type} {symbol_desc}\n"
            f"Code:\n{code}"
        )
        sections.append(section)
    return "\n\n".join(sections)


def _extract_text_content(content: object) -> str:
    """
    Safely extract text from chat response content, handling strings,
    lists of content blocks, or dicts without crashing.
    """
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                text_val = item.get("text") or item.get("content") or ""
                if text_val:
                    parts.append(str(text_val))
            else:
                parts.append(str(item))
        return "\n".join(parts)
    return str(content) if content is not None else ""


def generate_answer(question: str, chunks: list[dict]) -> str:
    """
    Generate an answer to the question using the retrieved code chunks.

    Parameters
    ----------
    question : str
        The developer's question.
    chunks : list[dict]
        Retrieved code chunks from retriever.search().

    Returns
    -------
    str
        The LLM's generated response.
    """
    llm = _get_chat_model()
    context_text = _format_context(chunks)

    user_message = (
        f"Context code snippets:\n\n{context_text}\n\n"
        f"Developer Question: {question}\n\n"
        f"Answer:"
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_message),
    ]

    try:
        response = llm.invoke(messages)
        return _extract_text_content(response.content)
    except LLMConfigError:
        raise
    except Exception as e:
        # Full diagnostic traceback is recorded in the server logs
        logger.exception("LLM generation failed: %s", type(e).__name__)
        # Sanitize any sensitive details from the user-facing exception
        err_msg = str(e)
        api_key = os.getenv("OPENAI_API_KEY", "")
        if api_key and api_key in err_msg:
            err_msg = err_msg.replace(api_key, "[REDACTED]")
        raise LLMError(f"LLM provider error: {type(e).__name__} - {err_msg}") from e
