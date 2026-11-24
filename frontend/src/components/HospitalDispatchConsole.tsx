import React, { useState } from 'react';
import { 
  PhoneCall, 
  MessageSquare, 
  CheckCircle2, 
  ShieldCheck, 
  Send, 
  Volume2, 
  CheckCheck,
  Ambulance,
  Server
} from 'lucide-react';
import { Hospital, Incident } from '../types';
import { soundEffects } from '../services/soundEffects';

interface HospitalDispatchConsoleProps {
  incident: Incident;
  hospital: Hospital | null;
  onDispatchVoice: () => void;
  onDispatchSMS: () => void;
  onAcknowledgeIncident: () => void;
}

export const HospitalDispatchConsole: React.FC<HospitalDispatchConsoleProps> = ({
  incident,
  hospital,
  onDispatchVoice,
  onDispatchSMS,
  onAcknowledgeIncident,
}) => {
  const [activeTab, setActiveTab] = useState<'VOICE' | 'SMS' | 'API'>('VOICE');
  const [isCalling, setIsCalling] = useState<boolean>(false);

  const isFalsePositive = incident.severity === 'FILTERED_FALSE_POSITIVE';
  const isResolved = incident.status === 'RESOLVED';
  const isAcknowledged = incident.status === 'ACKNOWLEDGED';

  const voiceActions = incident.dispatchActions.filter(a => a.channel === 'TWILIO_VOICE');
  const smsActions = incident.dispatchActions.filter(a => a.channel === 'TWILIO_SMS');

  const handleSimulateCall = () => {
    soundEffects.playDispatchBeep();
    setIsCalling(true);
    setTimeout(() => {
      onDispatchVoice();
      setIsCalling(false);
    }, 1800);
  };

  const handleSimulateSMS = () => {
    soundEffects.playDispatchBeep();
    onDispatchSMS();
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090e1a]/90 backdrop-blur-md p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Automated Hospital & EMS Dispatch Console
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Twilio Voice, SMS & FHIR Gateway (Backend Support Mock)
            </p>
          </div>
        </div>

        {/* Duplicate Prevention Status Badge */}
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-cyan-400" />
          IDEMPOTENCY / DEDUP ACTIVE
        </span>
      </div>

      {/* Target Hospital Quick Status Bar */}
      {hospital && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
          <div>
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              Targeted Trauma Center
            </span>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{hospital.name}</span>
              <span className="text-xs px-1.5 py-0.2 rounded bg-red-950 border border-red-500/30 text-red-400 font-mono">
                {hospital.traumaLevel.replace('_', ' ')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              ER Hotline: {hospital.emergencyDepartmentPhone} &bull; ETA: {hospital.etaMinutes} mins
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isResolved ? (
              <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                PATIENT RECEIVED IN ER
              </span>
            ) : isAcknowledged ? (
              <span className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <Ambulance className="w-4 h-4 text-emerald-400 animate-pulse" />
                TRAUMA TEAM MOBILIZED
              </span>
            ) : (
              <button
                onClick={onAcknowledgeIncident}
                disabled={isFalsePositive}
                className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Acknowledge & Dispatch Ambulance</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Channel Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('VOICE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'VOICE' 
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Twilio Voice ({voiceActions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('SMS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'SMS' 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Twilio SMS ({smsActions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('API')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'API' 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>FHIR / Direct API (1)</span>
        </button>
      </div>

      {/* Tab 1: Twilio Voice Call Simulation */}
      {activeTab === 'VOICE' && (
        <div className="space-y-3">
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isCalling ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                <span className="text-xs font-mono font-bold text-white">
                  {isCalling ? 'DIALING EMERGENCY ROOM...' : 'AUTOMATED VOICE BROADCAST ACTIVE'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Call Duration: 0:42 &bull; Status: 200 OK
              </span>
            </div>

            {/* Synthesizer Audio Waveform Visualizer */}
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 mb-3 flex items-center justify-between gap-1 overflow-hidden">
              <div className="flex items-center gap-1">
                <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-400 uppercase">Text-to-Speech Engine</span>
              </div>
              {/* Animated waveform bars */}
              <div className="flex items-end gap-1 h-6">
                {[40, 75, 30, 90, 60, 100, 45, 80, 50, 95, 70, 35, 85, 65, 45].map((h, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-red-500 rounded-full animate-pulse" 
                    style={{ 
                      height: `${h}%`,
                      animationDelay: `${i * 60}ms`
                    }} 
                  />
                ))}
              </div>
            </div>

            {/* Broadcast Transcript */}
            <div className="bg-slate-950/80 p-3 rounded border border-slate-800/80 text-xs font-mono text-slate-300 leading-relaxed">
              <span className="text-[10px] text-amber-400 font-bold block mb-1">
                TRANSCRIPT BROADCAST TO {hospital?.name || 'TRAUMA CENTER'}:
              </span>
              <p className="italic text-slate-300">
                &ldquo;ATTENTION TRAUMA CONTROL. This is an automated emergency crash dispatch from vehicle telemetry chip 
                <strong className="text-cyan-300"> {incident.telemetryChipId}</strong>. A confirmed 
                <strong className="text-red-400"> {incident.telemetry.impactForceG}g collision</strong> occurred at coordinates 
                <strong className="text-amber-300"> {incident.coordinates.lat.toFixed(4)}, {incident.coordinates.lng.toFixed(4)}</strong> ({incident.coordinates.address}). 
                Patient is <strong className="text-white">{incident.patient.fullName}</strong>, 
                Blood Type <strong className="text-red-400">{incident.patient.bloodType}</strong>, 
                Allergies: <strong className="text-amber-400">{incident.patient.allergies.join(', ')}</strong>. 
                Estimated arrival in 6 minutes. Press 1 to acknowledge receipt.&rdquo;
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Next retry: None (Call Accepted by ER Staff)
              </span>
              <button
                onClick={handleSimulateCall}
                disabled={isCalling || isFalsePositive}
                className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{isCalling ? 'Calling...' : 'Re-trigger Voice Alert'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Twilio SMS Stream */}
      {activeTab === 'SMS' && (
        <div className="space-y-2.5">
          {smsActions.map((action) => (
            <div key={action.id} className="bg-slate-900/70 border border-slate-800 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  {action.target}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold">
                  {action.status} &bull; {action.latencyMs}ms
                </span>
              </div>
              <p className="font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
                {action.payloadSummary}
              </p>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1.5">
                <span>Sent at {action.timestamp}</span>
                <span className="text-blue-400">Twilio SID: SM_{action.id}992a</span>
              </div>
            </div>
          ))}

          <div className="pt-1 flex justify-end">
            <button
              onClick={handleSimulateSMS}
              disabled={isFalsePositive}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Supplemental SMS Update</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: HL7 / FHIR Direct API Payload */}
      {activeTab === 'API' && (
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-2 border-b border-slate-800 pb-1">
            <span className="text-cyan-400 font-bold">POST /v1/emergency/admit (HL7 FHIR JSON)</span>
            <span className="text-emerald-400">HTTP 201 Created</span>
          </div>
          <pre className="text-slate-300 leading-tight">
{JSON.stringify({
  resourceType: "EmergencyCrashObservation",
  incidentId: incident.id,
  timestamp: incident.timestamp,
  vehicle: {
    vin: incident.vehicleVin,
    model: incident.vehicleModel,
    telemetryChip: incident.telemetryChipId
  },
  collisionPhysics: {
    peakGForce: incident.telemetry.impactForceG,
    thresholdExceeded: incident.telemetry.impactForceG >= 6.0,
    impactAngle: incident.telemetry.impactAngleDeg,
    airbags: incident.telemetry.airbagsDeployed,
    rollover: incident.telemetry.rolloverDetected
  },
  patient: {
    id: incident.patient.id,
    name: incident.patient.fullName,
    bloodType: incident.patient.bloodType,
    allergies: incident.patient.allergies,
    conditions: incident.patient.chronicConditions
  },
  assignedER: hospital?.name || "Metropolitan Trauma"
}, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
