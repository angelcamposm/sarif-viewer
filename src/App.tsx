import React, { useState, useEffect, useMemo } from 'react';
import { SarifLog } from './types/sarif';
import {
  NormalizedFinding,
  MuteRecord,
  FilterState,
} from './types/viewer';
import { parseSarifJson } from './services/sarifParser';
import { muteStorage } from './services/muteStorage';

// Components
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { FilterBar, LevelOption } from './components/FilterBar';
import { FindingsTable } from './components/FindingsTable';
import { DetailsPanel } from './components/DetailsPanel';
import { EmptyState } from './components/EmptyState';
import { MuteModal } from './components/MuteModal';
import { MuteManagerDialog } from './components/MuteManagerDialog';
import { RawSarifModal } from './components/RawSarifModal';
import { InvocationsPanel } from './components/InvocationsPanel';
import { Footer } from './components/Footer';

const initialFilters: FilterState = {
  searchQuery: '',
  selectedLevel: 'all',
  selectedRule: 'all',
  selectedTag: 'all',
  muteStatus: 'all',
};

const SESSION_REPORT_KEY = 'sarif_viewer_active_report_v1';

export const App: React.FC = () => {
  // Theme State: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('sarif_viewer_theme') as 'light' | 'dark' | null;
        if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')?.matches) {
          return 'dark';
        }
      }
    } catch (e) {
      console.warn('Theme initialization error:', e);
    }
    return 'light';
  });

  // Apply dark class to <html> root element
  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('sarif_viewer_theme', theme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Raw file state (restored safely from sessionStorage if user refreshed with F5)
  const [rawSarif, setRawSarif] = useState<{ content: string; filename: string } | null>(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const saved = sessionStorage.getItem(SESSION_REPORT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.content === 'string' && typeof parsed.filename === 'string') {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore session report:', e);
    }
    return null;
  });

  // Report instance counter for clean unmounting/remounting of tables and panels
  const [reportInstanceId, setReportInstanceId] = useState(0);

  // Muted records state directly mirrored from storage
  const [mutedRecords, setMutedRecords] = useState<Record<string, MuteRecord>>(() =>
    muteStorage.getAll()
  );

  // UI state
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Modals state
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [modalFinding, setModalFinding] = useState<NormalizedFinding | null>(null);
  const [isMuteManagerOpen, setIsMuteManagerOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [rawSarifModalFinding, setRawSarifModalFinding] = useState<NormalizedFinding | null>(null);

  // Subscribe to mute storage changes
  useEffect(() => {
    const unsubscribe = muteStorage.subscribe((records) => {
      setMutedRecords(records);
    });
    return unsubscribe;
  }, []);

  // Derive parsed report via useMemo (zero cascading render warnings)
  const report = useMemo(() => {
    if (!rawSarif) return null;
    try {
      const parsedJson = JSON.parse(rawSarif.content) as SarifLog;
      return parseSarifJson(parsedJson, rawSarif.filename, mutedRecords);
    } catch (err: any) {
      console.error('Failed to parse SARIF:', err);
      return null;
    }
  }, [rawSarif, mutedRecords]);

  // Generate available level filter options (original baseline levels + all overwritten tags/levels)
  const levelOptions: LevelOption[] = useMemo(() => {
    const baseOptions: LevelOption[] = [
      { value: 'all', label: 'All levels' },
      { value: 'error', label: 'Errors' },
      { value: 'warning', label: 'Warnings' },
      { value: 'note', label: 'Notes' },
      { value: 'none', label: 'None' },
    ];

    if (!report) return baseOptions;

    // Collect all distinct override tags present in this report
    const overrideTags = Array.from(
      new Set(
        report.findings
          .filter((f) => f.isLevelOverridden && f.overrideTag)
          .map((f) => f.overrideTag!)
      )
    ).sort();

    const overrideOptions: LevelOption[] = overrideTags.map((tag) => ({
      value: `override:${tag}`,
      label: `${tag} (Overwritten)`,
      isOverride: true,
    }));

    return [...baseOptions, ...overrideOptions];
  }, [report]);

  // Handle file loading - complete wipe, reset, and session storage cache
  const handleFileLoaded = (fileContent: string, fileName: string) => {
    try {
      const parsedJson = JSON.parse(fileContent);
      if (!parsedJson || typeof parsedJson !== 'object' || (!parsedJson.runs && !parsedJson.version)) {
        alert('Invalid SARIF file: Missing runs array or SARIF version header.');
        return;
      }

      // 1. Reset all filters and selection
      setFilters(initialFilters);
      setSelectedFindingId(null);
      setRawSarifModalFinding(null);
      setModalFinding(null);
      setIsMuteModalOpen(false);
      setIsMuteManagerOpen(false);

      // 2. Increment instance counter to force complete unmount of old table/panel
      setReportInstanceId((prev) => prev + 1);

      // 3. Set new raw content and persist in sessionStorage for refresh resiliency
      const reportPayload = { content: fileContent, filename: fileName };
      setRawSarif(reportPayload);

      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem(SESSION_REPORT_KEY, JSON.stringify(reportPayload));
        }
      } catch (storageErr) {
        console.warn('Report too large for sessionStorage quota, caching skipped:', storageErr);
      }
    } catch (e: any) {
      alert(`Invalid JSON format: ${e.message}`);
    }
  };

  // Close active report and return to Welcome/EmptyState
  const handleCloseReport = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(SESSION_REPORT_KEY);
      }
    } catch (e) {
      console.warn('Failed to clear sessionStorage report:', e);
    }
    setRawSarif(null);
    setFilters(initialFilters);
    setSelectedFindingId(null);
    setRawSarifModalFinding(null);
    setModalFinding(null);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev: FilterState) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  // Filtered Findings computed memo
  const filteredFindings = useMemo(() => {
    if (!report) return [];

    return report.findings.filter((finding) => {
      // 1. Text Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesQuery =
          finding.ruleId.toLowerCase().includes(query) ||
          (finding.ruleName && finding.ruleName.toLowerCase().includes(query)) ||
          finding.message.toLowerCase().includes(query) ||
          finding.filePath.toLowerCase().includes(query) ||
          finding.tags.some((t) => t.toLowerCase().includes(query)) ||
          finding.effectiveLevel.toLowerCase().includes(query) ||
          (finding.overrideTag && finding.overrideTag.toLowerCase().includes(query));

        if (!matchesQuery) return false;
      }

      // 2. Severity Level filter (supporting both baseline levels and specific override tags)
      if (filters.selectedLevel !== 'all') {
        if (filters.selectedLevel.startsWith('override:')) {
          const targetTag = filters.selectedLevel.replace('override:', '');
          if (!finding.isLevelOverridden || finding.overrideTag?.toLowerCase() !== targetTag.toLowerCase()) {
            return false;
          }
        } else {
          // Matches if either effectiveLevel or originalLevel matches
          if (
            finding.effectiveLevel !== filters.selectedLevel &&
            finding.originalLevel !== filters.selectedLevel
          ) {
            return false;
          }
        }
      }

      // 3. Rule ID filter
      if (filters.selectedRule !== 'all') {
        if (finding.ruleId !== filters.selectedRule) return false;
      }

      // 4. Tag filter
      if (filters.selectedTag !== 'all') {
        if (!finding.tags.includes(filters.selectedTag)) return false;
      }

      // 5. Mute Status filter
      if (filters.muteStatus === 'active' && finding.isMuted) return false;
      if (filters.muteStatus === 'muted' && !finding.isMuted) return false;

      return true;
    });
  }, [report, filters]);

  // Selected Finding object
  const selectedFinding = useMemo(() => {
    if (!report || report.findings.length === 0) return null;
    if (selectedFindingId) {
      const match = report.findings.find((f) => f.id === selectedFindingId);
      if (match) return match;
    }
    return filteredFindings[0] || report.findings[0] || null;
  }, [report, selectedFindingId, filteredFindings]);

  // Keyboard navigation for findings table
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (filteredFindings.length === 0) return;
        e.preventDefault();

        const currentIndex = filteredFindings.findIndex((f) => f.id === selectedFinding?.id);
        let nextIndex = currentIndex;

        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < filteredFindings.length - 1 ? currentIndex + 1 : 0;
        } else if (e.key === 'ArrowUp') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredFindings.length - 1;
        }

        if (filteredFindings[nextIndex]) {
          setSelectedFindingId(filteredFindings[nextIndex].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredFindings, selectedFinding]);

  const handleOpenMuteModal = (finding: NormalizedFinding) => {
    setModalFinding(finding);
    setIsMuteModalOpen(true);
  };

  const handleConfirmMute = (record: MuteRecord) => {
    muteStorage.mute(record);
  };

  const handleConfirmUnmute = (findingId: string) => {
    muteStorage.unmute(findingId);
  };

  const handleClearAllMuted = () => {
    muteStorage.clearAll();
  };

  const totalMutedCount = Object.keys(mutedRecords).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 selection:bg-blue-100 dark:selection:bg-zinc-800 dark:selection:text-white font-sans transition-colors duration-200">
      {!report ? (
        <EmptyState
          onFileLoaded={handleFileLoaded}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      ) : (
        <>
          {/* Global Application Header */}
          <Header
            report={report}
            filteredFindings={filteredFindings}
            onFileLoaded={handleFileLoaded}
            onOpenMuteManager={() => setIsMuteManagerOpen(true)}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
            onCloseReport={handleCloseReport}
            mutedCount={totalMutedCount}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />

          {/* Main Content Area */}
          <main className="flex-1 w-full flex flex-col">
            {/* Top Metrics Cards Summary */}
            <MetricsBar
              key={`metrics_${reportInstanceId}_${report.fileName}`}
              report={report}
              selectedLevel={filters.selectedLevel}
              onSelectLevel={(level) => handleFilterChange({ selectedLevel: level })}
            />

            {/* Filter and Search Bar */}
            <FilterBar
              key={`filter_${reportInstanceId}_${report.fileName}`}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              availableRules={report.allRules}
              availableTags={report.allTags}
              levelOptions={levelOptions}
            />

            {/* Two-Column Workspace Layout */}
            <div className="bg-white dark:bg-zinc-900 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start  px-4 sm:px-6 lg:px-8 py-5">
              {/* Left Column: Interactive Sortable Findings Table */}
              <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
                <FindingsTable
                  key={`table_${reportInstanceId}_${report.fileName}`}
                  findings={filteredFindings}
                  selectedFindingId={selectedFinding?.id || null}
                  onSelectFinding={(f) => setSelectedFindingId(f.id)}
                  onToggleMute={handleOpenMuteModal}
                  onViewRawSarif={(f) => setRawSarifModalFinding(f)}
                />
              </div>

              {/* Right Column: Deep Findings Detail Panel */}
              <div className="lg:col-span-5 xl:col-span-5 flex flex-col sticky top-20">
                <DetailsPanel
                  key={`details_${reportInstanceId}_${report.fileName}`}
                  finding={selectedFinding}
                  reportFileName={report.fileName}
                  onToggleMute={handleOpenMuteModal}
                  onViewRawSarif={(f) => setRawSarifModalFinding(f)}
                />
              </div>
            </div>
          </main>

          {/* Global Application Footer */}
          <Footer
            report={report}
            filteredCount={filteredFindings.length}
          />
        </>
      )}

      {/* Modal: Single Finding Mute Form */}
      {isMuteModalOpen && modalFinding && (
        <MuteModal
          finding={modalFinding}
          isOpen={isMuteModalOpen}
          onClose={() => setIsMuteModalOpen(false)}
          onConfirmMute={handleConfirmMute}
          onConfirmUnmute={handleConfirmUnmute}
        />
      )}

      {/* Modal: Global Muted Alerts Manager */}
      {isMuteManagerOpen && (
        <MuteManagerDialog
          isOpen={isMuteManagerOpen}
          onClose={() => setIsMuteManagerOpen(false)}
          mutedRecords={mutedRecords}
          onUnmute={handleConfirmUnmute}
          onClearAll={handleClearAllMuted}
        />
      )}

      {/* Modal: Tool Invocations & Diagnostics */}
      {isDiagnosticsOpen && report && (
        <InvocationsPanel
          report={report}
          isOpen={isDiagnosticsOpen}
          onClose={() => setIsDiagnosticsOpen(false)}
        />
      )}

      {/* Modal: Syntax Highlighted Raw SARIF Inspector */}
      {rawSarifModalFinding && (
        <RawSarifModal
          finding={rawSarifModalFinding}
          isOpen={!!rawSarifModalFinding}
          onClose={() => setRawSarifModalFinding(null)}
        />
      )}
    </div>
  );
};
export default App;
