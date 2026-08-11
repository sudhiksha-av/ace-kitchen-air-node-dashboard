from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Breakpoint:
    c_low: float
    c_high: float
    i_low: int
    i_high: int
    category: str
    color: str


PM25_BREAKPOINTS = [
    Breakpoint(0.0, 12.0, 0, 50, "Good", "#2e7d32"),
    Breakpoint(12.1, 35.4, 51, 100, "Moderate", "#f9a825"),
    Breakpoint(35.5, 55.4, 101, 150, "Unhealthy for Sensitive Groups", "#ef6c00"),
    Breakpoint(55.5, 150.4, 151, 200, "Unhealthy", "#c62828"),
    Breakpoint(150.5, 250.4, 201, 300, "Very Unhealthy", "#6a1b9a"),
    Breakpoint(250.5, 500.4, 301, 500, "Hazardous", "#4e342e"),
]


def calculate_pm25_aqi(pm25: Optional[float]) -> dict:
    if pm25 is None:
        return {"aqi": None, "category": "No data", "color": "#78909c"}

    concentration = round(float(pm25), 1)
    for breakpoint in PM25_BREAKPOINTS:
        if breakpoint.c_low <= concentration <= breakpoint.c_high:
            aqi = ((breakpoint.i_high - breakpoint.i_low) / (breakpoint.c_high - breakpoint.c_low))
            aqi = aqi * (concentration - breakpoint.c_low) + breakpoint.i_low
            return {
                "aqi": round(aqi),
                "category": breakpoint.category,
                "color": breakpoint.color,
            }

    return {"aqi": 500, "category": "Hazardous", "color": "#4e342e"}
