import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Navigation } from 'lucide-react';

export interface DispatchMission {
  id: string;
  targetName: string;
  coordinates: string;
  timestamp: string;
  etaSeconds: number;
  unitCode: string;
}

interface DispatchToastProps {
  mission: DispatchMission | null;
  onDismiss: () => void;
}

export const DispatchToast: React.FC<DispatchToastProps> = ({ mission, onDismiss }) => {
  const [remainingEta, setRemainingEta] = useState<number>(() => mission?.etaSeconds ?? 480);

  useEffect(() => {
    if (!mission) return;

    const timer = setInterval(() => {
      setRemainingEta((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [mission]);

  if (!mission) return null;

  const minutes = Math.floor(remainingEta / 60);
  const seconds = remainingEta % 60;
  const formattedEta = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom duration-300 font-mono">
      <div className="bg-[#0b1424] border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl shadow-emerald-950/60 backdrop-blur-md space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-white tracking-wider uppercase">
              Automated Enforcement Active
            </span>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mission Details */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Deployed Unit:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-emerald-400 animate-spin-slow" />
              {mission.unitCode} (Autonomous VTOL)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Target AOI:</span>
            <span className="text-slate-200 font-semibold truncate max-w-[220px]">
              {mission.targetName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Coordinates:</span>
            <span className="text-slate-300 text-[11px]">{mission.coordinates}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Intercept ETA:</span>
            <span className="text-amber-400 font-bold">{formattedEta} remaining</span>
          </div>
        </div>

        {/* Dispatch Protocol Confirmation */}
        <div className="p-2 rounded-lg bg-[#070b14] border border-emerald-900/50 flex items-center gap-2 text-[10px] text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Encrypted webhook transmitted to District Collectorate & DGMS Central Patrol Network.</span>
        </div>
      </div>
    </div>
  );
};
