# app/workers/celery_app.py
from celery import Celery
from app.config import settings
from app.logging_config import logger

celery_app = Celery(
    "sanarch",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.extraction_task"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,

    # Task routing — documents go to their own queue
    task_routes={
        "app.workers.extraction_task.process_document": {"queue": "documents"},
    },

    # Limits — prevent any single task from hanging forever
    task_soft_time_limit=120,  # 2 min — sends SoftTimeLimitExceeded
    task_time_limit=180,       # 3 min — kills the task

    # Retry config
    task_acks_late=True,       # ack only after task completes (safer)
    task_reject_on_worker_lost=True,

    # Worker config
    worker_prefetch_multiplier=1,  # process one task at a time per worker
    worker_max_tasks_per_child=50, # recycle worker after 50 tasks (prevent memory leaks)
)

logger.info("Celery app configured")