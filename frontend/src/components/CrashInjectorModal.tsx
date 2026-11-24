import React, { useState } from 'react';
import { X, Play, Sliders, Zap, RotateCcw, AlertTriangle } from 'lucide-react';
import { Accident } from '../types/contracts';
import { MOCK_SEED_ACCIDENTS } from '../mock/seedData';
import { accidentService } from '../services/accidentService';

interface CrashInjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (accident: Partial<Accident>) => void;
}

export const CrashInjectorModal: React.FC<CrashInjectorModalProps> = ({
  isOpen,
  onClose,
  onInject,
}) => {
  const [customG, setCustomG] = useState<number>(14.5);
  const [customVehicle, setCustomVehicle] = useState<string>('VH-999');
  const [customSeverity, setCustomSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('CRITICAL');

  if (!isOpen) return null;

  const handleInjectSeed = (seed: Accident) => {
    // Generate new unique ID so it appears as fresh incoming event
    onInject({
      ...seed,
      accident_id: `evt-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('Z', ''),
      acknowledged: false,
      acknowledged_at: null,
      notification_status: 'SENT'
    });
    onClose();
  };

  const handleInjectCustom = () => {
    onInject({
      accident_id: `evt-${Date.now().toString().slice(-4)}`,
      vehicle_id: customVehicle,
      timestamp: new Date().toISOString().replace('Z', ''),
      severity: customSeverity,
      impact_magnitude: customG,
      latitude: 26.8500 + (Math.random() - 0.5) * 0.04,
      longitude: 80.9400 + (Math.random() - 0.5) * 0.04,
      notification_status: 'SENT',
      acknowledged: false,
      acknowledged_at: null,
      patient_id: 'PT-001',
      detection_reason: `Custom test injection: ${customG.toFixed(1)}g collision. Exceeds 6.0g trigger gate.`
    });
    onClose();
  };

  const handleResetStore = () => {
    accidentService.resetMockStore();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1329] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Crash Notification Simulator & Test Injector
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Inject test accident alerts (evt-seed-001 to 005) to test hospital notification & 5s polling
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Section 1: Pre-configured Seed Scenarios */}
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Contract Seed Scenarios (evt-seed-001 to 005)
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {MOCK_SEED_ACCIDENTS.map((seed) => (
                <div
                  key={seed.accident_id}
                  onClick={() => handleInjectSeed(seed)}
                  className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-850 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors font-mono text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white">{seed.accident_id}</strong>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                        seed.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                        seed.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                        seed.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      }`}>
                        {seed.severity}
                      </span>
                      <span className="text-slate-400">&bull; {seed.impact_magnitude}g</span>
                      <span className="text-slate-500 text-[10px]">
                        {seed.selected_hospital?.route ? `${seed.selected_hospital.route.length} route waypoints` : 'route: null'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                      {seed.detection_reason}
                    </p>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-slate-800 text-cyan-300 font-bold hover:bg-cyan-600 hover:text-white transition-colors shrink-0 ml-2">
                    Inject &rarr;
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Custom Injection */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
            <h3 className="font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-cyan-400" />
              Custom Impact Parameters
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Vehicle Identifier:</label>
                <input
                  type="text"
                  value={customVehicle}
                  onChange={(e) => setCustomVehicle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Severity Level:</label>
                <select
                  value={customSeverity}
                  onChange={(e) => setCustomSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                >
                  <option value="CRITICAL">CRITICAL (Very Critical)</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-400">G-Force Impact:</span>
                <span className="text-white font-bold">{customG.toFixed(1)}g (Gate: ≥6.0g)</span>
              </div>
              <input
                type="range"
                min="6.0"
                max="22.0"
                step="0.2"
                value={customG}
                onChange={(e) => setCustomG(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded cursor-pointer accent-red-500"
              />
            </div>

            <button
              onClick={handleInjectCustom}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <Play className="w-4 h-4" />
              <span>Fire Custom Crash Notification</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={handleResetStore}
            className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Store to Original Seed</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
