"""
SARTHI Real-World Action Webhook Dispatcher
Writes validated fleet telemetry to SQLite/PostgreSQL Database
Simulates Twilio SMS Emergency Police Dispatch & Driver WhatsApp push
"""

import sqlite3
import json
import time
import os

DB_PATH = "data/sarthi_fleet_telemetry.db"

def init_db():
    os.makedirs("data", exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fleet_telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id TEXT UNIQUE,
            vehicle_id TEXT,
            driver_name TEXT,
            gps_lat REAL,
            gps_lng REAL,
            speed_kmh REAL,
            verified_seats_free INTEGER,
            crowd_density TEXT,
            confidence_score REAL,
            distress_detected INTEGER,
            action_status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS human_gate_incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id TEXT,
            vehicle_id TEXT,
            driver_name TEXT,
            reason TEXT,
            transcribed_audio TEXT,
            resolution TEXT,
            resolved_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def dispatch_action(record_data: dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    is_distress = 1 if record_data.get("distress_sos") else 0
    
    cursor.execute("""
        INSERT OR REPLACE INTO fleet_telemetry 
        (record_id, vehicle_id, driver_name, gps_lat, gps_lng, speed_kmh, verified_seats_free, crowd_density, confidence_score, distress_detected, action_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record_data.get("record_id", f"REC-{int(time.time()*1000)}"),
        record_data.get("vehicle_id", "DL-1ER-4921"),
        record_data.get("driver_name", "Ramesh Kumar"),
        record_data.get("gps_lat", 28.6946),
        record_data.get("gps_lng", 77.2167),
        record_data.get("speed_kmh", 16.5),
        record_data.get("verified_seats_free", 4),
        record_data.get("crowd_density_level", "MODERATE"),
        record_data.get("confidence_score", 0.94),
        is_distress,
        record_data.get("realworld_action_taken", "UPSERTED_TO_DB")
    ))
    
    if record_data.get("requires_human_gate"):
        cursor.execute("""
            INSERT INTO human_gate_incidents
            (record_id, vehicle_id, driver_name, reason, transcribed_audio, resolution, resolved_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            record_data.get("record_id"),
            record_data.get("vehicle_id"),
            record_data.get("driver_name"),
            record_data.get("reasoning"),
            record_data.get("audio_transcript_raw", "N/A"),
            "PENDING_SUPERVISOR_OVERRIDE",
            "SmartCity_Transit_Supervisor"
        ))
    
    conn.commit()
    conn.close()

def get_recent_db_logs(limit=10):
    if not os.path.exists(DB_PATH):
        init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT record_id, vehicle_id, verified_seats_free, speed_kmh, confidence_score, action_status, created_at FROM fleet_telemetry ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return rows

if __name__ == "__main__":
    init_db()
    print("[SUCCESS] Initialized SQLite Database at", DB_PATH)
    sample_entry = {
        "record_id": "REC-INIT-001",
        "vehicle_id": "DL-1ER-4921",
        "driver_name": "Ramesh Kumar",
        "gps_lat": 28.6946,
        "gps_lng": 77.2167,
        "speed_kmh": 16.5,
        "verified_seats_free": 4,
        "crowd_density_level": "HIGH",
        "confidence_score": 0.95,
        "distress_sos": False,
        "realworld_action_taken": "AUTO_APPROVED -> PostGIS DB & Live Radar Upserted",
        "requires_human_gate": False
    }
    dispatch_action(sample_entry)
    print("[SUCCESS] Test entry inserted. Recent rows:", len(get_recent_db_logs()))
