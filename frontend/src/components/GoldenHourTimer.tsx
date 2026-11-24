import React, { useEffect, useState } from 'react';
import { Timer, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { Incident } from '../types';

interface GoldenHourTimerProps {
  incident: Incident;
}

export const GoldenHourTimer: React.FC<GoldenHourTimerProps> = ({ incident }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(incident.goldenHourRemainingSeconds);

  useEffect(() => {
    setSecondsRemaining(incident.goldenHourRemainingSeconds);
  }, [incident.id, incident.goldenHourRemainingSeconds]);

  useEffect(() => {
    if (incident.severity === 'FILTERED_FALSE_POSITIVE' || incident.status === 'RESOLVED') {
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [incident.severity, incident.status]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const elapsedSeconds = 3600 - secondsRemaining;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / 3600) * 100));

  const isFalsePositive = incident.severity === 'FILTERED_FALSE_POSITIVE';
  const isResolved = incident.status === 'RESOLVED';

  if (isFalsePositive) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 relative overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  FALSE POSITIVE SUPPRESSED
                </span>
                <span className="text-xs text-slate-400">Impact: {incident.telemetry.impactForceG}g &lt; 6.0g Threshold</span>
              </div>
              <h2 className="text-sm font-semibold text-white mt-0.5">
                Telemetry Filter Active: Emergency Golden Hour Timer Suspended
              </h2>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs text-slate-400 block">False Alarm Prevention</span>
            <span className="text-emerald-400 font-bold text-sm">Zero Hospital Dispatches Incurred</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 relative overflow-hidden backdrop-blur-sm transition-all ${
      isResolved 
        ? 'border-slate-800 bg-slate-900/60' 
        : 'border-red-500/40 bg-gradient-to-r from-red-950/40 via-[#0c1222] to-amber-950/30 glow-red'
    }`}>
      {/* Background Animated Gradient Pulse */}
      {!isResolved && (
        <div className="absolute inset-0 bg-red-600/5 pointer-events-none animate-pulse" />
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Indicator & Context */}
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border ${
            isResolved 
              ? 'bg-slate-800 border-slate-700 text-slate-400' 
              : 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse-fast'
          }`}>
            <Timer className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-xs font-bold uppercase px-2 py-0.5 rounded border ${
                isResolved 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
              }`}>
                {isResolved ? 'PATIENT STABILIZED' : 'CRITICAL GOLDEN HOUR COUNTDOWN'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                {elapsedMinutes}m elapsed since collision
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-1">
              {isResolved 
                ? 'Incident resolved. Trauma team accepted patient within survival window.' 
                : 'Definitive trauma surgery initiated within 60 minutes prevents 80%+ of hypovolemic fatalities.'}
            </p>
          </div>
        </div>

        {/* Right: The High-Impact Animated Clock */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="text-left md:text-right">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Remaining Window
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-3xl md:text-4xl font-extrabold tracking-tight ${
                isResolved 
                  ? 'text-slate-400' 
                  : secondsRemaining < 600 
                    ? 'text-red-500 animate-bounce' 
                    : secondsRemaining < 1800 
                      ? 'text-amber-400' 
                      : 'text-red-400'
              }`}>
                {formattedTime}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 60:00</span>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden md:block" />

          {/* Time Saved Stat */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-center min-w-[130px]">
            <span className="text-[10px] font-mono text-slate-400 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              DIRECT DISPATCH GAIN
            </span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              +14.5 min saved
            </span>
            <span className="text-[10px] text-slate-500 block leading-tight">vs manual 911 dial</span>
          </div>
        </div>
      </div>

      {/* Progress Bar of the Golden Hour */}
      {!isResolved && (
        <div className="mt-3.5 w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/80">
          <div 
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-1000 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
