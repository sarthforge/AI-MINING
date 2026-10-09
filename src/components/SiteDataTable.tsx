import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpDown, 
  Copy, 
  Check, 
  Sparkles,
  MapPin
} from 'lucide-react';
import type { MiningSite } from '../types';


interface SiteDataTableProps {
  sites: MiningSite[];
  selectedSite: MiningSite;
  onSelectSite: (site: MiningSite) => void;
  onAnalyzeSite: (site: MiningSite) => void;
  onExportCSV: () => void;
}

export const SiteDataTable: React.FC<SiteDataTableProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  onAnalyzeSite,
  onExportCSV
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'totalAreaHa' | 'changePercentage' | 'confidenceScore' | 'newExcavationHa'>('newExcavationHa');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredAndSortedSites = useMemo(() => {
    return sites
      .filter(site => {
        const matchesSearch = 
          site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.mineralTarget.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = 
          statusFilter === 'all' || 
          site.alertStatus.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
  }, [sites, searchTerm, statusFilter, sortField, sortAsc]);

  const handleCopyCoords = (coords: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(coords);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getAlertBadge = (status: MiningSite['alertStatus']) => {
    switch (status) {
      case 'High Priority':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60 shadow-sm shadow-rose-950/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            High Priority
          </span>
        );
      case 'Investigation Required':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Investigation Required
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-950/80 text-blue-300 border border-blue-700/60">
            Under Review
          </span>
        );
      case 'Normal Compliance':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Normal Compliance
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0b1120] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 bg-[#080d1a] border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Global Monitored Mining AOI Registry</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
              {filteredAndSortedSites.length} of {sites.length} Active
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Geospatial surveillance records with multispectral area changes & neural verification flags
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search site, country, mineral..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#0d1424] border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-[#0d1424] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-[#0b1120]">All Statuses</option>
              <option value="high priority" className="bg-[#0b1120]">High Priority (3)</option>
              <option value="investigation required" className="bg-[#0b1120]">Investigation Required</option>
              <option value="normal compliance" className="bg-[#0b1120]">Normal Compliance</option>
              <option value="under review" className="bg-[#0b1120]">Under Review</option>
            </select>
          </div>

          {/* Download CSV */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs transition cursor-pointer"
            title="Download full CSV spreadsheet report"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#070b14] border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Site & Location</th>
              <th className="py-3 px-3">Coordinates (GIS)</th>
              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-200"
                onClick={() => {
                  setSortField('totalAreaHa');
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Footprint (ha)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-200"
                onClick={() => {
                  setSortField('newExcavationHa');
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center gap-1">
                  <span>Excavation Δ</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3 px-3 cursor-pointer hover:text-slate-200"
                onClick={() => {
                  setSortField('confidenceScore');
                  setSortAsc(!sortAsc);
                }}
              >
                <div className="flex items-center gap-1">
                  <span>AI Confidence</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Alert Status</th>
              <th className="py-3 px-3">Legal Classification Notice</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredAndSortedSites.map((site) => {
              const isSelected = site.id === selectedSite.id;
              const isHigh = site.alertStatus === 'High Priority';

              return (
                <tr
                  key={site.id}
                  onClick={() => onSelectSite(site)}
                  className={`transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Site & Location */}
                  <td className="py-3.5 px-4 font-sans">
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 p-1 rounded ${
                        isHigh ? 'bg-rose-950 text-rose-400 border border-rose-800/60' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {site.code}
                          </span>
                          <span className="font-semibold text-slate-100 group-hover:text-emerald-300 transition">
                            {site.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{site.region}, {site.country}</span>
                          <span>•</span>
                          <span className="text-amber-400/90 font-mono text-[10px]">{site.mineralTarget}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Coordinates with Copy action */}
                  <td className="py-3.5 px-3">
                    <div 
                      onClick={(e) => handleCopyCoords(site.formattedCoordinates, site.id, e)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-300 bg-slate-900/80 px-2 py-1 rounded border border-slate-700/80 hover:border-emerald-500/50 cursor-pointer"
                      title="Click to copy coordinates"
                    >
                      <span>{site.formattedCoordinates}</span>
                      {copiedId === site.id ? (
                        <Check className="w-3 h-3 text-emerald-400 ml-1" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 group-hover:text-slate-300 ml-1" />
                      )}
                    </div>
                  </td>

                  {/* Total Area Footprint */}
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-white text-xs">{site.totalAreaHa}</span>
                    <span className="text-slate-400 text-[11px] ml-1">ha</span>
                  </td>

                  {/* Excavation Change */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-bold text-xs ${site.newExcavationHa >= 1.5 ? 'text-rose-400' : 'text-amber-400'}`}>
                        +{site.newExcavationHa} ha
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (+{site.changePercentage}%)
                      </span>
                    </div>
                  </td>

                  {/* AI Confidence */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-1 w-24">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-400">{site.confidenceScore}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all"
                          style={{ width: `${site.confidenceScore}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Alert Status */}
                  <td className="py-3.5 px-3">
                    {getAlertBadge(site.alertStatus)}
                  </td>

                  {/* Legal Notice */}
                  <td className="py-3.5 px-3 font-sans">
                    <span className="text-[11px] text-amber-400/90 italic bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/30">
                      suspected unauthorized mining — permit verification required
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSite(site);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-medium transition cursor-pointer"
                        title="View on satellite imagery panel"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAnalyzeSite(site);
                        }}
                        className="p-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] transition cursor-pointer"
                        title="Run AI analysis report for this site"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Demo Notice */}
      <div className="p-3 bg-[#080d1a] border-t border-slate-800 text-[11px] text-slate-400 font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Cadastral overlay linked with National Mining Registry (ANM Brazil / INGEMMET Peru)</span>
        </div>
        <div className="text-amber-400/80">
          ALL RECORDS LABELED DEMO / SIMULATED DATA
        </div>
      </div>
    </div>
  );
};
