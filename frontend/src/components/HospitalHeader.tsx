import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Radio, 
  SlidersHorizontal,
  KeyRound
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface HospitalHeaderProps {
  unacknowledgedCount: number;
  isMockMode: boolean;
  onToggleMockMode: () => void;
  secondsUntilNextPoll: number;
  onRefreshNow: () => void;
  isLoading: boolean;
  onOpenInjector: () => void;
}

export const HospitalHeader: React.FC<HospitalHeaderProps> = ({
  unacknowledgedCount,
  isMockMode,
  onToggleMockMode,
  secondsUntilNextPoll,
  onRefreshNow,
  isLoading,
  onOpenInjector,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.getMuted());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#070b14]/95 backdrop-blur-md px-4 py-3">
      <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Emergency Status */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className={`relative p-2.5 rounded-xl border ${
              unacknowledgedCount > 0 
                ? 'bg-red-950/60 border-red-500/60 text-red-400' 
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                  TRAUMA EOC CONSOLE
                </span>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  EMERGENCY INTAKE DISPATCH
                </span>
              </div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Hospital Emergency Intake & Crash Notification System
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Live Polling (5s) & Connection State */}
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">POLLING:</span>
            <span className="font-bold text-cyan-400">EVERY 5s</span>
            <span className="text-slate-500">({secondsUntilNextPoll}s)</span>
          </div>

          <div className="h-3 w-px bg-slate-700" />

          {/* Quick manual refresh button */}
          <button
            onClick={onRefreshNow}
            disabled={isLoading}
            title="Poll now"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <div className="h-3 w-px bg-slate-700" />

          {/* Source indicator */}
          <button
            onClick={onToggleMockMode}
            title="Click to toggle between Mock Store and Real Backend (:8000)"
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
              isMockMode 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isMockMode ? 'MOCK DATA (ACTIVE)' : 'LIVE BACKEND (:8000)'}
          </button>

          <div className="h-3 w-px bg-slate-700 hidden lg:block" />

          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400" title="Sent as header X-API-Key: dev-hospital-key">
            <KeyRound className="w-3 h-3 text-amber-400" />
            <span>X-API-Key</span>
          </div>

          <div className="h-3 w-px bg-slate-700 hidden sm:block" />

          <span className="text-slate-400 hidden sm:inline">{utcTime}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Audio toggle button */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Emergency Siren' : 'Mute Emergency Siren'}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              isMuted 
                ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200' 
                : 'border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/50'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-red-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Audio On'}</span>
          </button>

          {/* Simulator Trigger */}
          <button
            onClick={onOpenInjector}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold font-mono shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Test Crash Injector</span>
          </button>
        </div>
      </div>
    </header>
  );
};
