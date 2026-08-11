from datetime import datetime
from typing import Iterable

import pandas as pd

PARAMETERS = ["temperature", "humidity", "pm25", "pm10", "aqi"]


def summarize(rows: list[dict], parameters: Iterable[str] = PARAMETERS) -> dict:
    if not rows:
        return {param: {"avg": None, "min": None, "max": None} for param in parameters}

    frame = pd.DataFrame(rows)
    summary = {}
    for param in parameters:
        if param not in frame:
            continue
        series = pd.to_numeric(frame[param], errors="coerce").dropna()
        summary[param] = {
            "avg": round(float(series.mean()), 2) if not series.empty else None,
            "min": round(float(series.min()), 2) if not series.empty else None,
            "max": round(float(series.max()), 2) if not series.empty else None,
        }
    return summary


def compare_ranges(first: list[dict], second: list[dict], parameters: Iterable[str] = PARAMETERS) -> dict:
    first_summary = summarize(first, parameters)
    second_summary = summarize(second, parameters)
    difference = {}
    for param in parameters:
        first_avg = first_summary.get(param, {}).get("avg")
        second_avg = second_summary.get(param, {}).get("avg")
        if first_avg in (None, 0) or second_avg is None:
            pct = None
        else:
            pct = round(((second_avg - first_avg) / first_avg) * 100, 2)
        difference[param] = {"avg_percent": pct}

    return {"first": first_summary, "second": second_summary, "difference": difference}


def parse_ist(value: str) -> datetime:
    return datetime.fromisoformat(value)
