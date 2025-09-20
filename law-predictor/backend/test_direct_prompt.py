from predictor import trend_predictor

# Your legal question
question = "What is the punishment for giving false evidence in court?"

# Manually selected evidence from IPC Section 193
evidence = [
    {
        "source_path": "Indian Penal Code",
        "text": "Section 193: Whoever intentionally gives false evidence in any stage of a judicial proceeding, or fabricates false evidence for the purpose of being used in any stage of a judicial proceeding, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine."
    }
]

# Run the AI prediction
result = trend_predictor(question, evidence)

# Print the result
import json
print(json.dumps(result, indent=2, ensure_ascii=False))