from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import sys
from pathlib import Path

# Add backend_api path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from ml_services.model_loader import risk_model_service

router = APIRouter(prefix="/api/v1/predict-risk", tags=["Landslide Risk AI Engine"])


class PredictionRequest(BaseModel):
    rainfall_24h_mm: float = Field(..., description="24-hour cumulative rainfall in mm")
    rainfall_72h_mm: Optional[float] = Field(None, description="72-hour cumulative rainfall in mm")
    soil_moisture_pct: float = Field(..., description="Volumetric soil moisture percentage (0-100)")
    slope_angle_deg: float = Field(..., description="Slope angle in degrees (0-90)")
    vulnerability_index: float = Field(default=70.0, description="GSI Geological Vulnerability Index (0-100)")
    pore_water_pressure_kpa: Optional[float] = Field(None, description="Pore water pressure in kPa")
    elevation_m: Optional[float] = Field(default=1200.0, description="Elevation in meters")
    vegetation_ndvi: Optional[float] = Field(default=0.55, description="Vegetation NDVI index (-0.2 to 1.0)")


@router.post("")
def predict_landslide_risk(payload: PredictionRequest) -> Dict[str, Any]:
    """
    Executes ONNX Runtime / XGBoost AI early warning risk prediction
    based on real-time hydrometeorological and geological factors.
    """
    features = payload.model_dump()
    result = risk_model_service.predict(features)
    return {
        "model_version": "LANDSAFE-NER-XGB-ONNX-v1.0",
        "input_features": features,
        "prediction": result
    }
