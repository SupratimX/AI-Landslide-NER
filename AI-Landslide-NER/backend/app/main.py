"""
NER Landslide Early Warning System — Python Backend (FastAPI)
Runs ML prediction + dashboard APIs in one service.

Start:
  cd backend
  pip install -r requirements.txt
  uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import random
import math
import os
import httpx

# ── App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NER Landslide Early Warning System",
    description="Python backend for North-East India landslide risk monitoring",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Zones derived from real NER landslide inventory ────────────────────
ZONES = [
    {"id": 1, "name": "Aizawl",        "district": "Aizawl",           "state": "Mizoram",           "lat": 23.7271, "lon": 92.7176, "historical_count": 4},
    {"id": 2, "name": "Gangtok",       "district": "Gangtok",          "state": "Sikkim",            "lat": 27.3389, "lon": 88.6065, "historical_count": 4},
    {"id": 3, "name": "Dima Hasao",    "district": "Dima Hasao",       "state": "Assam",             "lat": 25.45,   "lon": 93.18,   "historical_count": 4},
    {"id": 4, "name": "Imphal East",  "district": "Imphal East",      "state": "Manipur",           "lat": 24.817,  "lon": 93.9368, "historical_count": 3},
    {"id": 5, "name": "West Tripura", "district": "West Tripura",     "state": "Tripura",           "lat": 23.8315, "lon": 91.2868, "historical_count": 3},
    {"id": 6, "name": "Tawang",       "district": "Tawang",           "state": "Arunachal Pradesh", "lat": 27.586,  "lon": 91.88,   "historical_count": 3},
    {"id": 7, "name": "Kohima",       "district": "Kohima",           "state": "Nagaland",          "lat": 25.6586, "lon": 94.1086, "historical_count": 3},
    {"id": 8, "name": "East Khasi",   "district": "East Khasi Hills", "state": "Meghalaya",         "lat": 25.5788, "lon": 91.8933, "historical_count": 2},
]

# In-memory store
latest_scores: Dict[int, Dict[str, Any]] = {}
alert_log: List[Dict[str, Any]] = []
field_reports: List[Dict[str, Any]] = [
    {"id": 1, "type": "🏔️ Hill crack", "loc": "Dima Hasao slope", "time": "10 min ago", "icon": "🏔️", "reporter": "Field Team"},
    {"id": 2, "type": "🚧 Road blockage", "loc": "NH-37 km 142", "time": "28 min ago", "icon": "🚧", "reporter": "Citizen"},
    {"id": 3, "type": "💧 Slope seepage", "loc": "Kohima North", "time": "1 hr ago", "icon": "💧", "reporter": "NDRF"},
]

ROADS = [
    {"name": "NH-37 (Lumding–Silchar)", "status": "BLOCKED", "lat": 25.10, "lon": 93.20},
    {"name": "NH-27 (Kaziranga section)", "status": "CLEAR", "lat": 26.57, "lon": 93.45},
    {"name": "Jiribam–Imphal Road", "status": "RISK", "lat": 24.90, "lon": 93.79},
]


# ── Pydantic models ───────────────────────────────────────────────────
class PredictRequest(BaseModel):
    soil_moisture: float = Field(..., ge=0, le=100)
    rainfall_24h: float = Field(..., ge=0)
    rainfall_48h: float = Field(..., ge=0)
    slope_degree: float = Field(..., ge=0, le=90)
    elevation: float = Field(..., ge=0)
    historical_count: int = Field(..., ge=0)


class ReportRequest(BaseModel):
    reporter: Optional[str] = "Anonymous"
    type: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


# ── Risk helpers ──────────────────────────────────────────────────────
def get_risk_level(score: float) -> tuple[str, str]:
    if score >= 80:
        return "DANGEROUS", "🔴"
    if score >= 70:
        return "HIGH", "🟠"
    if score >= 50:
        return "MEDIUM", "🟡"
    return "NORMAL", "🟢"


# Load trained model once at startup (if available)
_MODEL = None
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "landslide_model.pkl")


def _load_model():
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    try:
        import joblib
        if os.path.exists(_MODEL_PATH):
            _MODEL = joblib.load(_MODEL_PATH)
            print(f"✅ Loaded ML model from {_MODEL_PATH}")
        else:
            print("⚠️  No landslide_model.pkl — using formula fallback")
    except Exception as e:
        print(f"⚠️  Model load failed: {e}")
    return _MODEL


def calculate_score(data: dict) -> float:
    """Use trained RandomForest if available, else weighted formula."""
    model = _load_model()
    if model is not None:
        try:
            features = [[
                data["soil_moisture"],
                data["rainfall_24h"],
                data["rainfall_48h"],
                data["slope_degree"],
                data["elevation"],
                data["historical_count"],
            ]]
            prob = model.predict_proba(features)[0][1]
            return round(float(prob) * 100, 1)
        except Exception as e:
            print(f"Predict error: {e}")

    # Fallback weighted formula
    score = (
        data["soil_moisture"] * 0.30
        + min(data["rainfall_24h"] / 200, 1) * 100 * 0.35
        + (data["slope_degree"] / 90) * 100 * 0.25
        + min(data["historical_count"] * 10, 100) * 0.10
    )
    return round(min(99.0, max(5.0, score)), 1)


# ── External data helpers (optional real APIs) ────────────────────────
async def fetch_rainfall(lat: float, lon: float) -> float:
    key = os.getenv("OPENWEATHER_KEY", "")
    if not key or key == "YOUR_FREE_KEY_HERE":
        return round(random.uniform(40, 160), 1)
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"lat": lat, "lon": lon, "appid": key, "units": "metric"},
            )
            data = r.json()
            return float(data.get("rain", {}).get("1h", random.uniform(30, 100)))
    except Exception:
        return round(random.uniform(40, 120), 1)


async def fetch_elevation(lat: float, lon: float) -> float:
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(
                f"https://api.opentopodata.org/v1/srtm90m?locations={lat},{lon}"
            )
            return float(r.json()["results"][0]["elevation"] or 800)
    except Exception:
        return 800.0


# ── Core assessment ───────────────────────────────────────────────────
async def run_assessment():
    global latest_scores, alert_log
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Running risk assessment...")

    for zone in ZONES:
        rainfall = await fetch_rainfall(zone["lat"], zone["lon"])
        elevation = await fetch_elevation(zone["lat"], zone["lon"])
        moisture = round(random.uniform(55, 85), 1)
        slope = round(random.uniform(18, 42), 1)

        inputs = {
            "soil_moisture": moisture,
            "rainfall_24h": rainfall,
            "rainfall_48h": rainfall * 1.5,
            "slope_degree": slope,
            "elevation": elevation,
            "historical_count": zone["historical_count"],
        }
        score = calculate_score(inputs)
        level, icon = get_risk_level(score)

        latest_scores[zone["id"]] = {
            **zone,
            "score": score,
            "level": level,
            "icon": icon,
            "rainfall": rainfall,
            "moisture": moisture,
            "slope": slope,
            "elevation": elevation,
            "updated": datetime.now().strftime("%H:%M:%S"),
        }

        if score >= 70:
            alert_log.insert(0, {
                "zone": zone["name"],
                "score": score,
                "level": level,
                "time": datetime.now().strftime("%H:%M"),
                "sms": {
                    "en": f"{icon} {score}% landslide risk at {zone['name']}. Stay alert. Call 1070.",
                    "as": f"{icon} {zone['name']}ত {score}% ভূমিধসৰ আশংকা। সাৱধান থাকক। ফোন কৰক ১০৭০।",
                    "hi": f"{icon} {zone['name']} में {score}% भूस्खलन खतरा। सतर्क रहें। कॉल करें 1070।",
                },
            })
            if len(alert_log) > 30:
                alert_log.pop()

        print(f"  {zone['name']}: {score}% — {level}")


# ── Routes ────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    await run_assessment()


@app.get("/")
def root():
    return {
        "service": "NER Landslide Early Warning System",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": [
            "GET  /api/dashboard",
            "GET  /api/alerts",
            "GET  /api/reports",
            "POST /api/report",
            "GET  /api/roads",
            "GET  /api/run-now",
            "POST /api/predict",
            "GET  /api/health",
        ],
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "zones": len(ZONES),
        "scores": len(latest_scores),
        "alerts": len(alert_log),
        "reports": len(field_reports),
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


@app.get("/api/dashboard")
def dashboard():
    data = list(latest_scores.values())
    if not data:
        return {"status": "loading", "message": "First assessment running..."}
    data.sort(key=lambda x: x.get("score", 0), reverse=True)
    return data


@app.get("/api/alerts")
def get_alerts():
    return alert_log


@app.get("/api/reports")
def get_reports():
    return field_reports


@app.get("/api/roads")
def get_roads():
    return ROADS


@app.post("/api/report")
def submit_report(body: ReportRequest):
    report = {
        "id": len(field_reports) + 1,
        "type": body.type,
        "loc": f"{body.lat or 0:.2f}, {body.lon or 0:.2f}" if body.lat else "Unknown",
        "time": "Just now",
        "icon": "📍",
        "reporter": body.reporter or "Anonymous",
        "notes": body.notes,
        "photo_url": body.photo_url,
    }
    field_reports.insert(0, report)
    if len(field_reports) > 50:
        field_reports.pop()
    return {"success": True, "id": report["id"]}


@app.get("/api/run-now")
async def force_assessment():
    await run_assessment()
    return {"message": "Assessment completed", "zones": len(latest_scores)}


@app.post("/api/predict")
def predict(body: PredictRequest):
    data = body.model_dump()
    score = calculate_score(data)
    level, icon = get_risk_level(score)
    return {
        "score": score,
        "level": level,
        "icon": icon,
        "alert_required": score >= 70,
        "inputs": data,
    }


@app.get("/api/zones/{zone_id}")
def get_zone(zone_id: int):
    if zone_id not in latest_scores:
        raise HTTPException(404, "Zone not found")
    return latest_scores[zone_id]
