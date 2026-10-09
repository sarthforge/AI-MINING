import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  AlertTriangle, 
  Cpu, 
  Layers, 
  Compass, 
  RotateCw
} from 'lucide-react';
import type { MiningSite } from '../types';


interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: MiningSite;
}

const SCAN_STEPS = [
  'Ingesting Sentinel-2 MSI multi-temporal bands (B02, B03, B04, B08, B11)...',
  'Executing atmospheric Sen2Cor calibration & cloud shadow masking...',
  'Computing differential NDVI vegetation loss & Bare Soil Index (BSI)...',
  'Running deep convolutional U-Net & Swin-Transformer segmentation...',
  'Intersecting raster disturbance mask with ANM cadastre concession #BR-PA-2024-88...',
  'Synthesizing geospatial verification dossier and confidence matrix...'
];

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  site
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanStepIndex, setScanStepIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setIsScanning(true);
      setScanStepIndex(0);
      setProgress(0);
      return;
    }

    setIsScanning(true);
    setProgress(0);
    setScanStepIndex(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        const next = prev + 5;
        const step = Math.min(
          Math.floor((next / 100) * SCAN_STEPS.length),
          SCAN_STEPS.length - 1
        );
        setScanStepIndex(step);
        return next;
      });
    }, 110);

    return () => clearInterval(interval);
  }, [isOpen, site.id]);

  if (!isOpen) return null;

  const handleDownloadDossier = () => {
    const textReport = `===============================================================
TERRAWATCH AI — AUTONOMOUS SATELLITE INTELLIGENCE DOSSIER
[DEMO / SIMULATED ENVIRONMENT REPORT]
===============================================================
Generated At: ${new Date().toISOString()}
Target AOI: ${site.name} (${site.code})
Region: ${site.region}, ${site.country}
Coordinates: ${site.formattedCoordinates}
Sensor Pipeline: ${site.sensor}
Observation Date: ${site.lastObservationDate} (vs Baseline: ${site.baselineDate})

LEGAL CLASSIFICATION:
*** SUSPECTED UNAUTHORIZED MINING — PERMIT VERIFICATION REQUIRED ***
(Definitive legal determination cannot be made solely via satellite imagery;
ground truthing and official permit verification are required.)

KEY GEOSPATIAL MEASUREMENTS:
- Suspected New Excavation: ${site.newExcavationHa} Hectares
- Total Operational Pit Area: ${site.totalAreaHa} Hectares
- Registered Concession Limit: 16.0 Hectares
- Boundary Overflow: +2.4 Hectares outside permitted cadastre
- Neural Ensemble Confidence: ${site.confidenceScore}% (Optical + SAR Multi-pass)
- Canopy Loss Index (NDVI): ${site.ndviBaseline} -> ${site.ndviCurrent} (-62.8%)
- Riparian Buffer Encroachment: 140 meters from river bank

RECOMMENDED ENFORCEMENT ACTIONS:
1. Priority Level: CODE ORANGE — Urgent Field Ground-Truthing
2. Dispatch regional environmental inspection unit to coordinates.
3. Cross-reference concession title with National Mining Cadastre.
4. Issue provisional audit notice to active site concession holder.

DEPLOYMENT PREREQUISITES NOTE:
Actual production deployment requires multi-constellation satellite imagery,
calibrated GIS elevation models, validated CV models, and authoritative
government concession cadastre datasets.
===============================================================`;

    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TerraWatch_Dossier_${site.code}_${site.lastObservationDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-[#0a0f1d] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#070b14] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Autonomous Satellite AI Analysis Report
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  DEMO / SIMULATED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                AOI: {site.code} — {site.name} ({site.formattedCoordinates})
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

        {/* Modal Body */}
        {isScanning ? (
          /* Scanning Loading State */
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Radar Circle and Spinner */}
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping-slow"></div>
              <div className="absolute inset-2 rounded-full border border-cyan-500/30"></div>
              <div className="absolute inset-4 rounded-full border border-dashed border-emerald-500/40 animate-spin-slow"></div>
              <div className="w-20 h-20 rounded-full bg-slate-900/90 border border-emerald-500/60 flex items-center justify-center shadow-lg shadow-emerald-950/60">
                <Cpu className="w-10 h-10 text-emerald-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <h4 className="text-sm font-mono font-bold text-emerald-400 uppercase tracking-wider">
                PROCESSING SATELLITE ORTHOMOSAIC
              </h4>
              <p className="text-xs text-slate-300 font-mono h-8 flex items-center justify-center">
                {SCAN_STEPS[scanStepIndex]}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Inference Progress</span>
                <span className="text-emerald-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/60">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-100 shadow-sm shadow-emerald-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-mono">
              Simulated pipeline: Sentinel-2 MSI Multi-spectral + SAR Coherence Fusion
            </p>
          </div>
        ) : (
          /* Completed Analysis Report */
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Primary Finding Alert Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/70 via-rose-900/40 to-slate-900 border-2 border-rose-600/70 shadow-lg shadow-rose-950/40">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-rose-600/20 border border-rose-500 text-rose-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700">
                      FLAGGED ANOMALY
                    </span>
                    <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                      suspected unauthorized mining — permit verification required
                    </h4>
                  </div>
                  <p className="text-xs text-rose-200/90 mt-1.5 leading-relaxed">
                    Automated change segmentation detected <strong>{site.newExcavationHa} hectares</strong> of fresh excavation benches extending outside the licensed concession polygon boundary, encroaching 140 meters into the Rio Tapajós riparian river corridor.
                  </p>
                </div>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">SUSPECTED BREACH</span>
                <span className="text-xl font-bold text-rose-400">+{site.newExcavationHa} ha</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Outside Cadastre</span>
              </div>

              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">TOTAL EXCAVATION</span>
                <span className="text-xl font-bold text-white">{site.totalAreaHa} ha</span>
                <span className="text-[10px] text-amber-400 block mt-0.5">Cap: 16.0 ha (+15.0%)</span>
              </div>

              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">DEMO CONFIDENCE</span>
                <span className="text-xl font-bold text-emerald-400">{site.confidenceScore}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Dual Optical/SAR</span>
              </div>

              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">RECOMMENDED PRIORITY</span>
                <span className="text-sm font-bold text-amber-400">CODE ORANGE</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Urgent Inspection</span>
              </div>
            </div>

            {/* Technical Verification Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Cadastral Cross-Reference */}
              <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-2">
                <h5 className="font-bold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Cadastral Concession Cross-Check</span>
                </h5>
                <div className="space-y-1.5 text-slate-400 text-[11px]">
                  <div className="flex justify-between">
                    <span>Registered Title:</span>
                    <span className="text-slate-200">#BR-PA-2024-88 (ANM)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Licensed Surface Cap:</span>
                    <span className="text-slate-200">16.0 Hectares</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Active Footprint:</span>
                    <span className="text-rose-400 font-bold">18.6 Hectares</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-amber-400 font-semibold">Boundary Overflow Confirmed</span>
                  </div>
                </div>
              </div>

              {/* Spectral Evidence */}
              <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-2">
                <h5 className="font-bold text-slate-200 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Multispectral Indices Evidence</span>
                </h5>
                <div className="space-y-1.5 text-slate-400 text-[11px]">
                  <div className="flex justify-between">
                    <span>NDVI Vegetation Loss:</span>
                    <span className="text-rose-400 font-bold">-0.49 (0.78 → 0.29)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bare Soil Index (BSI):</span>
                    <span className="text-amber-400 font-bold">+0.54 (Heavy Exposure)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SAR Coherence (S1 VV/VH):</span>
                    <span className="text-slate-200">High contrast drop (Clear-cut)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Water Sedimentation Plume:</span>
                    <span className="text-cyan-400 font-bold">+184% Turbidity Index</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-2.5">
              <h5 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Recommended Inspection Protocol</span>
              </h5>
              <ul className="space-y-2 text-xs text-slate-300 font-sans">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span><strong>Field Inspection:</strong> Dispatch regional environmental inspection agents to coordinates <code className="text-emerald-300 font-mono">{site.formattedCoordinates}</code> for GPS ground-truthing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span><strong>Permit Verification:</strong> Formally audit national mining cadastre for any recent permit renewal or extension filings.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span><strong>Riparian Mitigation:</strong> Deploy sediment retention booms along the northern quarry edge to prevent further runoff into Rio Tapajós.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Modal Bottom Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#070b14] border-t border-slate-800">
          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            TerraWatch AI v2.4 • Model: Satellite-U-Net-Ensemble-v3
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {!isScanning && (
              <>
                <button
                  onClick={() => setIsScanning(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Re-scan</span>
                </button>
                <button
                  onClick={handleDownloadDossier}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Dossier</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
