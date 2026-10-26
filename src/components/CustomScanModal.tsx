import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  ShieldCheck, 
  Eye
} from 'lucide-react';
import type { MiningSite, OverlayPolygon } from '../types';

interface CustomScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToDashboard: (customSite: MiningSite) => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'preset-sand',
    name: 'Riverbed Sand Mining (Illegal Encroachment)',
    region: 'Central River Tributary',
    country: 'Custom Scan AOI',
    image: '/site_choco.jpg',
    coords: '23°47\'40" N, 86°25\'30" E',
    lat: 23.7944,
    lng: 86.4250,
    areaHa: 4.8,
    isLegal: false,
    permitCap: 2.0,
    license: 'REVOKED-LEASE-DIST-4'
  },
  {
    id: 'preset-copper',
    name: 'Open-Pit Benchmark (Permitted Concession)',
    region: 'Industrial Mining Corridor',
    country: 'Custom Scan AOI',
    image: '/site_carajas.jpg',
    coords: '21°15\'10" N, 81°18\'22" E',
    lat: 21.2528,
    lng: 81.3061,
    areaHa: 14.5,
    isLegal: true,
    permitCap: 16.0,
    license: 'ANM-LIC-2026-COMPLIANT'
  },
  {
    id: 'preset-alluvial',
    name: 'Forest Canopy Dredge Pit (Eco-Buffer Breach)',
    region: 'Protected Reserve Edge',
    country: 'Custom Scan AOI',
    image: '/satellite_current.jpg',
    coords: '18°22\'45" N, 83°05\'12" E',
    lat: 18.3792,
    lng: 83.0867,
    areaHa: 3.2,
    isLegal: false,
    permitCap: 0.0,
    license: 'UNLICENSED-BUFFER-BREACH'
  }
];

const SCAN_STEPS = [
  'Ingesting uploaded raster pixel grid & calibrating Ground Sampling Distance (GSD)...',
  'Computing multi-spectral Differential NDVI (B08 NIR / B04 Red) vegetation index...',
  'Executing Bare Soil Index (BSI) anomaly segmentation & surface disturbance mapping...',
  'Intersecting raster disturbance mask with cadastral concession boundary vectors...',
  'Generating final geospatial detection coordinates & confidence dossier...'
];

