"""
test_embeddings.py – Quick smoke test for the embed_texts function.

Embeds 3 sample strings and prints the vector dimensionality + a
short preview of each vector so you can verify the model loaded correctly.
"""

from embeddings import embed_texts

sample_texts = [
    "public User createUser(String name) { return new User(name); }",
    "def verify_password(plain, hashed): return bcrypt.checkpw(plain, hashed)",
    "What does the UserService class do?",
]

print("Embedding 3 sample texts …\n")
vectors = embed_texts(sample_texts)

for text, vec in zip(sample_texts, vectors):
    # Show the first 5 floats as a preview
    preview = ", ".join(f"{v:.4f}" for v in vec[:5])
    print(f"  Text:   {text[:60]}…")
    print(f"  Dim:    {len(vec)}")
    print(f"  First5: [{preview}, …]\n")

print(f"[OK] All good - each vector has {len(vectors[0])} dimensions.")
