import ollama
import json
import re

def ask_llm_for_trend(question, evidence_list):
    prompt = "You are a legal prediction assistant for Indian law.\n"
    prompt += "Question:\n" + question + "\n\n"
    prompt += "Evidence:\n"
    for i, e in enumerate(evidence_list[:3], 1):
        prompt += f"[{i}] {e.get('source_path','?')}\n{e.get('text','')[:500]}\n\n"
    
    try:
        response = ollama.chat(model='llama3.2:3b', messages=[
            {'role': 'system', 'content': 'You are a helpful legal assistant.'},
            {'role': 'user', 'content': prompt}
        ])
        return {"reasoning": response['message']['content'], "label": "analyzed"}
    except Exception as e:
        return {"reasoning": "Error processing request", "label": "error"}

def trend_predictor(question, retrieved_docs, case_data=None):
    # Get LLM analysis
    llm_result = ask_llm_for_trend(question, retrieved_docs)
    
    # If case data is provided, add statistical analysis
    case_analysis = ""
    if case_data:
        from main import find_relevant_cases, generate_case_context
        relevant_cases = find_relevant_cases(question, case_data)
        if relevant_cases:
            case_analysis = generate_case_context(relevant_cases)
    
    return {
        "question": question,
        "reasoning": llm_result.get("reasoning") + case_analysis,
        "label": llm_result.get("label"),
        "evidence": retrieved_docs,
        "case_statistics": case_analysis
    }