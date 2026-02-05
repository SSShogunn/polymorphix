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
    return f"https://{BUCKET}.pub.r2.dev/{key}"


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
