import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Loader2,
  FileSearch,
  Key,
  Compass,
  FileCode,
  GitCompare,
  Send,
  ShoppingCart,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import type { CurrentlyProcessing, BotProgressStep } from '../types';

interface CurrentlyProcessingCardProps {
  current: CurrentlyProcessing | null;
  botStatusState: string;
}

interface StepMeta {
  key: BotProgressStep;
  label: string;
  icon: React.ElementType;
}

const PIPELINE_STEPS: StepMeta[] = [
  { key: 'login', label: 'Login', icon: Key },
  { key: 'navigate', label: 'Navigate', icon: Compass },
  { key: 'extract_pdfs', label: 'Extract PDFs', icon: FileSearch },
  { key: 'velux_rules_check', label: 'VELUX Rules', icon: GitCompare },
  { key: 'fill_form', label: 'Invoice Details', icon: FileCode },
  { key: 'submission_details', label: 'Review Status', icon: CheckSquare },
  { key: 'basket_pim', label: 'Basket (PIM)', icon: ShoppingCart },
  { key: 'awaiting_submit', label: 'Redact & Close', icon: Send },
];

export const CurrentlyProcessingCard: React.FC<CurrentlyProcessingCardProps> = ({
  current,
  botStatusState,
}) => {
  const [elapsedSec, setElapsedSec] = useState<number>(0);

  useEffect(() => {
    if (!current) {
      setElapsedSec(0);
      return;
    }
    const startTime = new Date(current.startedAt).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedSec(Math.max(0, Math.floor((now - startTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [current]);

  const getStepIndex = (stepKey: BotProgressStep) => {
    if (stepKey === 'redact_close') {
      return PIPELINE_STEPS.findIndex((s) => s.key === 'awaiting_submit');
    }
    return PIPELINE_STEPS.findIndex((s) => s.key === stepKey);
  };

  const currentStepIndex = current ? getStepIndex(current.step) : -1;

  return (
    <div
      id="dashboard-currently-processing-card"
      className="glass-panel p-6 rounded-3xl overflow-hidden relative shadow-lg"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400">
            {current ? (
              <Activity className="w-5 h-5 animate-pulse text-purple-600 dark:text-purple-400" />
            ) : (
              <Clock className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Live Pipeline Execution Trace
              </h3>
              {current ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Active Submission
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  Standby
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {current
                ? `Live execution trace for submission #${current.submissionId}`
                : 'Bot runner idle or waiting for next batch cycle'}
            </p>
          </div>
        </div>

        {current && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                Batch Progress
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                Row {current.batchCurrent} of {current.batchTotal}
              </span>
            </div>
            <div className="h-7 w-[1px] bg-slate-200 dark:bg-white/10" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                Elapsed
              </span>
              <span className="font-bold text-purple-600 dark:text-purple-300">{elapsedSec}s</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      {current ? (
        <div className="pt-5 space-y-6">
          {/* Submission Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl glass-inset">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Submission ID
              </span>
              <div className="font-mono font-black text-lg text-slate-900 dark:text-white mt-0.5">
                #{current.submissionId}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Supplier Identified
              </span>
              <div className="text-sm font-semibold text-purple-700 dark:text-purple-300 truncate mt-0.5" title={current.supplierName}>
                {current.supplierName || 'Resolving supplier...'}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Target Invoice Number
              </span>
              <div className="font-mono font-semibold text-sm text-cyan-700 dark:text-cyan-300 mt-0.5">
                {current.invoiceNumber || 'Extracting from receipt...'}
              </div>
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Active Playwright Phase
              </span>
              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                {current.stepLabel}
              </span>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {PIPELINE_STEPS.map((s, idx) => {
                const Icon = s.icon;
                const isCompleted = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                let stateClasses = 'bg-slate-50 dark:bg-white/5 border-slate-200/80 dark:border-white/5 text-slate-400';
                if (isCompleted) {
                  stateClasses = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-sm';
                } else if (isCurrent) {
                  stateClasses =
                    'bg-purple-500/15 border-purple-500/50 text-purple-800 dark:text-purple-200 shadow-md shadow-purple-500/20 ring-2 ring-purple-500/40';
                }

                return (
                  <div
                    key={s.key}
                    className={`relative p-3 rounded-2xl border flex flex-col justify-between gap-2 transition-all ${stateClasses}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold opacity-75">
                        0{idx + 1}
                      </span>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-xs font-semibold truncate leading-tight">
                          {s.label}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-70 block mt-0.5">
                        {isCompleted ? 'Done' : isCurrent ? 'Active' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Step Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>Overall Submission Completion</span>
              <span className="text-purple-600 dark:text-purple-300 font-bold">{current.progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-black/50 overflow-hidden border border-slate-300/60 dark:border-white/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${current.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Standby / Idle Empty State */
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {botStatusState === 'running'
                ? 'Scanning Data Required Queue...'
                : 'Bot Runner is Currently Standing By'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              {botStatusState === 'running'
                ? 'Looking for the first unlocked row in the "Pending & Redacted" table.'
                : 'Click "Start Runner" above to begin processing submissions, verifying invoice details, and populating products.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
