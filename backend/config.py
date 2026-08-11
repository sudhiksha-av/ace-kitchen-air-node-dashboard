from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).with_name(".env")
DEFAULT_BASELINE_CSV = Path(__file__).parent / "data" / "cooking_pollution_baseline.csv"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Air Quality Dashboard API"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    thingspeak_channel_id: Optional[str] = None
    thingspeak_read_api_key: Optional[str] = None
    thingspeak_results: int = 800

    cache_ttl_seconds: int = 15
    node_offline_minutes: int = 60

    pm25_threshold: float = 35.4
    pm10_threshold: float = 154.0
    aqi_threshold: int = 100

    cooking_baseline_alerts_enabled: bool = True
    cooking_baseline_csv: str = str(DEFAULT_BASELINE_CSV)
    cooking_baseline_stat: str = "P95"
    cooking_baseline_margin_percent: float = 0

    whatsapp_provider: str = Field(default="disabled", description="disabled, twilio, meta, callmebot, ultramsg")
    whatsapp_to: str = "9059236651"

    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_from: Optional[str] = None

    meta_token: Optional[str] = None
    meta_phone_number_id: Optional[str] = None

    callmebot_apikey: Optional[str] = None

    ultramsg_instance_id: Optional[str] = None
    ultramsg_token: Optional[str] = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
