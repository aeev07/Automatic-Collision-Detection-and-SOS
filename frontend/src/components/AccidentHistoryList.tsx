import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Clock, 
  CheckCheck, 
  Car, 
  Hospital as HospitalIcon, 
  Zap
} from 'lucide-react';
import { AccidentDetail } from '../types/contracts';
import { formatUtcTime, formatRelativeTime } from '../utils/date';

interface AccidentHistoryListProps {
  accidents: AccidentDetail[];
  selectedId: string | undefined;
  onSelectAccident: (accident: AccidentDetail) => void;
  onAcknowledge: (id: string) => void;
}

type FilterTab = 'ALL' | 'UNACKNOWLEDGED' | 'CRITICAL_HIGH' | 'ACKNOWLEDGED';

export const AccidentHistoryList: React.FC<AccidentHistoryListProps> = ({
  accidents,
  selectedId,
  onSelectAccident,
  onAcknowledge,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<FilterTab>('ALL');

  // Filter calculations
  const unackCount = useMemo(() => accidents.filter(a => !a.acknowledged).length, [accidents]);
  const criticalHighCount = useMemo(() => accidents.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length, [accidents]);

  const filteredAccidents = useMemo(() => {
    return accidents.filter(acc => {
      // Tab filter
      if (filterTab === 'UNACKNOWLEDGED' && acc.acknowledged) return false;
      if (filterTab === 'ACKNOWLEDGED' && !acc.acknowledged) return false;
      if (filterTab === 'CRITICAL_HIGH' && acc.severity !== 'CRITICAL' && acc.severity !== 'HIGH') return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        acc.accident_id.toLowerCase().includes(q) ||
        acc.vehicle_id.toLowerCase().includes(q) ||
        acc.patient_id.toLowerCase().includes(q) ||
        (acc.patient?.name && acc.patient.name.toLowerCase().includes(q)) ||
        (acc.selected_hospital?.name && acc.selected_hospital.name.toLowerCase().includes(q))
      );
    });
  }, [accidents, filterTab, searchQuery]);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090e1a]/90 backdrop-blur-md p-4 flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Accident Log & Queue ({accidents.length})
          </h3>
        </div>

        {unackCount > 0 && (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 border border-red-500/40 text-red-300 animate-pulse">
            {unackCount} Awaiting ER Acceptance
          </span>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by accident ID, vehicle, patient, hospital..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-800/60 pb-2 text-[11px] font-mono">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-2.5 py-1 rounded transition-colors ${
            filterTab === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({accidents.length})
        </button>

        <button
          onClick={() => setFilterTab('UNACKNOWLEDGED')}
          className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
            filterTab === 'UNACKNOWLEDGED' ? 'bg-red-950/80 text-red-300 border border-red-500/40 font-bold' : 'text-slate-400 hover:text-red-300'
          }`}
        >
          <span>Pending ({unackCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('CRITICAL_HIGH')}
          className={`px-2.5 py-1 rounded transition-colors ${
            filterTab === 'CRITICAL_HIGH' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          Critical / High ({criticalHighCount})
        </button>

        <button
          onClick={() => setFilterTab('ACKNOWLEDGED')}
          className={`px-2.5 py-1 rounded transition-colors ${
            filterTab === 'ACKNOWLEDGED' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-emerald-300'
          }`}
        >
          Acknowledged
        </button>
      </div>

      {/* List Items (Previous & Active Accidents) */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[580px]">
        {filteredAccidents.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-slate-500">
            No accidents match your filter criteria.
          </div>
        ) : (
          filteredAccidents.map((acc) => {
            const isSelected = acc.accident_id === selectedId;
            const isCritical = acc.severity === 'CRITICAL';
            const isHigh = acc.severity === 'HIGH';
            const isMedium = acc.severity === 'MEDIUM';

            return (
              <div
                key={acc.accident_id}
                onClick={() => onSelectAccident(acc)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-slate-800/95 border-blue-500 shadow-lg glow-cyan scale-[1.01]' 
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Top row: ID, Severity & Relative Time */}
                <div className="flex items-center justify-between gap-2 mb-1.5 font-mono text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{acc.accident_id}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                      isCritical ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                      isHigh ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      isMedium ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}>
                      {acc.severity}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    {formatRelativeTime(acc.timestamp)} ({formatUtcTime(acc.timestamp)} UTC)
                  </span>
                </div>

                {/* Middle row: Vehicle, G-Force & Patient */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Car className="w-3 h-3 text-slate-400" />
                      {acc.vehicle_id}
                    </span>
                    <span className="flex items-center gap-0.5 font-bold text-amber-400">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {acc.impact_magnitude.toFixed(1)}g
                    </span>
                  </div>

                  {acc.patient && (
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-white font-semibold truncate max-w-[120px]">{acc.patient.name.split(' ')[0]}</span>
                      <span className="px-1 rounded bg-red-950 border border-red-500/40 text-red-400 font-bold text-[10px]">
                        {acc.patient.blood_group}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom row: Hospital & Acknowledgement Status */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[11px] font-mono">
                  <div className="flex items-center gap-1 text-slate-400 truncate max-w-[190px]">
                    <HospitalIcon className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{acc.selected_hospital?.name || 'Local Hospital'}</span>
                  </div>

                  <div>
                    {acc.acknowledged ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                        <CheckCheck className="w-3 h-3" />
                        ACKNOWLEDGED
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcknowledge(acc.accident_id);
                        }}
                        className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
