import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./landsafe_ner.db"
    POSTGIS_ENABLED: bool = False

    # External Geospatial APIs
    NGDR_API_BASE_URL: str = "https://ngdr.gsi.gov.in/api/v1"
    NGDR_API_KEY: str = ""

    NRSC_API_BASE_URL: str = "https://bhuvan-app1.nrsc.gov.in/landslide/api"
    NRSC_API_KEY: str = ""

    NESAC_NESDR_API_BASE_URL: str = "https://nesdr.nesac.gov.in/api/v1"
    NESAC_NESDR_API_KEY: str = ""

    WEATHER_API_KEY: str = ""

    # Alerting (Twilio & Fast2SMS)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    FAST2SMS_API_KEY: str = ""

    # Backend
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    JWT_SECRET_KEY: str = "landsafe-ner-secret-key-2026"
    JWT_ALGORITHM: str = "HS256"
    CORS_ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8000,http://127.0.0.1:3000,http://127.0.0.1:8000"

    # ML Paths
    MODEL_EXPORT_DIR: str = "ml_training_pipeline/export"
    XGBOOST_MODEL_PATH: str = "ml_training_pipeline/export/risk_model.onnx"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
