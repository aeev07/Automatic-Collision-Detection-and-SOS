export type CollisionSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'FILTERED_FALSE_POSITIVE';
export type IncidentStatus = 'DETECTED' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'RESOLVED' | 'FILTERED';
export type TraumaLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';

export interface Coordinates {
  lat: number;
  lng: number;
  address?: string;
  roadName?: string;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  age: number;
  gender: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  organDonor: boolean;
  insuranceId: string;
  medicalNotes: string;
  estimatedVitals: {
    heartRateBpm: number;
    spO2Percent: number;
    systolicBP: number;
    consciousnessStatus: 'CONSCIOUS' | 'UNRESPONSIVE' | 'UNKNOWN';
  };
}

export interface Hospital {
  id: string;
  name: string;
  traumaLevel: TraumaLevel;
  distanceKm: number;
  etaMinutes: number;
  availableIcuBeds: number;
  emergencyDepartmentPhone: string;
  coordinates: Coordinates;
  specialties: string[];
  status: 'READY' | 'BUSY' | 'DISPATCHED';
}

export interface IncidentTelemetry {
  impactForceG: number;
  preCrashSpeedKmh: number;
  postCrashSpeedKmh: number;
  deltaV: number;
  impactVector: Vector3D;
  impactAngleDeg: number;
  rolloverDetected: boolean;
  airbagsDeployed: boolean;
  crushSensorFront: boolean;
  crushSensorLeft: boolean;
  crushSensorRight: boolean;
  crushSensorRear: boolean;
  seatbeltsBuckled: number;
  occupantsEstimated: number;
  batteryIsolated: boolean;
  fireHazardRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DispatchAction {
  id: string;
  channel: 'TWILIO_VOICE' | 'TWILIO_SMS' | 'HOSPITAL_DIRECT_API' | 'EMERGENCY_SERVICES_E911';
  target: string;
  status: 'PENDING' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CALLING' | 'CONNECTED';
  timestamp: string;
  payloadSummary: string;
  latencyMs: number;
}

export interface Incident {
  id: string;
  timestamp: string;
  vehicleId: string;
  vehicleModel: string;
  vehicleVin: string;
  vehicleColor: string;
  telemetryChipId: string;
  coordinates: Coordinates;
  severity: CollisionSeverity;
  status: IncidentStatus;
  goldenHourRemainingSeconds: number; // 3600 down to 0
  telemetry: IncidentTelemetry;
  patient: PatientProfile;
  assignedHospital: Hospital | null;
  dispatchActions: DispatchAction[];
  notes?: string;
}

export interface SimulationPreset {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  gForce: number;
  speedKmh: number;
  angleDeg: number;
  isFalsePositive: boolean;
  rollover: boolean;
  airbags: boolean;
  incidentData: Partial<Incident>;
}
