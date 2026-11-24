import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Hospital as HospitalIcon, 
  ShieldCheck,
  Ambulance
} from 'lucide-react';
import { Hospital, Incident } from '../types';

interface IncidentMapProps {
  incident: Incident;
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  onSelectHospital: (h: Hospital) => void;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({
  incident,
  hospitals,
  selectedHospital,
  onSelectHospital,
}) => {
  const [mapMode, setMapMode] = useState<'RADAR' | 'STREET'>('RADAR');
  const [ambulancePos, setAmbulancePos] = useState<number>(30); // 0% to 100% on route

  // Animate ambulance moving along route
  useEffect(() => {
    if (incident.severity === 'FILTERED_FALSE_POSITIVE' || incident.status === 'RESOLVED') return;

    const interval = setInterval(() => {
      setAmbulancePos(prev => (prev >= 95 ? 10 : prev + 2.5));
    }, 800);

    return () => clearInterval(interval);
  }, [incident.severity, incident.status]);

  const isFalsePositive = incident.severity === 'FILTERED_FALSE_POSITIVE';
  const coords = incident.coordinates;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090e1a]/90 backdrop-blur-md p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-400">
            <Navigation className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Live GIS Coordinates & Hospital Dispatch Routing
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {coords.address || 'Crash Site Coordinates'} &bull; Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch map visual mode */}
          <div className="flex rounded-lg border border-slate-800 p-0.5 bg-slate-900/80 text-xs font-mono">
            <button
              onClick={() => setMapMode('RADAR')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapMode === 'RADAR' 
                  ? 'bg-blue-600 text-white font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tactical Radar
            </button>
            <button
              onClick={() => setMapMode('STREET')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                mapMode === 'STREET' 
                  ? 'bg-blue-600 text-white font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Coordinates
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative w-full h-[320px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
        {/* Tactical Grid Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />

        {/* Tactical Radar Concentric Circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[120px] h-[120px] rounded-full border border-blue-500/20" />
          <div className="w-[220px] h-[220px] rounded-full border border-blue-500/15" />
          <div className="w-[320px] h-[320px] rounded-full border border-blue-500/10" />
          {/* Radar sweeping scanline */}
          <div className="absolute w-[280px] h-[280px] rounded-full radar-sweep animate-radar pointer-events-none" />
        </div>

        {/* Central Crash Marker */}
        <div className="absolute z-20 flex flex-col items-center transform -translate-y-2">
          {isFalsePositive ? (
            <div className="flex flex-col items-center">
              <div className="p-2 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 shadow-[0_0_15px_#22c55e]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="mt-1 px-1.5 py-0.5 rounded bg-slate-900 border border-emerald-500/40 text-[10px] font-mono text-emerald-400 font-bold shadow">
                Spike Filtered (2.8g)
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative">
                {/* Shockwave Rings */}
                <div className="absolute -inset-3 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
                <div className="relative p-2.5 rounded-full bg-red-600 text-white shadow-[0_0_20px_#ef4444] border-2 border-white">
                  <MapPin className="w-5 h-5 fill-white" />
                </div>
              </div>
              <div className="mt-1.5 px-2 py-0.5 rounded bg-red-950/90 border border-red-500/60 text-[10px] font-mono text-red-300 font-bold shadow-lg flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                CRASH: {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
              </div>
            </div>
          )}
        </div>

        {/* Hospital Markers plotted relative to center */}
        {hospitals.map((hosp, idx) => {
          const isSelected = selectedHospital?.id === hosp.id;
          
          // Layout positions in tactical radar view
          const offsets = [
            { top: '18%', right: '15%' }, // Hosp 1 (NE)
            { bottom: '22%', left: '16%' }, // Hosp 2 (SW)
            { bottom: '15%', right: '28%' }  // Hosp 3 (SE)
          ];
          const pos = offsets[idx % offsets.length];

          return (
            <div
              key={hosp.id}
              onClick={() => onSelectHospital(hosp)}
              style={pos}
              className={`absolute z-20 cursor-pointer transition-all duration-300 group ${
                isSelected ? 'scale-110' : 'opacity-85 hover:opacity-100 hover:scale-105'
              }`}
            >
              <div className={`p-2 rounded-lg border flex items-center gap-1.5 shadow-lg ${
                isSelected 
                  ? 'bg-blue-600/90 border-blue-400 text-white shadow-[0_0_15px_#2563eb]' 
                  : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-500'
              }`}>
                <HospitalIcon className="w-3.5 h-3.5 text-cyan-300" />
                <div className="font-mono text-[10px]">
                  <div className="font-bold flex items-center gap-1">
                    {hosp.name.split(' ')[0]}
                    {isSelected && (
                      <span className="text-[8px] bg-white text-blue-900 font-black px-1 rounded">
                        TARGET
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <span>{hosp.distanceKm}km</span> &bull; 
                    <span className="text-emerald-400 font-bold">{hosp.etaMinutes}m ETA</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Animated Dispatch Route Polyline & Moving Ambulance */}
        {selectedHospital && !isFalsePositive && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {/* Dashed route line */}
            <line
              x1="50%"
              y1="50%"
              x2="78%"
              y2="25%"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              className="animate-pulse"
            />
            {/* Moving Ambulance marker along line */}
            <circle
              cx={`${50 + (78 - 50) * (ambulancePos / 100)}%`}
              cy={`${50 + (25 - 50) * (ambulancePos / 100)}%`}
              r="6"
              fill="#22c55e"
              stroke="#ffffff"
              strokeWidth="2"
              className="shadow-[0_0_10px_#22c55e]"
            />
          </svg>
        )}

        {/* Live Ambulance Movement Overlay Banner */}
        {selectedHospital && !isFalsePositive && (
          <div className="absolute top-2 left-2 z-20 bg-slate-900/90 border border-slate-800 rounded-md px-2.5 py-1.5 text-[11px] font-mono flex items-center gap-2">
            <Ambulance className="w-4 h-4 text-emerald-400 animate-bounce" />
            <div>
              <span className="text-white font-bold">Ambulance Intercept Active</span>
              <span className="text-slate-400 block text-[9px]">
                En route from {selectedHospital.name.split(' ')[0]} &bull; {selectedHospital.etaMinutes} min ETA
              </span>
            </div>
          </div>
        )}

        {/* Corner HUD coordinates */}
        <div className="absolute bottom-2 right-2 z-20 bg-slate-900/90 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-slate-400">
          <span className="text-blue-400 font-bold">GPS FIX: </span>
          <span>{coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}</span>
        </div>
      </div>

      {/* Hospital Selection Cards Drawer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {hospitals.map((hosp) => {
          const isSelected = selectedHospital?.id === hosp.id;
          return (
            <div
              key={hosp.id}
              onClick={() => onSelectHospital(hosp)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-blue-950/40 border-blue-500/60 shadow-lg glow-cyan' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-xs font-bold text-white line-clamp-1">
                  {hosp.name}
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  hosp.traumaLevel === 'LEVEL_1' 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                    : hosp.traumaLevel === 'LEVEL_2'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {hosp.traumaLevel.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono mt-2">
                <span className="text-slate-400">
                  {hosp.distanceKm} km &bull; <strong className="text-emerald-400">{hosp.etaMinutes} mins</strong>
                </span>
                <span className="text-cyan-400 text-[11px]">
                  {hosp.availableIcuBeds} ICU Beds
                </span>
              </div>

              <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center justify-between">
                <span>{hosp.emergencyDepartmentPhone}</span>
                {isSelected && <span className="text-blue-400 font-bold">ACTIVE DISPATCH TARGET</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
