import sys
from pathlib import Path

# Ensure repository root is in sys.path regardless of execution directory
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

import json
from collision_engine.simulator.generator import IMUScenarioGenerator
from collision_engine.detection.detector import MultiStageCollisionDetector
from collision_engine.classification.classifier import CollisionClassifier

def run_all_tests():
    detector = MultiStageCollisionDetector()
    scenarios = [
        "normal_driving",
        "hard_braking",
        "pothole",
        "minor_bump",
        "high_impact_collision",
        "rollover"
    ]

    header = f"{'SCENARIO':<22} | {'COLLISION?':<10} | {'SEVERITY':<8} | {'PEAK (g)':<9} | {'SUSTAINED':<10} | {'GYRO (deg/s)':<13} | {'CONF':<5} | {'NAIVE 6G':<8}"
    print("\n" + "=" * len(header))
    print(header)
    print("=" * len(header))

    results = {}
    for sc in scenarios:
        req = IMUScenarioGenerator.get_scenario(sc)
        metrics = detector.analyze(req.readings)
        res = CollisionClassifier.classify(
            metrics, "VH-101", "2026-11-24T14:30:00Z", threshold_g=detector.threshold_g
        )
        results[sc] = (res, metrics)

        sev = res.severity.value if res.severity else "None"
        dur = f"{metrics.sustained_duration_ms}ms"
        print(f"{sc:<22} | {str(res.collision_detected):<10} | {sev:<8} | {metrics.peak_acceleration_g:<9.2f} | {dur:<10} | {metrics.peak_angular_speed_deg_s:<13.1f} | {res.confidence_score:<5.2f} | {str(metrics.naive_6g_triggered):<8}")

    print("=" * len(header) + "\n")

    print("--- Detailed Detection Reasoning & Contracts Conformity ---")
    for sc in ["pothole", "high_impact_collision", "rollover"]:
        res, metrics = results[sc]
        print(f"\n[{sc.upper()}]")
        print(f"Detection Reason: \"{res.detection_reason}\"")
        print(f"Contract JSON Output:")
        print(json.dumps(res.model_dump(), indent=2))

if __name__ == "__main__":
    run_all_tests()
