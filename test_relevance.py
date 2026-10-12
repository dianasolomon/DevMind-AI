"""
test_relevance.py – Offline test suite for project isolation, score thresholding,
and source attribution filtering.
"""

import sys
from retriever import search, DEFAULT_SCORE_THRESHOLD
from main import filter_supporting_sources, Source

# Ensure console supports utf-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def test_project_isolation():
    print("[1] Testing Project Isolation...")
    hits = search(project_id="other-project", question="How do I verify a user's password?", k=5)
    assert len(hits) == 0, f"Expected 0 hits for other-project, got {len(hits)}"
    print("    PASSED: other-project returned 0 hits (isolated from demo-project).")


def test_threshold_filtering():
    print("\n[2] Testing Score Threshold Filtering...")
    q = "How do I verify a user's password?"

    # Baseline: no threshold (score_threshold=0.0) -> returns all 3 chunks in demo-project
    all_hits = search(project_id="demo-project", question=q, k=5, score_threshold=0.0)
    assert len(all_hits) == 3, f"Expected 3 chunks with 0.0 threshold, got {len(all_hits)}"
    print(f"    Baseline (threshold=0.0): {len(all_hits)} chunks retrieved.")

    # Default threshold (0.35) -> should filter out UserService.java (~0.24, ~0.17)
    filtered_hits = search(project_id="demo-project", question=q, k=5)
    assert len(filtered_hits) == 1, f"Expected 1 chunk with default threshold, got {len(filtered_hits)}"
    assert filtered_hits[0]["file_path"] == "app/auth.py", f"Expected app/auth.py, got {filtered_hits[0]['file_path']}"
    assert filtered_hits[0]["score"] >= DEFAULT_SCORE_THRESHOLD
    print(f"    Default threshold ({DEFAULT_SCORE_THRESHOLD}): 1 chunk retrieved ({filtered_hits[0]['file_path']}:{filtered_hits[0]['start_line']}, score={filtered_hits[0]['score']:.4f}).")

    # High threshold (0.95) -> should return 0 chunks
    strict_hits = search(project_id="demo-project", question=q, k=5, score_threshold=0.95)
    assert len(strict_hits) == 0, f"Expected 0 chunks with 0.95 threshold, got {len(strict_hits)}"
    print("    Strict threshold (0.95): 0 chunks retrieved.")


def test_source_attribution_filtering():
    print("\n[3] Testing Source Attribution & Filtering...")

    mock_chunks = [
        {
            "file_path": "app/auth.py",
            "start_line": 5,
            "end_line": 20,
            "symbol_name": "verify_password",
            "symbol_type": "function",
            "class_name": None,
            "code": "def verify_password(plain, hashed):\n    return bcrypt.checkpw(plain.encode(), hashed)",
        },
        {
            "file_path": "src/UserService.java",
            "start_line": 12,
            "end_line": 30,
            "symbol_name": "createUser",
            "symbol_type": "method",
            "class_name": "UserService",
            "code": "public User createUser(String name) {\n    User u = new User(name);\n    return userRepository.save(u);\n}",
        },
    ]

    # Scenario A: Answer explicitly discusses verify_password in app/auth.py
    answer_a = "You can verify a password by calling verify_password in app/auth.py using bcrypt."
    sources_a = filter_supporting_sources(answer_a, mock_chunks)
    assert len(sources_a) == 1, f"Expected 1 source, got {len(sources_a)}"
    assert sources_a[0].file_path == "app/auth.py"
    print("    Scenario A (explicit citation): correctly cited app/auth.py and dropped UserService.java.")

    # Scenario B: Paraphrased answer without filename, but using code identifiers (bcrypt, checkpw)
    answer_b = "The password check encodes the plain input and compares it against hashed bytes via bcrypt.checkpw."
    sources_b = filter_supporting_sources(answer_b, mock_chunks)
    assert len(sources_b) == 1, f"Expected 1 source, got {len(sources_b)}"
    assert sources_b[0].file_path == "app/auth.py"
    print("    Scenario B (paraphrased with code tokens): correctly cited app/auth.py via token overlap.")

    # Scenario C: Answer discusses creating a user
    answer_c = "To create a user, call createUser on the UserService class which saves it to userRepository."
    sources_c = filter_supporting_sources(answer_c, mock_chunks)
    assert len(sources_c) == 1, f"Expected 1 source, got {len(sources_c)}"
    assert sources_c[0].file_path == "src/UserService.java"
    print("    Scenario C (UserService citation): correctly cited src/UserService.java.")

    # Scenario D: Paraphrased summary with no verbatim tokens -> fallback preserves top chunk
    answer_d = "Authentication is handled by validating credentials."
    sources_d = filter_supporting_sources(answer_d, mock_chunks)
    assert len(sources_d) == 1
    assert sources_d[0].file_path == mock_chunks[0]["file_path"]
    print("    Scenario D (general summary fallback): preserved top chunk for attribution without dropping sources.")


if __name__ == "__main__":
    test_project_isolation()
    test_threshold_filtering()
    test_source_attribution_filtering()
    print("\n[OK] All offline tests passed successfully!")
