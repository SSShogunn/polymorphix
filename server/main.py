from contextlib import asynccontextmanager

from app.config import settings
from app.database import db
from app.routes import auth, videos
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    print("Connected to database")

    yield

    await db.disconnect()
    print("Disconnected from database")


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(videos.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Polymorphix API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
