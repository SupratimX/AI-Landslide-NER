import os
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Numeric, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship, declarative_base
import sys
from pathlib import Path

# Common Base
Base = declarative_base()

try:
    from geoalchemy2 import Geometry
    GEOALCHEMY_AVAILABLE = True
except ImportError:
    GEOALCHEMY_AVAILABLE = False


class Location(Base):
    __tablename__ = "locations"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    region_name = Column(String(255), nullable=False, index=True)
    
    coordinates = Column(String(255), nullable=False) # "POINT(lon lat)"
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    vulnerability_index = Column(Float, nullable=True) # 0 to 100
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    terrain_type = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "region_name": self.region_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "vulnerability_index": float(self.vulnerability_index) if self.vulnerability_index is not None else 0.0,
            "state": self.state,
            "district": self.district,
            "terrain_type": self.terrain_type,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class EnvironmentalData(Base):
    __tablename__ = "environmental_data"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    loc_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    rainfall_mm = Column(Float, nullable=True)
    rainfall_72h_mm = Column(Float, nullable=True)
    soil_moisture = Column(Float, nullable=True)
    slope_angle = Column(Float, nullable=True)
    pore_water_pressure = Column(Float, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "loc_id": self.loc_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "rainfall_mm": float(self.rainfall_mm) if self.rainfall_mm is not None else 0.0,
            "rainfall_72h_mm": float(self.rainfall_72h_mm) if self.rainfall_72h_mm is not None else 0.0,
            "soil_moisture": float(self.soil_moisture) if self.soil_moisture is not None else 0.0,
            "slope_angle": float(self.slope_angle) if self.slope_angle is not None else 0.0,
            "pore_water_pressure": float(self.pore_water_pressure) if self.pore_water_pressure is not None else 0.0
        }


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    loc_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    risk_probability = Column(Float, nullable=False)
    alert_status = Column(String(20), nullable=False, default="none")
    contributing_factors = Column(Text, nullable=True)
    forecast_horizon_hours = Column(Integer, default=24)

    def to_dict(self):
        return {
            "id": self.id,
            "loc_id": self.loc_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "risk_probability": round(float(self.risk_probability), 4),
            "alert_status": self.alert_status,
            "contributing_factors": self.contributing_factors,
            "forecast_horizon_hours": self.forecast_horizon_hours
        }


class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    coordinates = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    image_path = Column(Text, nullable=True)
    onnx_severity_score = Column(Float, nullable=True)
    hazard_type = Column(String(50), default="debris_flow")
    description = Column(Text, nullable=True)
    reporter_phone = Column(String(20), nullable=True)
    sync_status = Column(String(20), nullable=False, default="synced")
    verified_by_authority = Column(Boolean, default=False)
    action_taken = Column(String(100), default="under_review")

    def to_dict(self):
        return {
            "id": self.id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "image_path": self.image_path,
            "onnx_severity_score": float(self.onnx_severity_score) if self.onnx_severity_score is not None else 0.0,
            "hazard_type": self.hazard_type,
            "description": self.description,
            "reporter_phone": self.reporter_phone,
            "sync_status": self.sync_status,
            "verified_by_authority": self.verified_by_authority,
            "action_taken": self.action_taken
        }
