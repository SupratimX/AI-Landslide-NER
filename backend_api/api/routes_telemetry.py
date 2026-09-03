from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json
import sys
from pathlib import Path

# Add backend_api path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from database.db_session import get_db
from models.orm import Location, EnvironmentalData, RiskPrediction
from ml_services.model_loader import risk_model_service

router = APIRouter(prefix="/api/v1/environmental-data", tags=["Telemetry & Ingestion"])


class EnvironmentalDataInput(BaseModel):
    loc_id: int
    rainfall_mm: float = Field(..., description="24-hr cumulative rainfall in mm")
    rainfall_72h_mm: float = Field(None, description="72-hr cumulative rainfall in mm")
    soil_moisture: float = Field(..., description="Volumetric soil moisture % (0-100)")
    slope_angle: float = Field(..., description="Slope gradient in degrees")
    pore_water_pressure: float = Field(None, description="Pore water pressure in kPa")


@router.post("")
def ingest_environmental_data(payload: EnvironmentalDataInput, db: Session = Depends(get_db)):
    """
    Ingests IoT sensor / meteorological feed data, automatically executes
    the ONNX/XGBoost risk model, and stores the updated risk prediction.
    """
    loc = db.query(Location).filter(Location.id == payload.loc_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found.")

    r72 = payload.rainfall_72h_mm if payload.rainfall_72h_mm is not None else payload.rainfall_mm * 2.2
    pore_press = payload.pore_water_pressure if payload.pore_water_pressure is not None else (payload.soil_moisture / 100.0) * (payload.rainfall_mm / 10.0) * 1.8
    now = datetime.now(timezone.utc)

    # 1. Insert environmental record
    env = EnvironmentalData(
        loc_id=payload.loc_id,
        timestamp=now,
        rainfall_mm=payload.rainfall_mm,
        rainfall_72h_mm=r72,
        soil_moisture=payload.soil_moisture,
        slope_angle=payload.slope_angle,
        pore_water_pressure=pore_press
    )
    db.add(env)
    db.flush()

    # 2. Run real-time risk prediction
    features = {
        "rainfall_24h_mm": payload.rainfall_mm,
        "rainfall_72h_mm": r72,
        "soil_moisture_pct": payload.soil_moisture,
        "slope_angle_deg": payload.slope_angle,
        "vulnerability_index": float(loc.vulnerability_index) if loc.vulnerability_index else 60.0,
        "pore_water_pressure_kpa": pore_press
    }
    prediction = risk_model_service.predict(features)

    # 3. Store risk prediction in DB
    risk_record = RiskPrediction(
        loc_id=loc.id,
        timestamp=now,
        risk_probability=prediction["risk_probability"],
        alert_status=prediction["alert_status"],
        contributing_factors=json.dumps(prediction["contributing_factors"]),
        forecast_horizon_hours=24
    )
    db.add(risk_record)
    db.commit()

    return {
        "status": "success",
        "message": "Environmental telemetry ingested and live risk prediction computed.",
        "environmental_data": env.to_dict(),
        "risk_prediction": risk_record.to_dict(),
        "action_required": prediction["action_required"]
    }
