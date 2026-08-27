import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { EmptyState } from './components/EmptyState';
import { MetricsBar } from './components/MetricsBar';
import { FilterBar, LevelOption } from './components/FilterBar';
import { FindingsTable } from './components/FindingsTable';
import { DetailsPanel } from './components/DetailsPanel';
import { Footer } from './components/Footer';
import { MuteModal } from './components/MuteModal';
import { MuteManagerDialog } from './components/MuteManagerDialog';
import { RawSarifModal } from './components/RawSarifModal';
import { parseSarifJson } from './services/sarifParser';
import { muteStorage } from './services/muteStorage';
import { NormalizedFinding, FilterState, MuteRecord } from './types/viewer';
import { SarifLog } from './types/sarif';

const initialFilters: FilterState = {
  searchQuery: '',
  selectedLevel: 'all',
  selectedRule: 'all',
  selectedTag: 'all',
  muteStatus: 'all',
};

export function App() {
  const [rawSarif, setRawSarif] = useState<{ content: string; filename: string } | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [mutedRecords, setMutedRecords] = useState<Record<string, MuteRecord>>(() => muteStorage.getAll());
  
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sarif_viewer_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Modals state
  const [modalFinding, setModalFinding] = useState<NormalizedFinding | null>(null);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [isMuteManagerOpen, setIsMuteManagerOpen] = useState(false);
  const [rawSarifModalFinding, setRawSarifModalFinding] = useState<NormalizedFinding | null>(null);

  // Sync theme to document.documentElement
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sarif_viewer_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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
      { value: 'error', label: 'Errors (Baseline / Effective)' },
      { value: 'warning', label: 'Warnings (Baseline / Effective)' },
      { value: 'note', label: 'Notes (Baseline / Effective)' },
      { value: 'none', label: 'None (Baseline / Effective)' },
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

  // Handle file loading
  const handleFileLoaded = (fileContent: string, fileName: string) => {
    try {
      const parsedJson = JSON.parse(fileContent);
      if (!parsedJson || typeof parsedJson !== 'object' || (!parsedJson.runs && !parsedJson.version)) {
        alert('Invalid SARIF file: Missing runs array or SARIF version header.');
        return;
      }
      setFilters(initialFilters);
      setRawSarif({ content: fileContent, filename: fileName });
      
      // Auto-select first finding if available
      const tempReport = parseSarifJson(parsedJson as SarifLog, fileName);
      if (tempReport.findings.length > 0) {
        setSelectedFindingId(tempReport.findings[0].id);
      }
    } catch (e: any) {
      alert(`Invalid JSON format: ${e.message}`);
    }
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
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
    if (!report) return null;
    return (
      report.findings.find((f) => f.id === selectedFindingId) ||
      filteredFindings[0] ||
      report.findings[0] ||
      null
    );
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
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 selection:bg-blue-100 dark:selection:bg-zinc-800 dark:selection:text-white font-sans transition-colors duration-200">
      {!report ? (
        <EmptyState
          onFileLoaded={handleFileLoaded}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      ) : (
        <>
          {/* Top Header Navigation (Full Width) */}
          <Header
            report={report}
            filteredFindings={filteredFindings}
            onFileLoaded={handleFileLoaded}
            onOpenMuteManager={() => setIsMuteManagerOpen(true)}
            mutedCount={totalMutedCount}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />

          <div className="bg-white dark:bg-zinc-900 flex-1 flex flex-col transition-colors duration-200">
            {/* Summary Metrics Bar (Full Width) */}
            <MetricsBar
              report={report}
              selectedLevel={filters.selectedLevel}
              onSelectLevel={(level) => handleFilterChange({ selectedLevel: level })}
              muteStatus={filters.muteStatus}
              onSelectMuteStatus={(status) => handleFilterChange({ muteStatus: status })}
            />

            {/* Search & Faceted Filter Bar (Full Width) */}
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              availableRules={report.allRules}
              availableTags={report.allTags}
              levelOptions={levelOptions}
            />

            {/* 12-Column Responsive Grid Layout (Full Width, No Boxed Constraint) */}
            <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 8 Columns: Findings Table */}
                <div className="lg:col-span-8">
                  <FindingsTable
                    findings={filteredFindings}
                    selectedFindingId={selectedFinding?.id || null}
                    onSelectFinding={(f) => setSelectedFindingId(f.id)}
                    onToggleMute={handleOpenMuteModal}
                    onViewRawSarif={(f) => setRawSarifModalFinding(f)}
                  />
                </div>

                {/* 4 Columns: Details Panel */}
                <div className="lg:col-span-4 sticky top-20">
                  <DetailsPanel
                    finding={selectedFinding}
                    reportFileName={report.fileName}
                    onToggleMute={handleOpenMuteModal}
                    onViewRawSarif={(f) => setRawSarifModalFinding(f)}
                  />
                </div>
              </div>
            </main>
          </div>

          {/* Footer Status Bar (Full Width) */}
          <Footer report={report} filteredCount={filteredFindings.length} />
        </>
      )}

      {/* Individual Mute Dialog */}
      <MuteModal
        finding={modalFinding}
        isOpen={isMuteModalOpen}
        onClose={() => setIsMuteModalOpen(false)}
        onConfirmMute={handleConfirmMute}
        onConfirmUnmute={handleConfirmUnmute}
      />

      {/* Mute Manager Dialog */}
      <MuteManagerDialog
        isOpen={isMuteManagerOpen}
        onClose={() => setIsMuteManagerOpen(false)}
        mutedRecords={mutedRecords}
        onUnmute={handleConfirmUnmute}
        onClearAll={handleClearAllMuted}
      />

      {/* Raw SARIF JSON Inspector Modal */}
      <RawSarifModal
        finding={rawSarifModalFinding}
        isOpen={!!rawSarifModalFinding}
        onClose={() => setRawSarifModalFinding(null)}
      />
    </div>
  );
}

export default App;
