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
  RotateCw,
  ShieldCheck
} from 'lucide-react';
import { pollAnalysisJob, startAnalysis } from '../services/api';
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
  'Intersecting raster disturbance mask with statutory concession cadastre limits...',
  'Synthesizing geospatial verification dossier and confidence matrix...'
];

function stepFromProgress(pct: number): number {
  return Math.min(Math.floor((pct / 100) * SCAN_STEPS.length), SCAN_STEPS.length - 1);
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen,
  onClose,
  site
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanStepIndex, setScanStepIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [reportSite, setReportSite] = useState<MiningSite>(site);
  const [scanNonce, setScanNonce] = useState(0);

  const isBenchmark = site.isPermittedBenchmark || site.alertStatus === 'Normal Compliance';
  const permittedCap = site.permittedCapHa || 16.0;

  useEffect(() => {
    if (!isOpen) {
      setIsScanning(true);
      setScanStepIndex(0);
      setProgress(0);
      setReportSite(site);
      return;
    }

    let cancelled = false;
    setIsScanning(true);
    setProgress(0);
    setScanStepIndex(0);
    setReportSite(site);

    const runSimulated = () => {
      const interval = setInterval(() => {
        if (cancelled) {
          clearInterval(interval);
          return;
        }
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            return 100;
          }
          const next = prev + 5;
          setScanStepIndex(stepFromProgress(next));
          return next;
        });
      }, 110);
      return () => clearInterval(interval);
    };

    let stopSim: (() => void) | undefined;

    (async () => {
      try {
        const job = await startAnalysis({
          siteId: site.id,
          baselineDate: site.baselineDate,
          currentImageDate: site.lastObservationDate,
        });
        if (cancelled) return;
        const done = await pollAnalysisJob(job.jobId, {
          intervalMs: 1500,
          onProgress: (j) => {
            if (cancelled) return;
            const pct = Math.max(5, Math.min(99, j.progress || 10));
            setProgress(pct);
            setScanStepIndex(stepFromProgress(pct));
          },
        });
        if (cancelled) return;
        if (done.status === 'DONE' && done.result) {
          setReportSite(done.result);
        }
        setProgress(100);
        setScanStepIndex(SCAN_STEPS.length - 1);
        setIsScanning(false);
      } catch {
        if (cancelled) return;
        // API unavailable or unauthorized — keep demo UX via simulated scan
        stopSim = runSimulated();
      }
    })();

    return () => {
      cancelled = true;
      stopSim?.();
    };
  }, [isOpen, site, scanNonce]);

  if (!isOpen) return null;

  const handleDownloadDossier = () => {
    const textReport = `===============================================================
TERRAWATCH AI — AUTONOMOUS SATELLITE INTELLIGENCE DOSSIER
[DEMO / SIMULATED ENVIRONMENT REPORT]
===============================================================
Generated At: ${new Date().toISOString()}
Target AOI: ${reportSite.name} (${reportSite.code})
Region: ${reportSite.region}, ${reportSite.country}
Coordinates: ${reportSite.formattedCoordinates}
Sensor Pipeline: ${reportSite.sensor}
Observation Date: ${reportSite.lastObservationDate} (vs Baseline: ${reportSite.baselineDate})

LEGAL CLASSIFICATION:
${isBenchmark 
  ? '*** VERIFIED COMPLIANT BENCHMARK — ZERO BOUNDARY DEVIATION ***\n(Statutory operations strictly confined within registered mining concession boundary.)'
  : '*** SUSPECTED UNAUTHORIZED MINING — PERMIT VERIFICATION REQUIRED ***\n(Definitive legal determination cannot be made solely via satellite imagery; ground truthing and official permit verification are required.)'
}

KEY GEOSPATIAL MEASUREMENTS:
- Registered Concession Title: ${reportSite.permitLicenseNumber || reportSite.concessionStatus}
- Statutory Concession Cap: ${permittedCap} Hectares
- Total Operational Pit Area: ${reportSite.totalAreaHa} Hectares
- Boundary Overflow / Breach: ${isBenchmark ? '0.0 Hectares (100% Compliant)' : `+${reportSite.newExcavationHa} Hectares outside permitted cadastre`}
- Neural Ensemble Confidence: ${reportSite.confidenceScore}% (Optical + SAR Multi-pass)
- Canopy Loss Index (NDVI): ${reportSite.ndviBaseline} -> ${reportSite.ndviCurrent} (${((reportSite.ndviCurrent - reportSite.ndviBaseline) / reportSite.ndviBaseline * 100).toFixed(1)}%)
- Classification Category: ${isBenchmark ? 'Permitted Baseline Control AOI' : 'Suspected Unauthorized Anomaly'}

${isBenchmark ? `RECOMMENDED ACTIONS (BENCHMARK REFERENCE):
1. Priority Level: CODE GREEN — Nominal Operation Baseline
2. Maintain active Sentinel-2 5-day observation cycle.
3. Utilize spectral reflectance values as regional control baseline for false positive suppression.
4. No environmental enforcement dispatch required.` : `RECOMMENDED ENFORCEMENT ACTIONS:
1. Priority Level: CODE ORANGE — Urgent Field Ground-Truthing
2. Dispatch regional environmental inspection unit to coordinates ${site.formattedCoordinates}.
3. Cross-reference concession title with National Mining Cadastre.
4. Issue provisional audit notice to active site concession holder.`}

DEPLOYMENT PREREQUISITES NOTE:
Actual production deployment requires multi-constellation satellite imagery,
calibrated GIS elevation models, validated CV models, and authoritative
government concession cadastre datasets.
===============================================================`;

    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TerraWatch_Dossier_${reportSite.code}_${reportSite.lastObservationDate}.txt`;
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
            <div className={`p-2 rounded-xl border ${
              isBenchmark
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {isBenchmark ? <ShieldCheck className="w-5 h-5" /> : <Sparkles className="w-5 h-5 animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Autonomous Satellite AI Analysis Report
                </h3>
                {isBenchmark ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold">
                    BASELINE BENCHMARK
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    DEMO / SIMULATED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                AOI: {reportSite.code} — {reportSite.name} ({reportSite.formattedCoordinates})
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
            {isBenchmark ? (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-emerald-900/40 to-slate-900 border-2 border-emerald-600/70 shadow-lg shadow-emerald-950/40">
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-500 text-emerald-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                        VERIFIED BENCHMARK
                      </span>
                      <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                        CERTIFIED CONCESSION — ZERO BOUNDARY OVERFLOW
                      </h4>
                    </div>
                    <p className="text-xs text-emerald-200/90 mt-1.5 leading-relaxed">
                      Automated change segmentation confirms <strong>0.0 hectares</strong> of unauthorized ground disturbance. All active extraction pits and infrastructure are 100% contained within the official registered concession envelope ({site.permitLicenseNumber || 'Statutory Lease'}).
                    </p>
                  </div>
                </div>
              </div>
            ) : (
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
                      Automated change segmentation detected <strong>{site.newExcavationHa} hectares</strong> of fresh excavation benches extending outside the licensed concession polygon boundary, encroaching past statutory cadastre markers.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">
                  {isBenchmark ? 'BOUNDARY STATUS' : 'SUSPECTED BREACH'}
                </span>
                <span className={`text-xl font-bold ${isBenchmark ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isBenchmark ? '0.0 ha' : `+${reportSite.newExcavationHa} ha`}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {isBenchmark ? '100% Inside Cadastre' : 'Outside Cadastre'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">TOTAL EXCAVATION</span>
                <span className="text-xl font-bold text-white">{reportSite.totalAreaHa} ha</span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  Cap: {permittedCap} ha ({isBenchmark ? 'Headroom OK' : 'Over Limit'})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">AI CONFIDENCE</span>
                <span className="text-xl font-bold text-emerald-400">{reportSite.confidenceScore}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Dual Optical/SAR</span>
              </div>

              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">PRIORITY LEVEL</span>
                <span className={`text-sm font-bold ${isBenchmark ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isBenchmark ? 'CODE GREEN' : 'CODE ORANGE'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {isBenchmark ? 'Baseline Control' : 'Urgent Inspection'}
                </span>
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
                    <span className="text-slate-200">{site.permitLicenseNumber || 'ANM Federal Cadastre'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Licensed Surface Cap:</span>
                    <span className="text-slate-200">{permittedCap} Hectares</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Active Footprint:</span>
                    <span className={isBenchmark ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {site.totalAreaHa} Hectares
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-semibold ${isBenchmark ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isBenchmark ? 'Compliant with Title' : 'Boundary Overflow Confirmed'}
                    </span>
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
                    <span>NDVI Vegetation Delta:</span>
                    <span className={isBenchmark ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {reportSite.ndviBaseline} → {reportSite.ndviCurrent} ({isBenchmark ? 'Preserved' : 'Deforestation'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bare Soil Index (BSI):</span>
                    <span className={isBenchmark ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                      {isBenchmark ? 'Contained to Pit Floor' : 'Heavy Exposure Outside Cadastre'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SAR Coherence (S1 VV/VH):</span>
                    <span className="text-slate-200">
                      {isBenchmark ? 'Stable structural backscatter' : 'High contrast clear-cut drop'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sediment Retention:</span>
                    <span className={isBenchmark ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                      {isBenchmark ? 'Engineered Closed Circuit' : 'Elevated Turbidity Index'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="p-4 rounded-xl bg-[#070b14] border border-slate-800 space-y-2.5">
              <h5 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isBenchmark ? 'Baseline Quality Protocol' : 'Recommended Inspection Protocol'}</span>
              </h5>
              <ul className="space-y-2 text-xs text-slate-300 font-sans">
                {isBenchmark ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                      <span><strong>Routine Observation:</strong> Maintain scheduled 5-day Sentinel-2 MSI orbit telemetry passes without priority alerts.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                      <span><strong>Baseline Calibration:</strong> Retain this site as a calibrated ground-truth control mine to tune bare soil anomaly thresholds regionally.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                      <span><strong>Statutory Audit:</strong> Record is fully compliant with cadastral titles ({reportSite.permitLicenseNumber || 'ANM Licensed'}).</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
                      <span><strong>Field Inspection:</strong> Dispatch regional environmental inspection agents to coordinates <code className="text-emerald-300 font-mono">{reportSite.formattedCoordinates}</code> for GPS ground-truthing.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                      <span><strong>Permit Verification:</strong> Formally audit national mining cadastre for any recent permit renewal filings.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                      <span><strong>Mitigation Notice:</strong> Require site operators to cease unpermitted clearing and stabilize exposed riverbank soils.</span>
                    </li>
                  </>
                )}
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
                  onClick={() => setScanNonce((n) => n + 1)}
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
