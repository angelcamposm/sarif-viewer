import React, { useState } from 'react';
import { NormalizedFinding, MuteRecord } from './types/viewer';
import { useTheme } from './hooks/useTheme';
import { useMuteStorage } from './hooks/useMuteStorage';
import { useReport } from './hooks/useReport';
import { useFilters } from './hooks/useFilters';
import { ReportProvider } from './context/ReportContext';
import { FilterProvider } from './context/FilterContext';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

// Components
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { FilterBar } from './components/FilterBar';
import { FindingsTable } from './components/FindingsTable';
import { DetailsPanel } from './components/DetailsPanel';
import { EmptyState } from './components/EmptyState';
import { MuteModal } from './components/MuteModal';
import { MuteManagerDialog } from './components/MuteManagerDialog';
import { RawSarifModal } from './components/RawSarifModal';
import { InvocationsPanel } from './components/InvocationsPanel';
import { Footer } from './components/Footer';

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { report, loadFile, closeReport } = useReport();
  const {
    filters,
    setFilters,
    clearFilters,
    filteredFindings,
    setSelectedFindingId,
    selectedFinding,
    levelOptions,
  } = useFilters();
  const { mutedRecords, mute, unmute, clearAll } = useMuteStorage();

  // Modals presentation state
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
  const [modalFinding, setModalFinding] = useState<NormalizedFinding | null>(null);
  const [isMuteManagerOpen, setIsMuteManagerOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [rawSarifModalFinding, setRawSarifModalFinding] = useState<NormalizedFinding | null>(null);

  // Keyboard navigation hook
  useKeyboardNavigation(
    filteredFindings,
    selectedFinding?.id || null,
    setSelectedFindingId
  );

  const handleOpenMuteModal = (finding: NormalizedFinding) => {
    setModalFinding(finding);
    setIsMuteModalOpen(true);
  };

  const handleConfirmMute = (record: MuteRecord) => {
    mute(record);
  };

  const handleConfirmUnmute = (findingId: string) => {
    unmute(findingId);
  };

  const totalMutedCount = Object.keys(mutedRecords).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 selection:bg-blue-100 dark:selection:bg-zinc-800 dark:selection:text-white font-sans transition-colors duration-200">
      {!report ? (
        <EmptyState
          onFileLoaded={loadFile}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <>
          {/* Global Application Header */}
          <Header
            report={report}
            filteredFindings={filteredFindings}
            onFileLoaded={loadFile}
            onOpenMuteManager={() => setIsMuteManagerOpen(true)}
            onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
            onCloseReport={closeReport}
            mutedCount={totalMutedCount}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          {/* Main Content Area */}
          <main className="flex-1 w-full flex flex-col">
            {/* Top Metrics Cards Summary */}
            <MetricsBar
              report={report}
              selectedLevel={filters.selectedLevel}
              onSelectLevel={(level) => setFilters({ selectedLevel: level })}
              muteStatus={filters.muteStatus}
              onSelectMuteStatus={(status) => setFilters({ muteStatus: status })}
            />

            {/* Filter and Search Bar */}
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={clearFilters}
              availableRules={report.allRules}
              availableTags={report.allTags}
              levelOptions={levelOptions}
            />

            {/* Two-Column Workspace Layout */}
            <div className="bg-white dark:bg-zinc-900 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start px-4 sm:px-6 lg:px-8 py-5">
              {/* Left Column: Interactive Sortable Findings Table */}
              <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
                <FindingsTable
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
          onClearAll={clearAll}
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

export const App: React.FC = () => {
  return (
    <ReportProvider>
      <FilterProvider>
        <AppContent />
      </FilterProvider>
    </ReportProvider>
  );
};

export default App;
