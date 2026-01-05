from fastapi import APIRouter, UploadFile, Depends, Form, File, HTTPException
from app.dependencies import get_current_user
from pathlib import Path
import shutil
import uuid
from app.database import get_db
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.video import Video as VideoModel

router = APIRouter(prefix="/videos", tags=["Video Management"])

UPLOAD_DIR = Path("/video_queue")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload(
    current_user: dict = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")

    original = Path(file.filename)
    ext = original.suffix.lower()

    if not ext:
        raise HTTPException(status_code=400, detail="File extension missing")

    file_name = f"{uuid.uuid4()}_{current_user.id}{ext}"
    file_path = UPLOAD_DIR / file_name

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = file_path.stat().st_size

    video = VideoModel(
        user_id=current_user.id,
        title=title,
        description=description,
        original_filename=file.filename,
        file_size=file_size,
        status="uploading",
        raw_video_url=str(file_path),
    )

    db_session.add(video)
    await db_session.commit()
    await db_session.refresh(video)

    return {
        "id": str(video.id),
        "title": video.title,
        "description": video.description,
        "original_name": file.filename,
        "stored_as": file_name,
        "content_type": file.content_type,
        "file_size": video.file_size,
        "status": video.status,
        "created_at": video.created_at.isoformat() if video.created_at else None,
    }


@router.get("")
async def get_videos(
    db_session: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    result = await db_session.execute(select(VideoModel))
    videos = result.scalars().all()
    return videos
