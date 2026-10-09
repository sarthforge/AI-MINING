import React from 'react';
import { 
  Radar, 
  AlertOctagon, 
  Layers, 
  Target, 
  TrendingUp, 
  ArrowUpRight
} from 'lucide-react';


interface KPICardsProps {
  onOpenAlerts: () => void;
  onNavigateToTracking: () => void;
  onNavigateToDetection: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  onOpenAlerts,
  onNavigateToTracking,
  onNavigateToDetection
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: 12 Monitored Sites */}
      <div 
        onClick={onNavigateToDetection}
        className="bg-[#0b1120] border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-cyan-950/20 cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
            Surveillance Grid
          </span>
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-400">
            <Radar className="w-4 h-4 animate-spin-slow" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">12</span>
          <span className="text-xs font-medium text-cyan-400">Monitored Sites</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 mt-2">
          <span className="text-slate-500">6 Global Mineral Basins</span>
          <span className="inline-flex items-center text-emerald-400 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            100% Uplink
          </span>
        </div>
      </div>

      {/* KPI 2: 3 Simulated High-Priority Alerts */}
      <div 
        onClick={onOpenAlerts}
        className="bg-[#0b1120] border border-rose-900/40 hover:border-rose-600/60 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-rose-950/30 cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/15 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-medium text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            Urgent Triage
          </span>
          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-700/60 text-rose-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">3</span>
          <span className="text-xs font-semibold text-rose-400">Simulated High-Priority Alerts</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 mt-2">
          <span className="text-rose-400/90 font-medium truncate">Suspected unauthorized mining</span>
          <span className="text-slate-400 font-mono text-[11px] group-hover:text-rose-300 flex items-center">
            Review <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </span>
        </div>
      </div>

      {/* KPI 3: 2.4 Hectares New Excavation */}
      <div 
        onClick={onNavigateToTracking}
        className="bg-[#0b1120] border border-amber-900/40 hover:border-amber-600/60 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-amber-950/30 cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-medium text-amber-400 uppercase tracking-wider">
            Disturbed Ground Delta
          </span>
          <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-700/60 text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">2.4</span>
          <span className="text-xs font-bold text-amber-400">Hectares</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 mt-2">
          <span className="text-slate-400">Simulated New Excavation</span>
          <span className="inline-flex items-center text-amber-400 font-medium">
            <TrendingUp className="w-3 h-3 mr-1" />
            +24.8% (30d)
          </span>
        </div>
      </div>

      {/* KPI 4: 94.2% Demo Confidence */}
      <div 
        onClick={onNavigateToDetection}
        className="bg-[#0b1120] border border-emerald-900/40 hover:border-emerald-600/60 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-emerald-950/30 cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all pointer-events-none"></div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">
            Neural Ensemble
          </span>
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-700/60 text-emerald-400">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-extrabold text-white tracking-tight font-mono">94.2%</span>
          <span className="text-xs font-semibold text-emerald-400">Demo Confidence</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 mt-2">
          <span className="text-slate-500">Optical + SAR Cross-Validation</span>
          <span className="text-emerald-400 font-mono text-[11px] font-semibold">
            HIGH ACCURACY
          </span>
        </div>
      </div>
    </div>
  );
};
