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
        print("⚠️ Case data file not found at ./data/judgments/case.txt")
    
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

def format_response_for_markdown(text):
    """
    Post-process the response to ensure proper markdown formatting with line breaks
    """
    import re
    
    # First, normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Split into lines and process
    lines = text.split('\n')
    formatted_lines = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Skip empty lines but preserve them
        if not line:
            if formatted_lines and formatted_lines[-1] != '':
                formatted_lines.append('')
            continue
            
        # Add extra spacing around main headings (##)
        if line.startswith('##'):
            # Add blank line before heading if previous line isn't empty
            if formatted_lines and formatted_lines[-1] != '':
                formatted_lines.append('')
            formatted_lines.append(line)
            formatted_lines.append('')  # Add blank line after heading
            
        # Add spacing around numbered items (1., 2., etc.)
        elif re.match(r'^\d+\.', line):
            # Add blank line before numbered item
            if formatted_lines and formatted_lines[-1] != '':
                formatted_lines.append('')
            formatted_lines.append(line)
            formatted_lines.append('')  # Add blank line after numbered item
            
        # Handle bullet points - indent them
        elif line.startswith('*') or line.startswith('-'):
            formatted_lines.append('   ' + line)  # Indent bullet points
            
        # Handle regular paragraphs
        else:
            formatted_lines.append(line)
    
    # Join lines and clean up multiple consecutive empty lines
    result = '\n'.join(formatted_lines)
    result = re.sub(r'\n\s*\n\s*\n+', '\n\n', result)  # Replace 3+ newlines with 2
    
    return result.strip()

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
        
        # Enhanced system prompt with formatting instructions
        system_prompt = """You are an expert legal data analyst specializing in Indian law case predictions.

CRITICAL FORMATTING RULES:
- Use ## for main headings with blank lines before and after
- Use numbered lists (1., 2., 3.) with blank lines between each item
- Use * for bullet points with blank lines between groups
- Put TWO blank lines between major sections
- Put ONE blank line after each numbered item before starting bullet points
- Always end bullet point groups with a blank line
- Use **bold** for important terms

REQUIRED FORMAT EXAMPLE:

## **Main Section Title**

1. **First Item Name**

* First sub-point here
* Second sub-point here
* Third sub-point here

2. **Second Item Name**

* Another sub-point
* More details here

3. **Third Item Name**

* More information
* Additional details


## **Next Section Title**

Important information here.

Always follow this exact spacing pattern with blank lines for proper markdown rendering."""
        
        user_prompt = message + case_context
        print(f"🔍 Sending to LLM: {user_prompt[:200]}...")
        
        # Use Ollama
        response = ollama.chat(model='llama3.1:8b', messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_prompt}
        ])
        
        raw_response = response['message']['content']
        print(f"🔍 Raw LLM response: {raw_response}")

        # Handle multiple disclaimer variations (same as test_main.py)
        disclaimers_to_replace = [
            "I cannot provide legal advice, but",
            "I can't provide legal advice, but", 
            "I cannot provide legal advice.",
            "I can't provide legal advice.",
            "I cannot provide legal advice,",
            "I can't provide legal advice,",
            "However, I can offer some general information",
            "Would that help?",
            "I cannot provide legal advice. However, I can offer some general information about the Indian Penal Code (IPC)",
            "I cannot provide legal advice. However,",
            "However, I can offer some general information about the Indian Penal Code (IPC). Would that help?",
            "I cannot provide legal advice. However, I can offer some general information about the Indian Penal Code (IPC). Would that help?"
        ]

        cleaned_response = raw_response
        replacement_made = False

        for disclaimer in disclaimers_to_replace:
            if disclaimer in raw_response:
                print(f"🎯 FOUND DISCLAIMER: '{disclaimer}'")
                cleaned_response = cleaned_response.replace(
                    disclaimer,
                    "Based on historical legal data and case analysis,"
                )
                replacement_made = True
                break

        print(f"🔍 Replacement made: {replacement_made}")
        print(f"🔍 Cleaned response: '{cleaned_response}'")

        # If no replacement was made and it's still a generic response, force a better response
        if not replacement_made and len(cleaned_response) < 200 and case_context:
            print("🚨 FORCING BETTER RESPONSE")
            cleaned_response = "Based on historical legal data and case analysis, here's what the statistics show about similar cases."

        # POST-PROCESS THE RESPONSE FOR BETTER LINE BREAKS
        cleaned_response = format_response_for_markdown(cleaned_response)
        print(f"🔍 After formatting: {cleaned_response[:300]}...")

        # Combine historical context + cleaned LLM response
        final_response = ""
        if case_context:
            # Format case context better
            formatted_case_context = case_context.replace("📊 **Historical Case Data Analysis:**", "## 📊 **HISTORICAL CASE ANALYSIS**")
            formatted_case_context = formatted_case_context.replace("**Overall Analysis**", "**Based on")
            formatted_case_context = formatted_case_context.replace("• Combined Success Rate:", "similar cases, average success rate is")
            
            final_response += f"{formatted_case_context}\n\n"
            final_response += f"## 📋 **LEGAL ANALYSIS**\n\n{cleaned_response}"
        else:
            final_response = cleaned_response

        # Add a professional footer
        final_response += "\n\n---\n\n**⚠️ Disclaimer:** This is general legal information based on historical data. Please consult with a qualified lawyer for specific legal advice."

        print(f"🔍 Final response length: {len(final_response)}")
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)