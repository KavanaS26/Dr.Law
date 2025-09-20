import ollama
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

@app.get("/")
async def root():
    return {"message": "Backend running!"}

@app.post("/chat")
async def chat(request: dict):
    message = request.get("message", "")
    response = ollama.chat(model='llama3.2:3b', messages=[
        {'role': 'user', 'content': message}
    ])
    return {"response": response['message']['content']}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)