import asyncio
import logging
from pathlib import Path

import asyncpg
import boto3

from app.config import settings
from app.services.r2 import generate_public_url
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=settings.R2_ACCESS_KEY,
    aws_secret_access_key=settings.R2_SECRET_KEY,
    region_name="auto",
)

BUCKET = settings.R2_BUCKET_NAME

async def _upload_video_format(
    video_id: str,
    resolution: str,
    object_key: str,
    file_size: int,
) -> None:
    """
    Update the corresponding video_format row with the uploaded object's key and size.

    We assume a row was already created in video_tasks._create_video_format.
    """
    conn: asyncpg.Connection | None = None
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL)
        await conn.execute(
            """
            UPDATE video_formats
            SET video_url = $1,
                file_size = $2
            WHERE video_id = $3
              AND resolution = $4
            """,
            object_key,
            file_size,
            video_id,
            resolution,
        )
    finally:
        if conn is not None:
            await conn.close()


@celery_app.task(bind=True, name="upload.upload_to_r2")
def upload_to_r2(self, file_path: str, object_key: str, video_id: str):
    """
    Upload a transcoded video file to R2 and update the matching video_format row
    with the stored object key and file size.
    """
    try:
        path = Path(file_path)

        if not path.is_file():
            raise FileNotFoundError(f"File not found for upload: {file_path}")

        file_size = path.stat().st_size

        s3.upload_file(
            Filename=str(path),
            Bucket=BUCKET,
            Key=object_key,
            ExtraArgs={"ContentType": "video/mp4"},
        )

        filename = object_key.rsplit("/", 1)[-1]
        label = filename.split(".")[0]
        resolution = f"{label}p"

        asyncio.run(_upload_video_format(video_id, resolution, object_key, file_size))

        logger.info(
            "Uploaded video %s to R2: bucket=%s key=%s",
            video_id,
            BUCKET,
            object_key,
        )

    except Exception:
        logger.exception(
            "Failed to upload video %s to R2 (key=%s)", video_id, object_key
        )
        raise


async def _create_thumbnail(
    video_id: str,
    object_key: str,
    public_url: str,
    file_size: int,
) -> None:
    """
    Insert a row into thumbnails and set videos.thumbnail_url to the public URL.
    """
    conn: asyncpg.Connection | None = None
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL)
        await conn.execute(
            """
            INSERT INTO thumbnails (video_id, object_key, public_url, file_size)
            VALUES ($1, $2, $3, $4)
            """,
            video_id,
            object_key,
            public_url,
            file_size,
        )
        await conn.execute(
            """
            UPDATE videos SET thumbnail_url = $1, updated_at = NOW() WHERE id = $2
            """,
            public_url,
            video_id,
        )
    finally:
        if conn is not None:
            await conn.close()


@celery_app.task(bind=True, name="upload.upload_thumbnail_to_r2")
def upload_thumbnail_to_r2(self, file_path: str, video_id: str):
    """
    Upload a generated thumbnail to R2 and persist it in the thumbnails table
    with its public URL.
    """
    try:
        path = Path(file_path)

        if not path.is_file():
            raise FileNotFoundError(f"Thumbnail file not found: {file_path}")

        file_size = path.stat().st_size
        object_key = f"thumbnails/{video_id}/thumb.jpg"

        s3.upload_file(
            Filename=str(path),
            Bucket=BUCKET,
            Key=object_key,
            ExtraArgs={"ContentType": "image/jpeg"},
        )

        public_url = generate_public_url(object_key)

        asyncio.run(_create_thumbnail(video_id, object_key, public_url, file_size))

        logger.info(
            "Uploaded thumbnail for video %s to R2: key=%s",
            video_id,
            object_key,
        )

    except Exception:
        logger.exception("Failed to upload thumbnail for video %s", video_id)
        raise
