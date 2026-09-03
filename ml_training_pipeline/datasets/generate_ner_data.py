import os
import numpy as np
import pandas as pd
from pathlib import Path

def generate_ner_landslide_dataset(n_samples: int = 6000, random_seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic geological and hydro-meteorological dataset for
    India's North Eastern Region (NER), incorporating GSI/IMD physical landslide thresholds.
    """
    np.random.seed(random_seed)

    # 1. Slope Angle (degrees): Himalayan/NER terrain ranges 15 to 65 degrees
    slope_angle = np.random.triangular(left=18, mode=38, right=62, size=n_samples)

    # 2. Geological Vulnerability Index (0-100 scale, GSI/NGDR lithology mapping)
    vulnerability_index = np.random.beta(a=3, b=2, size=n_samples) * 100

    # 3. 24-hr Rainfall (mm): Low to extreme monsoonal downpours (Cherrapunji / Mawsynram scale)
    # Mixture distribution: 70% normal monsoon (10-80mm), 30% extreme cloudbursts (80-350mm)
    is_heavy = np.random.rand(n_samples) < 0.30
    rainfall_24h = np.where(
        is_heavy,
        np.random.gamma(shape=4.0, scale=35.0, size=n_samples), # High rain
        np.random.gamma(shape=2.0, scale=18.0, size=n_samples)  # Normal rain
    )
    rainfall_24h = np.clip(rainfall_24h, 0.0, 380.0)

    # 4. 72-hr Cumulative Rainfall (mm)
    rainfall_72h = rainfall_24h * np.random.uniform(1.8, 3.2, size=n_samples) + np.random.exponential(20, size=n_samples)
    rainfall_72h = np.clip(rainfall_72h, rainfall_24h, 750.0)

    # 5. Volumetric Soil Moisture (%) - correlated with rainfall
    base_moisture = np.random.uniform(20.0, 45.0, size=n_samples)
    rain_moisture_boost = (rainfall_72h / 750.0) * 55.0
    soil_moisture = np.clip(base_moisture + rain_moisture_boost + np.random.normal(0, 3, size=n_samples), 15.0, 98.0)

    # 6. Pore Water Pressure (kPa) - induced by saturated soil column
    pore_water_pressure = (soil_moisture / 100.0) * (rainfall_24h / 10.0) * np.random.uniform(1.2, 2.5, size=n_samples)
    pore_water_pressure = np.clip(pore_water_pressure, 0.0, 65.0)

    # 7. Elevation (meters above sea level): NER valley to high alpine (150m - 3600m)
    elevation = np.random.uniform(200.0, 3500.0, size=n_samples)

    # 8. Vegetation Cover (NDVI Index: -0.1 to 0.85)
    # Higher slope / high vulnerability tends to have lower stable vegetation
    vegetation_ndvi = np.clip(0.8 - (slope_angle / 100.0) * 0.5 - (vulnerability_index / 300.0) + np.random.normal(0, 0.08, size=n_samples), 0.05, 0.88)

    # Geotechnical Safety Factor / Landslide Probability Logic:
    # Based on infinite slope stability model & empirical GSI rainfall threshold curves:
    # I = a * R_24 + b * R_72 + c * sin(slope) + d * Vuln + e * Pore_Press - f * NDVI
    slope_rad = np.radians(slope_angle)
    risk_score = (
        0.012 * rainfall_24h +
        0.005 * rainfall_72h +
        1.800 * np.sin(slope_rad) +
        0.018 * vulnerability_index +
        0.025 * pore_water_pressure +
        0.015 * (soil_moisture - 40.0) -
        1.200 * vegetation_ndvi -
        1.950 # Intercept
    )
    
    # Add geotechnical noise
    risk_score += np.random.normal(0, 0.25, size=n_samples)

    # Sigmoid function for probability
    landslide_prob = 1.0 / (1.0 + np.exp(-risk_score))
    landslide_occurred = (landslide_prob >= 0.50).astype(int)

    df = pd.DataFrame({
        "rainfall_24h_mm": np.round(rainfall_24h, 2),
        "rainfall_72h_mm": np.round(rainfall_72h, 2),
        "soil_moisture_pct": np.round(soil_moisture, 2),
        "slope_angle_deg": np.round(slope_angle, 2),
        "vulnerability_index": np.round(vulnerability_index, 2),
        "pore_water_pressure_kpa": np.round(pore_water_pressure, 2),
        "elevation_m": np.round(elevation, 1),
        "vegetation_ndvi": np.round(vegetation_ndvi, 3),
        "landslide_probability_true": np.round(landslide_prob, 4),
        "landslide_occurred": landslide_occurred
    })

    return df


if __name__ == "__main__":
    out_dir = Path(__file__).resolve().parent
    out_dir.mkdir(parents=True, exist_ok=True)
    df = generate_ner_landslide_dataset()
    csv_path = out_dir / "ner_landslide_historical_dataset.csv"
    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} records for NER landslide dataset.")
    print(f"Saved to: {csv_path}")
    print(f"Landslide positive class ratio: {df['landslide_occurred'].mean():.2%}")
