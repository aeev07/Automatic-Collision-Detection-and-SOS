import React from 'react';
import { 
  Heart, 
  Droplet, 
  AlertCircle, 
  PhoneCall, 
  Award, 
  FileText, 
  UserCheck, 
  Activity
} from 'lucide-react';
import { PatientProfile } from '../types';

interface PatientMedicalCardProps {
  patient: PatientProfile;
}

export const PatientMedicalCard: React.FC<PatientMedicalCardProps> = ({ patient }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#090e1a]/90 backdrop-blur-md p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400">
            <Heart className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Patient Medical ID & Critical Profile
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Direct EMR Dispatch to Emergency Room Intake
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
          <UserCheck className="w-3 h-3" />
          HL7 / FHIR LINKED
        </span>
      </div>

      {/* Patient Name & Critical Blood Type Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
        <div>
          <span className="text-[10px] font-mono text-slate-400 block uppercase">
            Identified Driver Profile
          </span>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <span>{patient.fullName}</span>
            <span className="text-xs font-normal text-slate-400">
              ({patient.age}y &bull; {patient.gender})
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">
            ID: {patient.id} &bull; Ins: {patient.insuranceId}
          </span>
        </div>

        {/* BLOOD TYPE BADGE */}
        <div className="flex items-center gap-2.5 bg-red-950/60 border border-red-500/50 px-3.5 py-2 rounded-lg glow-red">
          <Droplet className="w-5 h-5 text-red-500 fill-red-500 shrink-0" />
          <div>
            <span className="text-[9px] font-mono uppercase text-red-300 font-bold block leading-none">
              BLOOD GROUP
            </span>
            <span className="text-lg font-black text-red-400 font-mono leading-tight">
              {patient.bloodType}
            </span>
          </div>
        </div>
      </div>

      {/* Allergies & Chronic Conditions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Allergies */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1 mb-1.5 uppercase">
            <AlertCircle className="w-3.5 h-3.5" />
            CRITICAL ALLERGIES
          </span>
          <div className="flex flex-wrap gap-1.5">
            {patient.allergies.map((allergy, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 font-mono text-[11px]"
              >
                {allergy}
              </span>
            ))}
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1 mb-1.5 uppercase">
            <FileText className="w-3.5 h-3.5" />
            CHRONIC MEDICAL CONDITIONS
          </span>
          <div className="flex flex-wrap gap-1.5">
            {patient.chronicConditions.map((condition, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-[11px]"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Estimated Vitals Stream */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 uppercase">
            <Activity className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            ESTIMATED TELEMETRY VITALS AT IMPACT
          </span>
          <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.2 rounded bg-amber-950/30 border border-amber-500/20">
            WEARABLE / IN-SEAT SENSORS
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 font-mono text-center">
          <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">HEART RATE</span>
            <span className="text-base font-bold text-red-400">
              {patient.estimatedVitals.heartRateBpm} <span className="text-[10px] font-normal text-slate-500">BPM</span>
            </span>
          </div>

          <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">SpO2 SATURATION</span>
            <span className="text-base font-bold text-cyan-400">
              {patient.estimatedVitals.spO2Percent}%
            </span>
          </div>

          <div className="bg-slate-950 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">CONSCIOUSNESS</span>
            <span className={`text-xs font-bold ${
              patient.estimatedVitals.consciousnessStatus === 'UNRESPONSIVE' 
                ? 'text-red-400' 
                : 'text-emerald-400'
            }`}>
              {patient.estimatedVitals.consciousnessStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Contact & Organ Donor Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/60 text-xs">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Emergency Contact:</span>
          <span className="font-semibold text-white">
            {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
          </span>
          <span className="font-mono text-slate-400 text-[11px]">
            {patient.emergencyContact.phone}
          </span>
        </div>

        {patient.organDonor && (
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded">
            <Award className="w-3 h-3" />
            <span>ORGAN DONOR REGISTERED</span>
          </div>
        )}
      </div>
    </div>
  );
};
