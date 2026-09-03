-- LANDSAFE NER — PostGIS schema
-- Run after: CREATE EXTENSION IF NOT EXISTS postgis;

CREATE EXTENSION IF NOT EXISTS postgis;

-- Monitored locations across NER
CREATE TABLE locations (
    id              SERIAL PRIMARY KEY,
    region_name     VARCHAR(255) NOT NULL,
    coordinates     GEOMETRY(Point, 4326) NOT NULL,
    vulnerability_index NUMERIC(5, 2) CHECK (vulnerability_index BETWEEN 0 AND 100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);

-- Environmental sensor / feed readings per location
CREATE TABLE environmental_data (
    id              SERIAL PRIMARY KEY,
    loc_id          INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    "timestamp"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    rainfall_mm     NUMERIC(6, 2),
    soil_moisture   NUMERIC(5, 2),
    slope_angle     NUMERIC(5, 2)
);
CREATE INDEX idx_env_data_loc_time ON environmental_data (loc_id, "timestamp");

-- Model-generated risk predictions
CREATE TABLE risk_predictions (
    id               SERIAL PRIMARY KEY,
    loc_id           INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    "timestamp"      TIMESTAMPTZ NOT NULL DEFAULT now(),
    risk_probability NUMERIC(5, 4) CHECK (risk_probability BETWEEN 0 AND 1),
    alert_status     VARCHAR(20) NOT NULL DEFAULT 'none'
                       CHECK (alert_status IN ('none', 'watch', 'warning', 'emergency'))
);
CREATE INDEX idx_risk_pred_loc_time ON risk_predictions (loc_id, "timestamp");

-- Citizen-submitted reports (mobile app, offline-first)
CREATE TABLE citizen_reports (
    id                  SERIAL PRIMARY KEY,
    coordinates         GEOMETRY(Point, 4326) NOT NULL,
    "timestamp"         TIMESTAMPTZ NOT NULL DEFAULT now(),
    image_path          TEXT,
    onnx_severity_score NUMERIC(5, 4),
    sync_status         VARCHAR(20) NOT NULL DEFAULT 'pending'
                           CHECK (sync_status IN ('pending', 'synced', 'failed'))
);
CREATE INDEX idx_citizen_reports_coordinates ON citizen_reports USING GIST (coordinates);
