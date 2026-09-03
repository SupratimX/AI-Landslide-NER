# LANDSAFE NER

> **AI-Powered Early Warning and Geospatial Landslide Risk Monitoring Platform for India's North Eastern Region (NER)**  
> *Smart India Hackathon 2026 — Problem Statement ID: SIH26001*

---

## 📌 Overview

**LANDSAFE NER** is a resilient, multi-tiered disaster intelligence system engineered specifically for the complex terrain and severe monsoon cloudburst dynamics of India's North Eastern Region (Assam, Meghalaya, Sikkim, Arunachal Pradesh, Mizoram, Nagaland, Manipur, and Tripura).

The platform addresses two critical technical bottlenecks in landslide disaster response:
1. **Geospatial Early Warning**: Continuous ingestion of telemetry (24h/72h rainfall accumulation, soil saturation index, slope gradient, sub-surface pore water pressure, and GSI lithological fragility) evaluated against high-throughput ONNX/XGBoost models with GSI NGDR fault line and NRSC hazard overlays.
2. **Low-Network Resilience & Edge AI**: An offline-first mobile architecture executing lightweight ONNX hazard severity models directly on-device with local SQLite persistence and automatic background queue synchronization.

---

## 🏗️ System Architecture

```
landsafe-ner/
├── backend_api/              # FastAPI REST API & real-time inference server
│   ├── api/                  # Modular route controllers (telemetry, alerts, citizen, GIS)
│   ├── models/               # SQLAlchemy ORM models
│   ├── ml_services/          # ONNX Runtime model loader (sub-millisecond inference)
│   ├── services/             # NGDR/NRSC GIS adapters & multilingual SMS broadcaster
│   ├── config.py             # Environment configuration (Pydantic Settings)
│   ├── main.py               # Application entrypoint with auto-seeding
│   └── requirements.txt
├── database/                 # PostGIS spatial database schemas & seed data
│   ├── schema.sql            # PostGIS source of truth DDL
│   ├── seed_data.py          # Seed data for 10 high-risk NER geological hotspots
│   └── db_session.py         # Resilient engine (PostgreSQL + PostGIS / SQLite fallback)
├── ml_training_pipeline/     # Decoupled model training & export
│   ├── datasets/             # NER geological & hydrometeorological dataset generators
│   ├── notebooks/            # Exploratory analysis & validation notebook
│   ├── export/               # Exported model artifacts (risk_model.onnx, model_meta.json)
│   └── train_model.py        # XGBoost training & ONNX export script
├── frontend_gis_dashboard/   # Next.js / React Authority Command Center
│   ├── public/               # Static assets & standalone tactical dashboard
│   ├── src/                  # Components (Leaflet Map, Telemetry HUD, Triage Queue)
│   └── package.json
└── mobile_app_edge/          # Offline-first Flutter mobile client
    ├── lib/                  # Models, SQLite storage, ONNX edge inference, and UI
    └── pubspec.yaml
```

---

## ⚡ Tech Stack

- **Backend & APIs**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2.
- **AI & ML**: XGBoost, Scikit-Learn, ONNX Runtime (Cross-platform and Edge).
- **Database**: PostgreSQL with PostGIS extension (with built-in local SQLite fallback for dev/testing).
- **GIS & Dashboard**: React / Next.js, Leaflet, GeoJSON, CARTO Dark Matter vector tiles.
- **Edge Mobile**: Flutter / Dart, SQLite (`sqflite`), on-device ONNX runtime.
- **Emergency Alerting**: Twilio SMS / Voice API with Fast2SMS failover (Multilingual in Assamese, Hindi, Bengali, Mizo, and English).
- **Geospatial Ingestion**: GSI National Geoscience Data Repository (NGDR), NRSC Landslide Atlas of India, NESAC NeSDR.

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18+ (for Next.js frontend development)
- *(Optional)* PostgreSQL with PostGIS extension (SQLite runs automatically if PostgreSQL is not active)

### 2. Setup Backend & Seed Database
```powershell
# Install backend dependencies
python -m pip install -r backend_api/requirements.txt

# Seed realistic NER hotspots (East Khasi Hills, Gangtok-Nathu La, Haflong, Tawang, etc.)
python database/seed_data.py

# Launch FastAPI server
python -m uvicorn backend_api.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive OpenAPI Swagger documentation will be available at **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**.

### 3. Launch Authority GIS Dashboard
Open `frontend_gis_dashboard/public/index.html` directly in your browser, or run the Next.js dev server:
```powershell
cd frontend_gis_dashboard
npm install
npm run dev
```
Dashboard available at **[http://localhost:3000](http://localhost:3000)**.

---

## 📊 Machine Learning Model Performance

The landslide risk prediction engine combines geotechnical slope stability models with empirical monsoonal precipitation thresholds calibrated for the Eastern Himalayas:

| Metric | Score |
| :--- | :--- |
| **ROC-AUC** | `0.9767` |
| **Accuracy** | `94.42%` |
| **Precision** | `96.12%` |
| **Recall** | `97.50%` |
| **F1 Score** | `0.9681` |

### Alert Threshold Hierarchy
- **Normal** (`< 0.40`): Baseline continuous monitoring.
- **Watch** (`0.40 - 0.65`): Pre-position field observers and equipment.
- **Warning** (`0.65 - 0.85`): Issue highway traffic advisories & automated SMS notifications.
- **Emergency** (`>= 0.85`): Immediate evacuation alerts & SDRF/NDRF emergency unit dispatch.

---

## 📡 API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service diagnostics and ONNX engine status |
| `GET` | `/api/v1/locations` | Monitored NER landslide hotspots with live telemetry |
| `GET` | `/api/v1/locations/{id}/history` | 7-day hydrological time-series records |
| `POST` | `/api/v1/environmental-data` | Ingest sensor readings (rainfall, soil moisture, tilt) |
| `POST` | `/api/v1/predict-risk` | Real-time on-demand ONNX risk inference |
| `GET` | `/api/v1/alerts/live` | Active warning and emergency zones |
| `POST` | `/api/v1/alerts/broadcast` | Dispatch multilingual SMS/Voice warnings |
| `GET` | `/api/v1/citizen-reports` | List citizen submissions with AI severity score |
| `POST` | `/api/v1/citizen-reports` | Ingest report from offline mobile edge sync |
| `GET` | `/api/v1/geospatial/faults` | GSI NGDR active geological fault lines GeoJSON |
| `GET` | `/api/v1/geospatial/hotspots-geojson` | Live GIS hotspot points styled by risk level |

---

## 👥 Contributors
**Team Next X** — Smart India Hackathon 2026
