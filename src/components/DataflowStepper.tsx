import React, { useState } from 'react';
import {
  NormalizedCodeFlow,
  NormalizedCodeFlowStep,
} from '../types/viewer';
import {
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

function getTimelineStepClass(isCurrent: boolean, isSource: boolean, isSink: boolean): string {
  if (isCurrent) {
    return 'bg-blue-600 text-white font-semibold shadow-xs';
  }
  if (isSource) {
    return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40';
  }
  if (isSink) {
    return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40';
  }
  return 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700';
}

export const DataflowStepper: React.FC<DataflowStepperProps> = ({ codeFlows }) => {
  const [selectedFlowIndex, setSelectedFlowIndex] = useState(0);
  const [selectedThreadIndex, setSelectedThreadIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!codeFlows || codeFlows.length === 0) return null;

  const safeFlowIndex = Math.min(selectedFlowIndex, codeFlows.length - 1);
  const currentFlow = codeFlows[safeFlowIndex] || codeFlows[0];
  const threadFlows = currentFlow.threadFlows || [];
  const safeThreadIndex = Math.min(selectedThreadIndex, Math.max(0, threadFlows.length - 1));
  const currentThread = threadFlows[safeThreadIndex] || threadFlows[0];
  const steps = currentThread?.steps || [];
  const safeStepIndex = Math.min(currentStepIndex, Math.max(0, steps.length - 1));
  const currentStep: NormalizedCodeFlowStep | undefined = steps[safeStepIndex] || steps[0];

  const handleSelectFlow = (idx: number) => {
    setSelectedFlowIndex(idx);
    setSelectedThreadIndex(0);
    setCurrentStepIndex(0);
  };

  const handleSelectThread = (idx: number) => {
    setSelectedThreadIndex(idx);
    setCurrentStepIndex(0);
  };

  const isSource = safeStepIndex === 0;
  const isSink = safeStepIndex === steps.length - 1 && steps.length > 1;

  return (
    <div className="space-y-4">
      {/* Top Stepper Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 rounded-lg p-0.5 border border-slate-200/80 dark:border-zinc-700/80">
            <button
              type="button"
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={safeStepIndex <= 0}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Previous step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-semibold px-2 text-slate-800 dark:text-zinc-200">
              Step {steps.length > 0 ? safeStepIndex + 1 : 0} of {steps.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={safeStepIndex >= steps.length - 1}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Next step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {(codeFlows.length > 1 || threadFlows.length > 1) && (
            <div className="flex items-center gap-2">
              {codeFlows.length > 1 && (
                <select
                  value={safeFlowIndex}
                  onChange={(e) => handleSelectFlow(Number(e.target.value))}
                  className="py-1 px-2 text-xs bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-md font-medium"
                >
                  {codeFlows.map((cf, idx) => (
                    <option key={`flow-${cf.message || idx}`} value={idx}>
                      {cf.message || `Flow #${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
              {threadFlows.length > 1 && (
                <select
                  value={safeThreadIndex}
                  onChange={(e) => handleSelectThread(Number(e.target.value))}
                  className="py-1 px-2 text-xs bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-md font-medium"
                >
                  {threadFlows.map((tf, idx) => (
                    <option key={`thread-${tf.id || tf.message || idx}`} value={idx}>
                      {tf.message || tf.id || `Thread #${idx + 1}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isSource && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wide">
              Taint Source
            </span>
          )}
          {isSink && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 uppercase tracking-wide">
              Taint Sink
            </span>
          )}
          {currentStep?.importance && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 capitalize">
              {currentStep.importance}
            </span>
          )}
        </div>
      </div>

      {/* Horizontal Path Timeline */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {steps.map((step, idx) => {
          const isCurrent = idx === safeStepIndex;
          const isStepSource = idx === 0;
          const isStepSink = idx === steps.length - 1 && steps.length > 1;

          return (
            <React.Fragment key={`step-${step.filePath}-${step.line}-${idx}`}>
              <button
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${getTimelineStepClass(
                  isCurrent,
                  isStepSource,
                  isStepSink
                )}`}
              >
                <span className="opacity-70">#{idx + 1}</span>
                <span className="font-sans font-medium truncate max-w-[130px]">
                  {step.fileName || `Step ${idx + 1}`}
                  {step.line ? `:${step.line}` : ''}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Current Step Details */}
      {currentStep && (
        <div className="space-y-3.5 pt-2">
          {/* File location */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">
              Step Location
            </div>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-zinc-950/60 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-800 dark:text-zinc-200 break-all">
              <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-semibold">
                {currentStep.filePath}
                {currentStep.line ? `:${currentStep.line}` : ''}
              </span>
            </div>
          </div>

          {/* Step Message */}
          {currentStep.message && (
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg text-xs text-blue-950 dark:text-blue-200 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>{currentStep.message}</span>
            </div>
          )}

          {/* Code Snippet */}
          {currentStep.codeSnippet && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">
                Source Snippet
              </div>
              <div className="bg-slate-900 dark:bg-black rounded-lg border border-slate-800 p-3 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed shadow-inner">
                <pre><code>{currentStep.codeSnippet}</code></pre>
              </div>
            </div>
          )}

          {/* Tracked State */}
          {currentStep.state && Object.keys(currentStep.state).length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Tracked Variables & State</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950/60 rounded-lg border border-slate-200 dark:border-zinc-800 divide-y divide-slate-200/60 dark:divide-zinc-800/60 text-xs font-mono">
                {Object.entries(currentStep.state).map(([k, v]) => (
                  <div key={k} className="px-3 py-1.5 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">{k}:</span>
                    <span className="text-slate-900 dark:text-zinc-100 font-semibold">{v}</span>
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
