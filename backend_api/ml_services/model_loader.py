import os
import json
import logging
import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger("landsafe.ml_services")

FEATURE_ORDER = [
    "rainfall_24h_mm",
    "rainfall_72h_mm",
    "soil_moisture_pct",
    "slope_angle_deg",
    "vulnerability_index",
    "pore_water_pressure_kpa",
    "elevation_m",
    "vegetation_ndvi"
]


class LandslideRiskModelService:
    def __init__(self, export_dir: Optional[str] = None):
        if export_dir:
            self.export_dir = Path(export_dir)
        else:
            self.export_dir = Path(__file__).resolve().parent.parent.parent / "ml_training_pipeline" / "export"

        self.onnx_session = None
        self.pkl_model = None
        self.metadata = {}
        self.load_models()

    def load_models(self):
        """Loads ONNX runtime model and metadata, with pickle fallback."""
        meta_path = self.export_dir / "model_meta.json"
        if meta_path.exists():
            try:
                with open(meta_path, "r") as f:
                    self.metadata = json.load(f)
                logger.info(f"Loaded model metadata from {meta_path}")
            except Exception as e:
                logger.warning(f"Failed to read model_meta.json: {e}")

        # Try ONNX Runtime
        onnx_path = self.export_dir / "risk_model.onnx"
        if onnx_path.exists():
            try:
                import onnxruntime as ort
                self.onnx_session = ort.InferenceSession(str(onnx_path))
                logger.info(f"Successfully initialized ONNX Runtime session from {onnx_path}")
            except Exception as e:
                logger.warning(f"Could not load ONNX model ({e}). Will try pickle fallback.")

        # Try Pickle Fallback
        pkl_path = self.export_dir / "risk_model.pkl"
        if pkl_path.exists():
            try:
                self.pkl_model = joblib.load(pkl_path)
                logger.info(f"Loaded XGBoost/Pickle model from {pkl_path}")
            except Exception as e:
                logger.warning(f"Could not load pickle model: {e}")

    def predict(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs inference on given environmental & geological features.
        """
        r24 = float(feature_dict.get("rainfall_24h_mm") or 0.0)
        r72 = float(feature_dict.get("rainfall_72h_mm") if feature_dict.get("rainfall_72h_mm") is not None else r24 * 2.2)
        sm = float(feature_dict.get("soil_moisture_pct") if feature_dict.get("soil_moisture_pct") is not None else 50.0)
        slope = float(feature_dict.get("slope_angle_deg") if feature_dict.get("slope_angle_deg") is not None else 35.0)
        vuln = float(feature_dict.get("vulnerability_index") if feature_dict.get("vulnerability_index") is not None else 65.0)
        
        pore_press = feature_dict.get("pore_water_pressure_kpa")
        if pore_press is None:
            pore_press = (sm / 100.0) * (r24 / 10.0) * 1.8
        else:
            pore_press = float(pore_press)
            
        elev = float(feature_dict.get("elevation_m") if feature_dict.get("elevation_m") is not None else 1200.0)
        ndvi = float(feature_dict.get("vegetation_ndvi") if feature_dict.get("vegetation_ndvi") is not None else 0.55)

        input_vector = [
            r24,
            r72,
            sm,
            slope,
            vuln,
            pore_press,
            elev,
            ndvi
        ]

        X = np.array([input_vector], dtype=np.float32)
        risk_prob = None

        # 1. Try ONNX Runtime inference
        if self.onnx_session is not None:
            try:
                input_name = self.onnx_session.get_inputs()[0].name
                outputs = self.onnx_session.run(None, {input_name: X})
                if len(outputs) > 1 and isinstance(outputs[1], list):
                    risk_prob = float(outputs[1][0].get(1, 0.5))
                elif len(outputs) > 1 and hasattr(outputs[1], 'shape'):
                    risk_prob = float(outputs[1][0][1])
                else:
                    risk_prob = float(outputs[0][0])
            except Exception as e:
                logger.warning(f"ONNX inference failed ({e}), falling back to pickle/heuristic.")

        # 2. Try Pickle inference if ONNX failed or was unavailable
        if risk_prob is None and self.pkl_model is not None:
            try:
                if hasattr(self.pkl_model, "predict_proba"):
                    probs = self.pkl_model.predict_proba(X)
                    risk_prob = float(probs[0, 1])
                else:
                    risk_prob = float(self.pkl_model.predict(X)[0])
            except Exception as e:
                logger.warning(f"Pickle model inference failed ({e}).")

        # 3. Geotechnical analytical equation fallback
        if risk_prob is None:
            raw_score = (
                0.012 * r24 +
                0.005 * r72 +
                1.8 * np.sin(np.radians(slope)) +
                0.018 * vuln +
                0.025 * pore_press +
                0.015 * (sm - 40.0) -
                1.2 * ndvi -
                1.95
            )
            risk_prob = float(1.0 / (1.0 + np.exp(-raw_score)))

        risk_prob = max(0.0, min(1.0, float(risk_prob)))

        # Determine Alert Status
        if risk_prob >= 0.85:
            alert_status = "emergency"
            action = "Trigger Immediate Evacuation & NDRF/SDRF Deployment"
        elif risk_prob >= 0.65:
            alert_status = "warning"
            action = "Issue SMS Advisory, Slope Monitoring & Traffic Caution"
        elif risk_prob >= 0.40:
            alert_status = "watch"
            action = "Pre-position Field Observers & Heavy Machinery"
        else:
            alert_status = "none"
            action = "Normal Automated Telemetry Monitoring"

        # Determine Primary Contributing Driver
        if r24 > 90.0:
            primary_driver = "Extreme Monsoonal Cloudburst / High Precipitation"
        elif sm > 75.0:
            primary_driver = "Sub-surface Hydrostatic Saturation & Pore Pressure"
        elif slope > 42.0:
            primary_driver = "High Relief Slope Instability & Shear Failure"
        elif vuln > 75.0:
            primary_driver = "High Geological Frailty & Fractured Lithology"
        else:
            primary_driver = "Normal Baseline Equilibrium"

        return {
            "risk_probability": round(risk_prob, 4),
            "alert_status": alert_status,
            "action_required": action,
            "primary_driver": primary_driver,
            "contributing_factors": {
                "rainfall_24h_mm": round(r24, 2),
                "rainfall_72h_mm": round(r72, 2),
                "soil_moisture_pct": round(sm, 2),
                "slope_angle_deg": round(slope, 2),
                "vulnerability_index": round(vuln, 2),
                "pore_water_pressure_kpa": round(pore_press, 2)
            }
        }


# Singleton instance
risk_model_service = LandslideRiskModelService()
