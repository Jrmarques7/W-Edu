import asyncio
import logging
from contextlib import suppress

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.notification import NotificationService

logger = logging.getLogger(__name__)


async def run_notification_worker(stop_event: asyncio.Event) -> None:
    logger.info(
        "Notification worker started interval=%ss batch_size=%s",
        settings.NOTIFICATION_WORKER_INTERVAL_SECONDS,
        settings.NOTIFICATION_WORKER_BATCH_SIZE,
    )
    while not stop_event.is_set():
        await asyncio.to_thread(_process_batch)
        with suppress(asyncio.TimeoutError):
            await asyncio.wait_for(stop_event.wait(), timeout=settings.NOTIFICATION_WORKER_INTERVAL_SECONDS)
    logger.info("Notification worker stopped")


def _process_batch() -> None:
    db = SessionLocal()
    try:
        processed = NotificationService(db).process_due(limit=settings.NOTIFICATION_WORKER_BATCH_SIZE)
        if processed:
            logger.info("Notification worker processed %s event(s)", len(processed))
    except Exception:
        logger.exception("Notification worker failed")
    finally:
        db.close()
