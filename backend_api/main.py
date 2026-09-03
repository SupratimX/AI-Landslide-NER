import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Add paths
root_path = Path(__file__).resolve().parent.parent
sys.path.append(str(root_path))
sys.path.append(str(Path(__file__).resolve().parent))

from config import settings
from database.db_session import engine, Base, SessionLocal
from database.seed_data import seed_database
from models.orm import Location

# Route imports
from api.routes_locations import router as locations_router
from api.routes_telemetry import router as telemetry_router
from api.routes_prediction import router as prediction_router
from api.routes_alerts import router as alerts_router
from api.routes_citizen import router as citizen_router
from api.routes_geospatial import router as geospatial_router
from api.routes_health import router as health_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("landsafe.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes DB schemas and seeds realistic NER dataset on launch if needed."""
    logger.info("Initializing LANDSAFE NER Platform backend...")
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        count = db.query(Location).count()
        db.close()
        if count == 0:
            logger.info("Database empty on startup. Auto-seeding realistic NER landslide hotspots...")
            seed_database()
        else:
            logger.info(f"Database ready with {count} monitored locations.")
    except Exception as e:
        logger.warning(f"Database initialization note: {e}")
    yield
    logger.info("LANDSAFE NER backend shutting down.")


app = FastAPI(
    title="LANDSAFE NER — AI Early Warning & Landslide Risk Monitoring API",
    description="Backend API for SIH 2026 (Problem Statement ID: SIH26001). Low-Network Resilience, Geospatial Intelligence, On-Device ONNX Inference, and Multilingual Alerting for India's North Eastern Region.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health_router)
app.include_router(locations_router)
app.include_router(telemetry_router)
app.include_router(prediction_router)
app.include_router(alerts_router)
app.include_router(citizen_router)
app.include_router(geospatial_router)

# Path to the frontend dashboard HTML
DASHBOARD_HTML_PATH = root_path / "frontend_gis_dashboard" / "public" / "index.html"


@app.get("/", tags=["Dashboard UI"])
def get_dashboard():
    """Serves the interactive Tactical GIS Authority Dashboard."""
    if DASHBOARD_HTML_PATH.exists():
        return FileResponse(str(DASHBOARD_HTML_PATH))
    return {
        "platform": "LANDSAFE NER",
        "message": "Dashboard HTML not found, open /docs for Swagger UI"
    }


@app.get("/dashboard", tags=["Dashboard UI"])
def get_dashboard_alias():
    """Alias for Tactical GIS Authority Dashboard."""
    return get_dashboard()


@app.get("/api/summary", tags=["Root"])
def api_summary():
    return {
        "platform": "LANDSAFE NER — AI Early Warning & Landslide Risk Monitoring",
        "sih_year": 2026,
        "problem_statement_id": "SIH26001",
        "target_region": "North Eastern Region (NER), India",
        "interactive_api_docs": "/docs",
        "status": "online"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
