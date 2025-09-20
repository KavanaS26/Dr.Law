from predictor import trend_predictor

question = "Will the Supreme Court uphold the new privacy bill?"
evidence = [
    {
        "source_path": "judgment1.pdf",
        "text": "The Supreme Court previously ruled in favor of privacy rights under Article 21..."
    },
    {
        "source_path": "statute2.html",
        "text": "The proposed bill aligns with the Personal Data Protection framework..."
    }
]

result = trend_predictor(question, evidence)
print(result)