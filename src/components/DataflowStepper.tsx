import React, { useState } from 'react';
import {
  NormalizedCodeFlow,
  NormalizedCodeFlowStep,
} from '../types/viewer';
import {
  ChevronLeft,
  ChevronRight,
  FileCode,
  Terminal,
} from 'lucide-react';
import { HighlightedCode } from './HighlightedCode';

interface DataflowStepperProps {
  codeFlows: NormalizedCodeFlow[];
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
      {/* Top Stepper Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {/* Previous / Next buttons & Step counter */}
          <div className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-zinc-800/80 p-0.5 border border-slate-200/80 dark:border-zinc-700/80 text-xs">
            <button
              type="button"
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={safeStepIndex <= 0}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Previous step"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-semibold px-2 text-slate-800 dark:text-zinc-200 whitespace-nowrap">
              Step {steps.length > 0 ? safeStepIndex + 1 : 0} of {steps.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
              disabled={safeStepIndex >= steps.length - 1}
              className="p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Next step"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {(codeFlows.length > 1 || threadFlows.length > 1) && (
            <div className="flex items-center gap-2">
              {codeFlows.length > 1 && (
                <select
                  value={safeFlowIndex}
                  onChange={(e) => handleSelectFlow(Number(e.target.value))}
                  className="py-1 px-2 text-xs bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-md font-medium"
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
                  className="py-1 px-2 text-xs bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-md font-medium"
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

        {/* Step Role Badge */}
        <div className="flex items-center gap-2">
          {isSource && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 uppercase tracking-wide">
              Taint Source
            </span>
          )}
          {isSink && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80 uppercase tracking-wide">
              Taint Sink
            </span>
          )}
          {currentStep?.importance && (
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 capitalize">
              {currentStep.importance}
            </span>
          )}
        </div>
      </div>

      {/* Clean Timeline Steps Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1">
        {steps.map((step, idx) => {
          const isCurrent = idx === safeStepIndex;
          const isStepSource = idx === 0;
          const isStepSink = idx === steps.length - 1 && steps.length > 1;

          let stepClass = 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800';
          if (isCurrent) {
            stepClass = 'bg-blue-600 text-white font-semibold shadow-xs';
          } else if (isStepSource) {
            stepClass = 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40';
          } else if (isStepSink) {
            stepClass = 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40';
          }

          return (
            <button
              key={`step-${step.filePath}-${step.line}-${idx}`}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${stepClass}`}
            >
              <span className="opacity-70">#{idx + 1}</span>
              <span className="font-sans font-medium truncate max-w-[140px]">
                {step.fileName || `Step ${idx + 1}`}
                {step.line ? `:${step.line}` : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Step Content */}
      {currentStep && (
        <div className="space-y-3 pt-1">
          {/* File location */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-zinc-300">
            <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="font-semibold break-all text-slate-800 dark:text-zinc-200">
              {currentStep.filePath}
            </span>
            {currentStep.line && (
              <span className="text-slate-400 dark:text-zinc-500">:line {currentStep.line}</span>
            )}
          </div>

          {/* Step Message with simple left border accent */}
          {currentStep.message && (
            <div className="border-l-2 border-blue-500 pl-3 py-1 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
              {currentStep.message}
            </div>
          )}

          {/* Code Snippet */}
          {currentStep.codeSnippet && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Source Snippet
              </div>
              <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 font-mono text-xs overflow-x-auto text-slate-800 dark:text-zinc-200 leading-relaxed shadow-2xs">
                <pre><HighlightedCode code={currentStep.codeSnippet} filePath={currentStep.filePath} /></pre>
              </div>
            </div>
          )}

          {/* Tracked Variables & State */}
          {currentStep.state && Object.keys(currentStep.state).length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Tracked Variables & State</span>
              </div>
              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800/80 font-mono text-xs shadow-2xs">
                {Object.entries(currentStep.state).map(([k, v]) => (
                  <div key={k} className="px-3 py-1.5 flex items-center justify-between text-xs">
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
