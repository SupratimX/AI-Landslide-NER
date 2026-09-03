from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import sys
from pathlib import Path

# Add backend_api path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from database.db_session import get_db
from models.orm import Location, EnvironmentalData, RiskPrediction

router = APIRouter(prefix="/api/v1/locations", tags=["Locations & Hotspots"])


@router.get("")
def list_locations(
    state: Optional[str] = None,
    min_vulnerability: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Lists all monitored landslide hotspots across NER with latest telemetry and risk."""
    query = db.query(Location)
    if state:
        query = query.filter(Location.state.ilike(f"%{state}%"))
    if min_vulnerability is not None:
        query = query.filter(Location.vulnerability_index >= min_vulnerability)

    locations = query.all()
    results = []

    for loc in locations:
        loc_dict = loc.to_dict()

        # Fetch latest environmental reading
        latest_env = (
            db.query(EnvironmentalData)
            .filter(EnvironmentalData.loc_id == loc.id)
            .order_by(EnvironmentalData.timestamp.desc())
            .first()
        )
        # Fetch latest risk prediction
        latest_pred = (
            db.query(RiskPrediction)
            .filter(RiskPrediction.loc_id == loc.id)
            .order_by(RiskPrediction.timestamp.desc())
            .first()
        )

        loc_dict["latest_telemetry"] = latest_env.to_dict() if latest_env else None
        loc_dict["latest_risk"] = latest_pred.to_dict() if latest_pred else {
            "risk_probability": 0.10,
            "alert_status": "none"
        }
        results.append(loc_dict)

    return {"count": len(results), "locations": results}


@router.get("/{location_id}")
def get_location_detail(location_id: int, db: Session = Depends(get_db)):
    """Retrieves detailed profile for a specific monitored hotspot."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location hotspot not found.")
    
    loc_dict = loc.to_dict()
    latest_env = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.loc_id == loc.id)
        .order_by(EnvironmentalData.timestamp.desc())
        .first()
    )
    latest_pred = (
        db.query(RiskPrediction)
        .filter(RiskPrediction.loc_id == loc.id)
        .order_by(RiskPrediction.timestamp.desc())
        .first()
    )
    loc_dict["latest_telemetry"] = latest_env.to_dict() if latest_env else None
    loc_dict["latest_risk"] = latest_pred.to_dict() if latest_pred else None
    return loc_dict


@router.get("/{location_id}/history")
def get_location_history(
    location_id: int,
    limit: int = Query(default=30, le=100),
    db: Session = Depends(get_db)
):
    """Returns historical environmental telemetry and risk predictions for time-series charts."""
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location hotspot not found.")

    env_records = (
        db.query(EnvironmentalData)
        .filter(EnvironmentalData.loc_id == location_id)
        .order_by(EnvironmentalData.timestamp.asc())
        .limit(limit)
        .all()
    )
    pred_records = (
        db.query(RiskPrediction)
        .filter(RiskPrediction.loc_id == location_id)
        .order_by(RiskPrediction.timestamp.asc())
        .limit(limit)
        .all()
    )

    return {
        "location": loc.to_dict(),
        "telemetry_history": [e.to_dict() for e in env_records],
        "risk_history": [p.to_dict() for p in pred_records]
    }
