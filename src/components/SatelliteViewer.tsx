import React, { useState, useRef } from 'react';
import { 
  Crosshair, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles,
  MapPin,
  Calendar,
  Compass,
  AlertTriangle,
  ShieldCheck,
  AlertOctagon,
  Landmark,
  FileText,
  Navigation
} from 'lucide-react';
import type { MiningSite, OverlayPolygon } from '../types';


interface SatelliteViewerProps {
  site: MiningSite;
  onAnalyzeSite: () => void;
  onOpenGovtNotice?: () => void;
  onDispatchDrone?: () => void;
}

type LayerMode = 'all' | 'suspected' | 'concession' | 'raw';

export const SatelliteViewer: React.FC<SatelliteViewerProps> = ({ 
  site, 
  onAnalyzeSite, 
  onOpenGovtNotice,
  onDispatchDrone 
}) => {
  // polygons come from GET /sites (or mock fallback sites); empty = raw imagery only
  const sitePolygons = site.polygons ?? [];
  const [activeLayer, setActiveLayer] = useState<LayerMode>('all');
  const [selectedPolygon, setSelectedPolygon] = useState<OverlayPolygon | null>(sitePolygons[0]);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showCrosshair, setShowCrosshair] = useState<boolean>(true);
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number; lat: string; lon: string; ndvi: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derived legal cadastre parameters
  const isBenchmark = Boolean(site.isPermittedBenchmark || site.alertStatus === 'Normal Compliance');
  const concessionPoly = sitePolygons.find(p => p.type === 'concession');
  const suspectedPoly = sitePolygons.find(p => p.type === 'suspected');
  const permittedCap = site.permittedCapHa ?? concessionPoly?.areaHa ?? (isBenchmark ? site.totalAreaHa : 16.0);
  const encroachmentArea = isBenchmark ? 0 : (suspectedPoly?.areaHa ?? site.newExcavationHa ?? 2.4);
  const licenseNumber = site.permitLicenseNumber || (isBenchmark ? `REG-${site.code}-LEGAL-CADASTRE` : `ANM-TITLE-${site.code}-REVOKED`);

  // Sync selected polygon when site changes
  React.useEffect(() => {
    setSelectedPolygon(sitePolygons[0]);
    setZoomLevel(1);
  }, [site.id]);


  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Simulated coordinate mapping
    const baseLat = site.latitude;
    const baseLon = site.longitude;
    const calcLat = (baseLat + (0.5 - y / 100) * 0.04).toFixed(5);
    const calcLon = (baseLon + (x / 100 - 0.5) * 0.04).toFixed(5);
    const simulatedNDVI = (0.75 - (y / 100) * 0.55).toFixed(2);

    setCursorCoords({
      x,
      y,
      lat: `${Math.abs(Number(calcLat))}° ${Number(calcLat) < 0 ? 'S' : 'N'}`,
      lon: `${Math.abs(Number(calcLon))}° ${Number(calcLon) < 0 ? 'W' : 'E'}`,
      ndvi: simulatedNDVI
    });
  };

  const handleMouseLeave = () => {
    setCursorCoords(null);
  };

  const isPolygonVisible = (type: OverlayPolygon['type']) => {
    if (activeLayer === 'raw') return false;
    if (activeLayer === 'suspected') return type === 'suspected';
    if (activeLayer === 'concession') return type === 'concession';
    return true;
  };

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Panel Top Header Bar */}
      <div className="px-4 py-3 bg-[#080d1a] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-xs font-bold text-emerald-400">ORTHO-OPTICAL L2A</span>
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{site.name}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                {site.code}
              </span>
              {site.isPermittedBenchmark ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  PERMITTED BENCHMARK
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800/60 font-semibold inline-flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3 text-rose-400" />
                  BREACH AOI
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{site.formattedCoordinates}</span>
              <span>•</span>
              <span className="text-slate-300">{site.region}, {site.country}</span>
            </div>
          </div>
        </div>

        {/* Observation Timestamp & Sensor */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-[#0e172a] border border-slate-700/80 text-slate-300 flex items-center gap-2 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>OBS: {site.lastObservationDate} 14:22 UTC</span>
          </div>
          <div className="hidden xl:flex px-2.5 py-1 rounded-lg bg-[#0e172a] border border-slate-700/80 text-emerald-400 font-mono text-[11px]">
            {site.sensor.split('+')[0]}
          </div>
        </div>
      </div>

      {/* Statutory Cadastre & Spatial Compliance Strip */}
      <div className={`px-4 py-2.5 border-b text-xs font-mono flex flex-wrap items-center justify-between gap-3 ${
        isBenchmark 
          ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200' 
          : 'bg-rose-950/20 border-rose-900/40 text-rose-200'
      }`}>
        <div className="flex items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Landmark className={`w-4 h-4 shrink-0 ${isBenchmark ? 'text-emerald-400' : 'text-rose-400'}`} />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Statutory Lease Cadastre</span>
              <span className="font-semibold text-slate-100">{licenseNumber}</span>
            </div>
          </div>
          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Permitted Quota</span>
            <span className="font-semibold text-slate-200">{permittedCap.toFixed(1)} ha</span>
          </div>
          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Excavation</span>
            <span className="font-semibold text-slate-200">{site.totalAreaHa.toFixed(1)} ha</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isBenchmark ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-900/40 border border-emerald-700/60 text-emerald-300 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% WITHIN STATUTORY BOUNDARY (0.0 ha Breach)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-900/40 border border-rose-700/60 text-rose-300 font-bold text-[11px] animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ILLEGAL ENCROACHMENT: +{encroachmentArea.toFixed(1)} ha BEYOND CADASTRE
            </span>
          )}
        </div>
      </div>

      {/* Main Satellite View Area */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative aspect-[16/9] w-full bg-[#050811] overflow-hidden select-none group cursor-crosshair"
      >
        {/* The Realistic Satellite Aerial Image */}
        <div 
          className="w-full h-full transition-transform duration-300 ease-out origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img 
            key={site.id}
            src={site.currentImageUrl || '/satellite_current.jpg'} 
            alt={`High-resolution aerial satellite imagery of ${site.name}`}
            className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.05]"
          />

          {/* SVG Vector Overlays */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-auto"
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Striped hazard pattern for unauthorized excavation */}
              <pattern id="hazardStripe" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="20" stroke="#ef4444" strokeWidth="4" strokeOpacity="0.45" />
              </pattern>
            </defs>

            {sitePolygons.map((poly) => {
              if (!isPolygonVisible(poly.type)) return null;
              const isSelected = selectedPolygon?.id === poly.id;

              return (
                <g key={poly.id} className="cursor-pointer group/poly">
                  {/* Fill Polygon */}
                  <polygon
                    points={poly.points}
                    fill={poly.type === 'suspected' ? 'url(#hazardStripe)' : poly.color}
                    stroke={poly.strokeColor}
                    strokeWidth={isSelected ? '3.5' : '2'}
                    strokeDasharray={poly.type === 'concession' ? '6,4' : undefined}
                    className={`transition-all duration-200 ${
                      poly.type === 'suspected' ? 'animate-pulse' : ''
                    } hover:brightness-125`}
                    onClick={() => setSelectedPolygon(poly)}
                  />

                  {/* Polygon Center Badge / Annotation */}
                  {poly.type === 'suspected' && (
                    <g transform="translate(320, 390)" pointerEvents="none">
                      <rect x="-10" y="-14" width="240" height="24" rx="4" fill="#0b1120" fillOpacity="0.92" stroke="#ef4444" strokeWidth="1" />
                      <circle cx="2" cy="-2" r="4" fill="#ef4444" />
                      <text x="14" y="2" fill="#fca5a5" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600">
                        {poly.label || `BREACH: +${site.newExcavationHa} ha (${site.confidenceScore}%)`}
                      </text>
                    </g>
                  )}

                  {poly.type === 'concession' && (
                    <g transform="translate(140, 240)" pointerEvents="none">
                      <rect x="-8" y="-14" width="210" height="22" rx="4" fill="#070b14" fillOpacity="0.9" stroke="#10b981" strokeWidth="1" />
                      <text x="4" y="1" fill="#6ee7b7" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="500">
                        {poly.label || `CONCESSION LIMIT: ${poly.areaHa} ha`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>


        {/* Scanline CRT overlay subtle simulation */}
        <div className="absolute inset-0 scanline-overlay pointer-events-none opacity-40"></div>

        {/* Top-Left Telemetry HUD Watermark */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#060a14]/85 border border-slate-700/80 backdrop-blur-sm text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>SENTINEL-2 MSI L2A • ORTHORECTIFIED</span>
          </div>
          {isBenchmark ? (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/85 border border-emerald-600/60 text-[10px] font-mono text-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>STATUTORY LEASE VERIFIED • 100% WITHIN CONCESSION BOUNDARY</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/85 border border-rose-600/60 text-[10px] font-mono text-rose-300">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>STATUTORY BOUNDARY BREACH • UNAUTHORIZED EXCAVATION BEYOND CADASTRE</span>
            </div>
          )}
        </div>

        {/* Top-Right Interactive Toolbar */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#060a14]/85 border border-slate-700/80 rounded-lg p-1 backdrop-blur-sm shadow-xl">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-slate-700 mx-0.5"></div>
          <button
            onClick={() => setShowCrosshair(prev => !prev)}
            className={`p-1.5 rounded transition ${
              showCrosshair ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle Crosshair Coordinates HUD"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Layer Filters Floating Pill on Image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-[#060a14]/90 border border-slate-700/80 rounded-lg p-1 backdrop-blur-sm text-xs font-mono">
          <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2 py-1 rounded transition cursor-pointer ${
              activeLayer === 'all' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Layers
          </button>
          <button
            onClick={() => setActiveLayer('suspected')}
            className={`px-2 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
              activeLayer === 'suspected' ? 'bg-rose-500/25 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Suspected Breaches
          </button>
          <button
            onClick={() => setActiveLayer('concession')}
            className={`px-2 py-1 rounded transition cursor-pointer ${
              activeLayer === 'concession' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Concession Limits
          </button>
          <button
            onClick={() => setActiveLayer('raw')}
            className={`px-2 py-1 rounded transition cursor-pointer ${
              activeLayer === 'raw' ? 'bg-slate-700 text-slate-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw Ortho
          </button>
        </div>

        {/* Crosshair Coordinates HUD Tracker (Bottom-Right) */}
        {showCrosshair && cursorCoords && (
          <div className="absolute bottom-3 right-3 bg-[#060a14]/90 border border-emerald-800/60 rounded-lg px-2.5 py-1.5 backdrop-blur-sm text-[11px] font-mono text-emerald-400 flex items-center gap-3 shadow-lg pointer-events-none">
            <div className="flex items-center gap-1 text-slate-300">
              <Compass className="w-3 h-3 text-emerald-400 animate-spin-slow" />
              <span>{cursorCoords.lat}, {cursorCoords.lon}</span>
            </div>
            <div className="text-slate-500">•</div>
            <div>
              <span className="text-slate-500">NDVI: </span>
              <span className={Number(cursorCoords.ndvi) < 0.35 ? 'text-rose-400' : 'text-emerald-400'}>
                {cursorCoords.ndvi}
              </span>
            </div>
            <div className="text-slate-500">•</div>
            <div className="text-slate-400">Elev: 218m ASL</div>
          </div>
        )}

        {/* North Arrow and Scale Bar Overlay */}
        <div className="absolute top-12 left-3 flex items-center gap-3 bg-[#060a14]/70 px-2 py-1 rounded border border-slate-800/80 text-[10px] font-mono text-slate-300 pointer-events-none">
          <span className="font-bold text-emerald-400">▲ N</span>
          <span>Scale: 1:5,000 (500m)</span>
        </div>
      </div>

      {/* Interactive Legend & Polygon Inspector Bar */}
      <div className="p-4 bg-[#080d1a] border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Polygon Legend */}
        <div className="flex items-center flex-wrap gap-3 sm:gap-4 text-xs font-mono">
          <span className="text-slate-400 uppercase text-[11px] font-semibold tracking-wider">
            Layer Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-600/40 border-2 border-rose-500 animate-pulse"></span>
            <span className="text-slate-300 font-medium">
              {isBenchmark 
                ? `Extraction Pit (${site.newExcavationHa.toFixed(1)} ha)` 
                : `Suspected Encroachment (+${encroachmentArea.toFixed(1)} ha)`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-600/20 border-2 border-dashed border-emerald-400"></span>
            <span className="text-slate-300">Concession Lease ({permittedCap.toFixed(1)} ha)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-cyan-600/30 border-2 border-cyan-400"></span>
            <span className="text-slate-300">Tailings Settling Pond</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-600/30 border-2 border-amber-400"></span>
            <span className="text-slate-300">Spur Access Road</span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2">
          {onOpenGovtNotice && (
            <button
              onClick={onOpenGovtNotice}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-600/50 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Generate Official Statutory Mining Inspection Notice / FIR (PDF)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Statutory Notice (PDF)</span>
            </button>
          )}

          {!isBenchmark && onDispatchDrone && (
            <button
              onClick={onDispatchDrone}
              className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-600/50 rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Dispatch autonomous UAV patrol drone to current breach coordinates"
            >
              <Navigation className="w-3.5 h-3.5 text-rose-400" />
              <span>Dispatch Drone</span>
            </button>
          )}

          <button
            onClick={onAnalyzeSite}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Run Deep Neural Audit</span>
          </button>
        </div>
      </div>

      {/* Selected Polygon Inspector Card */}
      {selectedPolygon && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-[#0d1424] border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div 
              className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 sm:mt-0"
              style={{ backgroundColor: selectedPolygon.strokeColor }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{selectedPolygon.title}</span>
                <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300">
                  {selectedPolygon.areaHa} ha
                </span>
                {selectedPolygon.type === 'suspected' && (
                  <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-rose-950 text-rose-300 border border-rose-800/60 font-bold">
                    FLAGGED ANOMALY
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {selectedPolygon.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400 font-mono">
              Status: {selectedPolygon.type === 'suspected' ? (
                <span className="text-rose-400 font-bold">Unpermitted Excavation Breach</span>
              ) : selectedPolygon.type === 'concession' ? (
                <span className="text-emerald-400 font-semibold">Registered Cadastral Boundary (ANM/SERNAGEOMIN)</span>
              ) : (
                <span className="text-cyan-400 font-semibold">Authorized Mine Workings & Plant</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
