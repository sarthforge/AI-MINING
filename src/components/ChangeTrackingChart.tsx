import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { Activity, Calendar, ShieldCheck, AlertOctagon } from 'lucide-react';
import { getHistoricalDataForSite } from '../data/mockData';
import type { MiningSite } from '../types';

interface ChangeTrackingChartProps {
  site: MiningSite;
}

export const ChangeTrackingChart: React.FC<ChangeTrackingChartProps> = ({ site }) => {
  const [metricView, setMetricView] = useState<'area' | 'indices'>('area');

  const chartData = useMemo(() => getHistoricalDataForSite(site), [site]);
  const isBenchmark = site.isPermittedBenchmark || site.alertStatus === 'Normal Compliance';
  const permittedCap = site.permittedCapHa || chartData[0]?.permittedCapHa || 16.0;

  const yDomain = useMemo(() => {
    if (metricView === 'indices') return [0, 1];
    const vals = chartData.map(d => d.totalExcavationHa).concat(chartData.map(d => d.permittedCapHa));
    const minVal = Math.floor(Math.min(...vals) * 0.85);
    const maxVal = Math.ceil(Math.max(...vals) * 1.15);
    return [Math.max(0, minVal), maxVal];
  }, [chartData, metricView]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#070b14]/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono">
          <p className="text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{label} ({payload[0]?.payload?.date})</span>
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-semibold text-white">
                  {entry.value} {entry.unit || (metricView === 'area' ? 'ha' : '')}
                </span>
              </div>
            ))}
            {metricView === 'area' && (
              <div className="pt-1.5 mt-1 border-t border-slate-800 text-[10px] font-medium">
                {payload[0]?.payload?.unauthorizedHa > 0 ? (
                  <span className="text-rose-400">
                    ▲ {payload[0]?.payload?.unauthorizedHa} ha suspected breach outside {permittedCap} ha cap
                  </span>
                ) : (
                  <span className="text-emerald-400">
                    ✓ Inside permitted concession limits ({permittedCap} ha cap)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
      {/* Chart Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Excavation Velocity & Spectral Degradation Time Series</span>
              {isBenchmark ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  PERMITTED BENCHMARK
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-400 border border-rose-800/60 font-semibold inline-flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  BREACH AOI
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Temporal change progression for {site.name} across 9-month Sentinel-2 observation cycle (Jan – Sep 2026)
          </p>
        </div>

        {/* Metric Selector Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center bg-[#070b14] p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setMetricView('area')}
              className={`px-3 py-1 rounded cursor-pointer transition ${
                metricView === 'area'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Surface Area (ha)
            </button>
            <button
              onClick={() => setMetricView('indices')}
              className={`px-3 py-1 rounded cursor-pointer transition ${
                metricView === 'indices'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NDVI & Turbidity
            </button>
          </div>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricView === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="totalExcavationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="unauthorizedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={yDomain} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" ha" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              
              {/* Permitted Concession Limit Reference Line */}
              <ReferenceLine 
                y={permittedCap} 
                stroke="#10b981" 
                strokeDasharray="4 4" 
                strokeWidth={2}
                label={{ value: `Permitted Concession Cap: ${permittedCap} ha`, fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }} 
              />

              <Area 
                type="monotone" 
                dataKey="totalExcavationHa" 
                name="Total Pit Excavation" 
                stroke="#f59e0b" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#totalExcavationGrad)" 
              />
              <Area 
                type="monotone" 
                dataKey="unauthorizedHa" 
                name="Suspected Unauthorized Breach" 
                stroke="#ef4444" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#unauthorizedGrad)" 
              />
            </AreaChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 1]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area 
                type="monotone" 
                dataKey="vegetationIndexNDVI" 
                name="NDVI Vegetation Canopy" 
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#ndviGrad)" 
              />
              <Line 
                type="monotone" 
                dataKey="turbidityIndex" 
                name="Water Turbidity Index (x100)" 
                stroke="#06b6d4" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Analytical Callout Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
        {isBenchmark ? (
          <>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-emerald-900/40 flex items-center justify-between">
              <span className="text-slate-400">Cadastre Compliance:</span>
              <span className="text-emerald-400 font-bold">100% Within Bounds (Zero Overflow)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Permitted Headroom:</span>
              <span className="text-cyan-400 font-bold">
                {site.permittedCapHa ? `${(site.permittedCapHa - site.totalAreaHa).toFixed(1)} ha remaining` : 'Audited'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Vegetation Health:</span>
              <span className="text-emerald-300 font-bold">Stable (Preserved Buffer)</span>
            </div>
          </>
        ) : (
          <>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-rose-900/40 flex items-center justify-between">
              <span className="text-slate-400">Boundary Breach Date:</span>
              <span className="text-rose-400 font-bold">May 2026 (Exceeded Cap)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Current Breach Delta:</span>
              <span className="text-amber-400 font-bold">+{site.newExcavationHa} ha outside cadastre</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Mean Deforestation Pace:</span>
              <span className="text-slate-200 font-bold">~0.4 ha / month</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
