from app.config import settings
from celery import Celery

celery_app = Celery("polymorphix", broker=settings.CELERY_BROKER_URL)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_routes={"upload.*": {"queue": "upload"}},
    # Result backend (optional - for task result storage)
    # result_backend=settings.REDIS_URL,
)

from app.tasks import upload_tasks, video_tasks  # noqa: E402, F401
