"""
=============================================================
STEP-BY-STEP: Process NER inventory → Train model → Integrate
=============================================================

What this script does:
  1. Loads your historical landslide CSV
  2. Builds feature-rich training data (because the inventory
     only has location + date, not soil/rain/slope)
  3. Trains a RandomForest classifier
  4. Saves landslide_model.pkl  (auto-loaded by FastAPI)
  5. Prints zone suggestions for the dashboard

Run:
  cd backend
  python prepare_and_train.py
"""

from __future__ import annotations

import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

# ─────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent
INVENTORY = ROOT / "data" / "ner_inventory.csv"
OUT_CSV = ROOT / "data" / "training_data.csv"
MODEL_PATH = ROOT / "landslide_model.pkl"

# ─────────────────────────────────────────────────────────────
# 1. LOAD INVENTORY
# ─────────────────────────────────────────────────────────────
print("=" * 60)
print("1. Loading inventory…")
df = pd.read_csv(INVENTORY)
print(f"   Rows: {len(df)}")
print(f"   States: {df['state'].nunique()}")
print(f"   Unique locations: {df.groupby(['latitude','longitude']).ngroups}")

# ─────────────────────────────────────────────────────────────
# 2. HISTORICAL COUNT PER LOCATION
# ─────────────────────────────────────────────────────────────
print("\n2. Computing historical_count per location…")

loc_counts = (
    df.groupby(["latitude", "longitude", "state", "district"])
    .size()
    .reset_index(name="historical_count")
)
print(loc_counts.sort_values("historical_count", ascending=False).head(10).to_string(index=False))

# ─────────────────────────────────────────────────────────────
# 3. BUILD TRAINING FEATURES
#    The inventory has NO soil_moisture / rainfall / slope.
#    We create realistic synthetic samples:
#      • POSITIVE (landslide=1) near known sites with high risk features
#      • NEGATIVE (landslide=0) with lower risk features
# ─────────────────────────────────────────────────────────────
print("\n3. Generating training samples…")

rng = np.random.default_rng(42)
rows = []

# --- Positive samples (around real landslide locations) ---
for _, loc in loc_counts.iterrows():
    n_pos = max(8, int(loc["historical_count"] * 4))  # more samples for frequent sites
    for _ in range(n_pos):
        # High-risk feature ranges typical of NER monsoon landslides
        soil = rng.uniform(65, 95)
        rain24 = rng.uniform(80, 220)
        rain48 = rain24 * rng.uniform(1.3, 2.0)
        slope = rng.uniform(25, 55)
        elev = rng.uniform(400, 2800)
        hist = int(loc["historical_count"])

        rows.append(
            {
                "soil_moisture": round(soil, 1),
                "rainfall_24h": round(rain24, 1),
                "rainfall_48h": round(rain48, 1),
                "slope_degree": round(slope, 1),
                "elevation": round(elev, 0),
                "historical_count": hist,
                "landslide_occurred": 1,
                "state": loc["state"],
                "district": loc["district"],
                "lat": loc["latitude"],
                "lon": loc["longitude"],
            }
        )

# --- Negative samples (safer conditions / random NER points) ---
# Use same number of negatives as positives for balance
n_neg = len(rows)
for i in range(n_neg):
    # Low–medium risk feature ranges
    soil = rng.uniform(20, 60)
    rain24 = rng.uniform(5, 70)
    rain48 = rain24 * rng.uniform(1.1, 1.6)
    slope = rng.uniform(5, 25)
    elev = rng.uniform(50, 1500)
    # Occasionally reuse a real location but with safe features
    if i % 3 == 0 and len(loc_counts):
        loc = loc_counts.iloc[i % len(loc_counts)]
        hist = int(loc["historical_count"])
        state, dist = loc["state"], loc["district"]
        lat, lon = loc["latitude"], loc["longitude"]
    else:
        hist = 0
        state, dist = "Synthetic", "Safe zone"
        lat, lon = 25.0 + rng.uniform(-2, 3), 92.0 + rng.uniform(-3, 3)

    rows.append(
        {
            "soil_moisture": round(soil, 1),
            "rainfall_24h": round(rain24, 1),
            "rainfall_48h": round(rain48, 1),
            "slope_degree": round(slope, 1),
            "elevation": round(elev, 0),
            "historical_count": hist,
            "landslide_occurred": 0,
            "state": state,
            "district": dist,
            "lat": lat,
            "lon": lon,
        }
    )

train_df = pd.DataFrame(rows)
print(f"   Total samples: {len(train_df)}")
print(f"   Positive (landslide=1): {(train_df.landslide_occurred == 1).sum()}")
print(f"   Negative (landslide=0): {(train_df.landslide_occurred == 0).sum()}")

# Save for inspection
OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
train_df.to_csv(OUT_CSV, index=False)
print(f"   Saved → {OUT_CSV}")

# ─────────────────────────────────────────────────────────────
# 4. TRAIN MODEL
# ─────────────────────────────────────────────────────────────
print("\n4. Training RandomForest…")

FEATURES = [
    "soil_moisture",
    "rainfall_24h",
    "rainfall_48h",
    "slope_degree",
    "elevation",
    "historical_count",
]
TARGET = "landslide_occurred"

X = train_df[FEATURES]
y = train_df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = RandomForestClassifier(
    n_estimators=150,
    max_depth=12,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

preds = model.predict(X_test)
acc = accuracy_score(y_test, preds)
print(f"\n   Accuracy: {acc * 100:.1f}%")
print("\n   Classification report:")
print(classification_report(y_test, preds, target_names=["No Landslide", "Landslide"]))
print("   Confusion matrix:")
print(confusion_matrix(y_test, preds))

print("\n   Feature importance:")
imp = dict(zip(FEATURES, model.feature_importances_))
for k, v in sorted(imp.items(), key=lambda x: -x[1]):
    print(f"     {k:20s} {v:.3f}")

# ─────────────────────────────────────────────────────────────
# 5. SAVE MODEL
# ─────────────────────────────────────────────────────────────
joblib.dump(model, MODEL_PATH)
print(f"\n5. ✅ Model saved → {MODEL_PATH}")
print("   Restart uvicorn and the API will load it automatically.")

# ─────────────────────────────────────────────────────────────
# 6. SUGGEST DASHBOARD ZONES (from real inventory)
# ─────────────────────────────────────────────────────────────
print("\n6. Suggested zones for dashboard (copy into main.py ZONES list):\n")

# Prefer locations with most events
top = loc_counts.sort_values("historical_count", ascending=False).head(8)
for i, (_, r) in enumerate(top.iterrows(), 1):
    name = f"{r['district']}"
    print(
        f'    {{"id": {i}, "name": "{name}", "district": "{r["district"]}", '
        f'"state": "{r["state"]}", "lat": {r["latitude"]}, "lon": {r["longitude"]}, '
        f'"historical_count": {int(r["historical_count"])}}},'
    )

print("\n" + "=" * 60)
print("DONE. Next steps:")
print("  1. Restart backend:  uvicorn app.main:app --reload --port 8000")
print("  2. Test predict:     POST http://localhost:8000/api/predict")
print("  3. Refresh frontend: http://localhost:3000")
print("=" * 60)
