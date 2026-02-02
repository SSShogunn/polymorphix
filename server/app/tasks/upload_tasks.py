"""
Upload worker – R2 (S3-compatible) uploads.
Steps and TODOs only; no implementation.
"""

import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="upload.upload_to_r2")
def upload_to_r2(self, file_path: str, object_key: str, bucket: str | None = None):
    """
    Upload a file to R2.

    Steps:
    1. TODO: Load R2 config (endpoint, access key, secret, bucket) from settings.
    2. TODO: Create S3/R2 client (boto3 or aioboto3 for async).
    3. TODO: Open file and get size for progress / Content-Length.
    4. TODO: Upload to R2 (PutObject or upload_file) with optional progress callback.
    5. TODO: Build public or presigned URL for the object (if needed).
    6. TODO: Update task state / progress (e.g. self.update_state) if desired.
    7. TODO: On success: return URL or key; on failure: log and re-raise.
    """
    raise NotImplementedError("Upload worker not implemented yet.")
