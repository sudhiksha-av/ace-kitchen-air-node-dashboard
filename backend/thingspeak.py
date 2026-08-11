from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import httpx
import pandas as pd

from .aqi import calculate_pm25_aqi
from .config import get_settings

IST = timezone(timedelta(hours=5, minutes=30))


def _to_float(value: Any) -> Optional[float]:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _convert_timestamp(value: str) -> tuple[str, str]:
    utc_dt = datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    ist_dt = utc_dt.astimezone(IST)
    return utc_dt.isoformat(), ist_dt.isoformat()


def _normalize_feed(feed: dict[str, Any]) -> dict[str, Any]:
    utc_ts, ist_ts = _convert_timestamp(feed["created_at"])
    temperature = _to_float(feed.get("field1"))
    humidity = _to_float(feed.get("field2"))
    pm25 = _to_float(feed.get("field3"))
    pm10 = _to_float(feed.get("field4"))
    aqi = calculate_pm25_aqi(pm25)
    return {
        "entry_id": feed.get("entry_id"),
        "timestamp_utc": utc_ts,
        "timestamp_ist": ist_ts,
        "temperature": temperature,
        "humidity": humidity,
        "pm25": pm25,
        "pm10": pm10,
        "aqi": aqi["aqi"],
        "aqi_category": aqi["category"],
        "aqi_color": aqi["color"],
    }


def _mock_feeds(hours: int = 48) -> list[dict[str, Any]]:
    now_ist = datetime.now(IST).replace(second=0, microsecond=0)
    rows = []
    for index in range(hours * 4):
        stamp = now_ist - timedelta(minutes=15 * (hours * 4 - index - 1))
        hour = stamp.hour + stamp.minute / 60
        pm25 = 28 + 17 * max(0, (1 - abs(hour - 21) / 12)) + (index % 7) * 0.9
        pm10 = pm25 * 1.7 + (index % 5) * 2.4
        temperature = 26 + 4 * max(0, (1 - abs(hour - 14) / 10)) + (index % 3) * 0.25
        humidity = 72 - 15 * max(0, (1 - abs(hour - 14) / 10)) + (index % 4)
        aqi = calculate_pm25_aqi(pm25)
        rows.append(
            {
                "entry_id": index + 1,
                "timestamp_utc": stamp.astimezone(timezone.utc).isoformat(),
                "timestamp_ist": stamp.isoformat(),
                "temperature": round(temperature, 1),
                "humidity": round(humidity, 1),
                "pm25": round(pm25, 1),
                "pm10": round(pm10, 1),
                "aqi": aqi["aqi"],
                "aqi_category": aqi["category"],
                "aqi_color": aqi["color"],
            }
        )
    return rows


def _thingspeak_time(value: datetime) -> str:
    utc_dt = value.astimezone(timezone.utc)
    return utc_dt.strftime("%Y-%m-%d %H:%M:%S")


async def fetch_thingspeak_data(
    results: Optional[int] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> list[dict[str, Any]]:
    settings = get_settings()
    if not settings.thingspeak_channel_id:
        return filter_rows(_mock_feeds(), start, end)

    params: dict[str, Any] = {"results": results or settings.thingspeak_results}
    if start:
        params["start"] = _thingspeak_time(start)
    if end:
        params["end"] = _thingspeak_time(end)
    if settings.thingspeak_read_api_key:
        params["api_key"] = settings.thingspeak_read_api_key

    url = f"https://api.thingspeak.com/channels/{settings.thingspeak_channel_id}/feeds.json"
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        payload = response.json()

    return [_normalize_feed(feed) for feed in payload.get("feeds", []) if feed.get("created_at")]


def filter_rows(
    rows: list[dict[str, Any]],
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> list[dict[str, Any]]:
    if not start and not end:
        return rows

    filtered = []
    for row in rows:
        stamp = datetime.fromisoformat(row["timestamp_ist"])
        if start and stamp < start:
            continue
        if end and stamp > end:
            continue
        filtered.append(row)
    return filtered


def rows_to_frame(rows: list[dict[str, Any]]) -> pd.DataFrame:
    return pd.DataFrame(rows)
