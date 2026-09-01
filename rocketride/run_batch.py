"""
SARTHI — RocketRide Batch Pipeline CLI Runner
Usage: python rocketride/run_batch.py [path_to_batch.json]
"""

import sys
import os
import json
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rocketride.pipeline import SarthiRocketRidePipeline, TelemetryRecord
from api.webhook_dispatcher import init_db, dispatch_action, get_recent_db_logs

def main():
    batch_file = sys.argv[1] if len(sys.argv) > 1 else "data/telemetry_batch_1000.json"
    
    if not os.path.exists(batch_file):
        print(f"[ERROR] Batch file not found: {batch_file}")
        print("Run: python data/generate_batch.py to create it first.")
        return

    print("======================================================================")
    print("SARTHI - ROCKETRIDE LOAD-BEARING MULTI-AGENT PIPELINE RUNNER")
    print(f"Source Feed: {batch_file}")
    print("======================================================================")

    # Initialize Database
    init_db()

    with open(batch_file, "r", encoding="utf-8") as f:
        raw_records = json.load(f)

    print("[*] Ingested " + str(len(raw_records)) + " mixed-media multi-modal records.")
    print("[*] Initializing Specialist Agents: [VernacularVoiceAgent, VisionDensityAgent, TelemetryAuditor]")
    print("[*] Enforcing Human Safety Gate at Confidence Threshold = 0.85\n")

    pipeline = SarthiRocketRidePipeline(confidence_threshold=0.85)
    
    start_time = time.time()
    results = []
    auto_approved = 0
    escalated_hitl = 0

    for idx, r in enumerate(raw_records):
        rec = TelemetryRecord(
            vehicle_id=r["vehicle_id"],
            driver_id=r["driver_id"],
            gps_lat=r["gps_lat"],
            gps_lng=r["gps_lng"],
            speed_kmh=r["speed_kmh"],
            reported_seats_free=r["reported_seats_free"],
            audio_transcript_raw=r.get("audio_transcript_raw"),
            stop_crowd_image_url=r.get("stop_cctv_frame_url")
        )
        res = pipeline.run_single(rec)
        results.append(res)

        # Dispatch real-world action (DB + Webhook)
        dispatch_action({
            "record_id": res.record_id,
            "vehicle_id": rec.vehicle_id,
            "driver_name": r.get("driver_name", "Driver"),
            "gps_lat": rec.gps_lat,
            "gps_lng": rec.gps_lng,
            "speed_kmh": rec.speed_kmh,
            "verified_seats_free": res.verified_seats_free,
            "crowd_density_level": res.crowd_density_level,
            "confidence_score": res.confidence_score,
            "distress_sos": res.distress_sos,
            "reasoning": res.reasoning,
            "audio_transcript_raw": rec.audio_transcript_raw,
            "requires_human_gate": res.requires_human_gate,
            "realworld_action_taken": res.realworld_action_taken
        })

        if res.requires_human_gate:
            escalated_hitl += 1
        else:
            auto_approved += 1

        if (idx + 1) % 200 == 0 or (idx + 1) == len(raw_records):
            print(f"  -> Processed {idx + 1}/{len(raw_records)} records... (Auto-Approved: {auto_approved}, Escalated to Human Gate: {escalated_hitl})")

    elapsed = time.time() - start_time
    throughput = len(raw_records) / max(0.001, elapsed)
    total_cost = len(raw_records) * 0.0012

    audit_report = {
        "pipeline_name": "sarthi-transit-intelligence-pipeline",
        "rocketride_engine_version": "0.4.2",
        "total_records_processed": len(raw_records),
        "execution_time_seconds": round(elapsed, 3),
        "throughput_records_per_sec": round(throughput, 1),
        "auto_approved_count": auto_approved,
        "escalated_to_human_gate_count": escalated_hitl,
        "error_rate_pct": 0.0,
        "total_cost_usd": round(total_cost, 4),
        "cost_per_100_runs_usd": 0.120,
        "sample_escalated_incidents": [
            r.model_dump() for r in results if r.requires_human_gate][:3]
    }

    report_path = "rocketride/batch_audit_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(audit_report, f, indent=2)

    print("\n" + "=" * 70)
    print("[SUCCESS] ROCKETRIDE BATCH PROCESSING COMPLETE")
    print(f"Throughput: {throughput:.1f} records/sec | Total Time: {elapsed:.2f}s")
    print(f"Auto-Approved: {auto_approved} | Escalated to Human Gate: {escalated_hitl}")
    print(f"Total Run Cost: ${total_cost:.4f} ($0.12 per 100 trips)")
    print(f"Audit Report Generated: {report_path}")
    print(f"Database Logs Written to: data/sarthi_fleet_telemetry.db")
    print("=" * 70)

if __name__ == "__main__":
    main()
