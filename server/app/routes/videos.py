from fastapi import APIRouter, UploadFile, Depends, Form, File, HTTPException
from app.dependencies import get_current_user
from pathlib import Path
import shutil
import uuid

router = APIRouter(prefix="/videos", tags=["Video Management"])


UPLOAD_DIR = Path("/video_queue")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload(
    current_user: dict = Depends(get_current_user),
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")

    original = Path(file.filename)
    ext = original.suffix.lower()

    if not ext:
        raise HTTPException(
            status_code=400,
            detail="File extension missing"
        )

    safe_name = f"{uuid.uuid4()}_{current_user.id}{ext}"
    file_path = UPLOAD_DIR / safe_name

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "original_name": file.filename,
        "stored_as": safe_name,
        "content_type": file.content_type
    }
