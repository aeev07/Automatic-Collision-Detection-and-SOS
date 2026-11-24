import { Hospital, Incident, PatientProfile, SimulationPreset } from '../types';

export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-01',
    name: 'Metropolitan Trauma & Surgical Center',
    traumaLevel: 'LEVEL_1',
    distanceKm: 3.4,
    etaMinutes: 6,
    availableIcuBeds: 7,
    emergencyDepartmentPhone: '+1 (555) 019-2834',
    coordinates: {
      lat: 37.7845,
      lng: -122.4080,
      address: '750 Harrison St, San Francisco, CA',
      roadName: 'Harrison St'
    },
    specialties: ['Neuro-trauma', 'Cardiothoracic Surgery', 'Burn Unit', 'Pediatric ICU'],
    status: 'READY'
  },
  {
    id: 'hosp-02',
    name: 'St. Jude Emergency Hospital',
    traumaLevel: 'LEVEL_2',
    distanceKm: 5.8,
    etaMinutes: 11,
    availableIcuBeds: 3,
    emergencyDepartmentPhone: '+1 (555) 014-9921',
    coordinates: {
      lat: 37.7612,
      lng: -122.4350,
      address: '1001 Potrero Ave, San Francisco, CA',
      roadName: 'Potrero Ave'
    },
    specialties: ['General Trauma', 'Orthopedic Surgery', 'Emergency Radiology'],
    status: 'READY'
  },
  {
    id: 'hosp-03',
    name: 'Bayview Urgent & Trauma Care',
    traumaLevel: 'LEVEL_3',
    distanceKm: 8.2,
    etaMinutes: 16,
    availableIcuBeds: 12,
    emergencyDepartmentPhone: '+1 (555) 018-4412',
    coordinates: {
      lat: 37.7310,
      lng: -122.3920,
      address: '350 3rd St, San Francisco, CA',
      roadName: '3rd St'
    },
    specialties: ['Stabilization Unit', 'Minor Trauma', 'Air Ambulance Pad'],
    status: 'READY'
  }
];

export const INITIAL_PATIENT: PatientProfile = {
  id: 'pat-9041',
  fullName: 'Alexander "Alex" Mercer',
  age: 34,
  gender: 'Male',
  bloodType: 'O-Negative (Universal Donor)',
  allergies: ['Penicillin (Anaphylaxis Risk)', 'Ibuprofen / NSAIDs'],
  chronicConditions: ['Type-1 Diabetes (Insulin Dependent)', 'Mild Asthma'],
  emergencyContact: {
    name: 'Dr. Sarah Mercer',
    relationship: 'Spouse',
    phone: '+1 (555) 782-9013'
  },
  organDonor: true,
  insuranceId: 'BCBS-EXP-9924-T',
  medicalNotes: 'Has continuous glucose monitor sensor on left arm. MedicAlert bracelet verified.',
  estimatedVitals: {
    heartRateBpm: 118,
    spO2Percent: 94,
    systolicBP: 105,
    consciousnessStatus: 'UNRESPONSIVE'
  }
};

export const INITIAL_INCIDENT: Incident = {
  id: 'INC-2026-8841',
  timestamp: new Date().toISOString(),
  vehicleId: 'VH-4092-TES',
  vehicleModel: '2024 Genesis G80 / Embedded ECU-X1',
  vehicleVin: 'KMHN45CG7PA092144',
  vehicleColor: 'Phantom Obsidian Black',
  telemetryChipId: 'CHIP-ARM-CORTEX-M4-089',
  coordinates: {
    lat: 37.7749,
    lng: -122.4194,
    address: 'Market St & 8th St Intersection',
    roadName: 'Market Street (Eastbound)'
  },
  severity: 'CRITICAL',
  status: 'DISPATCHED',
  goldenHourRemainingSeconds: 3240, // 54 minutes remaining
  telemetry: {
    impactForceG: 12.4, // Threshold is >= 6.0g
    preCrashSpeedKmh: 74,
    postCrashSpeedKmh: 0,
    deltaV: 74,
    impactVector: { x: 10.8, y: 5.2, z: 2.1 },
    impactAngleDeg: 28, // Near head-on front-left
    rolloverDetected: false,
    airbagsDeployed: true,
    crushSensorFront: true,
    crushSensorLeft: true,
    crushSensorRight: false,
    crushSensorRear: false,
    seatbeltsBuckled: 1,
    occupantsEstimated: 1,
    batteryIsolated: true,
    fireHazardRisk: 'MEDIUM'
  },
  patient: INITIAL_PATIENT,
  assignedHospital: INITIAL_HOSPITALS[0],
  dispatchActions: [
    {
      id: 'disp-01',
      channel: 'TWILIO_VOICE',
      target: '+1 (555) 019-2834 (Metropolitan Trauma Desk)',
      status: 'CONNECTED',
      timestamp: new Date(Date.now() - 45000).toLocaleTimeString(),
      payloadSummary: 'Automated 12.4g crash broadcast, O- blood alert, critical trauma request delivered.',
      latencyMs: 340
    },
    {
      id: 'disp-02',
      channel: 'TWILIO_SMS',
      target: '+1 (555) 019-2834 (Trauma Bay Shift Lead)',
      status: 'DELIVERED',
      timestamp: new Date(Date.now() - 40000).toLocaleTimeString(),
      payloadSummary: 'GPS: 37.7749,-122.4194 | Speed: 74km/h | G-Force: 12.4g | Patient: Alex Mercer (34M, O-Neg, Insulin)',
      latencyMs: 210
    },
    {
      id: 'disp-03',
      channel: 'TWILIO_SMS',
      target: '+1 (555) 782-9013 (Spouse: Sarah Mercer)',
      status: 'DELIVERED',
      timestamp: new Date(Date.now() - 35000).toLocaleTimeString(),
      payloadSummary: 'Collision detected for vehicle VH-4092. Metropolitan Trauma Center dispatched. Live tracking active.',
      latencyMs: 195
    },
    {
      id: 'disp-04',
      channel: 'HOSPITAL_DIRECT_API',
      target: 'FHIR / HL7 Emergency Protocol Endpoint',
      status: 'SENT',
      timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
      payloadSummary: 'EHR telemetry payload sent to Metropolitan Trauma Intake queue.',
      latencyMs: 82
    }
  ],
  notes: 'High-energy oblique collision at high speed. Structural intrusion on driver side. Rapid ER response required.'
};

