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
import csv
import re

# --- Config ---
EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./faiss_index/index.faiss")
META_PATH = os.getenv("DOCS_META_PATH", "./faiss_index/docs_meta.jsonl")  # stays jsonl

# --- Load Case Data ---
def load_case_data():
    """Load case data from case.txt file"""
    case_data = []
    case_file_path = "./data/judgments/case.txt"
    
    if os.path.exists(case_file_path):
        try:
            with open(case_file_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f, delimiter='|')
                header = next(reader)  # Skip header line
                
                for row in reader:
                    if len(row) >= 5:
                        case_data.append({
                            'case_id': row[0].strip(),
                            'case_type': row[1].strip(),
                            'ipc_section': row[2].strip(),
                            'winning_percentage': float(row[3].strip()),
                            'outcome': row[4].strip()
                        })
            print(f"✅ Loaded {len(case_data)} case records from case.txt")
        except Exception as e:
            print(f"⚠️ Error loading case data: {e}")
    else:
        print("⚠️ Case data file not found at ./data/judgements/case.txt")
    
    return case_data

def find_relevant_cases(query, case_data, max_results=5):
    """Find cases relevant to the user's query"""
    query_lower = query.lower()
    relevant_cases = []
    
    # Define keywords and their associated IPC sections
    keywords_map = {
        'fraud': ['420'], 'cheating': ['420'], 'dishonesty': ['420'],
        'murder': ['302'], 'homicide': ['302'], 'killing': ['302'],
        'false evidence': ['193'], 'perjury': ['193'], 'lying': ['193'],
        'dowry': ['498a'], 'harassment': ['498a'], 'cruelty': ['498a'],
        'rape': ['376'], 'sexual assault': ['376'],
        'attempt to murder': ['307'], 'attempted murder': ['307'],
        'assault': ['323', '324'], 'beating': ['323'], 'hurt': ['323', '324'],
        'theft': ['379'], 'stealing': ['379'],
        'breach of trust': ['406']
    }
    
    for case in case_data:
        relevance_score = 0
        case_section = case['ipc_section'].lower()
        case_type = case['case_type'].lower()
        
        # Direct IPC section matching
        ipc_numbers = re.findall(r'\b(\d{2,3}[a-z]*)\b', query_lower)
        for number in ipc_numbers:
            if number in case_section:
                relevance_score += 20
        
        # Keyword matching
        for keyword, sections in keywords_map.items():
            if keyword in query_lower:
                for section in sections:
                    if section in case_section:
                        relevance_score += 15
        
        # Case type matching
        if any(ctype in query_lower for ctype in ['civil', 'criminal']):
            if any(ctype in case_type for ctype in ['civil', 'criminal'] if ctype in query_lower):
                relevance_score += 10
        
        if relevance_score > 0:
            case_with_score = case.copy()
            case_with_score['relevance_score'] = relevance_score
            relevant_cases.append(case_with_score)
    
    # Sort by relevance and return top results
    relevant_cases.sort(key=lambda x: x['relevance_score'], reverse=True)
    return relevant_cases[:max_results]

