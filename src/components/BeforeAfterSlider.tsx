import React, { useState } from 'react';
import { 
  GitCompare, 
  Columns, 
  Split, 
  TrendingDown
} from 'lucide-react';
import type { MiningSite } from '../types';

interface BeforeAfterSliderProps {
  site: MiningSite;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ site }) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side'>('slider');


  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const container = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((clientX - container.left) / container.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
              <GitCompare className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              Multi-Temporal Change Analysis & Verification
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare historical baseline surface conditions against current satellite observations
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center bg-[#070b14] p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setComparisonMode('slider')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer transition ${
                comparisonMode === 'slider'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>Split Curtain</span>
            </button>
            <button
              onClick={() => setComparisonMode('side-by-side')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded cursor-pointer transition ${
                comparisonMode === 'side-by-side'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>
        </div>
      </div>

      {/* Observation Date Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#070b14] border border-emerald-900/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">BASELINE OBSERVATION:</span>
            <span className="text-emerald-300 font-semibold">{site.baselineDate}</span>
          </div>
          <span className="text-[11px] text-slate-400">NDVI: {site.ndviBaseline} (Intact)</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#070b14] border border-rose-900/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-slate-400">CURRENT OBSERVATION:</span>
            <span className="text-rose-300 font-semibold">{site.lastObservationDate}</span>
          </div>
          <span className="text-[11px] text-rose-400 font-bold">NDVI: {site.ndviCurrent} (-62.8%)</span>
        </div>
      </div>

      {/* Interactive Visual Comparison Container */}
      {comparisonMode === 'slider' ? (
        <div
          className="relative aspect-[16/9] w-full rounded-xl overflow-hidden cursor-ew-resize select-none border border-slate-800 shadow-inner group"
          onMouseMove={handleSliderMove}
          onTouchMove={handleSliderMove}
        >
          {/* Current Observation (Background Image) */}
          <img
            key={`current-${site.id}`}
            src={site.currentImageUrl || '/satellite_current.jpg'}
            alt={`Current satellite capture of ${site.name}`}
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.95]"
          />

          {/* Current Label on right */}
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-[#060a14]/85 border border-rose-600/50 text-[11px] font-mono text-rose-300 backdrop-blur-sm pointer-events-none">
            CURRENT: {site.lastObservationDate} (+{site.newExcavationHa} ha EXCAVATION)
          </div>

          {/* Baseline Observation (Foreground Image with Clip Path) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              key={`baseline-${site.id}`}
              src={site.baselineImageUrl || '/satellite_baseline.jpg'}
              alt={`Baseline satellite capture of ${site.name}`}
              className="absolute inset-0 w-full h-full object-cover max-w-none filter brightness-[0.95]"
              style={{ width: '100%', height: '100%', minWidth: '100%' }}
            />
            {/* Baseline Label on left */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#060a14]/85 border border-emerald-600/50 text-[11px] font-mono text-emerald-300 backdrop-blur-sm">
              BASELINE: {site.baselineDate} (CANOPY INTACT)
            </div>
          </div>

          {/* Draggable Divider Handle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900/90 border-2 border-emerald-400 shadow-xl flex items-center justify-center text-white text-[10px] font-mono">
              ◄►
            </div>
          </div>

          {/* Hover instruction guide */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-[11px] text-slate-300 backdrop-blur-sm pointer-events-none flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
            <span>Hover or drag curtain to reveal before/after transformation</span>
          </div>
        </div>
      ) : (
        /* Side by Side Dual Panel */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Historical Baseline
              </span>
              <span>{site.baselineDate}</span>
            </div>
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-emerald-900/50 shadow-md">
              <img
                src={site.baselineImageUrl || '/satellite_baseline.jpg'}
                alt={`Historical Baseline for ${site.name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-emerald-300">
                Canopy Density: 98.4%
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                Current Observation
              </span>
              <span>{site.lastObservationDate}</span>
            </div>
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-rose-900/50 shadow-md">
              <img
                src={site.currentImageUrl || '/satellite_current.jpg'}
                alt={`Current Observation for ${site.name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-rose-300 font-semibold">
                +{site.newExcavationHa} ha Suspected Disturbed Ground
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Change KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">CANOPY LOSS</span>
          <div className="text-lg font-mono font-bold text-rose-400 flex items-center gap-1">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span>-27.2%</span>
          </div>
          <span className="text-[10px] text-slate-500">98.4% → 71.2%</span>
        </div>

        <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">BARE SOIL EXPANSION</span>
          <div className="text-lg font-mono font-bold text-amber-400">
            +2.4 ha
          </div>
          <span className="text-[10px] text-slate-500">1.6% → 28.8%</span>
        </div>

        <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">NDVI DROP</span>
          <div className="text-lg font-mono font-bold text-rose-400">
            -0.49
          </div>
          <span className="text-[10px] text-slate-500">0.78 → 0.29 (Severe)</span>
        </div>

        <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">TURBIDITY PLUME</span>
          <div className="text-lg font-mono font-bold text-cyan-400">
            +184%
          </div>
          <span className="text-[10px] text-slate-500">Rio Tapajós Bend</span>
        </div>
      </div>
    </div>
  );
};
