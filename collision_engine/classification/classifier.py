import uuid
from typing import Tuple, Optional
from collision_engine.api.schemas import SeverityLevel, CollisionAnalysisResponse
from collision_engine.detection.detector import CollisionMetrics


class CollisionClassifier:
    """
    Evaluates multi-stage collision metrics to:
    1. Distinguish real collisions from false positives (braking, potholes).
    2. Grade collision severity (LOW, MEDIUM, HIGH, CRITICAL).
    3. Generate confidence score (0.0 - 1.0) and explainable reason string.
    """

    @classmethod
    def classify(cls, metrics: CollisionMetrics, vehicle_id: str, timestamp: str) -> CollisionAnalysisResponse:
        peak_g = metrics.peak_acceleration_g
        duration_ms = metrics.sustained_duration_ms
        gyro_peak = metrics.peak_angular_speed_deg_s
        is_inversion = metrics.is_inversion_detected
        is_vert_dominant = metrics.is_vertical_dominant

        # Case 1: Rollover
        if is_inversion:
            severity = SeverityLevel.CRITICAL
            confidence = min(0.98, 0.85 + (gyro_peak / 1000.0))
            reason = (
                f"Vehicle rollover detected: vertical acceleration inverted (az < -0.4g) "
                f"with high roll rate ({gyro_peak} deg/s); CRITICAL severity."
            )
            return CollisionAnalysisResponse(
                event_id=f"evt_{uuid.uuid4().hex[:8]}",
                vehicle_id=vehicle_id,
                timestamp=timestamp,
                collision_detected=True,
                confidence_score=round(confidence, 2),
                impact_magnitude=peak_g,
                severity=severity,
                detection_reason=reason
            )

        # Case 2: Pothole / Road Shock Rejection (False Positive Filter)
        # Even if peak_g > 6.0g, short duration (<25ms) + vertical dominant + low gyro = NOT a crash
        if is_vert_dominant and duration_ms <= 20 and gyro_peak < 30.0:
            confidence = 0.92  # High confidence that it is NOT a collision
            reason = (
                f"Peak {peak_g}g shock lasted only {duration_ms}ms with low angular rate ({gyro_peak} deg/s); "
                f"identified as pothole/road irregularity. Ruled out collision."
            )
            return CollisionAnalysisResponse(
                event_id=f"evt_{uuid.uuid4().hex[:8]}",
                vehicle_id=vehicle_id,
                timestamp=timestamp,
                collision_detected=False,
                confidence_score=round(confidence, 2),
                impact_magnitude=peak_g,
                severity=None,
                detection_reason=reason
            )

        # Case 3: Hard Braking / Normal Driving Rejection
        if peak_g < 3.5:
            confidence = 0.95
            reason = (
                f"Peak magnitude {peak_g}g within normal driving and standard braking limits (<3.5g); "
                f"no collision detected."
            )
            return CollisionAnalysisResponse(
                event_id=f"evt_{uuid.uuid4().hex[:8]}",
                vehicle_id=vehicle_id,
                timestamp=timestamp,
                collision_detected=False,
                confidence_score=round(confidence, 2),
                impact_magnitude=peak_g,
                severity=None,
                detection_reason=reason
            )

        # Case 4: True Collision Detection with Multi-Stage Validation
        # Requires both:
        # a) Minimum sustained impact duration (>= 20ms)
        # b) Angular rate perturbation (> 20 deg/s) OR high peak (> 8.0g)
        if duration_ms >= 20 and (gyro_peak >= 25.0 or peak_g >= 7.5):
            # Grade severity
            if peak_g >= 12.0 or metrics.delta_v_ms >= 10.0:
                severity = SeverityLevel.CRITICAL
                base_conf = 0.94
            elif peak_g >= 8.0:
                severity = SeverityLevel.HIGH
                base_conf = 0.91
            elif peak_g >= 5.5:
                severity = SeverityLevel.MEDIUM
                base_conf = 0.86
            else:
                severity = SeverityLevel.LOW
                base_conf = 0.82

            confidence = min(0.99, base_conf + min(0.05, duration_ms / 1000.0))
            reason = (
                f"Peak {peak_g}g sustained {duration_ms}ms with gyro spike ({gyro_peak} deg/s); "
                f"ruled out pothole/braking. {severity.value} impact confirmed."
            )

            return CollisionAnalysisResponse(
                event_id=f"evt_{uuid.uuid4().hex[:8]}",
                vehicle_id=vehicle_id,
                timestamp=timestamp,
                collision_detected=True,
                confidence_score=round(confidence, 2),
                impact_magnitude=peak_g,
                severity=severity,
                detection_reason=reason
            )

        # Edge Case: Transient shock without sufficient persistence
        reason = (
            f"Transient peak of {peak_g}g lacked sufficient persistence ({duration_ms}ms < 20ms) "
            f"and gyro correlation ({gyro_peak} deg/s); classified as non-collision impact."
        )
        return CollisionAnalysisResponse(
            event_id=f"evt_{uuid.uuid4().hex[:8]}",
            vehicle_id=vehicle_id,
            timestamp=timestamp,
            collision_detected=False,
            confidence_score=0.88,
            impact_magnitude=peak_g,
            severity=None,
            detection_reason=reason
        )
