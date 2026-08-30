import React, { useState } from 'react';
import {
  NormalizedCodeFlow,
  NormalizedCodeFlowStep,
  NormalizedThreadFlow,
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

function getTimelineStepClass(isCurrent: boolean, isSource: boolean, isSink: boolean): string {
  if (isCurrent) {
    return 'bg-blue-600 text-white shadow-sm font-bold scale-105';
  }
  if (isSource) {
    return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100';
  }
  if (isSink) {
    return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100';
  }
  return 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50';
}

const DataflowFlowSelectors: React.FC<{
  codeFlows: NormalizedCodeFlow[];
  threadFlows: NormalizedThreadFlow[];
  safeFlowIndex: number;
  safeThreadIndex: number;
  onSelectFlow: (idx: number) => void;
  onSelectThread: (idx: number) => void;
}> = ({
  codeFlows,
  threadFlows,
  safeFlowIndex,
  safeThreadIndex,
  onSelectFlow,
  onSelectThread,
}) => {
  if (codeFlows.length <= 1 && threadFlows.length <= 1) return null;

  return (
    <div className="p-2.5 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center gap-3 text-xs">
      {codeFlows.length > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 dark:text-zinc-400 font-medium">Flow:</span>
          <select
            value={safeFlowIndex}
            onChange={(e) => onSelectFlow(Number(e.target.value))}
            className="py-1 px-2 text-xs bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 rounded-md font-medium"
          >
            {codeFlows.map((cf, idx) => (
              <option key={`flow-${cf.message || idx}`} value={idx}>
                {cf.message || `Flow #${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {threadFlows.length > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 dark:text-zinc-400 font-medium">Thread:</span>
          <select
            value={safeThreadIndex}
            onChange={(e) => onSelectThread(Number(e.target.value))}
            className="py-1 px-2 text-xs bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700 rounded-md font-medium"
          >
            {threadFlows.map((tf, idx) => (
              <option key={`thread-${tf.id || tf.message || idx}`} value={idx}>
                {tf.message || tf.id || `Thread #${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

const DataflowTimeline: React.FC<{
  steps: NormalizedCodeFlowStep[];
  safeStepIndex: number;
  onSelectStep: (idx: number) => void;
}> = ({ steps, safeStepIndex, onSelectStep }) => (
  <div className="p-3 bg-slate-100/70 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto">
    <div className="flex items-center gap-2 min-w-max">
      {steps.map((step, idx) => {
        const isCurrent = idx === safeStepIndex;
        const isSource = idx === 0;
        const isSink = idx === steps.length - 1;

        return (
          <React.Fragment key={`step-${step.filePath}-${step.line}-${idx}`}>
            <button
              type="button"
              onClick={() => onSelectStep(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${getTimelineStepClass(
                isCurrent,
                isSource,
                isSink
              )}`}
            >
              <span className="opacity-75">#{idx + 1}</span>
              <span className="truncate max-w-[120px] font-sans font-medium">
                {step.fileName || `Step ${idx + 1}`}
                {step.line ? `:${step.line}` : ''}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-600 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

const DataflowStepDetail: React.FC<{
  currentStep?: NormalizedCodeFlowStep;
  safeStepIndex: number;
  totalSteps: number;
  }> = ({ currentStep, safeStepIndex, totalSteps }) => {
  if (!currentStep) return null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-slate-800 dark:text-zinc-200 font-semibold truncate max-w-xs sm:max-w-md">
            {currentStep.filePath}
            {currentStep.line ? `:${currentStep.line}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {safeStepIndex === 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
              Taint Source
            </span>
          )}
          {safeStepIndex === totalSteps - 1 && totalSteps > 1 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 uppercase">
              Taint Sink
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 capitalize">
            {currentStep.importance || 'important'}
          </span>
        </div>
      </div>

      {currentStep.message && (
        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-lg text-xs text-blue-950 dark:text-blue-200 leading-relaxed flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>{currentStep.message}</span>
        </div>
      )}

      {currentStep.codeSnippet && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Source Snippet
          </div>
          <div className="bg-slate-900 dark:bg-black rounded-lg border border-slate-800 p-3 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
            <pre><code>{currentStep.codeSnippet}</code></pre>
          </div>
        </div>
      )}

      {currentStep.state && Object.keys(currentStep.state).length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5" />
            <span>Tracked Variables & State</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-2 text-xs font-mono divide-x divide-slate-100 dark:divide-zinc-800">
              {Object.entries(currentStep.state).map(([k, v]) => (
                <div key={k} className="p-2 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-slate-500 dark:text-zinc-400">{k}:</span>
                  <span className="text-slate-900 dark:text-zinc-100 font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

  return (
    <div className="bg-slate-50 dark:bg-zinc-950/80 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col transition-colors duration-200">
      <DataflowFlowSelectors
        codeFlows={codeFlows}
        threadFlows={threadFlows}
        safeFlowIndex={safeFlowIndex}
        safeThreadIndex={safeThreadIndex}
        onSelectFlow={handleSelectFlow}
        onSelectThread={handleSelectThread}
      />

      <div className="p-3.5 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Dataflow & Taint Path</span>
              <span className="text-[11px] font-normal text-slate-400 dark:text-zinc-500 font-mono">
                ({steps.length} steps)
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Trace user-controlled inputs across execution steps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
            disabled={safeStepIndex <= 0}
            className="p-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            title="Previous step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold text-slate-700 dark:text-zinc-300 px-1">
            {steps.length > 0 ? safeStepIndex + 1 : 0} / {steps.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
            disabled={safeStepIndex >= steps.length - 1}
            className="p-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            title="Next step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <DataflowTimeline
        steps={steps}
        safeStepIndex={safeStepIndex}
        onSelectStep={setCurrentStepIndex}
      />

      <DataflowStepDetail
        currentStep={currentStep}
        safeStepIndex={safeStepIndex}
        totalSteps={steps.length}
      />
    </div>
  );
};
