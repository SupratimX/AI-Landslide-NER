import os
import sys
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database.db_session import SessionLocal, engine, Base
from backend_api.models.orm import Location, EnvironmentalData, RiskPrediction, CitizenReport

# Realistic high-risk landslide hotspots across India's North Eastern Region (NER)
NER_HOTSPOTS = [
    {
        "region_name": "East Khasi Hills (Mawkdok - Cherrapunji Route, NH-106)",
        "state": "Meghalaya",
        "district": "East Khasi Hills",
        "latitude": 25.3347,
        "longitude": 91.7584,
        "vulnerability_index": 88.5,
        "terrain_type": "Steep Sandstone/Shale Plateau Escarpment",
        "rainfall_24h": 142.5,
        "rainfall_72h": 320.0,
        "soil_moisture": 78.4,
        "slope_angle": 44.5,
        "pore_pressure": 32.8,
        "risk_probability": 0.912,
        "alert_status": "emergency"
    },
    {
        "region_name": "Guwahati - Shillong Corridor (Umiam - Nongpoh Stretch, NH-06)",
        "state": "Meghalaya",
        "district": "Ri-Bhoi",
        "latitude": 25.7538,
        "longitude": 91.8794,
        "vulnerability_index": 76.2,
        "terrain_type": "Weathered Gneissic Hills with Cut Slopes",
        "rainfall_24h": 85.0,
        "rainfall_72h": 190.5,
        "soil_moisture": 68.2,
        "slope_angle": 38.0,
        "pore_pressure": 22.4,
        "risk_probability": 0.745,
        "alert_status": "warning"
    },
    {
        "region_name": "Gangtok - Nathu La Highway (Mile 9 to 13 Zone)",
        "state": "Sikkim",
        "district": "East Sikkim",
        "latitude": 27.3516,
        "longitude": 88.6651,
        "vulnerability_index": 92.0,
        "terrain_type": "High Altitude Fragile Mica Schist / Moraine",
        "rainfall_24h": 110.0,
        "rainfall_72h": 265.0,
        "soil_moisture": 82.1,
        "slope_angle": 52.0,
        "pore_pressure": 39.5,
        "risk_probability": 0.887,
        "alert_status": "emergency"
    },
    {
        "region_name": "Dima Hasao Hill Section (Haflong - Jatinga Valley)",
        "state": "Assam",
        "district": "Dima Hasao",
        "latitude": 25.1834,
        "longitude": 93.0298,
        "vulnerability_index": 84.0,
        "terrain_type": "Disang Shale Soft Formation & Railway Cut",
        "rainfall_24h": 94.2,
        "rainfall_72h": 210.0,
        "soil_moisture": 71.5,
        "slope_angle": 39.5,
        "pore_pressure": 25.1,
        "risk_probability": 0.795,
        "alert_status": "warning"
    },
    {
        "region_name": "Tawang - Sela Pass Mountain Corridor (NH-13)",
        "state": "Arunachal Pradesh",
        "district": "Tawang",
        "latitude": 27.5861,
        "longitude": 91.8653,
        "vulnerability_index": 79.5,
        "terrain_type": "Glaciated Granite Gneiss & Loose Debris",
        "rainfall_24h": 45.0,
        "rainfall_72h": 98.0,
        "soil_moisture": 52.0,
        "slope_angle": 46.0,
        "pore_pressure": 15.2,
        "risk_probability": 0.521,
        "alert_status": "watch"
    },
    {
        "region_name": "Aizawl City Slopes (Bawngkawn - Durtlang Ridge)",
        "state": "Mizoram",
        "district": "Aizawl",
        "latitude": 23.7540,
        "longitude": 92.7306,
        "vulnerability_index": 81.3,
        "terrain_type": "Alternating Siltstone-Shale Folding",
        "rainfall_24h": 62.0,
        "rainfall_72h": 140.0,
        "soil_moisture": 60.5,
        "slope_angle": 36.5,
        "pore_pressure": 18.7,
        "risk_probability": 0.589,
        "alert_status": "watch"
    },
    {
        "region_name": "Champhai Border Highway & Slope Basin",
        "state": "Mizoram",
        "district": "Champhai",
        "latitude": 23.4735,
        "longitude": 93.3297,
        "vulnerability_index": 68.0,
        "terrain_type": "Surma Group Sandstones with Tectonic Fractures",
        "rainfall_24h": 22.0,
        "rainfall_72h": 50.0,
        "soil_moisture": 38.0,
        "slope_angle": 30.0,
        "pore_pressure": 8.0,
        "risk_probability": 0.215,
        "alert_status": "none"
    },
    {
        "region_name": "Kohima - Dimapur Highway (Phesama By-pass, NH-29)",
        "state": "Nagaland",
        "district": "Kohima",
        "latitude": 25.6417,
        "longitude": 94.1102,
        "vulnerability_index": 87.0,
        "terrain_type": "Crushed Clayey Shale & Heavy Saturated Overburden",
        "rainfall_24h": 105.0,
        "rainfall_72h": 240.0,
        "soil_moisture": 77.0,
        "slope_angle": 42.0,
        "pore_pressure": 29.3,
        "risk_probability": 0.835,
        "alert_status": "warning"
    },
    {
        "region_name": "Imphal - Jiribam Highway (Noney Bridge Corridor, NH-37)",
        "state": "Manipur",
        "district": "Noney",
        "latitude": 24.8167,
        "longitude": 93.5975,
        "vulnerability_index": 90.5,
        "terrain_type": "Steep Valley Slopes with Tupul Debris Fan",
        "rainfall_24h": 125.0,
        "rainfall_72h": 290.0,
        "soil_moisture": 80.5,
        "slope_angle": 48.0,
        "pore_pressure": 35.0,
        "risk_probability": 0.895,
        "alert_status": "emergency"
    },
    {
        "region_name": "Jampui Hills Hilltop (Vanghmun - Kanchanpur)",
        "state": "Tripura",
        "district": "North Tripura",
        "latitude": 23.9528,
        "longitude": 92.2789,
        "vulnerability_index": 54.0,
        "terrain_type": "Moderate Lateritic & Sandstone Anticline",
        "rainfall_24h": 18.0,
        "rainfall_72h": 42.0,
        "soil_moisture": 34.0,
        "slope_angle": 24.0,
        "pore_pressure": 6.5,
        "risk_probability": 0.162,
        "alert_status": "none"
    }
]

