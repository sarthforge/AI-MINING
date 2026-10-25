import React from 'react';
import { 
  Satellite, 
  Download, 
  Bell, 
  Calendar, 
  Sparkles,
  MapPin,
  Scale
} from 'lucide-react';
import type { MiningSite } from '../types';


interface HeaderProps {
  selectedSite: MiningSite;
  onSelectSite: (site: MiningSite) => void;
  allSites: MiningSite[];
  selectedDateRange: string;
  onSelectDateRange: (range: string) => void;
  onOpenAnalysis: () => void;
  onOpenAlerts: () => void;
  unreadAlertCount: number;
  onExportCSV: () => void;
  onOpenComparison?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedSite,
  onSelectSite,
  allSites,
  selectedDateRange,
  onSelectDateRange,
  onOpenAnalysis,
  onOpenAlerts,
  unreadAlertCount,
  onExportCSV,
  onOpenComparison
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3 text-slate-100 shadow-xl shadow-black/40">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Brand & Mission Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-blue-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-950/50">
            <Satellite className="w-6 h-6 text-emerald-400 animate-pulse-subtle" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                TerraWatch <span className="text-emerald-400 font-extrabold">AI</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                SIMULATED / DEMO ENVIRONMENT
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                SENTINEL-2 ORBIT SYNC
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Autonomous Satellite Intelligence for Detecting, Measuring & Tracking Suspected Unauthorized Mining
            </p>
          </div>
        </div>

        {/* Global Controls & Functional Actions */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Site Selector Filter */}
          <div className="flex items-center bg-[#0d1424] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <label htmlFor="site-select" className="sr-only">Select Monitored AOI</label>
            <select
              id="site-select"
              value={selectedSite.id}
              onChange={(e) => {
                const found = allSites.find(s => s.id === e.target.value);
                if (found) onSelectSite(found);
              }}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[190px] font-medium truncate"
            >
              {allSites.map(site => (
                <option key={site.id} value={site.id} className="bg-[#0b1120] text-slate-200">
                  {site.code}: {site.name.split('—')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center bg-[#0d1424] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <label htmlFor="date-range-select" className="sr-only">Date Range Filter</label>
            <select
              id="date-range-select"
              value={selectedDateRange}
              onChange={(e) => onSelectDateRange(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-medium"
            >
              <option value="30d" className="bg-[#0b1120] text-slate-200">Last 30 Days (Sep 2026)</option>
              <option value="90d" className="bg-[#0b1120] text-slate-200">Last 90 Days (Q3 2026)</option>
              <option value="180d" className="bg-[#0b1120] text-slate-200">Last 6 Months</option>
              <option value="baseline" className="bg-[#0b1120] text-slate-200">Baseline Comparison (Nov 25 – Sep 26)</option>
            </select>
          </div>

          {/* Compare Baseline Action Button */}
          {onOpenComparison && (
            <button
              onClick={onOpenComparison}
              className="flex items-center gap-1.5 bg-[#0e1c2d] hover:bg-cyan-950/80 text-cyan-300 hover:text-cyan-200 font-semibold text-xs px-3 py-1.5 rounded-lg border border-cyan-500/40 shadow-md shadow-cyan-950/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Compare suspected breach sites against normal permitted benchmark mines"
            >
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Compare Baseline</span>
              <span className="sm:hidden">Compare</span>
            </button>
          )}

          {/* Analyze Site Action Button */}
          <button
            onClick={onOpenAnalysis}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Trigger autonomous computer vision analysis on current observation zone"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-spin-slow" />
            <span>Analyze Site</span>
          </button>

          {/* Download CSV Report */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer"
            title="Download full CSV report with coordinates, areas, and confidence metrics"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">CSV Report</span>
          </button>

          {/* Dismissible Alerts Trigger */}
          <button
            onClick={onOpenAlerts}
            className="relative flex items-center justify-center p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            title="View simulated high-priority mining alerts"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                {unreadAlertCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
