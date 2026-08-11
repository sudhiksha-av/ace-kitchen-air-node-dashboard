from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .alerts import alert_message, evaluate_alerts, send_whatsapp_alert
from .comparison import compare_ranges, parse_ist
from .config import get_settings
from .csv_export import to_csv
from .scheduler import create_scheduler
from .thingspeak import IST, fetch_thingspeak_data, filter_rows

app = FastAPI(title="Air Quality Dashboard API")
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_cache = {"expires_at": datetime.min.replace(tzinfo=IST), "rows": []}


async def get_cached_rows(force: bool = False) -> list[dict]:
    now = datetime.now(IST)
    if force or now >= _cache["expires_at"]:
        _cache["rows"] = await fetch_thingspeak_data()
        _cache["expires_at"] = now + timedelta(seconds=settings.cache_ttl_seconds)
    return _cache["rows"]


@app.on_event("startup")
async def startup_event():
    scheduler = create_scheduler(get_cached_rows)
    scheduler.start()
    app.state.scheduler = scheduler


@app.on_event("shutdown")
async def shutdown_event():
    app.state.scheduler.shutdown(wait=False)


@app.get("/api/health")
async def health():
    return {"status": "ok", "timezone": "Asia/Kolkata"}


@app.get("/api/dashboard")
async def dashboard(force: bool = False):
    rows = await get_cached_rows(force)
    latest = rows[-1] if rows else None
    is_online = False
    last_updated = None
    if latest:
        latest_dt = datetime.fromisoformat(latest["timestamp_ist"])
        last_updated = latest_dt.isoformat()
        is_online = datetime.now(IST) - latest_dt <= timedelta(minutes=settings.node_offline_minutes)

    alerts = evaluate_alerts(latest, is_online)
    return {
        "latest": latest,
        "rows": rows,
        "node_status": "Online" if is_online else "Offline",
        "last_updated_ist": last_updated,
        "alerts": alerts,
        "next_refresh_seconds": settings.cache_ttl_seconds,
    }


@app.get("/api/data")
async def data(start: Optional[str] = None, end: Optional[str] = None):
    start_dt = parse_ist(start) if start else None
    end_dt = parse_ist(end) if end else None
    if start_dt or end_dt:
        rows = await fetch_thingspeak_data(start=start_dt, end=end_dt)
    else:
        rows = await get_cached_rows()
    return {"rows": filter_rows(rows, start_dt, end_dt)}


@app.get("/api/export.csv")
async def export_csv(start: Optional[str] = None, end: Optional[str] = None):
    start_dt = parse_ist(start) if start else None
    end_dt = parse_ist(end) if end else None
    if start_dt or end_dt:
        rows = await fetch_thingspeak_data(start=start_dt, end=end_dt)
    else:
        rows = await get_cached_rows()
    csv = to_csv(filter_rows(rows, start_dt, end_dt))
    return Response(
        content=csv,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=air-quality-data.csv"},
    )


@app.get("/api/compare")
async def compare(
    first_start: str = Query(...),
    first_end: str = Query(...),
    second_start: str = Query(...),
    second_end: str = Query(...),
):
    rows = await get_cached_rows()
    first = filter_rows(rows, parse_ist(first_start), parse_ist(first_end))
    second = filter_rows(rows, parse_ist(second_start), parse_ist(second_end))
    return {"comparison": compare_ranges(first, second), "first_rows": first, "second_rows": second}


@app.post("/api/alerts/test")
async def test_alert():
    rows = await get_cached_rows()
    latest = rows[-1] if rows else None
    alerts = evaluate_alerts(latest, True)
    message = alert_message(alerts or [{"message": "Test alert from Air Quality Dashboard."}], datetime.now(IST))
    return await send_whatsapp_alert(message)


frontend_dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
