from datetime import datetime
from typing import Optional

import httpx

from .baseline_alerts import evaluate_cooking_baseline_alerts
from .config import get_settings


def evaluate_alerts(latest: Optional[dict], is_online: bool) -> list[dict]:
    settings = get_settings()
    if not latest:
        return [{"type": "node", "severity": "critical", "message": "No sensor data available."}]

    alerts = []
    if latest.get("pm25") is not None and latest["pm25"] > settings.pm25_threshold:
        alerts.append({"type": "pm25", "severity": "warning", "message": f"PM2.5 is {latest['pm25']} ug/m3."})
    if latest.get("pm10") is not None and latest["pm10"] > settings.pm10_threshold:
        alerts.append({"type": "pm10", "severity": "warning", "message": f"PM10 is {latest['pm10']} ug/m3."})
    if latest.get("aqi") is not None and latest["aqi"] > settings.aqi_threshold:
        alerts.append({"type": "aqi", "severity": "warning", "message": f"AQI is {latest['aqi']}."})
    alerts.extend(evaluate_cooking_baseline_alerts(latest))
    if not is_online:
        alerts.append({"type": "node", "severity": "critical", "message": "Node has been offline for more than 1 hour."})
    return alerts


async def send_whatsapp_alert(message: str) -> dict:
    settings = get_settings()
    provider = settings.whatsapp_provider.lower()

    if provider == "disabled":
        return {"sent": False, "provider": "disabled", "detail": "WhatsApp provider is not configured."}

    async with httpx.AsyncClient(timeout=20) as client:
        if provider == "callmebot":
            response = await client.get(
                "https://api.callmebot.com/whatsapp.php",
                params={"phone": settings.whatsapp_to, "text": message, "apikey": settings.callmebot_apikey},
            )
        elif provider == "twilio":
            response = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Messages.json",
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
                data={"From": settings.twilio_from, "To": f"whatsapp:+91{settings.whatsapp_to}", "Body": message},
            )
        elif provider == "meta":
            response = await client.post(
                f"https://graph.facebook.com/v20.0/{settings.meta_phone_number_id}/messages",
                headers={"Authorization": f"Bearer {settings.meta_token}"},
                json={
                    "messaging_product": "whatsapp",
                    "to": f"91{settings.whatsapp_to}",
                    "type": "text",
                    "text": {"body": message},
                },
            )
        elif provider == "ultramsg":
            response = await client.post(
                f"https://api.ultramsg.com/{settings.ultramsg_instance_id}/messages/chat",
                data={"token": settings.ultramsg_token, "to": f"+91{settings.whatsapp_to}", "body": message},
            )
        else:
            return {"sent": False, "provider": provider, "detail": "Unsupported WhatsApp provider."}

    return {"sent": response.is_success, "provider": provider, "status_code": response.status_code}


def alert_message(alerts: list[dict], generated_at: datetime) -> str:
    lines = [f"Air quality alert at {generated_at.strftime('%d %b %Y, %I:%M %p IST')}"]
    lines.extend(alert["message"] for alert in alerts)
    return "\n".join(lines)
