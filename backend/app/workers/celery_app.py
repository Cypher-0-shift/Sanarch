import ssl
from celery import Celery
from app.config import settings
from app.logging_config import logger
import redis as redis_lib

def _verify_redis_on_startup():
    try:
        r = redis_lib.from_url(settings.redis_url)
        r.ping()
        logger.info("Celery Redis broker: connected")
    except Exception as e:
        logger.error(f"Celery Redis broker: UNREACHABLE — {e}")
        # Do not crash — Celery will retry connections

_verify_redis_on_startup()

broker_use_ssl = None
redis_backend_use_ssl = None

if settings.redis_url.startswith("rediss://"):
    ssl_conf = {"ssl_cert_reqs": ssl.CERT_REQUIRED}
    broker_use_ssl = ssl_conf
    redis_backend_use_ssl = ssl_conf

celery_app = Celery(
    "sanarch",
    broker=settings.redis_url,
    backend=settings.redis_url,
    broker_use_ssl=broker_use_ssl,
    redis_backend_use_ssl=redis_backend_use_ssl,
    include=["app.workers.extraction_task", "app.workers.cleanup_task"]
)

from celery.schedules import crontab

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

    # Scheduled tasks
    beat_schedule={
        "cleanup-failed-documents-daily": {
            "task": "app.workers.cleanup_task.cleanup_failed_documents",
            "schedule": crontab(hour=0, minute=0),
        },
    },
)

logger.info("Celery app configured")