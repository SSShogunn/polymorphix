from fastapi import APIRouter, HTTPException, UploadFile, status, Depends, Form
from supabase import create_client, Client
from app.config import settings
from app.dependencies import get_current_user


router = APIRouter(prefix="/video", tags=["Video Management"])


@router.post("/upload")
async def upload_video(
    file: UploadFile,
    title: str = Form(...),
    description: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    print("File " + file.format())
    print("title " + title)
    print("description " + description)
    print("current_user " + current_user['id'])
