"""
Optional: Train a real RandomForest model.
Place data.csv in this folder with columns:
  soil_moisture, rainfall_24h, rainfall_48h,
  slope_degree, elevation, historical_count, landslide_occurred

Then: python train.py
Model will be saved as landslide_model.pkl and auto-loaded by the API.
"""

import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

DATA = "data.csv"
if not os.path.exists(DATA):
    print("data.csv not found — API will use the built-in demo formula.")
    exit(0)

df = pd.read_csv(DATA)
df.fillna(df.mean(numeric_only=True), inplace=True)

FEATURES = [
    "soil_moisture",
    "rainfall_24h",
    "rainfall_48h",
    "slope_degree",
    "elevation",
    "historical_count",
]
TARGET = "landslide_occurred"

X = df[FEATURES]
y = df[TARGET]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = RandomForestClassifier(
    n_estimators=100, max_depth=10, random_state=42, class_weight="balanced"
)
model.fit(X_train, y_train)

preds = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, preds)*100:.1f}%")
print(classification_report(y_test, preds, target_names=["No Landslide", "Landslide"]))

joblib.dump(model, "landslide_model.pkl")
print("✅ Saved landslide_model.pkl — restart uvicorn to use it.")
