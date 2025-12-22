from fastapi import APIRouter, HTTPException, UploadFile, status, Depends, Form, File
from supabase import create_client, Client
from app.config import settings
from app.dependencies import get_current_user


router = APIRouter(prefix="/video", tags=["Video Management"])


@router.post("/upload")
async def upload(
    file: UploadFile = File(...), title: str = Form(...), description: str = Form(...)
):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "title": title,
        "description": description,
    }
