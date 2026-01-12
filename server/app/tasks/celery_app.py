import os
from celery import Celery

broker_url = os.getenv('CELERY_BROKER_URL', 'pyamqp://guest:guest@localhost//')
celery_app = Celery('tasks', broker=broker_url)

@celery_app.task(name="app.tasks.add")
def add(x, y):
    return x + y