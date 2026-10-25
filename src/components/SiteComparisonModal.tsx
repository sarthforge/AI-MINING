import React, { useState } from 'react';
import { 
  X, 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRightLeft, 
  MapPin, 
  Eye
} from 'lucide-react';
import type { MiningSite } from '../types';

interface SiteComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSites: MiningSite[];
  initialSiteA?: MiningSite;
  initialSiteB?: MiningSite;
  onSelectSiteForView: (site: MiningSite) => void;
}

export const SiteComparisonModal: React.FC<SiteComparisonModalProps> = ({
  isOpen,
  onClose,
  allSites,
  initialSiteA,
  initialSiteB,
  onSelectSiteForView
}) => {
  // Flagged / breach sites default list
  const breachSites = allSites.filter(s => !s.isPermittedBenchmark || s.alertStatus !== 'Normal Compliance');
  // Permitted benchmark sites default list
  const benchmarkSites = allSites.filter(s => s.isPermittedBenchmark || s.alertStatus === 'Normal Compliance');

  const [siteAId, setSiteAId] = useState<string>(
    initialSiteA?.id || breachSites[0]?.id || allSites[0].id
  );
  const [siteBId, setSiteBId] = useState<string>(
    initialSiteB?.id || benchmarkSites[0]?.id || allSites[benchmarkSites.length > 0 ? allSites.indexOf(benchmarkSites[0]) : 1].id
  );

  React.useEffect(() => {
    if (initialSiteA) setSiteAId(initialSiteA.id);
  }, [initialSiteA]);

  React.useEffect(() => {
    if (initialSiteB) setSiteBId(initialSiteB.id);
  }, [initialSiteB]);

  if (!isOpen) return null;

  const siteA = allSites.find(s => s.id === siteAId) || allSites[0];
  const siteB = allSites.find(s => s.id === siteBId) || allSites[1];

  const handleSwap = () => {
    setSiteAId(siteB.id);
    setSiteBId(siteA.id);
  };

  const getComplianceStatusBadge = (site: MiningSite) => {
    if (site.isPermittedBenchmark || site.alertStatus === 'Normal Compliance') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Permitted Baseline Benchmark
        </span>
      );
    }
    if (site.alertStatus === 'High Priority' || site.concessionStatus === 'Boundary Breach' || site.concessionStatus === 'Unlicensed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-700/70 shadow-sm shadow-rose-950/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          Suspected Breach / Anomaly
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-700/60">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        {site.alertStatus}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-5xl bg-[#0a0f1d] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#070b14] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Mining Site Benchmark Comparison Engine
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  Cadastre vs Ground Truth
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Compare suspected unauthorized breaches against verified permitted baseline control sites
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

        {/* Quick Swap Toolbar */}
        <div className="px-5 py-2.5 bg-[#090e1c] border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-400">Comparing 2 AOIs:</span>
            <span className="font-semibold text-rose-300">{siteA.code} ({siteA.name.split('—')[0]})</span>
            <span className="text-slate-500">vs</span>
            <span className="font-semibold text-emerald-300">{siteB.code} ({siteB.name.split('—')[0]})</span>
          </div>
          <button
            onClick={handleSwap}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px] cursor-pointer"
            title="Swap sites left/right"
          >
            <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
            <span>Swap Columns</span>
          </button>
        </div>

        {/* Main Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Dual Site Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1: Site A */}
            <div className={`rounded-xl border p-4 space-y-4 transition-all ${
              siteA.isPermittedBenchmark || siteA.alertStatus === 'Normal Compliance'
                ? 'bg-[#08121f] border-emerald-800/50'
                : 'bg-[#140b12] border-rose-800/60 shadow-lg shadow-rose-950/20'
            }`}>
              {/* Site A Selector & Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Observation AOI 1
                  </span>
                  {getComplianceStatusBadge(siteA)}
                </div>

                <div className="flex items-center bg-[#070b14] border border-slate-700/80 rounded-lg px-2.5 py-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <select
                    value={siteA.id}
                    onChange={(e) => setSiteAId(e.target.value)}
                    className="w-full bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer truncate"
                  >
                    <optgroup label="🚨 Flagged / Breaches" className="bg-[#0b1120] text-rose-300 font-semibold">
                      {breachSites.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0b1120] text-slate-200">
                          {s.code}: {s.name} ({s.concessionStatus})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="✅ Permitted Benchmarks" className="bg-[#0b1120] text-emerald-300 font-semibold">
                      {benchmarkSites.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0b1120] text-slate-200">
                          {s.code}: {s.name} (Licensed)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>{siteA.region}, {siteA.country}</span>
                  <span className="text-amber-400/90">{siteA.mineralTarget}</span>
                </div>
              </div>

              {/* Satellite Image Preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black group">
                <img
                  src={siteA.currentImageUrl}
                  alt={siteA.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-white">
                  <span>Coords: {siteA.formattedCoordinates}</span>
                  <button
                    onClick={() => {
                      onSelectSiteForView(siteA);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> View Map
                  </button>
                </div>
              </div>

              {/* Metric Breakdown Table */}
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#070b14]/90 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Permit License:</span>
                    <span className={`font-semibold ${siteA.isPermittedBenchmark ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {siteA.permitLicenseNumber || siteA.concessionStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Permitted Cap:</span>
                    <span className="text-slate-200">
                      {siteA.permittedCapHa ? `${siteA.permittedCapHa} ha` : 'No Legal Cap'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Pit Footprint:</span>
                    <span className="text-white font-bold">{siteA.totalAreaHa} ha</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Overflow / Breach Delta:</span>
                    <span className={`font-bold ${siteA.newExcavationHa > 0.5 && !siteA.isPermittedBenchmark ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {siteA.isPermittedBenchmark 
                        ? '0.0 ha (Inside Cadastre)' 
                        : `+${siteA.newExcavationHa} ha Breach`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#070b14]/90 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Vegetation NDVI:</span>
                    <span className={`font-bold ${siteA.ndviBaseline - siteA.ndviCurrent > 0.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {siteA.ndviBaseline} → {siteA.ndviCurrent}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#070b14]/90 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">AI Confidence:</span>
                    <span className="text-emerald-400 font-bold">{siteA.confidenceScore}%</span>
                  </div>
                </div>

                {/* Status Notice */}
                <div className={`p-2 rounded-lg border text-[11px] leading-relaxed font-sans ${
                  siteA.isPermittedBenchmark || siteA.alertStatus === 'Normal Compliance'
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                }`}>
                  {siteA.notes}
                </div>
              </div>
            </div>

            {/* Column 2: Site B */}
            <div className={`rounded-xl border p-4 space-y-4 transition-all ${
              siteB.isPermittedBenchmark || siteB.alertStatus === 'Normal Compliance'
                ? 'bg-[#08121f] border-emerald-800/50'
                : 'bg-[#140b12] border-rose-800/60 shadow-lg shadow-rose-950/20'
            }`}>
              {/* Site B Selector & Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Observation AOI 2
                  </span>
                  {getComplianceStatusBadge(siteB)}
                </div>

                <div className="flex items-center bg-[#070b14] border border-slate-700/80 rounded-lg px-2.5 py-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <select
                    value={siteB.id}
                    onChange={(e) => setSiteBId(e.target.value)}
                    className="w-full bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer truncate"
                  >
                    <optgroup label="✅ Permitted Benchmarks" className="bg-[#0b1120] text-emerald-300 font-semibold">
                      {benchmarkSites.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0b1120] text-slate-200">
                          {s.code}: {s.name} (Licensed)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🚨 Flagged / Breaches" className="bg-[#0b1120] text-rose-300 font-semibold">
                      {breachSites.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0b1120] text-slate-200">
                          {s.code}: {s.name} ({s.concessionStatus})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>{siteB.region}, {siteB.country}</span>
                  <span className="text-amber-400/90">{siteB.mineralTarget}</span>
                </div>
              </div>

              {/* Satellite Image Preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black group">
                <img
                  src={siteB.currentImageUrl}
                  alt={siteB.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono text-white">
                  <span>Coords: {siteB.formattedCoordinates}</span>
                  <button
                    onClick={() => {
                      onSelectSiteForView(siteB);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> View Map
                  </button>
                </div>
              </div>

              {/* Metric Breakdown Table */}
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#070b14]/90 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Permit License:</span>
                    <span className={`font-semibold ${siteB.isPermittedBenchmark ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {siteB.permitLicenseNumber || siteB.concessionStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Permitted Cap:</span>
                    <span className="text-slate-200">
                      {siteB.permittedCapHa ? `${siteB.permittedCapHa} ha` : 'No Legal Cap'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Pit Footprint:</span>
                    <span className="text-white font-bold">{siteB.totalAreaHa} ha</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Overflow / Breach Delta:</span>
                    <span className={`font-bold ${siteB.newExcavationHa > 0.5 && !siteB.isPermittedBenchmark ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {siteB.isPermittedBenchmark 
                        ? '0.0 ha (Inside Cadastre)' 
                        : `+${siteB.newExcavationHa} ha Breach`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#070b14]/90 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Vegetation NDVI:</span>
                    <span className={`font-bold ${siteB.ndviBaseline - siteB.ndviCurrent > 0.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {siteB.ndviBaseline} → {siteB.ndviCurrent}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#070b14]/90 border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">AI Confidence:</span>
                    <span className="text-emerald-400 font-bold">{siteB.confidenceScore}%</span>
                  </div>
                </div>

                {/* Status Notice */}
                <div className={`p-2 rounded-lg border text-[11px] leading-relaxed font-sans ${
                  siteB.isPermittedBenchmark || siteB.alertStatus === 'Normal Compliance'
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                }`}>
                  {siteB.notes}
                </div>
              </div>
            </div>
          </div>

          {/* Analytical Value Callout Box: Why Normal Permitted Sites Matter */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-emerald-950/40 border border-cyan-800/40 space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Scientific & Regulatory Basis of Comparison (तुलना का वैज्ञानिक आधार)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300 font-sans pt-1">
              <div className="bg-[#070b14]/60 p-2.5 rounded-lg border border-slate-800/60">
                <span className="font-semibold text-emerald-300 block mb-1">1. Threshold Calibration</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Permitted benchmark sites establish nominal bare soil and NDVI variations for active mines, preventing false positives from legitimate ground leveling.
                </p>
              </div>
              <div className="bg-[#070b14]/60 p-2.5 rounded-lg border border-slate-800/60">
                <span className="font-semibold text-amber-300 block mb-1">2. Cadastral Boundary Enforcement</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Permitted mines confine 100% of activity within licensed polygons, highlighting that unauthorized sites are flagged specifically for overflowing statutory borders into conservation zones.
                </p>
              </div>
              <div className="bg-[#070b14]/60 p-2.5 rounded-lg border border-slate-800/60">
                <span className="font-semibold text-cyan-300 block mb-1">3. Objective Evidence for Audits</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Comparing illegal placer dredging directly against a certified mining lease proves procedural fairness before dispatching environmental enforcement teams.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#070b14] border-t border-slate-800 shrink-0 text-xs">
          <span className="text-slate-400 font-mono text-[11px] hidden sm:block">
            TerraWatch AI Baseline Engine • Comparing ANM/SERNAGEOMIN/DEM Records
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                onSelectSiteForView(siteA);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              Inspect {siteA.code}
            </button>
            <button
              onClick={() => {
                onSelectSiteForView(siteB);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              Inspect {siteB.code}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
