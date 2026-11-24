import React from 'react';
import { 
  Activity, 
  CheckCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  FileText, 
  UserCheck, 
  PhoneCall, 
  Stethoscope 
} from 'lucide-react';
import { AccidentDetail } from '../types/contracts';
import { formatUtcDateTime, formatRelativeTime } from '../utils/date';

interface AccidentDetailCardProps {
  accident: AccidentDetail | null;
  onAcknowledge: (id: string) => void;
}

export const AccidentDetailCard: React.FC<AccidentDetailCardProps> = ({
  accident,
  onAcknowledge,
}) => {
  if (!accident) return null;

  const isCritical = accident.severity === 'CRITICAL';
  const isHigh = accident.severity === 'HIGH';
  const isMedium = accident.severity === 'MEDIUM';

  const severityBadgeClass = isCritical 
    ? 'bg-red-500/15 text-red-400 border-red-500/40 glow-red'
    : isHigh 
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 glow-amber'
      : isMedium
        ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40'
        : 'bg-blue-500/15 text-blue-400 border-blue-500/40';

  const gPercent = Math.min(100, (accident.impact_magnitude / 20) * 100);
  const patient = accident.patient;

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl p-5 shadow-2xl shadow-black/30 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Telemetry Log & Incident Triage
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${severityBadgeClass}`}>
                {accident.severity}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Accident ID: <strong className="text-cyan-300">{accident.accident_id}</strong> &bull; Vehicle: <strong className="text-white">{accident.vehicle_id}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatUtcDateTime(accident.timestamp)} UTC ({formatRelativeTime(accident.timestamp)})</span>
        </div>
      </div>

      {/* Impact Magnitude Gauge (≥6.0g Threshold Gate) */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-baseline justify-between mb-2 font-mono">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            PEAK ACCELEROMETER SPIKE (MAGNITUDE)
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${
              accident.impact_magnitude >= 12 ? 'text-red-400' : accident.impact_magnitude >= 6 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {accident.impact_magnitude.toFixed(1)}g
            </span>
            <span className="text-xs text-slate-500">/ 20.0g max</span>
          </div>
        </div>

        {/* Progress Track */}
        <div className="relative w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          {/* 6.0g Gate Marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 shadow-[0_0_8px_#f59e0b]"
            style={{ left: '30%' }}
            title="6.0g Impact Threshold Gate"
          />
          <div 
            className={`h-full transition-all duration-700 rounded-full ${
              accident.impact_magnitude >= 12 
                ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600' 
                : 'bg-gradient-to-r from-emerald-500 to-amber-500'
            }`}
            style={{ width: `${gPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1.5">
          <span>0g (Rest)</span>
          <span className="text-amber-400 font-bold flex items-center gap-1">
            ▲ 6.0g Collision Gate
          </span>
          <span>20.0g (Extreme)</span>
        </div>
      </div>

      {/* Patient Triage Summary Pill with Identity Disclaimer */}
      {patient && (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 font-mono text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold text-[10px] flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                {patient.patient_id}
              </span>
              <strong className="text-white text-sm">Owner: {patient.name}</strong>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30 text-amber-300 font-bold">
              Identity Pending Paramedic Confirmation
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div>
              <span className="text-amber-400 font-bold">Allergies: </span>
              <span>{patient.allergies.length ? patient.allergies.join(', ') : 'None'}</span>
            </div>
            <div>
              <span className="text-cyan-400 font-bold">Conditions: </span>
              <span>{patient.medical_conditions.length ? patient.medical_conditions.join(', ') : 'None'}</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 italic flex items-center gap-1 pt-1 border-t border-slate-800/60">
            <Stethoscope className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>Transfusion protocol: Bedside testing required. Baseline owner profile shown for advisory awareness only.</span>
          </div>

          {patient.emergency_contact && (
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>Next of Kin: <strong className="text-white">{patient.emergency_contact.name}</strong></span>
              <a href={`tel:${patient.emergency_contact.phone}`} className="text-cyan-400 font-bold hover:underline flex items-center gap-1">
                <PhoneCall className="w-3 h-3" />
                {patient.emergency_contact.phone}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Collision Detection Reason */}
      {accident.detection_reason && (
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs font-mono">
          <span className="text-[10px] text-amber-400 font-bold block mb-1 uppercase flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Detection Reason & Telemetry
          </span>
          <p className="text-slate-300 italic leading-relaxed">
            &ldquo;{accident.detection_reason}&rdquo;
          </p>
        </div>
      )}

      {/* Status Indicators & Acknowledge Action */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/80 text-xs font-mono">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Dispatch Status</span>
            <div className="font-bold mt-0.5">
              {accident.notification_status === 'SENT' ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SENT TO ER
                </span>
              ) : accident.notification_status === 'PENDING' ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> PENDING DISPATCH
                </span>
              ) : (
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> FAILED
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
            SMS/Voice
          </span>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Hospital Intake Status</span>
            <div className="font-bold mt-0.5">
              {accident.acknowledged ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> ACKNOWLEDGED
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> AWAITING ER ACCEPTANCE
                </span>
              )}
            </div>
          </div>

          {!accident.acknowledged && (
            <button
              onClick={() => onAcknowledge(accident.accident_id)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Acknowledge</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
