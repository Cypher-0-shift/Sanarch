from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "smart_health_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Phase 6: Celery Beat Medication/FollowUp schedule
celery_app.conf.beat_schedule = {
    'generate-daily-medication-logs-7am': {
        'task': 'app.workers.tasks.generate_daily_medication_logs',
        'schedule': crontab(hour=7, minute=0),
    },
    'send-medication-reminders-every-30-mins': {
        'task': 'app.workers.tasks.send_medication_reminders',
        'schedule': crontab(minute='*/30'),
    },
}
