from fastapi import FastAPI
import uvicorn

PORT = 8080

app = FastAPI(title="API Server", description="API for the application", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Hello FastAPI 🚀"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)