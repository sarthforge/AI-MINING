import React from 'react';
import { Info, Database, Satellite, Cpu, Scale } from 'lucide-react';


export const DisclaimerFooter: React.FC = () => {
  return (
    <footer className="mt-8 border-t border-slate-800/80 bg-[#060a14] px-6 py-6 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Core Mandatory Legal Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold font-mono text-amber-300 uppercase tracking-wide">
                Geospatial Evidence & Due Process Protocol Notice
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                TerraWatch AI operates on the strict legal principle that orbital satellite imagery constitutes preliminary probabilistic intelligence, not definitive legal adjudication. Sites exhibiting surface anomalies are strictly classified as <strong className="text-amber-300 underline underline-offset-2">"suspected unauthorized mining — permit verification required"</strong>. Authoritative enforcement mandates ground-truthing inspections and cross-referencing with official national cadastral registries.
              </p>
            </div>
          </div>
          <div className="shrink-0 font-mono text-[11px] px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-700/50 text-amber-300">
            DEMO SIMULATION ONLY
          </div>
        </div>

        {/* Prerequisites Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-[11px] font-mono">
          <div className="p-3 rounded-lg bg-[#090d18] border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Satellite className="w-3.5 h-3.5" />
              <span>1. SATELLITE IMAGERY</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-normal font-sans">
              Production deployment requires multispectral (Sentinel-2, Landsat-9) and sub-meter commercial optical/SAR constellations (Planet, Maxar, Capella Space).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#090d18] border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>2. GEOSPATIAL GIS</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-normal font-sans">
              Rigorous Digital Elevation Models (SRTM/Copernicus DEM 30m), ground control points (GCPs), and orthorectification calibration matrices.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#090d18] border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>3. VALIDATED CV MODEL</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-normal font-sans">
              Deep neural networks (U-Net, Mask R-CNN, Swin Transformers) validated against ground-truthed mine sites across diverse biomes and seasons.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#090d18] border border-slate-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Database className="w-3.5 h-3.5" />
              <span>4. OFFICIAL PERMIT DATA</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-normal font-sans">
              Real-time API synchronization with government mining titles cadastre, environmental license registers, and protected indigenous reserves.
            </p>
          </div>
        </div>

        {/* Copyright and Watermark Line */}
        <div className="pt-3 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
          <div>
            TerraWatch AI Geospatial Intelligence Platform • Prototype v2.4 (Simulated Pipeline)
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">ESA Copernicus & NASA Landsat Open Data Framework</span>
            <span>•</span>
            <span className="text-emerald-400/80">Telemetry Synchronized</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