SAMPLE_CITIZEN_REPORTS = [
    {
        "latitude": 25.3361,
        "longitude": 91.7610,
        "hazard_type": "tension_crack",
        "onnx_severity_score": 0.89,
        "description": "50-meter long longitudinal tension crack appeared across NH-106 shoulder near Mawkdok view point after heavy morning cloudburst.",
        "image_path": "/assets/sample_hazard_crack.jpg",
        "reporter_phone": "+919876543210",
        "sync_status": "synced",
        "verified_by_authority": True,
        "action_taken": "sdrf_dispatched"
    },
    {
        "latitude": 27.3530,
        "longitude": 88.6675,
        "hazard_type": "mudslide",
        "onnx_severity_score": 0.94,
        "description": "Active debris sliding blocking 13th Mile road towards Nathula. Mud slurry descending from upper slope.",
        "image_path": "/assets/sample_mudslide.jpg",
        "reporter_phone": "+919876543211",
        "sync_status": "synced",
        "verified_by_authority": True,
        "action_taken": "sdrf_dispatched"
    },
    {
        "latitude": 25.1850,
        "longitude": 93.0310,
        "hazard_type": "rockfall",
        "onnx_severity_score": 0.72,
        "description": "Multiple boulders rolled down above Haflong hill track. Soil embankment shifting visibly.",
        "image_path": "/assets/sample_rockfall.jpg",
        "reporter_phone": "+919876543212",
        "sync_status": "synced",
        "verified_by_authority": False,
        "action_taken": "under_review"
    }
]


def seed_database():
    """Initializes tables and populates realistic NER dataset."""
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        existing_locs = db.query(Location).count()
        if existing_locs > 0:
            print(f"Database already contains {existing_locs} locations. Skipping seed.")
            return

        print("Seeding NER landslide hotspots and telemetry...")
        now = datetime.now(timezone.utc)

        for spot in NER_HOTSPOTS:
            loc = Location(
                region_name=spot["region_name"],
                coordinates=f"POINT({spot['longitude']} {spot['latitude']})",
                latitude=spot["latitude"],
                longitude=spot["longitude"],
                vulnerability_index=spot["vulnerability_index"],
                state=spot["state"],
                district=spot["district"],
                terrain_type=spot["terrain_type"],
                created_at=now - timedelta(days=30)
            )
            db.add(loc)
            db.flush() # Populate loc.id

            # Create 7-day historical telemetry curve leading to current reading
            for day_offset in range(7, -1, -1):
                hist_time = now - timedelta(days=day_offset, hours=random.randint(0, 4))
                # Scale towards current values
                scale = 1.0 - (day_offset * 0.1)
                rainfall = max(0.0, spot["rainfall_24h"] * scale + random.uniform(-10, 10))
                soil_m = max(10.0, min(95.0, spot["soil_moisture"] * scale + random.uniform(-5, 5)))
                
                env = EnvironmentalData(
                    loc_id=loc.id,
                    timestamp=hist_time,
                    rainfall_mm=round(rainfall, 2),
                    rainfall_72h_mm=round(rainfall * 2.3, 2),
                    soil_moisture=round(soil_m, 2),
                    slope_angle=spot["slope_angle"],
                    pore_water_pressure=round(spot["pore_pressure"] * scale, 2)
                )
                db.add(env)

            # Latest Risk Prediction
            pred = RiskPrediction(
                loc_id=loc.id,
                timestamp=now,
                risk_probability=spot["risk_probability"],
                alert_status=spot["alert_status"],
                contributing_factors=json.dumps({
                    "rainfall_24h_mm": spot["rainfall_24h"],
                    "soil_moisture_pct": spot["soil_moisture"],
                    "slope_angle_deg": spot["slope_angle"],
                    "vulnerability_index": spot["vulnerability_index"],
                    "primary_driver": "Extreme Monsoonal Precipitation & Pore Pressure" if spot["rainfall_24h"] > 70 else "Slope Steepness & Lithology"
                }),
                forecast_horizon_hours=24
            )
            db.add(pred)

        # Seed sample citizen reports
        for rep in SAMPLE_CITIZEN_REPORTS:
            citizen_rep = CitizenReport(
                coordinates=f"POINT({rep['longitude']} {rep['latitude']})",
                latitude=rep["latitude"],
                longitude=rep["longitude"],
                timestamp=now - timedelta(hours=random.randint(1, 12)),
                image_path=rep["image_path"],
                onnx_severity_score=rep["onnx_severity_score"],
                hazard_type=rep["hazard_type"],
                description=rep["description"],
                reporter_phone=rep["reporter_phone"],
                sync_status=rep["sync_status"],
                verified_by_authority=rep["verified_by_authority"],
                action_taken=rep["action_taken"]
            )
            db.add(citizen_rep)

        db.commit()
        print("Database seeded successfully with NER hotspots, telemetry history, and citizen reports!")

    except Exception as e:
        db.rollback()
        print(f"Error during database seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
