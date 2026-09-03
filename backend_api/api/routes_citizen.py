from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import sys
from pathlib import Path

# Add backend_api path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from database.db_session import get_db
from models.orm import CitizenReport

router = APIRouter(prefix="/api/v1/citizen-reports", tags=["Citizen Edge Reporting"])


class CitizenReportCreate(BaseModel):
    latitude: float = Field(..., description="GPS Latitude")
    longitude: float = Field(..., description="GPS Longitude")
    hazard_type: str = Field("tension_crack", description="Type of hazard: 'tension_crack', 'mudslide', 'rockfall', 'debris_flow'")
    onnx_severity_score: float = Field(..., description="On-device edge model severity score (0.0 to 1.0)")
    description: Optional[str] = Field(None, description="Citizen incident description")
    image_path: Optional[str] = Field(None, description="Image URL or local file path")
    reporter_phone: Optional[str] = Field(None, description="Optional citizen phone number")
    sync_status: str = Field("synced", description="'synced', 'pending', or 'failed'")


class AuthorityVerificationUpdate(BaseModel):
    verified_by_authority: bool
    action_taken: str = Field("sdrf_dispatched", description="'sdrf_dispatched', 'verified_monitoring', 'dismissed'")


@router.get("")
def list_citizen_reports(
    status: Optional[str] = None,
    hazard_type: Optional[str] = None,
    limit: int = Query(default=50, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieves citizen incident reports triaged by on-device edge ONNX severity score.
    """
    query = db.query(CitizenReport)
    if status:
        query = query.filter(CitizenReport.sync_status == status)
    if hazard_type:
        query = query.filter(CitizenReport.hazard_type == hazard_type)

    reports = query.order_by(CitizenReport.timestamp.desc()).limit(limit).all()
    return {
        "count": len(reports),
        "reports": [r.to_dict() for r in reports]
    }


@router.post("")
def submit_citizen_report(payload: CitizenReportCreate, db: Session = Depends(get_db)):
    """
    Ingests citizen field report synced from offline-first mobile app edge cache.
    """
    now = datetime.now(timezone.utc)
    report = CitizenReport(
        coordinates=f"POINT({payload.longitude} {payload.latitude})",
        latitude=payload.latitude,
        longitude=payload.longitude,
        timestamp=now,
        image_path=payload.image_path or "/assets/placeholder_hazard.jpg",
        onnx_severity_score=payload.onnx_severity_score,
        hazard_type=payload.hazard_type,
        description=payload.description,
        reporter_phone=payload.reporter_phone,
        sync_status=payload.sync_status,
        verified_by_authority=False,
        action_taken="under_review"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "status": "success",
        "message": "Citizen hazard report received and verified with Edge ONNX score.",
        "report": report.to_dict()
    }


@router.patch("/{report_id}/verify")
def verify_citizen_report(
    report_id: int,
    payload: AuthorityVerificationUpdate,
    db: Session = Depends(get_db)
):
    """
    Allows authorities to review citizen reports and trigger SDRF/NDRF dispatch.
    """
    report = db.query(CitizenReport).filter(CitizenReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Citizen report not found.")

    report.verified_by_authority = payload.verified_by_authority
    report.action_taken = payload.action_taken
    db.commit()

    return {
        "status": "success",
        "message": "Report status updated.",
        "report": report.to_dict()
    }
