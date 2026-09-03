from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any
import sys
from pathlib import Path

# Add backend_api path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from database.db_session import get_db
from models.orm import Location, RiskPrediction, EnvironmentalData
from services.geospatial_service import geospatial_service

router = APIRouter(prefix="/api/v1/geospatial", tags=["GIS & Geospatial Layers"])


@router.get("/faults")
def get_fault_lines() -> Dict[str, Any]:
    """Returns geological fault lines from GSI National Geoscience Data Repository (NGDR)."""
    return geospatial_service.get_fault_lines()


@router.get("/susceptibility")
def get_susceptibility_zones() -> Dict[str, Any]:
    """Returns landslide susceptibility polygons from NRSC Landslide Atlas / NESAC NeSDR."""
    return geospatial_service.get_susceptibility_zones()


@router.get("/hotspots-geojson")
def get_hotspots_geojson(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Returns all monitored NER locations formatted as a GeoJSON FeatureCollection
    with real-time risk level styling tokens for Leaflet / GIS dashboards.
    """
    locations = db.query(Location).all()
    features = []

    for loc in locations:
        latest_pred = (
            db.query(RiskPrediction)
            .filter(RiskPrediction.loc_id == loc.id)
            .order_by(RiskPrediction.timestamp.desc())
            .first()
        )
        latest_env = (
            db.query(EnvironmentalData)
            .filter(EnvironmentalData.loc_id == loc.id)
            .order_by(EnvironmentalData.timestamp.desc())
            .first()
        )

        status = latest_pred.alert_status if latest_pred else "none"
        prob = round(float(latest_pred.risk_probability), 4) if latest_pred else 0.10

        # Style mapping
        color_map = {
            "none": "#22c55e",      # Green
            "watch": "#eab308",     # Yellow
            "warning": "#f97316",   # Orange
            "emergency": "#ef4444"  # Red
        }

        feature = {
            "type": "Feature",
            "properties": {
                "id": loc.id,
                "region_name": loc.region_name,
                "state": loc.state,
                "district": loc.district,
                "terrain_type": loc.terrain_type,
                "vulnerability_index": float(loc.vulnerability_index) if loc.vulnerability_index else 0.0,
                "alert_status": status,
                "risk_probability": prob,
                "marker_color": color_map.get(status, "#22c55e"),
                "rainfall_24h_mm": float(latest_env.rainfall_mm) if latest_env and latest_env.rainfall_mm else 0.0,
                "soil_moisture_pct": float(latest_env.soil_moisture) if latest_env and latest_env.soil_moisture else 0.0,
                "slope_angle_deg": float(latest_env.slope_angle) if latest_env and latest_env.slope_angle else 0.0
            },
            "geometry": {
                "type": "Point",
                "coordinates": [loc.longitude, loc.latitude]
            }
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features
    }
