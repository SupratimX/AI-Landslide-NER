from fastapi import APIRouter
from datetime import datetime, timezone
import sys
from pathlib import Path

# Add backend_api path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import settings
from database.db_session import is_using_sqlite
from ml_services.model_loader import risk_model_service

router = APIRouter(prefix="/api/v1/health", tags=["System Health & Telemetry"])


@router.get("")
def health_check():
    """
    Returns live system status, ML inference engine status, and database mode.
    """
    onnx_ready = risk_model_service.onnx_session is not None
    pkl_ready = risk_model_service.pkl_model is not None

    return {
        "status": "healthy",
        "service": "LANDSAFE-NER-PLATFORM-API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database_backend": "SQLite (Local Fallback)" if is_using_sqlite() else "PostgreSQL + PostGIS",
        "ml_engine": {
            "onnx_runtime_active": onnx_ready,
            "pickle_fallback_active": pkl_ready,
            "model_metadata": risk_model_service.metadata
        },
        "geospatial_integrations": {
            "gsi_ngdr": "Active Adapter (NGDR Primary)",
            "nrsc_landslide_atlas": "Active Adapter",
            "nesac_nesdr": "Active Adapter"
        },
        "alerting": {
            "twilio_configured": bool(settings.TWILIO_ACCOUNT_SID),
            "fast2sms_configured": bool(settings.FAST2SMS_API_KEY)
        }
    }
