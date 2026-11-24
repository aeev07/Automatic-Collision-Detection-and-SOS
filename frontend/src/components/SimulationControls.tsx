import React, { useState } from 'react';
import { 
  X, 
  Play, 
  RotateCcw, 
  Sliders, 
  Zap, 
  Activity
} from 'lucide-react';
import { SimulationPreset } from '../types';
import { soundEffects } from '../services/soundEffects';

interface SimulationControlsProps {
  isOpen: boolean;
  onClose: () => void;
  presets: SimulationPreset[];
  activePresetId: string;
  onSelectPreset: (preset: SimulationPreset) => void;
  onCustomInject: (params: {
    gForce: number;
    speedKmh: number;
    angleDeg: number;
    rollover: boolean;
    airbags: boolean;
  }) => void;
  onResetIncident: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isOpen,
  onClose,
  presets,
  activePresetId,
  onSelectPreset,
  onCustomInject,
  onResetIncident,
}) => {
  const [customG, setCustomG] = useState<number>(8.5);
  const [customSpeed, setCustomSpeed] = useState<number>(65);
  const [customAngle, setCustomAngle] = useState<number>(45);
  const [customRollover, setCustomRollover] = useState<boolean>(false);
  const [customAirbags, setCustomAirbags] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: SimulationPreset) => {
    if (preset.isFalsePositive) {
      soundEffects.playFilteredTone();
    } else {
      soundEffects.playCrashAlertSound();
    }
    onSelectPreset(preset);
  };

  const handleApplyCustom = () => {
    if (customG < 6.0) {
      soundEffects.playFilteredTone();
    } else {
      soundEffects.playCrashAlertSound();
    }
    onCustomInject({
      gForce: customG,
      speedKmh: customSpeed,
      angleDeg: customAngle,
      rollover: customRollover,
      airbags: customAirbags,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1329] border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Embedded Sensor & Telemetry Simulator
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Inject synthetic accelerometer spikes, trigger false alarm filters, or test hospital dispatch
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

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Pre-configured Scenarios */}
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1-Click Demonstration Scenarios
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((preset) => {
                const isActive = activePresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isActive 
                        ? 'bg-slate-800/90 border-blue-500 shadow-lg glow-cyan' 
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-white text-sm line-clamp-1">
                        {preset.title}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${preset.badgeColor}`}>
                        {preset.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-2.5 line-clamp-2">
                      {preset.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-800 text-slate-400">
                      <span>Impact: <strong className={preset.gForce >= 6 ? 'text-red-400' : 'text-emerald-400'}>{preset.gForce}g</strong></span>
                      <span>Speed: <strong>{preset.speedKmh} km/h</strong></span>
                      <span>Angle: <strong>{preset.angleDeg}°</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Custom Parameter Calibration Slider */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Custom Telemetry Injection & Calibration
            </h3>

            {/* G-Force Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1">
                <span className="text-slate-300">Peak Accelerometer Spike (G-Force):</span>
                <span className={`text-base font-bold ${customG >= 6.0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {customG.toFixed(1)}g {customG >= 6.0 ? '(Triggers Emergency Flow)' : '(Suppressed by Filter)'}
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="20.0"
                step="0.1"
                value={customG}
                onChange={(e) => setCustomG(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>1.0g (Minor bump)</span>
                <span className="text-amber-400 font-bold">6.0g Hardware Gate</span>
                <span>20.0g (Extreme)</span>
              </div>
            </div>

            {/* Speed & Angle Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-slate-300">Impact Velocity:</span>
                  <span className="font-bold text-white">{customSpeed} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="160"
                  step="5"
                  value={customSpeed}
                  onChange={(e) => setCustomSpeed(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-slate-300">Collision Angle:</span>
                  <span className="font-bold text-white">{customAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={customAngle}
                  onChange={(e) => setCustomAngle(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={customAirbags}
                  onChange={(e) => setCustomAirbags(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-red-500 focus:ring-0"
                />
                <span>Airbags Deployed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={customRollover}
                  onChange={(e) => setCustomRollover(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-0"
                />
                <span>Vehicle Inverted (Rollover)</span>
              </label>
            </div>

            <button
              onClick={handleApplyCustom}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              <Play className="w-4 h-4" />
              <span>Inject Custom Telemetry Spike</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={onResetIncident}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline Demo Incident</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
