"""
DevMind AI — Code Parsing and Indexing

Scans an already-extracted project directory, parses Java/Python source files
with Tree-sitter, and writes structured code chunks to JSON.

Install:
    pip install tree-sitter-language-pack

Run:
    python code_parser.py /path/to/extracted/project --output code_chunks.json --project-id demo-project
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

try:
    from tree_sitter_language_pack import get_parser
except ImportError as exc:
    raise SystemExit(
        "Missing dependency. Install it with: "
        "pip install tree-sitter-language-pack"
    ) from exc


# Keep the prototype focused. More languages can be added later.
LANGUAGES = {
    ".py": "python",
    ".java": "java",
}

# Directories that usually contain generated files, dependencies, or build output.
IGNORED_DIRS = {
    ".git", ".idea", ".vscode", "__pycache__", ".venv", "venv",
    "node_modules", "target", "build", "dist", ".next",
}

# Avoid trying to parse very large files in a short prototype.
MAX_FILE_BYTES = 1_000_000


def node_text(source: bytes, node: Any) -> str:
    """Return the source text covered by a Tree-sitter node."""
    return source[node.start_byte:node.end_byte].decode("utf-8", errors="replace")


def find_name(node: Any, source: bytes) -> str | None:
    """Find a child identifier used as the name of a class/function."""
    for child in node.children:
        if child.type in {"identifier", "name"}:
            return node_text(source, child)
    # Some grammar nodes put the name in a field.
    name_node = node.child_by_field_name("name")
    if name_node is not None:
        return node_text(source, name_node)
    return None


def collect_symbols(node: Any, source: bytes, language: str, class_name: str | None = None):
    """
    Yield class/function/method nodes.
    The full node text is kept as a chunk so the result is useful to retrieval.
    """
    if language == "python":
        class_types = {"class_definition"}
        function_types = {"function_definition"}
    elif language == "java":
        class_types = {
            "class_declaration", "interface_declaration",
            "enum_declaration", "record_declaration",
        }
        function_types = {"method_declaration", "constructor_declaration"}
    else:
        return

    if node.type in class_types:
        name = find_name(node, source) or "anonymous_class"
        yield {
            "symbol_type": "class",
            "symbol_name": name,
            "class_name": name,
            "node": node,
        }
        # Continue into this class so its methods are extracted too.
        for child in node.children:
            yield from collect_symbols(child, source, language, class_name=name)
        return

    if node.type in function_types:
        name = find_name(node, source) or "anonymous_function"
        yield {
            "symbol_type": "function" if language == "python" else "method",
            "symbol_name": name,
            "class_name": class_name,
            "node": node,
        }
        # Don't recursively split a function into nested functions for this prototype.
        return

    for child in node.children:
        yield from collect_symbols(child, source, language, class_name)


def make_chunks(file_path: Path, root_dir: Path, project_id: str) -> list[dict[str, Any]]:
    extension = file_path.suffix.lower()
    language = LANGUAGES.get(extension)
    if language is None:
        return []

    try:
        if file_path.stat().st_size > MAX_FILE_BYTES:
            print(f"Skipping large file: {file_path}")
            return []
        source = file_path.read_bytes()
        parser = get_parser(language)
        tree = parser.parse(source)
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"Could not parse {file_path}: {exc}")
        return []

    relative_path = file_path.relative_to(root_dir).as_posix()
    chunks: list[dict[str, Any]] = []

    # Record class/function/method nodes. If a file has no recognized symbols,
    # keep the whole file as one fallback chunk.
    for symbol in collect_symbols(tree.root_node, source, language):
        node = symbol["node"]
        text = node_text(source, node).strip()
        if not text:
            continue

        chunks.append({
            "chunk_id": f"{project_id}:{relative_path}:{node.start_point.row + 1}:{node.end_point.row + 1}",
            "project_id": project_id,
            "file_path": relative_path,
            "language": language,
            "symbol_type": symbol["symbol_type"],
            "symbol_name": symbol["symbol_name"],
            "class_name": symbol["class_name"],
            "start_line": node.start_point.row + 1,
            "end_line": node.end_point.row + 1,
            "code": text,
        })

    if not chunks and source.strip():
        chunks.append({
            "chunk_id": f"{project_id}:{relative_path}:file",
            "project_id": project_id,
            "file_path": relative_path,
            "language": language,
            "symbol_type": "file",
            "symbol_name": file_path.name,
            "class_name": None,
            "start_line": 1,
            "end_line": len(source.splitlines()),
            "code": source.decode("utf-8", errors="replace").strip(),
        })

    return chunks


def should_skip(path: Path) -> bool:
    return any(part in IGNORED_DIRS for part in path.parts)


def index_project(project_dir: Path, project_id: str) -> list[dict[str, Any]]:
    """Parse supported files in an extracted project directory."""
    root_dir = project_dir.resolve()
    if not root_dir.exists() or not root_dir.is_dir():
        raise ValueError(f"Project directory does not exist: {root_dir}")

    chunks: list[dict[str, Any]] = []
    for file_path in root_dir.rglob("*"):
        if not file_path.is_file() or should_skip(file_path.relative_to(root_dir)):
            continue
        if file_path.suffix.lower() not in LANGUAGES:
            continue
        chunks.extend(make_chunks(file_path, root_dir, project_id))

    return chunks


def main() -> None:
    cli = argparse.ArgumentParser(description="Parse project code into JSON chunks.")
    cli.add_argument("project_dir", help="Path to an already-extracted project directory")
    cli.add_argument("--output", default="code_chunks.json", help="Output JSON file")
    cli.add_argument("--project-id", default="local-project", help="Project identifier")
    args = cli.parse_args()

    chunks = index_project(Path(args.project_dir), args.project_id)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(chunks, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Done. Parsed {len(chunks)} code chunks.")
    print(f"JSON output: {output_path.resolve()}")


if __name__ == "__main__":
    main()
