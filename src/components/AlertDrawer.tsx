import React from 'react';
import { 
  X, 
  AlertOctagon, 
  MapPin, 
  CheckCircle, 
  RotateCcw,
  Navigation
} from 'lucide-react';
import type { SatelliteAlert } from '../types';

interface AlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SatelliteAlert[];
  onDismissAlert: (id: string) => void;
  onResetAlerts: () => void;
  onSelectSiteFromAlert: (siteId: string) => void;
  onDispatchDrone?: (alert: SatelliteAlert) => void;
}

export const AlertDrawer: React.FC<AlertDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onDismissAlert,
  onResetAlerts,
  onSelectSiteFromAlert,
  onDispatchDrone
}) => {
  if (!isOpen) return null;


  const activeAlerts = alerts.filter(a => !a.dismissed);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg bg-[#080d1a] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#060a14]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  High-Priority Mining Alerts
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                  {activeAlerts.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Automated multi-temporal optical & SAR change anomalies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Disclaimer Sub-banner */}
        <div className="px-5 py-2.5 bg-amber-950/20 border-b border-amber-900/30 text-[11px] text-amber-300 font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>Legal Classification: Suspected unauthorized mining — permit verification required</span>
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeAlerts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-3 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-semibold text-slate-200">
                All High-Priority Alerts Dismissed
              </h4>
              <p className="text-xs text-slate-400 max-w-xs">
                No active critical alerts in queue. You can restore the 3 simulated demonstration alerts below.
              </p>
              <button
                onClick={onResetAlerts}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-emerald-400 border border-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset 3 Demo Alerts</span>
              </button>
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-[#0b1120] border border-rose-900/50 hover:border-rose-700/80 transition-all space-y-3 shadow-md"
              >
                {/* Alert Top Line */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                      {alert.category}
                    </span>
                    <h4 className="text-xs font-bold text-white pt-1">
                      {alert.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {alert.description}
                </p>

                {/* Telemetry metadata */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-[#070b14] p-2.5 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-500">Excavation: </span>
                    <span className="text-rose-400 font-bold">+{alert.detectedHectares} ha</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Confidence: </span>
                    <span className="text-emerald-400 font-bold">{alert.confidence}%</span>
                  </div>
                  <div className="col-span-2 truncate">
                    <span className="text-slate-500">Coords: </span>
                    <span className="text-slate-300">{alert.coordinates}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[10px] font-mono text-slate-500">
                    {alert.timestamp}
                  </span>
                  <div className="flex items-center gap-2">
                    {onDispatchDrone && (
                      <button
                        onClick={() => {
                          onDispatchDrone(alert);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold transition cursor-pointer"
                        title="Dispatch autonomous UAV drone patrol"
                      >
                        <Navigation className="w-3 h-3 text-rose-400" />
                        <span>Dispatch Drone</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectSiteFromAlert(alert.siteId);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-medium transition cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Inspect On Map</span>
                    </button>
                    <button
                      onClick={() => onDismissAlert(alert.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Bottom Actions */}
        <div className="p-4 bg-[#060a14] border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <button
            onClick={onResetAlerts}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore All Alerts</span>
          </button>
          <span className="text-slate-500 text-[11px]">
            DEMO SIMULATION FEED
          </span>
        </div>
      </div>
    </div>
  );
};
