import asyncio
import logging
import os
from datetime import datetime, timezone

import asyncpg

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL", "")


async def _update_video_status(
    video_id: str,
    status: str,
    progress: int = 0,
    error_message: str | None = None,
    processed_at: datetime | None = None,
):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute(
            """
            UPDATE videos
            SET status = $1,
                processing_progress = $2,
                error_message = $3,
                processed_at = $4,
                updated_at = NOW()
            WHERE id = $5
            """,
            status,
            progress,
            error_message,
            processed_at,
            video_id,
        )
    finally:
        await conn.close()


async def _get_video(video_id: str):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        return await conn.fetchrow("SELECT * FROM videos WHERE id = $1", video_id)
    finally:
        await conn.close()


async def _create_video_format(
    video_id: str,
    resolution: str,
    bitrate: int,
    codec: str = "h264",
    manifest_url: str | None = None,
    segment_base_url: str | None = None,
    file_size: int | None = None,
    segment_count: int | None = None,
):  
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute(
            """
            INSERT INTO video_formats
            (video_id, resolution, bitrate, codec, manifest_url, segment_base_url, file_size, segment_count)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            video_id,
            resolution,
            bitrate,
            codec,
            manifest_url,
            segment_base_url,
            file_size,
            segment_count,
        )
    finally:
        await conn.close()


@celery_app.task(name="tasks.process_video", bind=True)
def process_video(
    self,
    video_id: str,
    user_id: str,
    file_path: str,
    original_filename: str,
):
    logger.info(f"Starting processing for video {video_id}")
    logger.info(f"User: {user_id}, File: {file_path}")

    try:
        asyncio.run(
            _update_video_status(video_id, status="processing", progress=0)
        )

        # Step 1: Validate video file
        # TODO: Check if file exists, is valid video format
        asyncio.run(
            _update_video_status(video_id, status="processing", progress=10)
        )

        # Step 2: Extract video metadata (duration, resolution, etc.)
        # TODO: Use FFprobe to get metadata
        asyncio.run(
            _update_video_status(video_id, status="processing", progress=20)
        )

        # Step 3: Transcode to multiple qualities (1080p, 720p, 480p)
        # TODO: FFmpeg transcoding to HLS/DASH segments
        asyncio.run(
            _update_video_status(video_id, status="processing", progress=60)
        )

        # Step 4: Generate thumbnails
        # TODO: Extract frames at intervals
        asyncio.run(
            _update_video_status(video_id, status="processing", progress=80)
        )

        # Step 5: Create video format records
        # TODO: Create actual format entries after transcoding
        # Example:
        # asyncio.run(_create_video_format(
        #     video_id=video_id,
        #     resolution="1080p",
        #     bitrate=5000,
        #     manifest_url="https://storage.../video_id/1080p/manifest.m3u8"
        # ))

        # Step 6: Mark as ready
        asyncio.run(
            _update_video_status(
                video_id,
                status="ready",
                progress=100,
                processed_at=datetime.now(timezone.utc),
            )
        )

        logger.info(f"Successfully processed video {video_id}")
        return {
            "video_id": video_id,
            "status": "success",
            "message": f"Processed {original_filename}",
        }

    except Exception as e:
        logger.error(f"Failed to process video {video_id}: {str(e)}")

            # Update database with error status
        asyncio.run(
            _update_video_status(
                video_id,
                status="failed",
                error_message=str(e),
            )
        )

        raise