def generate_case_context(relevant_cases):
    """Generate context string from relevant cases"""
    if not relevant_cases:
        return ""
    
    context = "\n\n📊 **Historical Case Data Analysis:**\n"
    
    # Group cases by IPC section
    section_stats = {}
    for case in relevant_cases:
        section = case['ipc_section']
        if section not in section_stats:
            section_stats[section] = []
        section_stats[section].append(case)
    
    for section, cases in section_stats.items():
        avg_winning = sum(case['winning_percentage'] for case in cases) / len(cases)
        favorable_count = len([c for c in cases if c['outcome'] == 'Favorable'])
        
        context += f"\n🔹 **{section}** ({len(cases)} cases):\n"
        context += f"   • Average Success Rate: **{avg_winning:.1f}%**\n"
        context += f"   • Favorable Outcomes: {favorable_count}/{len(cases)}\n"
    
    # Overall statistics
    total_cases = len(relevant_cases)
    overall_avg = sum(case['winning_percentage'] for case in relevant_cases) / total_cases
    
    context += f"\n📈 **Overall Analysis** ({total_cases} similar cases):\n"
    context += f"   • Combined Success Rate: **{overall_avg:.1f}%**\n"
    
    # Recommendation
    if overall_avg >= 70:
        recommendation = "🟢 **High probability of success**"
    elif overall_avg >= 50:
        recommendation = "🟡 **Moderate chances of success**"
    else:
        recommendation = "🔴 **Lower probability of success**"
    
    context += f"   • Recommendation: {recommendation}\n"
    
    return context

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
# --- Load Case Data ---
case_data = load_case_data()
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
        print(f"🔍 Received message: {message}")
        
        # Check if question is about case predictions or winning chances
        prediction_keywords = [
            'winning', 'chances', 'probability', 'outcome', 'likely', 
            'success rate', 'predict', 'odds', 'prospects'
        ]
        
        case_context = ""
        if any(keyword in message.lower() for keyword in prediction_keywords):
            relevant_cases = find_relevant_cases(message, case_data)
            if relevant_cases:
                case_context = generate_case_context(relevant_cases)
                print(f"✅ Generated case context: {case_context}")
        
        # Enhanced system prompt to avoid disclaimers
        system_prompt = """You are an expert legal data analyst specializing in Indian law case predictions.
        When provided with historical case data and statistics, use them to give direct, realistic probability assessments.
        Start your response with "Based on historical data" when case statistics are provided.
        Be informative and focus on data-driven analysis rather than disclaimers."""
        
        user_prompt = message + case_context
        print(f"🔍 Sending to LLM: {user_prompt[:200]}...")
        
        # Use Ollama
        response = ollama.chat(model='llama3.1:8b', messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
        ])
        
        raw_response = response['message']['content']
        print(f"🔍 Raw LLM response: {raw_response}")
        
        # Handle multiple disclaimer variations
        disclaimers_to_replace = [
            "I cannot provide legal advice, but",
            "I can't provide legal advice, but", 
            "I cannot provide legal advice,",
            "I can't provide legal advice,",
            "I am not a lawyer, but",
            "I'm not a lawyer, but",
        ]
        
        cleaned_response = raw_response
        for disclaimer in disclaimers_to_replace:
            cleaned_response = cleaned_response.replace(
                disclaimer,
                "Based on available legal data,"
            )
        
        print(f"🔍 Cleaned response: {cleaned_response}")
        
        # IMPORTANT: Always include case context if available
        final_response = ""
        if case_context:
            final_response = case_context + "\n\n**Analysis:**\n" + cleaned_response
        else:
            final_response = cleaned_response
        
        print(f"🔍 Final response: {final_response[:200]}...")
        
        return {"response": final_response}
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
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

@app.post("/predict_case")
async def predict_case(request: dict):
    try:
        ipc_section = request.get("ipc_section", "")
        case_type = request.get("case_type", "")
        
        # Find matching cases
        matching_cases = []
        for case in case_data:
            section_match = ipc_section.lower() in case['ipc_section'].lower()
            type_match = not case_type or case_type.lower() in case['case_type'].lower()
            
            if section_match and type_match:
                matching_cases.append(case)
        
        if matching_cases:
            avg_winning = sum(case['winning_percentage'] for case in matching_cases) / len(matching_cases)
            favorable_cases = len([case for case in matching_cases if case['outcome'] == 'Favorable'])
            
            return {
                "ipc_section": ipc_section,
                "case_type": case_type or "All",
                "average_winning_percentage": round(avg_winning, 1),
                "total_cases": len(matching_cases),
                "favorable_cases": favorable_cases,
                "unfavorable_cases": len(matching_cases) - favorable_cases,
                "recommendation": (
                    "High chances of success" if avg_winning > 60 else 
                    "Moderate chances" if avg_winning > 40 else 
                    "Low chances of success"
                )
            }
        else:
            return {
                "message": "No historical data found for the specified criteria",
                "ipc_section": ipc_section
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")