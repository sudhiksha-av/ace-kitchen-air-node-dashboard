from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .alerts import alert_message, evaluate_alerts, send_whatsapp_alert
from .config import get_settings


def create_scheduler(cache_provider):
    scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

    async def check_alerts():
        rows = await cache_provider()
        latest = rows[-1] if rows else None
        settings = get_settings()
        is_online = False
        if latest:
            latest_dt = datetime.fromisoformat(latest["timestamp_ist"])
            is_online = datetime.now(latest_dt.tzinfo) - latest_dt <= timedelta(minutes=settings.node_offline_minutes)
        alerts = evaluate_alerts(latest, is_online)
        if alerts:
            await send_whatsapp_alert(alert_message(alerts, datetime.now(latest_dt.tzinfo if latest else None)))

    scheduler.add_job(check_alerts, "interval", minutes=5, id="air-quality-alerts", replace_existing=True)
    return scheduler
