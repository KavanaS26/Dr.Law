import ollama
import os
import csv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load case data
def load_simple_case_data():
    case_data = []
    case_file_path = "./data/judgments/case.txt"
    
    if os.path.exists(case_file_path):
        try:
            with open(case_file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                print(f"🔍 File has {len(lines)} lines")
                
                # Skip header line (first line)
                for i, line in enumerate(lines[1:], 1):
                    line = line.strip()
                    if not line:  # Skip empty lines
                        continue
                    
                    # Split by pipe and clean whitespace
                    parts = [part.strip() for part in line.split('|')]
                    print(f"🔍 Processing line {i}: {parts}")
                    
                    if len(parts) >= 5:
                        try:
                            case_data.append({
                                'case_id': parts[0],
                                'case_type': parts[1], 
                                'ipc_section': parts[2],
                                'winning_percentage': float(parts[3]),
                                'outcome': parts[4]
                            })
                            print(f"✅ Added case: {parts[0]} - {parts[2]}")
                        except ValueError as e:
                            print(f"⚠️ Error parsing line {i}: {e} - Data: {parts}")
                    else:
                        print(f"⚠️ Line {i} has insufficient parts: {len(parts)}")
                        
            print(f"✅ Loaded {len(case_data)} cases")
        except Exception as e:
            print(f"⚠️ Error: {e}")
    else:
        print(f"❌ File not found: {case_file_path}")
        
    return case_data

case_data = load_simple_case_data()



# Add this function right after your load_simple_case_data() function:

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




@app.get("/")
async def root():
    return {"message": "Backend running!", "cases_loaded": len(case_data)}

@app.post("/chat")
async def chat(request: dict):
    message = request.get("message", "")
    print(f"🔍 Received message: {message}")
    
    # Add case context if relevant
    case_context = ""
    prediction_keywords = ['winning', 'chances', 'probability', 'success rate']
    
    has_prediction_keyword = any(keyword in message.lower() for keyword in prediction_keywords)
    print(f"🔍 Has prediction keyword: {has_prediction_keyword}")
    print(f"🔍 Total cases available: {len(case_data)}")
    
    if has_prediction_keyword:
        # Simple case matching with debug
        relevant_cases = []
        
        print(f"🔍 Looking for IPC sections in message: {message.lower()}")
        
        for case in case_data:
            case_section_lower = case['ipc_section'].lower()
            
            # Check for exact matches
            if '420' in message.lower() and '420' in case_section_lower:
                relevant_cases.append(case)
                print(f"✅ Found IPC 420 match: {case}")
            elif '302' in message.lower() and '302' in case_section_lower:
                relevant_cases.append(case)
                print(f"✅ Found IPC 302 match: {case}")
            elif '193' in message.lower() and '193' in case_section_lower:
                relevant_cases.append(case)
                print(f"✅ Found IPC 193 match: {case}")
            elif '498a' in message.lower() and '498a' in case_section_lower:
                relevant_cases.append(case)
                print(f"✅ Found IPC 498A match: {case}")
            # Also check for keyword matches
            elif 'fraud' in message.lower() and '420' in case_section_lower:
                relevant_cases.append(case)
                print(f"✅ Found fraud->420 match: {case}")
            elif 'murder' in message.lower() and '302' in case_section_lower:
                relevant_cases.append(case)
                print(f"✅ Found murder->302 match: {case}")
        
        print(f"🔍 Found {len(relevant_cases)} relevant cases total")
        
        if relevant_cases:
            avg_success = sum(case['winning_percentage'] for case in relevant_cases) / len(relevant_cases)
            case_context = f"\n\n📊 HISTORICAL CASE ANALYSIS:\n"
            case_context += f"Based on {len(relevant_cases)} similar cases, average success rate is {avg_success:.1f}%\n\n"
            
            # Show individual case details
            for i, case in enumerate(relevant_cases[:5], 1):  # Show up to 5 cases
                case_context += f"{i}. {case['ipc_section']} ({case['case_type']}): {case['winning_percentage']}% - {case['outcome']}\n"
            
            print(f"✅ Generated case context: {case_context}")
        else:
            print("⚠️ No relevant cases found despite having prediction keywords")
    
    # Update your system_prompt in test_main.py to enforce proper line breaks:

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

    full_message = message + case_context
    print(f"🔍 Sending to LLM: {full_message[:200]}...")
    
    try:
        response = ollama.chat(model='llama3.2:3b', messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': full_message}
        ])
 
        # FIXED: Get the raw response first
        raw_response = response['message']['content']
        print(f"🔍 EXACT Raw response: '{raw_response}'")
        print(f"🔍 Raw response length: {len(raw_response)}")

        # Handle multiple disclaimer variations
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

        # ✅ Combine historical context + cleaned LLM response
        final_response = ""
        if case_context:
            # Format case context better
            formatted_case_context = case_context.replace("\n\n📊 HISTORICAL CASE ANALYSIS:\n", "\n## 📊 **HISTORICAL CASE ANALYSIS**\n\n")
            formatted_case_context = formatted_case_context.replace("Based on", "**Based on")
            formatted_case_context = formatted_case_context.replace("% - ", "%** - **") + "**"
            
            final_response += f"{formatted_case_context}\n\n"
            final_response += f"## 📋 **LEGAL ANALYSIS**\n\n{cleaned_response}"
        else:
            final_response = cleaned_response

        # Add a professional footer
        final_response += "\n\n---\n\n**⚠️ Disclaimer:** This is general legal information based on historical data. Please consult with a qualified lawyer for specific legal advice."

        print(f"🔍 Final response length: {len(final_response)}")
        print(f"🔍 Final response preview: {final_response[:300]}...")

        return {"response": final_response}

    except Exception as e:
        print(f"❌ Ollama error: {e}")
        return {"response": f"Error: {str(e)}"}
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)