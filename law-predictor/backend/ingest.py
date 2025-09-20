import os, json, argparse
from pathlib import Path
from tqdm import tqdm
import pdfplumber
from bs4 import BeautifulSoup
import requests
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import uuid

EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./faiss_index/index.faiss")
META_PATH = os.getenv("DOCS_META_PATH", "./faiss_index/docs_meta.jsonl")
D = 384  # embedding dimension for MiniLM-L6

def ensure_dirs():
    Path(os.path.dirname(INDEX_PATH)).mkdir(parents=True, exist_ok=True)

def extract_text_from_pdf(path):
    text = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                text.append(txt)
    return "\n".join(text)

def extract_text_from_html(path):
    if path.startswith("http"):
        r = requests.get(path, timeout=20)
        html = r.text
    else:
        html = open(path, "r", encoding="utf-8").read()
    soup = BeautifulSoup(html, "html.parser")
    for s in soup(["script","style"]):
        s.decompose()
    return soup.get_text(separator="\n")

def chunk_text(text, chunk_size=800, overlap=100):
    words = text.split()
    i, chunks = 0, []
    while i < len(words):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)
        i += (chunk_size - overlap)
    return chunks

def create_or_load_index(dimension):
    if os.path.exists(INDEX_PATH):
        return faiss.read_index(INDEX_PATH)
    return faiss.IndexFlatL2(dimension)

def main(data_dirs):
    ensure_dirs()
    embedder = SentenceTransformer(EMBED_MODEL)
    index = create_or_load_index(D)
    meta_f = open(META_PATH, "a", encoding="utf-8")

    for d in data_dirs:
        for root,_,files in os.walk(d):
            for f in files:
                path = os.path.join(root,f)
                if f.lower().endswith(".pdf"):
                    text = extract_text_from_pdf(path)
                elif f.lower().endswith((".html",".htm")):
                    text = extract_text_from_html(path)
                else:
                    try:
                        text = open(path,"r",encoding="utf-8").read()
                    except:
                        continue
                if not text or len(text.split()) < 50:
                    continue
                chunks = chunk_text(text, chunk_size=600, overlap=120)
                for chunk in chunks:
                    emb = embedder.encode([chunk], show_progress_bar=False)
                    emb = np.array(emb).astype("float32")
                    index.add(emb)
                    meta = {"id": str(uuid.uuid4()), "source_path": path, "text": chunk[:2000]}
                    meta_f.write(json.dumps(meta, ensure_ascii=False)+"\n")

    faiss.write_index(index, INDEX_PATH)
    meta_f.close()
    print("✅ Ingestion complete. Index saved to", INDEX_PATH)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dirs", nargs="+", default=["./data/statutes","./data/judgments"])
    args = parser.parse_args()
    main(args.dirs)
