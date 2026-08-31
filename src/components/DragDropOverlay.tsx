import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UploadCloud, FileCode2, X } from 'lucide-react';

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

  const handleDismiss = useCallback(() => {
    dragCounterRef.current = 0;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
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
  }, [isEnabled, handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handleDismiss]);

  if (!isDragging) return null;

  return (
    <dialog
      open
      aria-labelledby="drop-overlay-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/75 backdrop-blur-xs w-full h-full border-none max-w-none max-h-none overflow-hidden m-0 animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-8 text-center relative text-slate-900 dark:text-zinc-100 animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="Dismiss drop overlay (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 rounded-2xl border-2 border-dashed border-blue-500/80 dark:border-blue-500/70 bg-blue-50/40 dark:bg-blue-950/20 flex flex-col items-center justify-center text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 shadow-2xs border border-blue-100 dark:border-zinc-700">
            <UploadCloud className="w-8 h-8 animate-bounce" />
          </div>

          <h2 id="drop-overlay-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 mb-2">
            Open new SARIF report
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
            Drop your file to replace{' '}
            {activeReportName ? (
              <strong className="font-mono text-slate-800 dark:text-zinc-200 font-semibold break-all">
                {activeReportName}
              </strong>
            ) : (
              'the current report'
            )}{' '}
            and review new findings.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-700/80 text-xs font-medium text-slate-600 dark:text-zinc-300 shadow-2xs">
            <FileCode2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="font-mono text-[11px]">.sarif • .json (SARIF 2.1.0)</span>
          </div>
        </div>
      </div>
    </dialog>
  );
};
