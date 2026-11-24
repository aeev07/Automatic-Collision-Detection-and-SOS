// Shared API Contracts matching docs/CONTRACTS.md exactly

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface HospitalRoute {
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  distance_km: number;
  road_distance_km: number;
  eta_min: number;
  route?: [number, number][] | null; // list of [lat, lng] pairs, may be null or empty
}

export interface Accident {
  accident_id: string;
  vehicle_id: string;
  timestamp: string; // ISO 8601 without Z from backend
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  impact_magnitude: number; // in g
  selected_hospital: HospitalRoute | null;
  notification_status: NotificationStatus;
  acknowledged: boolean;
  acknowledged_at: string | null;
  patient_id: string | null;
  detection_reason?: string | null;
}

export interface Patient {
  patient_id: string | null;
  name: string;
  blood_group: string;
  allergies: string[];
  medical_conditions: string[];
  emergency_contact: {
    name: string;
    phone: string;
  };
}

// Joined representation for UI display
export interface AccidentDetail extends Accident {
  patient?: Patient | null;
}
