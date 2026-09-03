import os
import json
import logging
import requests
from typing import Dict, Any, List
from pathlib import Path
import sys

# Add backend_api path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import settings

logger = logging.getLogger("landsafe.geospatial")

# Built-in GeoJSON Layers for NER Geological Faults & NRSC Susceptibility Zones
NER_GEOLOGICAL_FAULTS = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "Dauki Fault System",
                "source": "GSI National Geoscience Data Repository (NGDR)",
                "hazard_level": "Critical Seismic & Thrust Fault",
                "slip_rate": "Active East-West Strike Slip"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [90.5, 25.18],
                    [91.2, 25.20],
                    [91.8, 25.19],
                    [92.5, 25.12],
                    [93.2, 25.05]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Kopili Fault Zone (Assam - Meghalaya Boundary)",
                "source": "GSI NGDR / NESAC NeSDR",
                "hazard_level": "High Fracture & Landslide Inducing",
                "slip_rate": "NW-SE Transpressional"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [92.2, 26.2],
                    [92.6, 25.8],
                    [93.0, 25.4],
                    [93.3, 25.0]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Naga Thrust Belt (Nagaland - Assam Foothills)",
                "source": "GSI NGDR",
                "hazard_level": "Major Active Thrust & Soft Debris Zone",
                "slip_rate": "Compressional Fold Belt"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [93.8, 25.4],
                    [94.2, 25.9],
                    [94.8, 26.5],
                    [95.4, 27.1]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Main Central Thrust (MCT - Sikkim Himalayan Sector)",
                "source": "GSI NGDR / NRSC",
                "hazard_level": "Extreme Landslide Susceptibility",
                "slip_rate": "Himalayan Interplate Collision"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [88.1, 27.6],
                    [88.5, 27.5],
                    [88.9, 27.4],
                    [89.3, 27.35]
                ]
            }
        }
    ]
}

NRSC_SUSCEPTIBILITY_ZONES = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "zone_name": "Shillong Plateau - Cherrapunji Escarpment",
                "susceptibility": "Very High",
                "risk_color": "#ef4444",
                "source": "NRSC Landslide Atlas of India / NDEM",
                "geology": "Cretaceous-Tertiary Sandstone Overlying Precambrian Gneiss"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [91.55, 25.20],
                    [91.95, 25.20],
                    [91.95, 25.45],
                    [91.55, 25.45],
                    [91.55, 25.20]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "zone_name": "East Sikkim Highway Corridor",
                "susceptibility": "Very High",
                "risk_color": "#ef4444",
                "source": "NRSC Landslide Atlas of India / NDEM",
                "geology": "Fragile Higher Himalayan Crystalline Complex"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [88.50, 27.25],
                    [88.85, 27.25],
                    [88.85, 27.50],
                    [88.50, 27.50],
                    [88.50, 27.25]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "zone_name": "Dima Hasao Hill Slopes",
                "susceptibility": "High",
                "risk_color": "#f97316",
                "source": "NESAC NeSDR",
                "geology": "Disang & Barail Soft Sediment Formations"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [92.80, 25.00],
                    [93.25, 25.00],
                    [93.25, 25.35],
                    [92.80, 25.35],
                    [92.80, 25.00]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "zone_name": "Aizawl & Champhai Ridge Foldings",
                "susceptibility": "Moderate to High",
                "risk_color": "#eab308",
                "source": "NRSC Landslide Atlas / NESAC",
                "geology": "Surma Group Interbedded Sandstone & Claystone"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [92.50, 23.30],
                    [93.45, 23.30],
                    [93.45, 23.90],
                    [92.50, 23.90],
                    [92.50, 23.30]
                ]]
            }
        }
    ]
}


class GeospatialDataService:
    def __init__(self):
        self.ngdr_base = settings.NGDR_API_BASE_URL
        self.nrsc_base = settings.NRSC_API_BASE_URL
        self.nesac_base = settings.NESAC_NESDR_API_BASE_URL

    def get_fault_lines(self) -> Dict[str, Any]:
        """Fetches active fault lines from NGDR with fallback."""
        if settings.NGDR_API_KEY:
            try:
                res = requests.get(
                    f"{self.ngdr_base}/geology/faults",
                    headers={"X-API-Key": settings.NGDR_API_KEY},
                    params={"bbox": "88,21,97,30"},
                    timeout=3
                )
                if res.status_code == 200:
                    return res.json()
            except Exception as e:
                logger.warning(f"Live NGDR fetch failed: {e}. Using cached geological layer.")
        return NER_GEOLOGICAL_FAULTS

    def get_susceptibility_zones(self) -> Dict[str, Any]:
        """Fetches NRSC Landslide Susceptibility Layers with fallback."""
        if settings.NRSC_API_KEY:
            try:
                res = requests.get(
                    f"{self.nrsc_base}/landslide-atlas/ner-zones",
                    headers={"Authorization": f"Bearer {settings.NRSC_API_KEY}"},
                    timeout=3
                )
                if res.status_code == 200:
                    return res.json()
            except Exception as e:
                logger.warning(f"Live NRSC fetch failed: {e}. Using cached susceptibility layer.")
        return NRSC_SUSCEPTIBILITY_ZONES


geospatial_service = GeospatialDataService()
