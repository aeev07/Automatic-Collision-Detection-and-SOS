import React from 'react';
import { 
  Heart, 
  Droplet, 
  AlertCircle, 
  PhoneCall, 
  UserCheck, 
  FileText
} from 'lucide-react';
import { Patient } from '../types/contracts';

interface PatientTraumaCardProps {
  patient: Patient | null | undefined;
}

export const PatientTraumaCard: React.FC<PatientTraumaCardProps> = ({ patient }) => {
  if (!patient) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#090e1a]/90 backdrop-blur-md p-4 text-xs font-mono text-slate-400">
        Loading patient medical profile...
      </div>
    );
  }

  const isUniversalDonor = patient.blood_group === 'O-' || patient.blood_group.includes('O-');

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
              Patient Medical & Trauma Record
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Direct EMR Dispatch to Emergency Room Intake
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
          <UserCheck className="w-3 h-3" />
          PATIENT ID: {patient.patient_id}
        </span>
      </div>

      {/* Patient Name & Critical Blood Group */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
        <div>
          <span className="text-[10px] font-mono text-slate-400 block uppercase">
            Identified Crash Victim
          </span>
          <div className="text-base font-bold text-white">
            {patient.name}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Linked to vehicle telemetry via consent profile
          </span>
        </div>

        {/* BLOOD GROUP BADGE */}
        <div className="flex items-center gap-2.5 bg-red-950/60 border border-red-500/50 px-3.5 py-2 rounded-lg glow-red">
          <Droplet className="w-5 h-5 text-red-500 fill-red-500 shrink-0" />
          <div>
            <span className="text-[9px] font-mono uppercase text-red-300 font-bold block leading-none">
              BLOOD GROUP
            </span>
            <span className="text-xl font-black text-red-400 font-mono leading-tight">
              {patient.blood_group}
            </span>
            {isUniversalDonor && (
              <span className="text-[8px] font-mono text-red-300 block uppercase font-bold">
                Universal Donor
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Allergies & Medical Conditions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Allergies */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1 mb-1.5 uppercase">
            <AlertCircle className="w-3.5 h-3.5" />
            CRITICAL DRUG ALLERGIES
          </span>
          {patient.allergies && patient.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {patient.allergies.map((allergy, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/40 text-amber-300 font-mono text-[11px]"
                >
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 font-mono text-[11px]">No known drug allergies (NKDA)</span>
          )}
        </div>

        {/* Chronic Conditions */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1 mb-1.5 uppercase">
            <FileText className="w-3.5 h-3.5" />
            CHRONIC MEDICAL CONDITIONS
          </span>
          {patient.medical_conditions && patient.medical_conditions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {patient.medical_conditions.map((cond, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 font-mono text-[11px]"
                >
                  {cond}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 font-mono text-[11px]">None recorded</span>
          )}
        </div>
      </div>

      {/* Emergency Contact Footer */}
      {patient.emergency_contact && (
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Emergency Next of Kin:</span>
            <strong className="text-white">{patient.emergency_contact.name}</strong>
            <span className="text-cyan-400 font-bold">({patient.emergency_contact.phone})</span>
          </div>

          <a
            href={`tel:${patient.emergency_contact.phone}`}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono transition-colors flex items-center gap-1"
          >
            <PhoneCall className="w-3 h-3 text-cyan-400" />
            <span>Call Next of Kin</span>
          </a>
        </div>
      )}
    </div>
  );
};
