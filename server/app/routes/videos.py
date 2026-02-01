from fastapi import APIRouter, UploadFile, Depends, Form, File, HTTPException
from pathlib import Path
import shutil
import uuid

from app.database import db
from app.dependencies import get_current_user
from app.schemas.video import DeleteAllResponse
from app.tasks.video_tasks import process_video
from prisma.models import User

router = APIRouter(prefix="/videos", tags=["Video Management"])

UPLOAD_DIR = Path("/video_queue")
PROCESSED_DIR = Path("/video_queue/processed")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload(
    current_user: User = Depends(get_current_user),
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

    video = await db.video.create(
        data={
            "userId": current_user.id,
            "title": title,
            "description": description,
            "originalFilename": file.filename,
            "fileSize": file_size,
            "status": "uploading",
            "rawVideoUrl": str(file_path),
        }
    )

    _ = process_video.delay(
        video_id=video.id,
        user_id=current_user.id,
        file_path=str(file_path),
        original_filename=file.filename,
    )

    return {
        "id": video.id,
        "title": video.title,
        "description": video.description,
        "original_name": file.filename,
        "stored_as": file_name,
        "content_type": file.content_type,
        "file_size": video.fileSize,
        "status": video.status,
        "created_at": video.createdAt.isoformat() if video.createdAt else None,
    }


@router.get("")
async def get_videos(
    current_user: User = Depends(get_current_user),
):
    """Get all uploaded videos for the current user, newest first."""
    videos = await db.video.find_many(
        where={"userId": current_user.id},
        include={"formats": True},
        order={"createdAt": "desc"},
    )
    return videos


@router.delete("", response_model=DeleteAllResponse)
async def delete_all_videos(
    current_user: User = Depends(get_current_user),
):
    """Delete all videos for the current user (DB records and files)."""
    videos = await db.video.find_many(
        where={"userId": current_user.id},
        include={"formats": True},
    )
    count = 0
    for video in videos:
        if video.rawVideoUrl:
            raw_path = Path(video.rawVideoUrl)
            if raw_path.exists() and raw_path.is_file():
                try:
                    raw_path.unlink()
                except OSError:
                    pass

        processed_path = PROCESSED_DIR / video.id
        if processed_path.exists() and processed_path.is_dir():
            try:
                shutil.rmtree(processed_path)
            except OSError:
                pass
        count += 1

    await db.video.delete_many(where={"userId": current_user.id})

    return DeleteAllResponse(
        deleted=count,
        message=f"Deleted {count} video(s).",
    )
