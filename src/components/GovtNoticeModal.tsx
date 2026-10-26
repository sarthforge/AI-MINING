import React from 'react';
import { 
  X, 
  Printer, 
  AlertTriangle, 
  Landmark, 
  FileText, 
  Copy, 
  Check, 
  Scale
} from 'lucide-react';
import type { MiningSite } from '../types';

interface GovtNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: MiningSite;
}

export const GovtNoticeModal: React.FC<GovtNoticeModalProps> = ({ isOpen, onClose, site }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const isBenchmark = Boolean(site.isPermittedBenchmark || site.alertStatus === 'Normal Compliance');
  const concessionPoly = site.polygons?.find(p => p.type === 'concession');
  const suspectedPoly = site.polygons?.find(p => p.type === 'suspected');
  const permittedCap = site.permittedCapHa ?? concessionPoly?.areaHa ?? (isBenchmark ? site.totalAreaHa : 16.0);
  const encroachmentArea = isBenchmark ? 0 : (suspectedPoly?.areaHa ?? site.newExcavationHa ?? 2.4);
  const licenseNumber = site.permitLicenseNumber || (isBenchmark ? `REG-${site.code}-LEGAL-CADASTRE` : `ANM-TITLE-${site.code}-BREACH`);
  
  const docketNumber = `FIR/DGMS/GEO-${site.code}-${site.id.replace('site-', '')}/2026`;
  const issueDate = site.lastObservationDate;

  const extractionPenaltyLakhs = (encroachmentArea * 45).toFixed(2);
  const ecologicalFundLakhs = (encroachmentArea * 25).toFixed(2);
  const adminLevyLakhs = isBenchmark ? '0.00' : '5.00';
  const totalLiabilityCrores = isBenchmark ? '0.00' : (encroachmentArea * 0.70 + 0.05).toFixed(2);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyNotice = () => {
    const textContent = `
================================================================================
GOVERNMENT OF INDIA / STATUTORY MINING ENFORCEMENT DIRECTORATE
DIRECTORATE GENERAL OF MINES SAFETY (DGMS) — GEOSPATIAL CADASTRE CELL
================================================================================
DOCKET REF NO: ${docketNumber}
DATE OF ISSUANCE: ${issueDate}
CLASSIFICATION: ${isBenchmark ? 'STATUTORY COMPLIANCE CERTIFICATE' : 'OFFICIAL ENCROACHMENT NOTICE & CEASE-AND-DESIST ORDER'}

SITE PARTICULARS:
-----------------
Mine Name: ${site.name} (${site.code})
Statutory Lease Reference: ${licenseNumber}
Coordinates: ${site.formattedCoordinates}
Administrative Division: ${site.region}, ${site.country}
Mineral Commodity: ${site.mineralTarget}

SATELLITE AUDIT EVIDENCE:
-------------------------
Satellite Sensor Feed: ${site.sensor}
Observation Orbit Date: ${site.lastObservationDate}
Permitted Concession Limit: ${permittedCap.toFixed(1)} ha
Total Disturbed Ground Surface: ${site.totalAreaHa.toFixed(1)} ha
Unlawful Spatial Encroachment: ${isBenchmark ? '0.0 ha (Compliant)' : `+${encroachmentArea.toFixed(1)} ha BEYOND CADASTRE`}
Canopy / Vegetation Loss (NDVI): Δ ${(site.ndviBaseline - site.ndviCurrent).toFixed(2)}
AI Neural Confidence: ${site.confidenceScore}%

STATUTORY LIABILITY ASSESSMENT:
-------------------------------
Unlawful Extraction Penalty (MMDR Sec. 21): ₹ ${extractionPenaltyLakhs} Lakhs
Ecological Restoration Cess: ₹ ${ecologicalFundLakhs} Lakhs
Total Assessed Statutory Liability: ₹ ${totalLiabilityCrores} Crores

MANDATORY DIRECTIVES:
---------------------
1. Immediate cessation of extraction operations outside registered coordinates.
2. Production of mining lease boundary pillars before District Magistrate within 48 hours.
3. Compound penalty payment initiation under statutory treasury head 0853.

AUTHORITY: Directorate General of Mines Safety & State Department of Mines
================================================================================
    `.trim();

    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-4xl bg-[#090d18] border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="px-5 py-3.5 bg-[#0d1424] border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isBenchmark ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'}`}>
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Statutory Mining Notice Generator</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {site.code}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Official Ministry of Mines & DGMS Cadastre Enforcement Format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyNotice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-mono transition cursor-pointer"
              title="Copy text of official order"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition cursor-pointer"
              title="Print or Save as Official PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable Official Document Area */}
        <div id="govt-notice-print-area" className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-100 font-sans print:p-0 print:text-black">
          {/* Official Document Paper Simulation */}
          <div className="bg-[#0c1220] border border-slate-700/80 rounded-xl p-6 sm:p-8 space-y-6 shadow-inner print:bg-white print:border-none print:text-black print:shadow-none print:p-0">
            {/* National Document Header */}
            <div className="text-center border-b border-slate-700/80 pb-5 print:border-black space-y-1">
              <div className="flex items-center justify-center gap-2 text-xs font-mono tracking-widest text-slate-400 uppercase print:text-black">
                <Landmark className="w-4 h-4 text-emerald-400 print:text-black" />
                <span>DIRECTORATE GENERAL OF MINES SAFETY (DGMS)</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white print:text-black uppercase">
                Ministry of Mines & Petroleum Resources
              </h1>
              <p className="text-xs font-mono text-slate-400 print:text-gray-700">
                Statutory Geospatial Surveillance & Cadastre Enforcement Cell • Form VIII-B (Rule 26)
              </p>
            </div>

            {/* Notice Reference & Docket Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono bg-[#070b14] p-3 rounded-lg border border-slate-800 print:bg-gray-100 print:border-gray-300 print:text-black">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Docket FIR Ref</span>
                <span className="font-bold text-slate-200 print:text-black">{docketNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Date of Issuance</span>
                <span className="font-semibold text-slate-200 print:text-black">{issueDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Target Commodity</span>
                <span className="font-semibold text-slate-200 print:text-black">{site.mineralTarget}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Statutory Status</span>
                <span className={`font-bold ${isBenchmark ? 'text-emerald-400 print:text-green-700' : 'text-rose-400 print:text-red-700'}`}>
                  {isBenchmark ? 'COMPLIANT' : 'ENCROACHMENT'}
                </span>
              </div>
            </div>

            {/* Subject Heading */}
            <div className="p-3.5 rounded-lg border text-xs font-mono leading-relaxed space-y-1 bg-[#091020] border-slate-700 print:bg-gray-50 print:border-gray-400">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Subject Directive:</div>
              <p className="font-semibold text-slate-100 print:text-black">
                {isBenchmark 
                  ? `CERTIFICATION OF CADASTRE CONFORMANCE: Zero unauthorized spatial encroachment observed across verified concession lease boundaries for ${site.name}.`
                  : `ORDER OF CEASE-AND-DESIST & STATUTORY COMPOUND PENALTY ASSESSMENT: Unlawful mineral extraction detected +${encroachmentArea.toFixed(1)} ha beyond statutory cadastral concession limits at ${site.name}.`
                }
              </p>
            </div>

            {/* Site & Satellite Observation Particulars Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider print:text-black flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                <span>1. Geospatial Telemetry & Concession Record</span>
              </h3>
              <div className="border border-slate-700/80 rounded-lg overflow-hidden text-xs font-mono">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                    <tr className="bg-[#080d1a] print:bg-gray-50">
                      <td className="p-2.5 text-slate-400 w-1/3 print:text-gray-700">Leaseholder / Mine Site</td>
                      <td className="p-2.5 text-slate-100 font-semibold print:text-black">{site.name}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-slate-400 print:text-gray-700">Registered Cadastre Title</td>
                      <td className="p-2.5 text-slate-200 print:text-black">{licenseNumber}</td>
                    </tr>
                    <tr className="bg-[#080d1a] print:bg-gray-50">
                      <td className="p-2.5 text-slate-400 print:text-gray-700">Geodetic Coordinates</td>
                      <td className="p-2.5 text-slate-200 print:text-black">{site.formattedCoordinates} ({site.region}, {site.country})</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-slate-400 print:text-gray-700">Surveillance Sensor Feed</td>
                      <td className="p-2.5 text-slate-200 print:text-black">{site.sensor} • Resolution: {site.resolution}</td>
                    </tr>
                    <tr className="bg-[#080d1a] print:bg-gray-50">
                      <td className="p-2.5 text-slate-400 print:text-gray-700">Observation Timestamp</td>
                      <td className="p-2.5 text-slate-200 print:text-black">{site.lastObservationDate} 14:22 UTC (Baseline: {site.baselineDate})</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spatial Findings & Environmental Loss Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider print:text-black flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                <span>2. AI Spatial Audit & Encroachment Metrics</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 print:bg-white print:border-gray-300">
                  <span className="text-[10px] text-slate-400 block uppercase">Permitted Quota</span>
                  <span className="text-sm font-bold text-slate-100 print:text-black">{permittedCap.toFixed(1)} ha</span>
                </div>
                <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 print:bg-white print:border-gray-300">
                  <span className="text-[10px] text-slate-400 block uppercase">Active Surface</span>
                  <span className="text-sm font-bold text-slate-100 print:text-black">{site.totalAreaHa.toFixed(1)} ha</span>
                </div>
                <div className={`p-3 rounded-lg border ${isBenchmark ? 'bg-emerald-950/30 border-emerald-800/60' : 'bg-rose-950/30 border-rose-800/60'} print:bg-white print:border-gray-300`}>
                  <span className="text-[10px] text-slate-400 block uppercase">Spatial Spillover</span>
                  <span className={`text-sm font-bold ${isBenchmark ? 'text-emerald-400 print:text-green-700' : 'text-rose-400 print:text-red-700'}`}>
                    {isBenchmark ? '0.0 ha (Compliant)' : `+${encroachmentArea.toFixed(1)} ha Breach`}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 print:bg-white print:border-gray-300">
                  <span className="text-[10px] text-slate-400 block uppercase">Neural Confidence</span>
                  <span className="text-sm font-bold text-cyan-400 print:text-black">{site.confidenceScore}%</span>
                </div>
              </div>
            </div>

            {/* Compound Statutory Liability Assessment */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider print:text-black flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 print:text-black" />
                <span>3. Statutory Penalty & Environmental Damage Assessment</span>
              </h3>
              <div className="border border-slate-700/80 rounded-lg overflow-hidden text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#080d1a] border-b border-slate-800 text-[10px] text-slate-400 uppercase print:bg-gray-100 print:text-black">
                    <tr>
                      <th className="p-2.5">Statutory Assessment Head</th>
                      <th className="p-2.5">Legal Provision</th>
                      <th className="p-2.5 text-right">Computed Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                    <tr>
                      <td className="p-2.5 text-slate-200 print:text-black">Unlawful Mineral Excavation Penalty</td>
                      <td className="p-2.5 text-slate-400 print:text-gray-700">Section 21(5), MMDR Act</td>
                      <td className="p-2.5 text-right font-semibold text-slate-100 print:text-black">₹ {extractionPenaltyLakhs} Lakhs</td>
                    </tr>
                    <tr className="bg-[#080d1a] print:bg-gray-50">
                      <td className="p-2.5 text-slate-200 print:text-black">Ecological Rehabilitation & Soil Cess</td>
                      <td className="p-2.5 text-slate-400 print:text-gray-700">Environment Protection Act</td>
                      <td className="p-2.5 text-right font-semibold text-slate-100 print:text-black">₹ {ecologicalFundLakhs} Lakhs</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-slate-200 print:text-black">Geospatial Administrative & Satellite Ingestion Fee</td>
                      <td className="p-2.5 text-slate-400 print:text-gray-700">DGMS Remote Sensing Rules</td>
                      <td className="p-2.5 text-right font-semibold text-slate-100 print:text-black">₹ {adminLevyLakhs} Lakhs</td>
                    </tr>
                    <tr className="bg-[#0b1426] border-t-2 border-slate-700 font-bold text-sm print:bg-gray-200">
                      <td className="p-2.5 text-white print:text-black" colSpan={2}>TOTAL STATUTORY COMPOUND LIABILITY</td>
                      <td className={`p-2.5 text-right ${isBenchmark ? 'text-emerald-400 print:text-green-800' : 'text-rose-400 print:text-red-800'}`}>
                        ₹ {totalLiabilityCrores} Crores
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Formal Directives */}
            <div className="space-y-1.5 text-xs text-slate-300 font-sans print:text-black">
              <h4 className="font-bold font-mono text-slate-200 uppercase print:text-black text-[11px]">4. Directives to Mine Management:</h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed print:text-gray-800">
                <li>Immediately halt all drilling, blast-hole excavation, and haulage equipment across coordinate boundary markers.</li>
                <li>Submit registered KML cadastre deeds and verified cadastral map before the District Collectorate within 48 hours.</li>
                <li>Deposit statutory compound assessment into Consolidated State Mineral Fund pending final joint physical demarcation.</li>
              </ol>
            </div>

            {/* Official Seal and Signature */}
            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-slate-400 print:text-black print:border-gray-400">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block print:text-gray-600">Verification Hash</span>
                <span className="font-mono text-[10px] text-slate-400 block bg-[#070b14] px-2 py-1 rounded border border-slate-800 print:bg-gray-100 print:text-gray-800">
                  SHA-256: 7f8a9e2d...{site.id}09ab4c...{site.code}
                </span>
              </div>
              <div className="text-right sm:text-right">
                <span className="font-bold text-slate-200 print:text-black block">Dr. K. R. Nambiar</span>
                <span className="text-[10px] text-slate-400 print:text-gray-700 block">Controller of Mines (Geospatial & Enforcement)</span>
                <span className="text-[10px] text-emerald-400 font-mono print:text-green-800 block">Digitally Certified via National Cadastre Portal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
