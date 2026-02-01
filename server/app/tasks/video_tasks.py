import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

import asyncpg
import ffmpeg

from app.config import settings
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

OUTPUT_EXT = ".mp4"

RESOLUTIONS = [
    ("1080", 1080, 5000),
    ("720", 720, 2500),
    ("480", 480, 1000),
]


async def _update_video_status(
    conn: asyncpg.Connection,
    video_id: str,
    status: str,
    progress: int = 0,
    error_message: str | None = None,
    processed_at: datetime | None = None,
):
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


async def _get_video(conn: asyncpg.Connection, video_id: str):
    return await conn.fetchrow("SELECT * FROM videos WHERE id = $1", video_id)


async def _create_video_format(
    conn: asyncpg.Connection,
    video_id: str,
    resolution: str,
    bitrate: int,
    codec: str = "h264",
    video_url: str | None = None,
    file_size: int | None = None,
):
    await conn.execute(
        """
        INSERT INTO video_formats
        (video_id, resolution, bitrate, codec, video_url, file_size)
        VALUES ($1, $2, $3, $4, $5, $6)
        """,
        video_id,
        resolution,
        bitrate,
        codec,
        video_url,
        file_size,
    )


async def _run_processing(
    video_id: str,
    user_id: str,
    file_path: str,
    original_filename: str,
):
    conn = None
    try:
        conn = await asyncpg.connect(settings.DATABASE_URL)
        await _update_video_status(conn, video_id, status="processing", progress=0)

        # Step 1: Validate video file
        path = Path(file_path)
        if not path.exists():
            await _update_video_status(
                conn, video_id, status="failed", error_message="File not found"
            )
            return
        if not path.is_file():
            await _update_video_status(
                conn, video_id, status="failed", error_message="Path is not a file"
            )
            return
        if path.stat().st_size == 0:
            await _update_video_status(
                conn, video_id, status="failed", error_message="Empty file"
            )
            return
        await _update_video_status(conn, video_id, status="processing", progress=10)

        # Step 2: Extract video metadata (duration, resolution, etc.)
        metadata = ffmpeg.probe(
            file_path,
            v="quiet",
            print_format="json",
            show_format=None,
            show_streams=None,
        )
        duration = float(metadata["format"]["duration"])
        video_stream = next(
            stream for stream in metadata["streams"] if stream["codec_type"] == "video"
        )
        _width = video_stream["width"]
        _height = video_stream["height"]

        duration_seconds = int(round(duration))
        await conn.execute(
            """
            UPDATE videos SET duration = $1, updated_at = NOW() WHERE id = $2
            """,
            duration_seconds,
            video_id,
        )

        await _update_video_status(conn, video_id, status="processing", progress=20)

        # Step 3: Transcode to multiple qualities (1080p, 720p, 480p)
        base_dir = Path("/video_queue/processed") / video_id
        base_dir.mkdir(parents=True, exist_ok=True)

        for label, height, bitrate_kbps in RESOLUTIONS:
            out_dir = base_dir / label
            out_dir.mkdir(parents=True, exist_ok=True)
            out_path = out_dir / f"video{OUTPUT_EXT}"

            try:
                (
                    ffmpeg.input(file_path)
                    .output(
                        str(out_path),
                        vf=f"scale=-2:{height}",
                        vcodec="libx264",
                        video_bitrate=f"{bitrate_kbps}k",
                        acodec="aac",
                        audio_bitrate="128k",
                        movflags="+faststart",
                        format="mp4",
                    )
                    .overwrite_output()
                    .run(quiet=True)
                )
            except ffmpeg.Error as e:
                stderr = e.stderr.decode("utf-8") if e.stderr else ""
                logger.error(f"FFmpeg failed: {stderr}")
                await _update_video_status(
                    conn, video_id, status="failed", error_message=stderr or str(e)
                )
                return

            logger.info(
                f"Video {video_id} for user {user_id} was transcoded with {label}p"
            )
            file_size = out_path.stat().st_size
            await _create_video_format(
                conn,
                video_id,
                resolution=label + "p",
                bitrate=bitrate_kbps,
                codec="h264",
                video_url=None,
                file_size=file_size,
            )

        await _update_video_status(conn, video_id, status="processing", progress=60)

        # Step 4: Generate thumbnails
        thumb_path = base_dir / "thumb.jpg"
        seek_sec = min(1, duration_seconds * 0.1)

        try:
            (
                ffmpeg.input(str(file_path), ss=seek_sec)
                .output(
                    str(thumb_path),
                    vframes=1,
                    vf="scale=1280:-2:flags=lanczos",
                    pix_fmt="yuvj420p",
                    **{"q:v": 1},
                )
                .overwrite_output()
                .run(quiet=True)
            )
            await conn.execute(
                """
                UPDATE videos SET thumbnail_url = $1, updated_at = NOW() WHERE id = $2
                """,
                str(thumb_path),
                video_id,
            )
        except ffmpeg.Error as ex:
            stderr = ex.stderr.decode("utf-8") if ex.stderr else ""
            logger.error(f"FFmpeg failed: {stderr}")
            await _update_video_status(
                conn, video_id, status="failed", error_message=stderr or str(ex)
            )
            return

        await _update_video_status(conn, video_id, status="processing", progress=80)

        # Step 6: Mark as ready
        await _update_video_status(
            conn,
            video_id,
            status="ready",
            progress=100,
            processed_at=datetime.now(timezone.utc),
        )

        logger.info(f"Successfully processed video {video_id}")
        return {
            "video_id": video_id,
            "status": "success",
            "message": f"Processed {original_filename}",
        }
    except Exception as e:
        logger.error(f"Failed to process video {video_id}: {str(e)}")
        if conn is not None:
            await _update_video_status(
                conn, video_id, status="failed", error_message=str(e)
            )
        raise
    finally:
        if conn is not None:
            await conn.close()


@celery_app.task(name="tasks.process_video", bind=True)
def process_video(
    self,
    video_id: str,
    user_id: str,
    file_path: str,
    original_filename: str,
):
    logger.info(f"Starting processing for video {video_id} (user {user_id})")
    return asyncio.run(_run_processing(video_id, user_id, file_path, original_filename))
