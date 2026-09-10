# Step-by-step: Use your CSV → Train model → Integrate

Your CSV is a **historical landslide inventory** (44 events, 2000–present).  
It has locations and dates, but **not** the sensor features the model needs:

| CSV has              | Model needs              |
|----------------------|--------------------------|
| latitude, longitude  | soil_moisture (%)        |
| state, district      | rainfall_24h / 48h (mm)  |
| event_date           | slope_degree (°)         |
| landslide_type       | elevation (m)            |
|                      | historical_count         |
|                      | landslide_occurred (0/1) |

So we **derive** training data from the inventory, train, then plug the model into FastAPI.

---

## Step 1 — Place the CSV

```bash
cd backend
mkdir -p data
# copy your file:
cp /path/to/NER_landslide_inventory_available_2000_present.csv data/ner_inventory.csv
```

(Already done if you use the packaged project.)

---

## Step 2 — Run prepare + train

```bash
cd backend
pip install pandas scikit-learn joblib numpy
python prepare_and_train.py
```

What it does:

1. Loads `data/ner_inventory.csv`
2. Counts how many landslides occurred at each lat/lon → `historical_count`
3. Creates **synthetic training rows**:
   - **Positive** (landslide=1): near real sites, high moisture/rain/slope
   - **Negative** (landslide=0): safer feature ranges
4. Trains `RandomForestClassifier`
5. Saves `landslide_model.pkl`
6. Writes `data/training_data.csv` for inspection
7. Prints suggested zone list for the dashboard

Expected output (approx):

```
Accuracy: ~95–100%   (synthetic data is cleanly separable)
Feature importance:
  soil_moisture   ~0.29
  slope_degree    ~0.24
  rainfall_48h    ~0.22
  rainfall_24h    ~0.20
  historical_count ~0.04
  elevation       ~0.00
✅ Model saved → landslide_model.pkl
```

---

## Step 3 — Restart backend (loads model automatically)

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

On startup you should see:

```
✅ Loaded ML model from .../landslide_model.pkl
```

Test prediction:

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "soil_moisture": 78,
    "rainfall_24h": 142,
    "rainfall_48h": 210,
    "slope_degree": 38,
    "elevation": 1240,
    "historical_count": 4
  }'
```

Response example:

```json
{
  "score": 91.2,
  "level": "DANGEROUS",
  "icon": "🔴",
  "alert_required": true,
  "inputs": { ... }
}
```

---

## Step 4 — Frontend already works

The Next.js dashboard calls `/api/dashboard`, which runs the same scoring for every zone.

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

Zones are now the real high-frequency inventory sites:
Aizawl, Gangtok, Dima Hasao, Imphal East, West Tripura, Tawang, Kohima, East Khasi Hills.

---

## How the integration works (code map)

| File | Role |
|------|------|
| `backend/data/ner_inventory.csv` | Your raw inventory |
| `backend/prepare_and_train.py` | Build training set + train + save `.pkl` |
| `backend/landslide_model.pkl` | Trained model (gitignored, local) |
| `backend/app/main.py` → `calculate_score()` | Loads `.pkl` and predicts |
| `backend/app/main.py` → `ZONES` | Real locations from inventory |
| Frontend `lib/api.ts` | Calls `/api/dashboard` & `/api/predict` |

---

## Improving the model later

1. **Real sensor / weather history**  
   Join rainfall time series (IMD / OpenWeather) to each event_date.

2. **DEM-derived slope & elevation**  
   Use OpenTopoData or SRTM for every inventory point (script can call the API).

3. **More negatives**  
   Sample random points in NER that never had landslides.

4. **Retrain**  
   Update `data/ner_inventory.csv` → re-run `python prepare_and_train.py` → restart uvicorn.

---

## Quick checklist

- [x] CSV placed in `backend/data/ner_inventory.csv`
- [x] `python prepare_and_train.py` → creates `landslide_model.pkl`
- [x] Zones updated from real inventory locations
- [x] FastAPI loads model on startup
- [x] Frontend shows live scores from Python API
