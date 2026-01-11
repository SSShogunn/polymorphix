from celery import Celery

celery_app = Celery('tasks', broker='pyamqp://guest@localhost//')

@celery_app.task(name="app.tasks.add")
def add(x, y):
    return x + y