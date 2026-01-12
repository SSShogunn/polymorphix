import os
from celery import Celery

broker_url = os.getenv('CELERY_BROKER_URL', 'pyamqp://guest:guest@localhost//')
celery_app = Celery('tasks', broker=broker_url)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
)

from app.tasks import video_tasks