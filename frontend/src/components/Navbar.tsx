import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Activity, 
  ShieldAlert, 
  Layers, 
  SlidersHorizontal,
  Clock
} from 'lucide-react';
import { Incident } from '../types';
import { soundEffects } from '../services/soundEffects';

interface NavbarProps {
  currentIncident: Incident;
  onOpenSimulator: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentIncident,
  onOpenSimulator,
  onOpenHistory,
  historyCount
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.getMuted());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC' + (now.getTimezoneOffset() > 0 ? '-' : '+') + Math.abs(now.getTimezoneOffset() / 60));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
    if (!next) soundEffects.playClick();
  };

  const isCritical = currentIncident.severity === 'CRITICAL';
  const isFalseAlarm = currentIncident.severity === 'FILTERED_FALSE_POSITIVE';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md px-4 py-3">
      <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className={`relative p-2.5 rounded-lg border ${
              isFalseAlarm
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : isCritical 
                  ? 'bg-red-950/50 border-red-500/60 text-red-400 animate-pulse' 
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
              <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                isFalseAlarm ? 'bg-emerald-400' : isCritical ? 'bg-red-500 animate-ping' : 'bg-amber-400'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  A-VCDDS v2.4
                </span>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  EMBEDDED TELEMETRY STREAM
                </span>
              </div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Automated Vehicle Collision & Hospital Dispatch System
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Real-time System Pulse / Architecture Status */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>ECU ACCELEROMETER SPIKE FILTER:</span>
            <span className="text-amber-400 font-bold">≥ 6.0g TRIGGER</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{timeStr || 'SYNCING...'}</span>
          </div>
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Audio toggle button */}
          <button
            onClick={toggleSound}
            title={isMuted ? "Enable Siren & Alerts" : "Mute Sound Effects"}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isMuted 
                ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200' 
                : 'border-red-500/40 bg-red-950/30 text-red-300 hover:bg-red-900/40'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-red-400 animate-pulse" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio On'}</span>
          </button>

          {/* Historical Log Button */}
          <button
            onClick={onOpenHistory}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Event Log</span>
            <span className="px-1.5 py-0.2 bg-slate-800 rounded text-[10px] text-cyan-300 font-mono">
              {historyCount}
            </span>
          </button>

          {/* Crash Simulator Trigger */}
          <button
            onClick={onOpenSimulator}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Crash Simulator</span>
          </button>
        </div>
      </div>
    </header>
  );
};