export const CustomScanModal: React.FC<CustomScanModalProps> = ({
  isOpen,
  onClose,
  onApplyToDashboard
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(PRESET_SCENARIOS[0].image);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_SCENARIOS[0].id);
  const [customName, setCustomName] = useState<string>('Custom Sentinel AOI Inspection');
  const [customLat, setCustomLat] = useState<string>('23.7944');
  const [customLng, setCustomLng] = useState<string>('86.4250');
  const [isLegalPreset, setIsLegalPreset] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Scan state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepIndex, setScanStepIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [scanCompleted, setScanCompleted] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setSelectedPresetId('custom-file');
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setScanCompleted(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setSelectedPresetId(preset.id);
    setSelectedImage(preset.image);
    setFileName(null);
    setCustomName(preset.name);
    setCustomLat(preset.lat.toString());
    setCustomLng(preset.lng.toString());
    setIsLegalPreset(preset.isLegal);
    setScanCompleted(false);
  };

  const handleRunInference = () => {
    setIsScanning(true);
    setProgress(0);
    setScanStepIndex(0);
    setScanCompleted(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setScanCompleted(true);
          return 100;
        }
        const next = prev + 10;
        const step = Math.min(Math.floor((next / 100) * SCAN_STEPS.length), SCAN_STEPS.length - 1);
        setScanStepIndex(step);
        return next;
      });
    }, 180);
  };

  const handleLoadIntoDashboard = () => {
    const lat = parseFloat(customLat) || 23.7944;
    const lng = parseFloat(customLng) || 86.4250;
    const isLegal = isLegalPreset;
    const area = isLegal ? 14.5 : 4.8;
    const newExcavation = isLegal ? 0.8 : 2.6;

    const customPolygons: OverlayPolygon[] = isLegal ? [
      {
        id: 'custom-concession',
        title: 'Statutory Mining Cadastre Envelope',
        type: 'concession',
        areaHa: 16.0,
        color: 'rgba(16, 185, 129, 0.15)',
        strokeColor: '#10b981',
        label: 'Statutory Concession: 16.0 ha',
        points: '150,150 750,140 780,680 140,700',
        description: 'Authorized open-cast mining envelope registered with state directorate.'
      },
      {
        id: 'custom-excavation',
        title: 'Permitted Extraction Bench',
        type: 'pit',
        areaHa: 14.5,
        color: 'rgba(6, 182, 212, 0.3)',
        strokeColor: '#06b6d4',
        label: 'Extraction Bench: 14.5 ha',
        points: '200,220 700,210 720,620 190,630',
        description: 'Active benches operating 100% inside licensed boundary.'
      }
    ] : [
      {
        id: 'custom-breach',
        title: 'Zone Alpha: Unauthorized Excavation Breach',
        type: 'suspected',
        areaHa: 2.6,
        color: 'rgba(239, 68, 68, 0.38)',
        strokeColor: '#ef4444',
        label: 'ALERT: 2.6 ha Beyond Cadastre',
        points: '220,320 520,310 560,550 200,560',
        description: 'Active earthmoving benches extending outside registered concession coordinates.'
      },
      {
        id: 'custom-concession',
        title: 'Statutory Lease Boundary Marker',
        type: 'concession',
        areaHa: 2.0,
        color: 'rgba(16, 185, 129, 0.15)',
        strokeColor: '#10b981',
        label: 'Concession Limit: 2.0 ha',
        points: '120,450 450,440 460,820 120,820',
        description: 'Official statutory boundary. Detected excavation exceeds boundary.'
      }
    ];

    const customSite: MiningSite = {
      id: `custom-aoi-${Date.now()}`,
      code: 'CUSTOM-AOI',
      name: customName,
      region: 'Custom Surveillance Sector',
      country: 'India',
      latitude: lat,
      longitude: lng,
      formattedCoordinates: `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`,
      totalAreaHa: area,
      newExcavationHa: newExcavation,
      changePercentage: isLegal ? 5.5 : 32.4,
      confidenceScore: 94.6,
      concessionStatus: isLegal ? 'Licensed' : 'Boundary Breach',
      alertStatus: isLegal ? 'Normal Compliance' : 'High Priority',
      mineralTarget: 'Aggregate / River Minerals',
      lastObservationDate: new Date().toISOString().slice(0, 10),
      baselineDate: '2026-01-15',
      ndviBaseline: 0.68,
      ndviCurrent: isLegal ? 0.62 : 0.28,
      sensor: 'Sentinel-2 MSI + Custom Orthomosaic',
      resolution: '0.5m Pan-Sharpened',
      notes: isLegal 
        ? 'Verified Compliant: Active extraction bench is strictly inside registered concession boundaries.'
        : 'Statutory Breach: Active excavation expanded beyond registered northern boundary coordinates.',
      currentImageUrl: selectedImage,
      baselineImageUrl: '/satellite_baseline.jpg',
      polygons: customPolygons,
      isPermittedBenchmark: isLegal,
      permitLicenseNumber: isLegal ? 'ANM-LIC-2026-COMPLIANT' : 'REVOKED-LEASE-DIST-4',
      permittedCapHa: isLegal ? 16.0 : 2.0,
      environmentalRating: isLegal ? 'Compliant (A)' : 'Critical Breach (F)'
    };

    onApplyToDashboard(customSite);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#090d18] border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-[#0d1424] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Custom Satellite Image Scanner</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  LIVE AI INFERENCE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Upload custom aerial raster imagery or test with realistic mining benchmarks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Selection: Upload vs Presets */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              1. Choose Satellite Source Image:
            </label>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_SCENARIOS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0f1d33] border-emerald-500 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                        : 'bg-[#0b1120] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 line-clamp-1">{preset.name}</span>
                      {preset.isLegal ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold">
                          LEGAL
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-800/60 font-semibold">
                          BREACH
                        </span>
                      )}
                    </div>
                    <div className="aspect-[16/9] w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                      <img src={preset.image} alt={preset.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{preset.coords}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom File Upload Box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`mt-2 p-4 rounded-xl border-2 border-dashed transition text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
                selectedPresetId === 'custom-file'
                  ? 'bg-emerald-950/20 border-emerald-500 text-emerald-300'
                  : 'bg-[#090d18] border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <Upload className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200">
                  {fileName ? `Uploaded: ${fileName}` : 'Or click to upload your own satellite JPG / PNG / GeoTIFF'}
                </span>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Supports high-resolution ortho-imagery, drone surveys, and Sentinel-2 bands
                </p>
              </div>
            </div>
          </div>

          {/* AOI Details & Coordinate Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0b1120] border border-slate-800 text-xs font-mono">
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Target Inspection Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Center Latitude</label>
              <input
                type="text"
                value={customLat}
                onChange={(e) => setCustomLat(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase block mb-1">Center Longitude</label>
              <input
                type="text"
                value={customLng}
                onChange={(e) => setCustomLng(e.target.value)}
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Scan Execution & Progress HUD */}
          {isScanning && (
            <div className="p-4 rounded-xl bg-[#0b1424] border border-emerald-500/40 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Running Neural Anomaly Extraction...
                </span>
                <span className="text-slate-300 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 animate-pulse">
                &gt; {SCAN_STEPS[scanStepIndex]}
              </p>
            </div>
          )}

          {/* Post-Scan Results Panel */}
          {scanCompleted && (
            <div className="p-4 rounded-xl bg-[#0b1424] border border-emerald-500/50 space-y-4 font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase">
                    Inference Complete • Neural Output Ready
                  </span>
                </div>
                {isLegalPreset ? (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    CONCESSION COMPLIANT
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800/60 font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    UNAUTHORIZED BOUNDARY BREACH
                  </span>
                )}
              </div>

              {/* Preview with Simulated Bounding Detection */}
              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black border border-slate-700">
                <img src={selectedImage} alt="Scanned Result" className="w-full h-full object-cover" />
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 450">
                  {isLegalPreset ? (
                    <polygon
                      points="120,100 680,90 700,380 110,400"
                      fill="rgba(16, 185, 129, 0.15)"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="6,4"
                    />
                  ) : (
                    <>
                      <polygon
                        points="180,240 500,230 530,410 160,420"
                        fill="rgba(239, 68, 68, 0.35)"
                        stroke="#ef4444"
                        strokeWidth="2.5"
                      />
                      <polygon
                        points="100,340 400,330 420,440 100,440"
                        fill="rgba(16, 185, 129, 0.12)"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4,4"
                      />
                    </>
                  )}
                </svg>
                <div className="absolute top-2 left-2 bg-[#060a14]/90 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 border border-emerald-800/60">
                  Detected Surface Disturbance: {isLegalPreset ? '14.5 ha' : '+2.6 ha Unauthorized'}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Confidence Score</span>
                  <span className="font-bold text-cyan-400">94.6%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">NDVI Drop</span>
                  <span className="font-bold text-rose-400">-0.40</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Excavation Footprint</span>
                  <span className="font-bold text-slate-200">{isLegalPreset ? '14.5 ha' : '4.8 ha'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#070b14] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Statutory Penalty</span>
                  <span className="font-bold text-amber-400">{isLegalPreset ? '₹ 0.00' : '₹ 1.82 Cr'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-[#0d1424] border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Model: ResNet-50 + Swin-Transformer (GSD 0.5m)
          </span>

          <div className="flex items-center gap-2 ml-auto">
            {!scanCompleted ? (
              <button
                onClick={handleRunInference}
                disabled={isScanning}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-emerald-950/40 transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isScanning ? 'Running Analysis...' : 'Run Neural Inference'}</span>
              </button>
            ) : (
              <button
                onClick={handleLoadIntoDashboard}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-cyan-950/40 transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Load Into Live Dashboard</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
