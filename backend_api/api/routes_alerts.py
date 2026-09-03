from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional
import sys
from pathlib import Path

# Add backend_api path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from database.db_session import get_db
from models.orm import Location, RiskPrediction, EnvironmentalData
from services.alert_service import alert_service

router = APIRouter(prefix="/api/v1/alerts", tags=["Early Warning & Broadcast Center"])


class BroadcastRequest(BaseModel):
    location_id: Optional[int] = None
    region_name: str = Field(..., description="Target hotspot or district name")
    alert_level: str = Field("warning", description="'watch', 'warning', or 'emergency'")
    risk_probability: float = Field(0.85, description="Risk probability score (0-1)")
    target_phones: Optional[List[str]] = Field(default=None, description="List of recipient phone numbers (E.164 format)")
    languages: Optional[List[str]] = Field(default=["en", "as", "hi", "bn", "mizo"], description="Target language codes")


@router.get("/live")
def get_live_alerts(db: Session = Depends(get_db)):
    """
    Returns all active Watch, Warning, and Emergency alerts across NER.
    """
    locations = db.query(Location).all()
    active_alerts = []

    for loc in locations:
        latest_pred = (
            db.query(RiskPrediction)
            .filter(RiskPrediction.loc_id == loc.id)
            .order_by(RiskPrediction.timestamp.desc())
            .first()
        )
        if latest_pred and latest_pred.alert_status in ["watch", "warning", "emergency"]:
            latest_env = (
                db.query(EnvironmentalData)
                .filter(EnvironmentalData.loc_id == loc.id)
                .order_by(EnvironmentalData.timestamp.desc())
                .first()
            )
            active_alerts.append({
                "location_id": loc.id,
                "region_name": loc.region_name,
                "state": loc.state,
                "district": loc.district,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
                "alert_status": latest_pred.alert_status,
                "risk_probability": round(float(latest_pred.risk_probability), 4),
                "timestamp": latest_pred.timestamp.isoformat() if latest_pred.timestamp else None,
                "rainfall_24h_mm": float(latest_env.rainfall_mm) if latest_env and latest_env.rainfall_mm else 0.0,
                "soil_moisture_pct": float(latest_env.soil_moisture) if latest_env and latest_env.soil_moisture else 0.0,
                "slope_angle_deg": float(latest_env.slope_angle) if latest_env and latest_env.slope_angle else 0.0
            })

    # Sort by risk probability descending
    active_alerts.sort(key=lambda x: x["risk_probability"], reverse=True)
    return {
        "active_count": len(active_alerts),
        "alerts": active_alerts
    }


@router.post("/broadcast")
def trigger_emergency_broadcast(payload: BroadcastRequest):
    """
    Dispatches automated localized multilingual SMS & Voice warnings
    to field responders, district disaster managers, and citizen hotlines.
    """
    broadcast_result = alert_service.broadcast_alert(
        region_name=payload.region_name,
        alert_level=payload.alert_level,
        risk_probability=payload.risk_probability,
        target_phones=payload.target_phones,
        languages=payload.languages
    )
    return broadcast_result


@router.get("/history")
def get_broadcast_history():
    """Returns log of recent emergency broadcasts."""
    return {
        "count": len(alert_service.broadcast_logs),
        "history": alert_service.broadcast_logs
    }
