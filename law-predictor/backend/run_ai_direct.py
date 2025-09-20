import argparse
import json
from predictor import trend_predictor
from sentence_transformers import SentenceTransformer
import faiss, os
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()

    # Load config
    EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./faiss_index/index.faiss")
    META_PATH = os.getenv("DOCS_META_PATH", "./faiss_index/docs_meta.jsonl")

    # Load embedding model
    embedder = SentenceTransformer(EMBED_MODEL)

    # Load FAISS index
    index = faiss.read_index(INDEX_PATH)

    # Load metadata
    with open(META_PATH, "r", encoding="utf-8") as f:
        docs_meta = [json.loads(line) for line in f]

    # Parse user input
    parser = argparse.ArgumentParser()
    parser.add_argument("--q", type=str, required=True, help="Legal question")
    parser.add_argument("--facts", type=str, default="", help="Supporting facts")
    parser.add_argument("--top_k", type=int, default=5, help="Number of chunks to retrieve")
    args = parser.parse_args()

    question = args.q
    facts = args.facts
    top_k = args.top_k
    qtext = question + ("\n" + facts if facts else "")
    q_emb = embedder.encode([qtext]).astype("float32")

    # Search index
    D, I = index.search(q_emb, top_k)
    raw_retrieved = [docs_meta[idx] for idx in I[0] if 0 <= idx < len(docs_meta)]

    retrieved = raw_retrieved  # Use all retrieved docs, no keyword filtering

    # Run prediction
    result = trend_predictor(qtext, retrieved)

    # Print result once
    print("\n✅ Final AI Output:\n")
    print(json.dumps(result, indent=2, ensure_ascii=False))

# Ensure script runs only once
if __name__ == "__main__":
    main()