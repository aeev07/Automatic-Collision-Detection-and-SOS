import React from 'react';
import { 
  Gauge, 
  Compass, 
  RotateCw, 
  AlertOctagon, 
  ZapOff, 
  Flame, 
  Car,
  Activity
} from 'lucide-react';
import { IncidentTelemetry } from '../types';

interface ImpactPhysicsCardProps {
  telemetry: IncidentTelemetry;
  vehicleModel: string;
  vehicleVin: string;
}

export const ImpactPhysicsCard: React.FC<ImpactPhysicsCardProps> = ({
  telemetry,
  vehicleModel,
  vehicleVin
}) => {
  const gForce = telemetry.impactForceG;
  const isOverThreshold = gForce >= 6.0;
  
  // Normalized percentage for 20g max meter
  const gPercent = Math.min(100, (gForce / 20) * 100);
  const thresholdPercent = (6.0 / 20) * 100; // 30%

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090e1a]/90 backdrop-blur-md p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Telemetry & Impact Dynamics
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {vehicleModel} &bull; VIN: {vehicleVin.slice(0, 10)}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
            isOverThreshold 
              ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' 
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            {isOverThreshold ? 'THRESHOLD EXCEEDED (≥6.0g)' : 'BELOW 6.0g (FILTERED)'}
          </span>
        </div>
      </div>

      {/* Main G-Force Gauge Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            PEAK IMPACT ACCELERATION (G-SPIKE)
          </span>
          <div className="flex items-baseline gap-1 font-mono">
            <span className={`text-2xl font-black ${
              gForce >= 10 ? 'text-red-400' : gForce >= 6 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {gForce.toFixed(1)}g
            </span>
            <span className="text-xs text-slate-500">/ 20.0g max</span>
          </div>
        </div>

        {/* Gauge track */}
        <div className="relative w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          {/* 6.0g Trigger marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 shadow-[0_0_8px_#f59e0b]"
            style={{ left: `${thresholdPercent}%` }}
            title="6.0g Collision Trigger Point"
          />

          {/* Active value fill */}
          <div 
            className={`h-full transition-all duration-700 rounded-full ${
              gForce >= 10 
                ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-red-600' 
                : gForce >= 6 
                  ? 'bg-gradient-to-r from-emerald-500 to-amber-500' 
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${gPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1">
          <span>0g (Normal Driving)</span>
          <span className="text-amber-400 font-bold flex items-center gap-0.5">
            ▲ 6.0g Collision Gate
          </span>
          <span>20g (Severe)</span>
        </div>
      </div>

      {/* 3-Axis & Direction Radar Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 3-Axis Accelerometer readout */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] font-mono text-slate-400 block mb-1">
            TRI-AXIS VECTORS
          </span>
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">X-Axis (Longitudinal):</span>
              <span className="font-bold text-cyan-300">{telemetry.impactVector.x.toFixed(1)}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Y-Axis (Lateral):</span>
              <span className="font-bold text-amber-300">{telemetry.impactVector.y.toFixed(1)}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Z-Axis (Vertical):</span>
              <span className="font-bold text-purple-300">{telemetry.impactVector.z.toFixed(1)}g</span>
            </div>
          </div>
        </div>

        {/* Impact Angle Compass */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono text-slate-400 block mb-1">
            IMPACT VECTOR ANGLE
          </span>
          <div className="relative w-12 h-12 flex items-center justify-center my-1">
            <div className="absolute inset-0 rounded-full border border-slate-700 border-dashed" />
            <Compass 
              className="w-8 h-8 text-red-400 transition-transform duration-500"
              style={{ transform: `rotate(${telemetry.impactAngleDeg}deg)` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-white">
            {telemetry.impactAngleDeg}° &bull; {telemetry.impactAngleDeg === 0 ? 'Head-On' : telemetry.impactAngleDeg === 90 ? 'Right Side (T-Bone)' : telemetry.impactAngleDeg === 180 ? 'Rear-End' : 'Oblique Angle'}
          </span>
        </div>

        {/* Speed Delta & Pre-crash */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-400 block mb-1">
            VELOCITY DELTA (ΔV)
          </span>
          <div className="font-mono">
            <div className="text-xl font-black text-white">
              {telemetry.deltaV} <span className="text-xs font-normal text-slate-400">km/h</span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              {telemetry.preCrashSpeedKmh} km/h → {telemetry.postCrashSpeedKmh} km/h in &lt;120ms
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-300">
            <Car className="w-3.5 h-3.5 text-slate-400" />
            <span>{telemetry.occupantsEstimated} Occupant(s) detected</span>
          </div>
        </div>
      </div>

      {/* Safety Subsystem Status Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        {/* Airbag */}
        <div className={`p-2 rounded border flex items-center gap-2 ${
          telemetry.airbagsDeployed 
            ? 'bg-red-950/40 border-red-500/40 text-red-300' 
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <AlertOctagon className="w-4 h-4 shrink-0 text-amber-400" />
          <div className="truncate">
            <div className="text-[10px] text-slate-400">AIRBAGS</div>
            <div className="font-bold">{telemetry.airbagsDeployed ? 'DEPLOYED' : 'INACTIVE'}</div>
          </div>
        </div>

        {/* Rollover */}
        <div className={`p-2 rounded border flex items-center gap-2 ${
          telemetry.rolloverDetected 
            ? 'bg-purple-950/40 border-purple-500/40 text-purple-300' 
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <RotateCw className="w-4 h-4 shrink-0 text-cyan-400" />
          <div className="truncate">
            <div className="text-[10px] text-slate-400">ROLLOVER</div>
            <div className="font-bold">{telemetry.rolloverDetected ? 'INVERTED' : 'UPRIGHT'}</div>
          </div>
        </div>

        {/* Battery Isolation */}
        <div className={`p-2 rounded border flex items-center gap-2 ${
          telemetry.batteryIsolated 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
            : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <ZapOff className="w-4 h-4 shrink-0 text-emerald-400" />
          <div className="truncate">
            <div className="text-[10px] text-slate-400">PYRO-FUSE</div>
            <div className="font-bold">{telemetry.batteryIsolated ? 'HV ISOLATED' : 'LIVE'}</div>
          </div>
        </div>

        {/* Fire Hazard */}
        <div className={`p-2 rounded border flex items-center gap-2 ${
          telemetry.fireHazardRisk === 'HIGH' 
            ? 'bg-red-950/50 border-red-500/50 text-red-400' 
            : telemetry.fireHazardRisk === 'MEDIUM'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400'
        }`}>
          <Flame className="w-4 h-4 shrink-0 text-orange-400" />
          <div className="truncate">
            <div className="text-[10px] text-slate-400">FIRE RISK</div>
            <div className="font-bold">{telemetry.fireHazardRisk}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