export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'preset-critical-headon',
    title: 'Severe Head-On Impact (12.4g)',
    description: 'High-speed frontal collision exceeding 6g threshold. Airbags fired, driver unresponsive.',
    badge: 'CRITICAL',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    gForce: 12.4,
    speedKmh: 74,
    angleDeg: 15,
    isFalsePositive: false,
    rollover: false,
    airbags: true,
    incidentData: {
      severity: 'CRITICAL',
      status: 'DISPATCHED',
      coordinates: {
        lat: 37.7749,
        lng: -122.4194,
        address: 'Market St & 8th St Intersection',
        roadName: 'Market Street'
      },
      telemetry: {
        impactForceG: 12.4,
        preCrashSpeedKmh: 74,
        postCrashSpeedKmh: 0,
        deltaV: 74,
        impactVector: { x: 11.8, y: 2.1, z: 1.2 },
        impactAngleDeg: 15,
        rolloverDetected: false,
        airbagsDeployed: true,
        crushSensorFront: true,
        crushSensorLeft: true,
        crushSensorRight: false,
        crushSensorRear: false,
        seatbeltsBuckled: 1,
        occupantsEstimated: 1,
        batteryIsolated: true,
        fireHazardRisk: 'MEDIUM'
      }
    }
  },
  {
    id: 'preset-tbone-intersection',
    title: 'Lateral T-Bone Collision (8.7g)',
    description: 'Direct side-impact intrusion at 48 km/h. Exceeds 6g trigger, side curtain airbags deployed.',
    badge: 'HIGH ALERT',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    gForce: 8.7,
    speedKmh: 48,
    angleDeg: 90,
    isFalsePositive: false,
    rollover: false,
    airbags: true,
    incidentData: {
      severity: 'HIGH',
      status: 'DISPATCHED',
      coordinates: {
        lat: 37.7812,
        lng: -122.4110,
        address: '5th & Folsom St Intersection',
        roadName: 'Folsom Street'
      },
      telemetry: {
        impactForceG: 8.7,
        preCrashSpeedKmh: 48,
        postCrashSpeedKmh: 12,
        deltaV: 36,
        impactVector: { x: 1.2, y: 8.5, z: 0.9 },
        impactAngleDeg: 90,
        rolloverDetected: false,
        airbagsDeployed: true,
        crushSensorFront: false,
        crushSensorLeft: true,
        crushSensorRight: false,
        crushSensorRear: false,
        seatbeltsBuckled: 2,
        occupantsEstimated: 2,
        batteryIsolated: true,
        fireHazardRisk: 'LOW'
      }
    }
  },
  {
    id: 'preset-highway-rollover',
    title: 'Highway Rollover & Inversion (9.5g)',
    description: 'Vehicle rolled 180° inverted on highway embankment. Structural roof crush alert.',
    badge: 'CRITICAL ROLLOVER',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    gForce: 9.5,
    speedKmh: 95,
    angleDeg: 180,
    isFalsePositive: false,
    rollover: true,
    airbags: true,
    incidentData: {
      severity: 'CRITICAL',
      status: 'DISPATCHED',
      coordinates: {
        lat: 37.7520,
        lng: -122.4040,
        address: 'US-101 Southbound near Exit 432',
        roadName: 'Highway US-101'
      },
      telemetry: {
        impactForceG: 9.5,
        preCrashSpeedKmh: 95,
        postCrashSpeedKmh: 0,
        deltaV: 95,
        impactVector: { x: 5.1, y: 4.8, z: 6.2 },
        impactAngleDeg: 180,
        rolloverDetected: true,
        airbagsDeployed: true,
        crushSensorFront: true,
        crushSensorLeft: true,
        crushSensorRight: true,
        crushSensorRear: false,
        seatbeltsBuckled: 1,
        occupantsEstimated: 1,
        batteryIsolated: true,
        fireHazardRisk: 'HIGH'
      }
    }
  },
  {
    id: 'preset-false-positive',
    title: 'Pothole / Dropped Phone (2.8g)',
    description: 'Transient 2.8g acceleration spike under 6.0g threshold. Filtered by algorithm, dispatch suppressed.',
    badge: 'FILTERED (FALSE ALARM)',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    gForce: 2.8,
    speedKmh: 35,
    angleDeg: 0,
    isFalsePositive: true,
    rollover: false,
    airbags: false,
    incidentData: {
      severity: 'FILTERED_FALSE_POSITIVE',
      status: 'FILTERED',
      coordinates: {
        lat: 37.7780,
        lng: -122.4150,
        address: 'Mission St near 9th St',
        roadName: 'Mission Street'
      },
      telemetry: {
        impactForceG: 2.8, // Under 6g!
        preCrashSpeedKmh: 35,
        postCrashSpeedKmh: 33,
        deltaV: 2,
        impactVector: { x: 0.5, y: 0.4, z: 2.7 },
        impactAngleDeg: 0,
        rolloverDetected: false,
        airbagsDeployed: false,
        crushSensorFront: false,
        crushSensorLeft: false,
        crushSensorRight: false,
        crushSensorRear: false,
        seatbeltsBuckled: 1,
        occupantsEstimated: 1,
        batteryIsolated: false,
        fireHazardRisk: 'LOW'
      }
    }
  }
];

