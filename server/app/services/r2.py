import logging

import boto3

from app.config import settings

logger = logging.getLogger(__name__)

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=settings.R2_ACCESS_KEY,
    aws_secret_access_key=settings.R2_SECRET_KEY,
    region_name="auto",
)

BUCKET = settings.R2_BUCKET_NAME


def generate_public_url(key: str) -> str:
    """
    Build the Cloudflare R2 public URL for a given object key.
    Requires public access to be enabled on the bucket.
    """
    return f"{settings.R2_PUBLIC_URL}/{key}"


def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    """
    Generate a presigned URL for reading an object from R2.

    You can call this from routes or services, passing a stored object key like
    'videos/<video_id>/1080.mp4'. Expires_in is in seconds.
    """
    try:
        return s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET, "Key": key},
            ExpiresIn=expires_in,
        )
    except Exception as exc:
        logger.error("Failed to generate presigned URL for %s: %s", key, exc)
        raise


def delete_object(key: str) -> bool:
    """Delete an object from R2 bucket."""
    try:
        s3.delete_object(Bucket=BUCKET, Key=key)
        logger.info("Deleted object from R2: %s", key)
        return True
    except Exception as exc:
        logger.error("Failed to delete object %s: %s", key, exc)
        return False


def delete_objects(keys: list[str]) -> int:
    """Delete multiple objects from R2 bucket. Returns count of deleted objects."""
    if not keys:
        return 0
    try:
        objects = [{"Key": key} for key in keys]
        response = s3.delete_objects(
            Bucket=BUCKET,
            Delete={"Objects": objects, "Quiet": True},
        )
        deleted_count = len(keys) - len(response.get("Errors", []))
        logger.info("Deleted %d objects from R2", deleted_count)
        return deleted_count
    except Exception as exc:
        logger.error("Failed to delete objects: %s", exc)
        return 0
