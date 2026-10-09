import React from 'react';
import { 
  LayoutDashboard, 
  ScanSearch, 
  GitCompare, 
  AlertTriangle, 
  Radio
} from 'lucide-react';
import type { MiningSite } from '../types';
import { SATELLITE_TELEMETRY } from '../data/mockData';


export type NavTab = 'overview' | 'detection' | 'tracking' | 'alerts';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadAlertCount: number;
  selectedSite: MiningSite;
  allSites: MiningSite[];
  onSelectSite: (site: MiningSite) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  unreadAlertCount,
  selectedSite,
  allSites,
  onSelectSite
}) => {
  const navItems = [
    {
      id: 'overview' as NavTab,
      label: 'Overview',
      icon: LayoutDashboard,
      badge: '12 AOIs',
      badgeColor: 'bg-slate-800 text-slate-300'
    },
    {
      id: 'detection' as NavTab,
      label: 'Detection',
      icon: ScanSearch,
      badge: 'Live Ortho',
      badgeColor: 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
    },
    {
      id: 'tracking' as NavTab,
      label: 'Change Tracking',
      icon: GitCompare,
      badge: 'Before / After',
      badgeColor: 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
    },
    {
      id: 'alerts' as NavTab,
      label: 'Alerts',
      icon: AlertTriangle,
      badge: `${unreadAlertCount} High`,
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800/60 font-bold'
    }
  ];

  return (
    <aside className="w-full lg:w-64 bg-[#070b14] border-r border-slate-800/80 flex flex-col shrink-0 justify-between">
      {/* Top Section: Navigation Links */}
      <div className="p-4 space-y-6">
        <div>
          <p className="text-[11px] font-mono tracking-wider text-slate-500 uppercase px-2 mb-2">
            Intelligence Modules
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Monitored Sites Quick Selector */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-[11px] font-mono tracking-wider text-slate-500 uppercase">
              Target Watchlist (12)
            </p>
            <span className="text-[10px] text-emerald-400 font-mono">ALL SYNCED</span>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {allSites.slice(0, 6).map((site) => {
              const isSelected = site.id === selectedSite.id;
              return (
                <button
                  key={site.id}
                  onClick={() => onSelectSite(site)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800 text-slate-100 font-medium border-l-2 border-emerald-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  <div className="truncate">
                    <span className="font-mono text-emerald-400 mr-1.5 text-[10px]">{site.code}</span>
                    <span className="text-slate-300 text-[11px]">{site.name.split('—')[0]}</span>
                  </div>
                  {site.alertStatus === 'High Priority' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  )}
                </button>
              );
            })}
            <div className="px-2 pt-1 text-[11px] text-slate-500 text-center">
              + 6 more sites in table
            </div>
          </div>
        </div>
      </div>

      {/* Satellite Constellation Telemetry Feed */}
      <div className="p-4 border-t border-slate-800/80 bg-[#090d18] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-semibold text-slate-300 uppercase">
              Telemetry Uplink
            </span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
            NOMINAL
          </span>
        </div>

        <div className="text-[11px] font-mono space-y-1.5 text-slate-400">
          <div className="flex justify-between">
            <span className="text-slate-500">Constellation:</span>
            <span className="text-slate-300">Sentinel-2A/B</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Next Pass ETA:</span>
            <span className="text-emerald-400 font-semibold">{SATELLITE_TELEMETRY.nextPassETA}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cloud Shield:</span>
            <span className="text-slate-300">{SATELLITE_TELEMETRY.cloudCoverage}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Cadastre Sync:</span>
            <span className="text-slate-300">ANM 2026 Q3 OK</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Cadastral Precision: 0.3m</span>
          <span className="text-amber-400/90 font-mono">SIMULATION</span>
        </div>
      </div>
    </aside>
  );
};
