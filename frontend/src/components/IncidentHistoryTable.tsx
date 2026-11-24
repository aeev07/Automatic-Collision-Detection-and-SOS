import React from 'react';
import { X, Layers, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Incident } from '../types';

interface IncidentHistoryTableProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  currentIncidentId: string;
}

export const IncidentHistoryTable: React.FC<IncidentHistoryTableProps> = ({
  isOpen,
  onClose,
  incidents,
  onSelectIncident,
  currentIncidentId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1329] border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Incident & Telemetry Event Archive
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Historical records of detected crashes, false positives, and hospital dispatch receipts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Body */}
        <div className="p-6 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">INCIDENT ID / TIME</th>
                <th className="pb-3 font-semibold">VEHICLE & CHIP</th>
                <th className="pb-3 font-semibold">IMPACT G-SPIKE</th>
                <th className="pb-3 font-semibold">SEVERITY / STATUS</th>
                <th className="pb-3 font-semibold">ASSIGNED ER</th>
                <th className="pb-3 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {incidents.map((inc) => {
                const isSelected = inc.id === currentIncidentId;
                const isFalseAlarm = inc.severity === 'FILTERED_FALSE_POSITIVE';
                return (
                  <tr 
                    key={inc.id}
                    className={`hover:bg-slate-850/50 transition-colors ${
                      isSelected ? 'bg-blue-950/30' : ''
                    }`}
                  >
                    <td className="py-3">
                      <span className="font-bold text-white block">{inc.id}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(inc.timestamp).toLocaleTimeString()}
                      </span>
                    </td>

                    <td className="py-3">
                      <span className="text-slate-300 block">{inc.vehicleModel}</span>
                      <span className="text-[10px] text-slate-500">{inc.telemetryChipId}</span>
                    </td>

                    <td className="py-3">
                      <span className={`font-bold ${
                        inc.telemetry.impactForceG >= 6.0 ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {inc.telemetry.impactForceG.toFixed(1)}g
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {inc.telemetry.preCrashSpeedKmh} km/h
                      </span>
                    </td>

                    <td className="py-3">
                      {isFalseAlarm ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                          <ShieldCheck className="w-3 h-3" />
                          FILTERED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-red-950/40 text-red-400 border border-red-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          {inc.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3">
                      <span className="text-slate-300">
                        {inc.assignedHospital ? inc.assignedHospital.name.split(' ')[0] : 'None (Suppressed)'}
                      </span>
                    </td>

                    <td className="py-3 text-right">
                      {isSelected ? (
                        <span className="text-[10px] text-blue-400 font-bold px-2 py-1 bg-blue-950/50 rounded border border-blue-500/30">
                          ACTIVE
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectIncident(inc);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-mono transition-colors inline-flex items-center gap-1"
                        >
                          <span>Load</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
