import csv
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Optional

from .config import get_settings

MEAL_PERIODS = [
    ("Breakfast", 6, 11),
    ("Lunch", 11, 15),
    ("Snacks", 15, 18),
    ("Dinner", 18, 23),
]

METRIC_COLUMNS = {
    "pm25": ("PM2.5", "ug/m3", "PM25"),
    "pm10": ("PM10", "ug/m3", "PM10"),
    "aqi": ("AQI", "", "AQI"),
}


def meal_period_for_time(stamp: datetime) -> Optional[str]:
    hour = stamp.hour + stamp.minute / 60
    for name, start_hour, end_hour in MEAL_PERIODS:
        if start_hour <= hour < end_hour:
            return name
    return None


@lru_cache
def load_baseline() -> dict[tuple[str, str], dict]:
    settings = get_settings()
    path = Path(settings.cooking_baseline_csv) if settings.cooking_baseline_csv else Path(__file__).parent / "data" / "cooking_pollution_baseline.csv"
    if not path.exists():
        return {}

    baseline = {}
    with path.open(newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            day = row.get("Day_of_Week")
            period = row.get("Meal_Period")
            if day and period:
                baseline[(day, period)] = row
    return baseline


def _to_float(value) -> Optional[float]:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def evaluate_cooking_baseline_alerts(latest: Optional[dict]) -> list[dict]:
    settings = get_settings()
    if not settings.cooking_baseline_alerts_enabled or not latest:
        return []

    timestamp = latest.get("timestamp_ist")
    if not timestamp:
        return []

    stamp = datetime.fromisoformat(timestamp)
    day = stamp.strftime("%A")
    period = meal_period_for_time(stamp)
    if not period:
        return []

    baseline = load_baseline().get((day, period))
    if not baseline:
        return []

    alerts = []
    stat = settings.cooking_baseline_stat.upper()
    margin_multiplier = 1 + (settings.cooking_baseline_margin_percent / 100)

    for key, (label, unit, csv_prefix) in METRIC_COLUMNS.items():
        actual = _to_float(latest.get(key))
        expected = _to_float(baseline.get(f"{csv_prefix}_{stat}"))
        if actual is None or expected is None:
            continue

        limit = expected * margin_multiplier
        if actual > limit:
            unit_label = f" {unit}" if unit else ""
            alerts.append(
                {
                    "type": f"cooking_baseline_{key}",
                    "severity": "warning",
                    "message": (
                        f"{label} is above normal cooking baseline for {day} {period}: "
                        f"{round(actual, 2)}{unit_label} vs {stat} baseline {round(expected, 2)}{unit_label}."
                    ),
                    "baseline": {
                        "day": day,
                        "meal_period": period,
                        "metric": key,
                        "stat": stat,
                        "expected": expected,
                        "actual": actual,
                        "margin_percent": settings.cooking_baseline_margin_percent,
                    },
                }
            )

    return alerts
