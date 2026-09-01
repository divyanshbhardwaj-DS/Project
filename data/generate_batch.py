import json
import random
import time

def generate_telemetry_batch(count=1000, filename="data/telemetry_batch_1000.json"):
    drivers = [
        {"driver_id": "DRV-104", "vehicle_id": "DL-1ER-4921", "name": "Ramesh Kumar"},
        {"driver_id": "DRV-108", "vehicle_id": "DL-1ER-8312", "name": "Suresh Sharma"},
        {"driver_id": "DRV-112", "vehicle_id": "DL-1ER-2901", "name": "Vinod Pal"},
        {"driver_id": "DRV-119", "vehicle_id": "DL-1ER-6640", "name": "Manoj Singh"},
        {"driver_id": "DRV-125", "vehicle_id": "DL-1ER-1144", "name": "Rajesh Gupta"},
        {"driver_id": "DRV-131", "vehicle_id": "DL-1ER-9082", "name": "Amit Verma"}
    ]

    stops = [
        {"name": "Vishwavidyalaya Metro Gate 2", "lat": 28.6946, "lng": 77.2167, "cctv": "https://sarthi.city/cctv/metro_gate2.jpg"},
        {"name": "Arts Faculty Circle", "lat": 28.6895, "lng": 77.2105, "cctv": "https://sarthi.city/cctv/arts_faculty.jpg"},
        {"name": "Hansraj College Gate 1", "lat": 28.6812, "lng": 77.2091, "cctv": "https://sarthi.city/cctv/hansraj_gate.jpg"},
        {"name": "Patel Chest Institute", "lat": 28.6845, "lng": 77.2102, "cctv": "https://sarthi.city/cctv/patel_chest.jpg"},
        {"name": "Kamla Nagar Market", "lat": 28.6798, "lng": 77.2024, "cctv": "https://sarthi.city/cctv/kamla_nagar.jpg"}
    ]

    normal_voice_phrases = [
        "कॉलेज मोड़ पर 3 सवारी बैठ गई, 3 सीट खाली है",
        "2 सवारी उतरी, 4 सीट खाली हैं",
        "मेट्रो स्टेशन पर गाड़ी फुल हो गई",
        "सभी 6 सीटें खाली हैं, मार्केट की तरफ जा रहा हूँ",
        "हंसराज गेट पर 1 सवारी बैठी, 5 सीट खाली"
    ]

    distress_voice_phrases = [
        "मदद चाहिए, कॉलेज मोड़ पर रास्ता बंद है और गाड़ी पंचर है (SOS Distress)",
        "एसओएस! आपातकालीन मदद चाहिए, रास्ता ब्लॉक है",
        "बचाओ, यहाँ जाम लगा है और झगड़ा हो रहा है"
    ]

    records = []
    base_time = int(time.time()) - 3600

    for i in range(count):
        drv = random.choice(drivers)
        stop = random.choice(stops)
        
        # 3% chance of anomaly or distress for testing Human-in-the-Loop Gate
        is_anomaly = (random.random() < 0.035)
        
        if is_anomaly:
            speed = round(random.uniform(48.0, 65.0), 1) # Speed Anomaly
            voice = random.choice(distress_voice_phrases)
            reported_seats = random.choice([0, 1])
        else:
            speed = round(random.uniform(12.0, 24.0), 1)
            voice = random.choice(normal_voice_phrases)
            reported_seats = random.choice([2, 3, 4, 5, 6])

        record = {
            "record_id": f"REC-BATCH-{i+1:04d}",
            "vehicle_id": drv["vehicle_id"],
            "driver_id": drv["driver_id"],
            "driver_name": drv["name"],
            "gps_lat": round(stop["lat"] + random.uniform(-0.003, 0.003), 6),
            "gps_lng": round(stop["lng"] + random.uniform(-0.003, 0.003), 6),
            "speed_kmh": speed,
            "reported_seats_free": reported_seats,
            "audio_transcript_raw": voice,
            "stop_cctv_frame_url": stop["cctv"],
            "nearest_stop": stop["name"],
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(base_time + i * 3))
        }
        records.append(record)

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    print(f"[SUCCESS] Generated {count} records in {filename}")

if __name__ == "__main__":
    generate_telemetry_batch(1000)
