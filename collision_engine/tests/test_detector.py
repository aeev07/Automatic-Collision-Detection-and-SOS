import pytest
from collision_engine.simulator.generator import IMUScenarioGenerator
from collision_engine.detection.detector import MultiStageCollisionDetector
from collision_engine.classification.classifier import CollisionClassifier
from collision_engine.api.schemas import SeverityLevel


@pytest.fixture
def detector():
    return MultiStageCollisionDetector()


def test_normal_driving_scenario(detector):
    readings = IMUScenarioGenerator.normal_driving()
    metrics = detector.analyze(readings)
    result = CollisionClassifier.classify(metrics, "VH-101", "2026-11-24T14:30:00Z")

    assert result.collision_detected is False
    assert result.severity is None
    assert result.impact_magnitude < 3.0
    assert "within normal driving" in result.detection_reason


def test_hard_braking_scenario(detector):
    readings = IMUScenarioGenerator.hard_braking()
    metrics = detector.analyze(readings)
    result = CollisionClassifier.classify(metrics, "VH-101", "2026-11-24T14:30:00Z")

    assert result.collision_detected is False
    assert result.severity is None
    assert result.impact_magnitude < 3.5
    assert "braking" in result.detection_reason.lower()


def test_pothole_rejection_multi_stage_vs_naive(detector):
    """
    Core demonstration: A naive 6g detector trips on pothole vertical shocks,
    whereas our multi-stage detector successfully rejects it as a false positive!
    """
    readings = IMUScenarioGenerator.pothole()
    metrics = detector.analyze(readings)
    result = CollisionClassifier.classify(metrics, "VH-101", "2026-11-24T14:30:00Z")

    # Baseline naive detector WOULD have failed here:
    assert metrics.naive_6g_triggered is True, "Naive 6g baseline should trip on pothole"
    assert metrics.peak_acceleration_g >= 7.0

    # Multi-stage detector successfully prevents false positive:
    assert result.collision_detected is False
    assert result.severity is None
    assert "pothole" in result.detection_reason.lower()
    assert metrics.sustained_duration_ms <= 20


def test_minor_bump_scenario(detector):
    readings = IMUScenarioGenerator.minor_bump()
    metrics = detector.analyze(readings)
    result = CollisionClassifier.classify(metrics, "VH-101", "2026-11-24T14:30:00Z")

    assert result.collision_detected is True
    assert result.severity == SeverityLevel.LOW
    assert result.impact_magnitude >= 3.5
    assert result.confidence_score >= 0.80


def test_high_impact_collision_scenario(detector):
    readings = IMUScenarioGenerator.high_impact_collision()
    metrics = detector.analyze(readings)
    result = CollisionClassifier.classify(metrics, "VH-101", "2026-11-24T14:30:00Z")

    assert result.collision_detected is True
    assert result.severity in [SeverityLevel.HIGH, SeverityLevel.CRITICAL]
    assert result.impact_magnitude >= 10.0
    assert result.confidence_score >= 0.88
    assert metrics.sustained_duration_ms >= 35


def test_rollover_scenario(detector):
    readings = IMUScenarioGenerator.rollover()
    metrics = detector.analyze(readings)
    result = CollisionClassifier.classify(metrics, "VH-101", "2026-11-24T14:30:00Z")

    assert result.collision_detected is True
    assert result.severity == SeverityLevel.CRITICAL
    assert metrics.is_inversion_detected is True
    assert "rollover" in result.detection_reason.lower()


def test_baseline_comparison_matrix(detector):
    """
    Evaluates false-positive rate across 50 iterations of potholes.
    Naive detector false alarm rate: ~100%
    Multi-stage detector false alarm rate: 0%
    """
    naive_false_alarms = 0
    multistage_false_alarms = 0
    trials = 50

    for _ in range(trials):
        readings = IMUScenarioGenerator.pothole()
        metrics = detector.analyze(readings)
        res = CollisionClassifier.classify(metrics, "VH-TEST", "2026-11-24T14:30:00Z")

        if metrics.naive_6g_triggered:
            naive_false_alarms += 1
        if res.collision_detected:
            multistage_false_alarms += 1

    assert naive_false_alarms == trials, "Naive 6g detector trips on all pothole impacts"
    assert multistage_false_alarms == 0, "Multi-stage detector must achieve 0 false alarms on potholes"
