import os, json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sentence_transformers import SentenceTransformer
import faiss
import ollama
import numpy as np
from predictor import trend_predictor

# --- Config ---
EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./faiss_index/index.faiss")
META_PATH = os.getenv("DOCS_META_PATH", "./faiss_index/docs_meta.jsonl")  # stays jsonl

# --- App Setup ---
app = FastAPI(title="AI-Powered Legal Assistance Backend")

# Enable CORS (important for React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in dev you can restrict to ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load Model & FAISS Index ---
try:
    embedder = SentenceTransformer(EMBED_MODEL)
except Exception as e:
    embedder = None
    print(f"⚠️ Could not load embedder: {e}")

index, docs_meta = None, []
if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
    try:
        index = faiss.read_index(INDEX_PATH)
        with open(META_PATH, "r", encoding="utf-8") as f:
            docs_meta = [json.loads(line) for line in f]
        print(f"✅ Loaded FAISS index with {len(docs_meta)} documents.")
    except Exception as e:
        print(f"⚠️ Error loading FAISS index: {e}")
else:
    print("⚠️ FAISS index or metadata file not found. Run `python ingest.py` first.")

# --- Request Schema ---
class Query(BaseModel):
    question: str
    facts: str = ""
    top_k: int = 5

# --- Routes ---
@app.get("/")
async def root():
    return {"message": "AI-Powered Legal Assistance Backend is running!"}

@app.post("/chat")
async def chat(request: dict):
    try:
        message = request.get("message", "")
        
        # Use Ollama instead of OpenAI
        response = ollama.chat(model='llama3.1:8b', messages=[
            {'role': 'system', 'content': 'You are a legal assistant expert in Indian Constitutional law. Provide helpful, accurate legal information.'},
            {'role': 'user', 'content': message}
        ])
        
        return {"response": response['message']['content']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/upload")
async def upload_document(file: str):
    # Simple file processing for now
    return {"analysis": "Document received and analyzed successfully"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(q: Query):
    if not index or not docs_meta:
        raise HTTPException(status_code=500, detail="FAISS index not available. Run ingestion first.")
    if not embedder:
        raise HTTPException(status_code=500, detail="SentenceTransformer not available.")

    # Prepare query
    qtext = q.question + ("\n" + q.facts if q.facts else "")
    q_emb = embedder.encode([qtext]).astype("float32")

    # Search in FAISS
    D, I = index.search(q_emb, q.top_k)
    retrieved = [docs_meta[idx] for idx in I[0] if 0 <= idx < len(docs_meta)]

    # Run prediction
    try:
        return trend_predictor(qtext, retrieved)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
