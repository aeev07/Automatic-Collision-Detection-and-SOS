import math
import random
from typing import List, Dict, Any
from collision_engine.api.schemas import IMUReading, CollisionAnalysisRequest


class IMUScenarioGenerator:
    """
    Generates synthetic 100Hz 6-axis IMU data (ax, ay, az in g; gx, gy, gz in deg/s)
    simulating realistic driving conditions and crash dynamics.
    """

    @staticmethod
    def normal_driving(duration_ms: int = 1000, step_ms: int = 10) -> List[IMUReading]:
        """Normal smooth cruising with minor road noise."""
        readings = []
        for t in range(0, duration_ms, step_ms):
            ax = random.gauss(0.0, 0.02)
            ay = random.gauss(0.0, 0.02)
            az = 1.0 + random.gauss(0.0, 0.03)  # 1g gravity along z
            gx = random.gauss(0.0, 0.5)
            gy = random.gauss(0.0, 0.5)
            gz = random.gauss(0.0, 0.5)
            readings.append(IMUReading(t_ms=t, ax=round(ax, 3), ay=round(ay, 3), az=round(az, 3),
                                       gx=round(gx, 2), gy=round(gy, 2), gz=round(gz, 2)))
        return readings

    @staticmethod
    def hard_braking(duration_ms: int = 1000, step_ms: int = 10) -> List[IMUReading]:
        """Aggressive panic braking: sustained deceleration on X, small pitch, no gyro spike."""
        readings = []
        for t in range(0, duration_ms, step_ms):
            if 300 <= t <= 750:
                # Deceleration ramp to -1.1g
                progress = min(1.0, (t - 300) / 100.0)
                ax = -1.1 * progress + random.gauss(0.0, 0.04)
                ay = random.gauss(0.0, 0.03)
                az = 1.0 + random.gauss(0.0, 0.04)
                gx = random.gauss(0.0, 0.8)
                gy = -5.0 * progress + random.gauss(0.0, 0.5)  # slight nose dip
                gz = random.gauss(0.0, 0.8)
            else:
                ax = random.gauss(0.0, 0.02)
                ay = random.gauss(0.0, 0.02)
                az = 1.0 + random.gauss(0.0, 0.03)
                gx = random.gauss(0.0, 0.5)
                gy = random.gauss(0.0, 0.5)
                gz = random.gauss(0.0, 0.5)
            readings.append(IMUReading(t_ms=t, ax=round(ax, 3), ay=round(ay, 3), az=round(az, 3),
                                       gx=round(gx, 2), gy=round(gy, 2), gz=round(gz, 2)))
        return readings

    @staticmethod
    def pothole(duration_ms: int = 1000, step_ms: int = 10) -> List[IMUReading]:
        """
        Pothole impact: High instantaneous vertical spike (7.5g - 8.5g)
        lasting strictly 1-2 samples (<20ms), with minimal angular rotation (<10 deg/s).
        Key false-positive test for naive 6g threshold detectors.
        
        """
        readings = []
        for t in range(0, duration_ms, step_ms):
            if t == 400:
                ax = 0.4 + random.gauss(0.0, 0.05)
                ay = 0.2 + random.gauss(0.0, 0.05)
                az = 8.2  # Sharp vertical spike
                gx = random.gauss(0.0, 2.0)
                gy = random.gauss(0.0, 3.0)
                gz = random.gauss(0.0, 2.0)
            elif t == 410:
                ax = -0.2
                ay = -0.1
                az = 3.5  # Rapid rebound
                gx = random.gauss(0.0, 2.0)
                gy = random.gauss(0.0, 2.0)
                gz = random.gauss(0.0, 1.0)
            elif t == 420:
                ax = 0.0
                ay = 0.0
                az = 0.4  # Damped rebound
                gx = random.gauss(0.0, 1.0)
                gy = random.gauss(0.0, 1.0)
                gz = random.gauss(0.0, 1.0)
            else:
                ax = random.gauss(0.0, 0.02)
                ay = random.gauss(0.0, 0.02)
                az = 1.0 + random.gauss(0.0, 0.03)
                gx = random.gauss(0.0, 0.5)
                gy = random.gauss(0.0, 0.5)
                gz = random.gauss(0.0, 0.5)
            readings.append(IMUReading(t_ms=t, ax=round(ax, 3), ay=round(ay, 3), az=round(az, 3),
                                       gx=round(gx, 2), gy=round(gy, 2), gz=round(gz, 2)))
        return readings

    @staticmethod
    def minor_bump(duration_ms: int = 1000, step_ms: int = 10) -> List[IMUReading]:
        """Low-speed parking tap or fender bender: peak ~4.5g, ~30ms duration."""
        readings = []
        for t in range(0, duration_ms, step_ms):
            if 400 <= t <= 430:
                ax = -4.5 + random.gauss(0.0, 0.2)
                ay = 0.8 + random.gauss(0.0, 0.1)
                az = 1.2 + random.gauss(0.0, 0.1)
                gx = random.gauss(0.0, 5.0)
                gy = -20.0 + random.gauss(0.0, 3.0)
                gz = 15.0 + random.gauss(0.0, 2.0)
            else:
                ax = random.gauss(0.0, 0.02)
                ay = random.gauss(0.0, 0.02)
                az = 1.0 + random.gauss(0.0, 0.03)
                gx = random.gauss(0.0, 0.5)
                gy = random.gauss(0.0, 0.5)
                gz = random.gauss(0.0, 0.5)
            readings.append(IMUReading(t_ms=t, ax=round(ax, 3), ay=round(ay, 3), az=round(az, 3),
                                       gx=round(gx, 2), gy=round(gy, 2), gz=round(gz, 2)))
        return readings

    @staticmethod
    def high_impact_collision(duration_ms: int = 1000, step_ms: int = 10) -> List[IMUReading]:
        """
        Severe frontal/angled crash:
        Peak acceleration 11g - 14g sustained across 40ms - 60ms,
        with violent angular rate spike (>120 deg/s) and rapid delta-V.
        """
        readings = []
        for t in range(0, duration_ms, step_ms):
            if 300 <= t <= 360:
                rel = (t - 300) / 60.0
                pulse = math.sin(rel * math.pi)
                ax = -11.5 * pulse + random.gauss(0.0, 0.4)
                ay = 4.2 * pulse + random.gauss(0.0, 0.3)
                az = 2.8 * pulse + 1.0 + random.gauss(0.0, 0.3)
                gx = 135.0 * pulse + random.gauss(0.0, 5.0)
                gy = -90.0 * pulse + random.gauss(0.0, 4.0)
                gz = 75.0 * pulse + random.gauss(0.0, 4.0)
            else:
                ax = random.gauss(0.0, 0.02)
                ay = random.gauss(0.0, 0.02)
                az = 1.0 + random.gauss(0.0, 0.03)
                gx = random.gauss(0.0, 0.5)
                gy = random.gauss(0.0, 0.5)
                gz = random.gauss(0.0, 0.5)
            readings.append(IMUReading(t_ms=t, ax=round(ax, 3), ay=round(ay, 3), az=round(az, 3),
                                       gx=round(gx, 2), gy=round(gy, 2), gz=round(gz, 2)))
        return readings

    @staticmethod
    def rollover(duration_ms: int = 1000, step_ms: int = 10) -> List[IMUReading]:
        """Vehicle rollover: sustained extreme angular roll rate (>200 deg/s), inverted vertical axis."""
        readings = []
        for t in range(0, duration_ms, step_ms):
            if t < 300:
                ax = random.gauss(0.0, 0.02)
                ay = random.gauss(0.0, 0.02)
                az = 1.0 + random.gauss(0.0, 0.03)
                gx = random.gauss(0.0, 0.5)
                gy = random.gauss(0.0, 0.5)
                gz = random.gauss(0.0, 0.5)
            elif 300 <= t <= 600:
                ax = -5.0 + random.gauss(0.0, 0.4)
                ay = 7.0 + random.gauss(0.0, 0.5)
                az = -0.9 + random.gauss(0.0, 0.2)  # Inverted gravity!
                gx = 240.0 + random.gauss(0.0, 10.0)  # Violent roll
                gy = 45.0 + random.gauss(0.0, 4.0)
                gz = 60.0 + random.gauss(0.0, 5.0)
            else:
                # Vehicle rests on roof/side
                ax = 0.05
                ay = 0.1
                az = -0.95  # Inverted rest
                gx = 0.0
                gy = 0.0
                gz = 0.0
            readings.append(IMUReading(t_ms=t, ax=round(ax, 3), ay=round(ay, 3), az=round(az, 3),
                                       gx=round(gx, 2), gy=round(gy, 2), gz=round(gz, 2)))
        return readings

    @classmethod
    def get_scenario(cls, scenario_name: str, vehicle_id: str = "VH-101", timestamp: str = "2026-11-24T14:30:00Z") -> CollisionAnalysisRequest:
        """Helper to create a full request object for any named scenario."""
        scenarios = {
            "normal_driving": cls.normal_driving,
            "hard_braking": cls.hard_braking,
            "pothole": cls.pothole,
            "minor_bump": cls.minor_bump,
            "high_impact_collision": cls.high_impact_collision,
            "rollover": cls.rollover,
        }
        if scenario_name not in scenarios:
            raise ValueError(f"Unknown scenario: {scenario_name}. Options: {list(scenarios.keys())}")
        
        readings = scenarios[scenario_name]()
        return CollisionAnalysisRequest(
            vehicle_id=vehicle_id,
            timestamp=timestamp,
            readings=readings
        )