export const HISTORICAL_INCIDENTS: Incident[] = [
  INITIAL_INCIDENT,
  {
    id: 'INC-2026-8839',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    vehicleId: 'VH-1102-VOLVO',
    vehicleModel: 'Volvo XC90 / Telematics ECU-3',
    vehicleVin: 'YV4BR00K9M1203948',
    vehicleColor: 'Silver Metallic',
    telemetryChipId: 'CHIP-ARM-CORTEX-M4-012',
    coordinates: {
      lat: 37.7650,
      lng: -122.4280,
      address: 'Valencia St & 16th St',
      roadName: 'Valencia Street'
    },
    severity: 'HIGH',
    status: 'RESOLVED',
    goldenHourRemainingSeconds: 0,
    telemetry: {
      impactForceG: 7.9,
      preCrashSpeedKmh: 52,
      postCrashSpeedKmh: 0,
      deltaV: 52,
      impactVector: { x: 7.2, y: 1.5, z: 0.8 },
      impactAngleDeg: 10,
      rolloverDetected: false,
      airbagsDeployed: true,
      crushSensorFront: true,
      crushSensorLeft: false,
      crushSensorRight: false,
      crushSensorRear: false,
      seatbeltsBuckled: 2,
      occupantsEstimated: 2,
      batteryIsolated: true,
      fireHazardRisk: 'LOW'
    },
    patient: {
      ...INITIAL_PATIENT,
      id: 'pat-8192',
      fullName: 'Elena Rostova',
      age: 29,
      bloodType: 'A-Positive',
      allergies: ['Sulfa drugs'],
      chronicConditions: ['None']
    },
    assignedHospital: INITIAL_HOSPITALS[1],
    dispatchActions: [],
    notes: 'Successfully transported to St. Jude ER. Patient stabilized.'
  },
  {
    id: 'INC-2026-8835',
    timestamp: new Date(Date.now() - 3600000 * 7).toISOString(),
    vehicleId: 'VH-9921-FORD',
    vehicleModel: 'Ford F-150 Lightning',
    vehicleVin: '1FTVW1EL9NW019234',
    vehicleColor: 'Atlas Blue',
    telemetryChipId: 'CHIP-ARM-CORTEX-M4-044',
    coordinates: {
      lat: 37.7880,
      lng: -122.3990,
      address: 'Embarcadero & Howard St',
      roadName: 'The Embarcadero'
    },
    severity: 'FILTERED_FALSE_POSITIVE',
    status: 'FILTERED',
    goldenHourRemainingSeconds: 3600,
    telemetry: {
      impactForceG: 3.1,
      preCrashSpeedKmh: 40,
      postCrashSpeedKmh: 38,
      deltaV: 2,
      impactVector: { x: 0.8, y: 0.2, z: 3.0 },
      impactAngleDeg: 0,
      rolloverDetected: false,
      airbagsDeployed: false,
      crushSensorFront: false,
      crushSensorLeft: false,
      crushSensorRight: false,
      crushSensorRear: false,
      seatbeltsBuckled: 1,
      occupantsEstimated: 1,
      batteryIsolated: false,
      fireHazardRisk: 'LOW'
    },
    patient: INITIAL_PATIENT,
    assignedHospital: null,
    dispatchActions: [],
    notes: 'Rough railroad crossing bump detected. Algorithm classified as non-crash transient (3.1g < 6.0g).'
  }
];
