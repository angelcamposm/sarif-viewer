import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UploadCloud, FileCode2, Sparkles, X } from 'lucide-react';

interface DragDropOverlayProps {
  onFileLoaded: (fileContent: string, fileName: string) => void;
  activeReportName?: string;
  isEnabled?: boolean;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({
  onFileLoaded,
  activeReportName,
  isEnabled = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      if (!isEnabled) return;
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        dragCounterRef.current += 1;
        if (dragCounterRef.current === 1) {
          setIsDragging(true);
        }
      }
    },
    [isEnabled]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      if (!isEnabled) return;
      e.preventDefault();
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    },
    [isEnabled]
  );

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      if (!isEnabled) return;
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    [isEnabled]
  );

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      if (!isEnabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const file = e.dataTransfer?.files?.[0];
      if (file) {
        try {
          const text = await file.text();
          onFileLoaded(text, file.name);
        } catch (err) {
          console.error('Failed to read dropped file:', err);
        }
      }
    },
    [isEnabled, onFileLoaded]
  );

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dragCounterRef.current = 0;
        setIsDragging(false);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  if (!isDragging) return null;

  return (
    <div
      role="region"
      aria-label="Drop SARIF Report Overlay"
      className="fixed inset-0 z-50 bg-slate-950/75 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150 transition-all"
    >
      <div className="max-w-xl w-full p-8 sm:p-12 rounded-3xl border-2 border-dashed border-blue-500 bg-white/95 dark:bg-zinc-900/95 text-slate-900 dark:text-zinc-100 shadow-2xl flex flex-col items-center text-center relative animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={() => {
            dragCounterRef.current = 0;
            setIsDragging(false);
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Dismiss drop overlay (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/10">
          <UploadCloud className="w-10 h-10 animate-bounce" />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <span>Drop New SARIF Report</span>
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
        </h3>

        <p className="text-sm text-slate-600 dark:text-zinc-300 mt-2 max-w-md leading-relaxed">
          Release the file anywhere on screen to replace{' '}
          {activeReportName ? (
            <strong className="font-mono text-blue-600 dark:text-blue-400 font-semibold break-all">
              {activeReportName}
            </strong>
          ) : (
            'the current report'
          )}{' '}
          and load the new findings.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-700 dark:text-zinc-300">
          <FileCode2 className="w-4 h-4 text-blue-500" />
          <span>Supports OASIS SARIF 2.1.0 (.sarif, .json)</span>
        </div>
      </div>
    </div>
  );
};
