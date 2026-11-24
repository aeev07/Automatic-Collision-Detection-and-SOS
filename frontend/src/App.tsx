import React, { useState } from 'react';
import { HospitalHeader } from './components/HospitalHeader';
import { CriticalAlertBanner } from './components/CriticalAlertBanner';
import { HospitalMap } from './components/HospitalMap';
import { AccidentDetailCard } from './components/AccidentDetailCard';
import { AccidentHistorySection } from './components/AccidentHistorySection';
import { CrashInjectorModal } from './components/CrashInjectorModal';
import { useAccidentPolling } from './hooks/useAccidentPolling';
import { ServerOff } from 'lucide-react';

export const App: React.FC = () => {
  const {
    accidents,
    selectedAccident,
    setSelectedAccident,
    isLoading,
    error,
    secondsUntilNextPoll,
    isMockMode,
    toggleMockMode,
    refreshNow,
    acknowledgeAccident,
    injectSimulation
  } = useAccidentPolling();

  const [isInjectorOpen, setIsInjectorOpen] = useState<boolean>(false);

  // Unacknowledged Critical or High accidents needing immediate hospital attention
  const unacknowledgedCount = accidents.filter(
    a => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'HIGH')
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#091124] via-[#0d1836] to-[#080e1e] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden">
      {/* Dynamic Ambient Background Lights (Mix Color Illuminations) */}
      <div className="fixed top-0 left-[-10%] w-[700px] h-[700px] ambient-light-cyan pointer-events-none -translate-y-1/3 blur-3xl z-0 opacity-80" />
      <div className="fixed top-20 right-[-10%] w-[800px] h-[800px] ambient-light-purple pointer-events-none blur-3xl z-0 opacity-75" />
      <div className="fixed bottom-[-10%] left-1/4 w-[650px] h-[650px] ambient-light-amber pointer-events-none blur-3xl z-0 opacity-50" />
      <div className="fixed inset-0 bg-grid-mesh pointer-events-none opacity-40 z-0" />

      {/* 1. Header Navbar */}
      <div className="relative z-30">
        <HospitalHeader
          unacknowledgedCount={unacknowledgedCount}
          isMockMode={isMockMode}
          onToggleMockMode={toggleMockMode}
          secondsUntilNextPoll={secondsUntilNextPoll}
          onRefreshNow={refreshNow}
          isLoading={isLoading}
          onOpenInjector={() => setIsInjectorOpen(true)}
        />
      </div>

      {/* 2. Backend Connection Diagnostic Warning */}
      {error && !isMockMode && (
        <div className="relative z-20 bg-red-950/80 border-b border-red-500/40 px-4 py-3 text-xs font-mono text-red-200">
          <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <ServerOff className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                Backend Error: <strong>{error}</strong>. Verify FastAPI is running at <strong>http://localhost:8000</strong> with header <strong>X-API-Key: dev-hospital-key</strong>.
              </span>
            </div>
            <button
              onClick={toggleMockMode}
              className="px-3 py-1 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold text-xs transition-colors shrink-0"
            >
              Switch back to Mock Data
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Operational Content Container */}
      <main className="relative z-10 flex-1 max-w-[1800px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Active Emergency Callout Banner (Blood group removed per clinical triage rules) */}
        <CriticalAlertBanner
          activeAccident={selectedAccident}
          unacknowledgedCount={unacknowledgedCount}
          onAcknowledge={acknowledgeAccident}
        />

        {/* Section 1: Active Accident Focus (Spacious 2-Column Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: GIS Map Tracking + Online Radar Tracking HUD */}
          <div className="lg:col-span-7">
            <HospitalMap
              accident={selectedAccident}
            />
          </div>

          {/* Right: Collision Telemetry Log, 6g Gate & Triage */}
          <div className="lg:col-span-5">
            <AccidentDetailCard
              accident={selectedAccident}
              onAcknowledge={acknowledgeAccident}
            />
          </div>
        </div>

        {/* Section 2: Dedicated Previous Accidents & Patient Medical Records Section */}
        <AccidentHistorySection
          accidents={accidents}
          selectedId={selectedAccident?.accident_id}
          onSelectAccident={setSelectedAccident}
          onAcknowledge={acknowledgeAccident}
        />
      </main>

      {/* 4. Crash Injector Simulator Modal */}
      <CrashInjectorModal
        isOpen={isInjectorOpen}
        onClose={() => setIsInjectorOpen(false)}
        onInject={injectSimulation}
      />
    </div>
  );
};

export default App;
