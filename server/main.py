from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, videos
from app.config import settings
from app.models import Video, VideoFormat, AuthUser

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(videos.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Polymorphix API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
