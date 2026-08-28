import React, { useState } from 'react';
import {
  NormalizedCodeFlow,
  NormalizedCodeFlowStep,
} from '../types/viewer';
import {
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FileCode,
  Sparkles,
  Terminal,
} from 'lucide-react';

interface DataflowStepperProps {
  codeFlows: NormalizedCodeFlow[];
}

export const DataflowStepper: React.FC<DataflowStepperProps> = ({ codeFlows }) => {
  const [selectedFlowIndex] = useState(0);
  const [selectedThreadIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!codeFlows || codeFlows.length === 0) return null;

  const currentFlow = codeFlows[selectedFlowIndex] || codeFlows[0];
  const currentThread = currentFlow.threadFlows[selectedThreadIndex] || currentFlow.threadFlows[0];
  const steps = currentThread?.steps || [];
  const currentStep: NormalizedCodeFlowStep | undefined = steps[currentStepIndex] || steps[0];

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col transition-colors duration-200">
      {/* Header & Flow Selector */}
      <div className="p-3.5 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Dataflow & Taint Path</span>
              <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded text-[10px] font-mono font-semibold">
                {steps.length} Steps
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {currentFlow.message || 'Execution trace from source to vulnerable sink'}
            </p>
          </div>
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStepIndex <= 0}
            className="px-2 py-1 text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 dark:border-zinc-700 rounded-md transition-colors shadow-2xs flex items-center gap-1 cursor-pointer text-slate-700 dark:text-zinc-300"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <span className="text-[11px] font-mono font-semibold px-2 py-1 bg-slate-100 dark:bg-zinc-800 rounded border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200">
            {currentStepIndex + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={currentStepIndex >= steps.length - 1}
            className="px-2 py-1 text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 dark:border-zinc-700 rounded-md transition-colors shadow-2xs flex items-center gap-1 cursor-pointer text-slate-700 dark:text-zinc-300"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Steps Timeline */}
      <div className="p-3 bg-slate-100/70 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto flex items-center gap-2">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isSource = idx === 0;
          const isSink = idx === steps.length - 1;

          return (
            <React.Fragment key={idx}>
              <button
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all shrink-0 cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-xs'
                    : isSource
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                    : isSink
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                    : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                }`}>
                  {step.step || idx + 1}
                </span>
                <span className="font-mono text-[11px]">
                  {isSource ? 'Source' : isSink ? 'Sink' : step.fileName || `Step ${idx + 1}`}
                </span>
                {step.line && <span className="opacity-75 text-[10px]">:{step.line}</span>}
              </button>

              {idx < steps.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active Step Details */}
      {currentStep && (
        <div className="p-4 space-y-3">
          {/* Step Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                currentStepIndex === 0
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : currentStepIndex === steps.length - 1
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
              }`}>
                {currentStepIndex === 0 ? 'Taint Source' : currentStepIndex === steps.length - 1 ? 'Vulnerable Sink' : 'Propagation Step'}
              </span>

              {currentStep.importance && (
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono capitalize">
                  Importance: <strong>{currentStep.importance}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-300 font-mono">
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentStep.filePath}</span>
              {currentStep.line && <span className="font-bold text-blue-600 dark:text-blue-400">:{currentStep.line}</span>}
            </div>
          </div>

          {/* Step Message */}
          {currentStep.message && (
            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs text-slate-700 dark:text-zinc-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>{currentStep.message}</div>
            </div>
          )}

          {/* Step Code Snippet */}
          {currentStep.codeSnippet ? (
            <div className="bg-slate-900 dark:bg-black rounded-lg border border-slate-800 overflow-hidden font-mono text-xs text-slate-200">
              <div className="px-3 py-1.5 bg-slate-800/80 dark:bg-zinc-900/80 border-b border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                <span>Code at line {currentStep.line ?? 'N/A'}</span>
                {currentStep.module && <span>Module: {currentStep.module}</span>}
              </div>
              <pre className="p-3 overflow-x-auto leading-relaxed text-emerald-400 dark:text-emerald-300">
                <code>{currentStep.codeSnippet}</code>
              </pre>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 dark:bg-zinc-900/60 rounded-lg border border-dashed border-slate-300 dark:border-zinc-800 text-xs text-slate-500 dark:text-zinc-400 text-center">
              No code snippet provided for this execution step.
            </div>
          )}

          {/* Variable State Tracker (if tool captured variable state) */}
          {currentStep.state && Object.keys(currentStep.state).length > 0 && (
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-zinc-100 mb-2">
                <Terminal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Captured Variables State</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(currentStep.state).map(([varName, varVal]) => (
                  <div key={varName} className="p-1.5 bg-slate-50 dark:bg-zinc-950 rounded border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-purple-700 dark:text-purple-300 font-semibold">{varName}:</span>
                    <span className="text-slate-800 dark:text-zinc-200 truncate">{varVal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
