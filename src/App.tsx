import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { KPICards } from './components/KPICards';
import { SatelliteViewer } from './components/SatelliteViewer';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { ChangeTrackingChart } from './components/ChangeTrackingChart';
import { SiteDataTable } from './components/SiteDataTable';
import { AnalysisModal } from './components/AnalysisModal';
import { AlertDrawer } from './components/AlertDrawer';
import { DisclaimerFooter } from './components/DisclaimerFooter';
import { MONITORED_SITES, SIMULATED_ALERTS } from './data/mockData';
import type { MiningSite, SatelliteAlert } from './types';
import { exportSitesToCSV } from './utils/csvExport';
import { 
  ScanSearch, 
  GitCompare, 
  BellRing
} from 'lucide-react';


export function App() {
  const [sites] = useState<MiningSite[]>(MONITORED_SITES);
  const [selectedSite, setSelectedSite] = useState<MiningSite>(MONITORED_SITES[0]);
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('30d');
  const [alerts, setAlerts] = useState<SatelliteAlert[]>(SIMULATED_ALERTS);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [analysisTargetSite, setAnalysisTargetSite] = useState<MiningSite>(MONITORED_SITES[0]);

  const unreadAlertCount = alerts.filter(a => !a.dismissed).length;

  const handleOpenAnalysisForSite = (site: MiningSite) => {
    setAnalysisTargetSite(site);
    setSelectedSite(site);
    setIsAnalysisModalOpen(true);
  };

  const handleOpenAnalysisFromHeader = () => {
    setAnalysisTargetSite(selectedSite);
    setIsAnalysisModalOpen(true);
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, dismissed: true } : a));
  };

  const handleResetAlerts = () => {
    setAlerts(SIMULATED_ALERTS);
  };

  const handleSelectSiteFromAlert = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    if (site) {
      setSelectedSite(site);
      setCurrentTab('detection');
    }
  };

  const handleExportCSV = () => {
    exportSitesToCSV(sites);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        selectedSite={selectedSite}
        onSelectSite={setSelectedSite}
        allSites={sites}
        selectedDateRange={selectedDateRange}
        onSelectDateRange={setSelectedDateRange}
        onOpenAnalysis={handleOpenAnalysisFromHeader}
        onOpenAlerts={() => setIsAlertDrawerOpen(true)}
        unreadAlertCount={unreadAlertCount}
        onExportCSV={handleExportCSV}
      />

      {/* Main Workspace Layout (Sidebar + Content Area) */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Navigation & Telemetry Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          unreadAlertCount={unreadAlertCount}
          selectedSite={selectedSite}
          allSites={sites}
          onSelectSite={(site) => {
            setSelectedSite(site);
            // If currently on alerts tab, switch to detection to view the selected site
            if (currentTab === 'alerts') setCurrentTab('detection');
          }}
        />

        {/* Primary Dashboard Content Area */}
        <main className="flex-1 p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top KPI Cards Strip (Always Visible for Instant Situational Awareness) */}
          <KPICards
            onOpenAlerts={() => setIsAlertDrawerOpen(true)}
            onNavigateToTracking={() => setCurrentTab('tracking')}
            onNavigateToDetection={() => setCurrentTab('detection')}
          />

          {/* Tab 1: Overview (Comprehensive Intelligence Hub) */}
          {currentTab === 'overview' && (
            <div className="space-y-6">
              {/* Satellite Imagery Panel */}
              <SatelliteViewer
                site={selectedSite}
                onAnalyzeSite={() => handleOpenAnalysisForSite(selectedSite)}
              />

              {/* Before/After & Historical Chart Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <BeforeAfterSlider site={selectedSite} />
                <ChangeTrackingChart site={selectedSite} />
              </div>

              {/* All Sites Data Table */}
              <SiteDataTable
                sites={sites}
                selectedSite={selectedSite}
                onSelectSite={(site) => {
                  setSelectedSite(site);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onAnalyzeSite={handleOpenAnalysisForSite}
                onExportCSV={handleExportCSV}
              />
            </div>
          )}

          {/* Tab 2: Detection (Deep Imagery & GIS Polygons Focus) */}
          {currentTab === 'detection' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ScanSearch className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-white">
                    Satellite Orthomosaic & Boundary Breach Detection
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Target: {selectedSite.name} ({selectedSite.code})
                </span>
              </div>

              <SatelliteViewer
                site={selectedSite}
                onAnalyzeSite={() => handleOpenAnalysisForSite(selectedSite)}
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <BeforeAfterSlider site={selectedSite} />
                <ChangeTrackingChart site={selectedSite} />
              </div>
            </div>
          )}

          {/* Tab 3: Change Tracking (Multi-Temporal Analysis) */}
          {currentTab === 'tracking' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">
                    Multi-Temporal Excavation Velocity & Vegetation Tracking
                  </h2>
                </div>
                <span className="text-xs font-mono text-emerald-400">
                  Baseline: {selectedSite.baselineDate} → Current: {selectedSite.lastObservationDate}
                </span>
              </div>

              <BeforeAfterSlider site={selectedSite} />
              <ChangeTrackingChart site={selectedSite} />

              <SiteDataTable
                sites={sites}
                selectedSite={selectedSite}
                onSelectSite={setSelectedSite}
                onAnalyzeSite={handleOpenAnalysisForSite}
                onExportCSV={handleExportCSV}
              />
            </div>
          )}

          {/* Tab 4: Alerts (Simulated Triage Center) */}
          {currentTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-rose-400" />
                  <h2 className="text-lg font-bold text-white">
                    Simulated High-Priority Incident Triage Queue
                  </h2>
                </div>
                <span className="text-xs font-mono text-rose-400 font-semibold">
                  {unreadAlertCount} Critical Breaches Flagged
                </span>
              </div>

              {/* Quick Alerts Triage Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {alerts.map(alert => (
                  <div 
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all ${
                      alert.dismissed 
                        ? 'bg-[#080d1a]/50 border-slate-800 opacity-60' 
                        : 'bg-[#0b1120] border-rose-900/60 shadow-lg shadow-rose-950/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                        {alert.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {alert.confidence}% Conf.
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1">{alert.title}</h3>
                    <p className="text-xs text-slate-400 mb-3">{alert.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-mono">
                      <span className="text-rose-400 font-bold">+{alert.detectedHectares} ha breach</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectSiteFromAlert(alert.siteId)}
                          className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 text-[11px] cursor-pointer"
                        >
                          View Map
                        </button>
                        {!alert.dismissed && (
                          <button
                            onClick={() => handleDismissAlert(alert.id)}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[11px] cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Supporting Table */}
              <SiteDataTable
                sites={sites}
                selectedSite={selectedSite}
                onSelectSite={setSelectedSite}
                onAnalyzeSite={handleOpenAnalysisForSite}
                onExportCSV={handleExportCSV}
              />
            </div>
          )}

          {/* Technical and Legal Disclaimer Footer */}
          <DisclaimerFooter />
        </main>
      </div>

      {/* Slide-out Alert Drawer */}
      <AlertDrawer
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        alerts={alerts}
        onDismissAlert={handleDismissAlert}
        onResetAlerts={handleResetAlerts}
        onSelectSiteFromAlert={handleSelectSiteFromAlert}
      />


      {/* Functional AI Analysis Modal */}
      <AnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        site={analysisTargetSite}
      />
    </div>
  );
}

export default App;
