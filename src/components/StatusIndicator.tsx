import React from 'react';
import {
  Play,
  Square,
  Pause,
  Clock,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  FileEdit,
  Database,
  Layers,
} from 'lucide-react';
import type { BotStatusState, CurrentlyProcessing, BotRunMode } from '../types';

interface StatusIndicatorProps {
  status: BotStatusState;
  lastStatusChange: string;
  onStart: (mode?: BotRunMode) => void;
  onStop: () => void;
  onPause: () => void;
  isLoadingAction: boolean;
  currentlyProcessing?: CurrentlyProcessing | null;
  currentMode?: BotRunMode;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  lastStatusChange,
  onStart,
  onStop,
  onPause,
  isLoadingAction,
  currentlyProcessing,
  currentMode = 'all',
}) => {
  const getStatusDetails = () => {
    const modeName =
      currentMode === 'redact_only'
        ? 'Redact Only'
        : currentMode === 'data_required_only'
        ? 'Data Required'
        : 'Full Pipeline';

    switch (status) {
      case 'running': {
        const hasSub = !!currentlyProcessing?.submissionId;
        return {
          title: hasSub
            ? `Processing Row #${currentlyProcessing.submissionId}`
            : `Automation Runner Active (${modeName})`,
          subtitle: hasSub
            ? `Current Step: ${currentlyProcessing.stepLabel || 'Working in portal'} ${
                currentlyProcessing.supplierName ? `• Supplier: ${currentlyProcessing.supplierName}` : ''
              }`
            : currentMode === 'redact_only'
            ? 'Monitoring Pending (Unredacted) queue, auto-redacting pricing values with Gemini Vision.'
            : currentMode === 'data_required_only'
            ? 'Processing Data Required queue, matching suppliers & eligible VELUX product codes.'
            : 'Continuously running full pipeline: auto-redacting receipts and processing data required submissions.',
          badge: hasSub ? `ROW #${currentlyProcessing.submissionId}` : `RUNNING • ${modeName.toUpperCase()}`,
          dotBg: 'bg-emerald-500',
          ringBg: 'ring-emerald-500/25',
          glowText: 'text-emerald-600 dark:text-emerald-400',
          badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          iconBg: 'bg-emerald-500/15 border-emerald-500/30',
          icon: Zap,
        };
      }
      case 'paused':
        return {
          title: 'Automation Runner is Paused',
          subtitle: 'Active Playwright browser session held in memory; queue processing is temporarily suspended.',
          badge: 'PAUSED',
          dotBg: 'bg-amber-500',
          ringBg: 'ring-amber-500/25',
          glowText: 'text-amber-600 dark:text-amber-400',
          badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
          iconBg: 'bg-amber-500/15 border-amber-500/30',
          icon: Pause,
        };
      case 'error':
        return {
          title: 'Runner Halted on Exception',
          subtitle: 'Automation encountered an unhandled exception or portal session disconnection.',
          badge: 'ERROR',
          dotBg: 'bg-rose-500',
          ringBg: 'ring-rose-500/25',
          glowText: 'text-rose-600 dark:text-rose-400',
          badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
          iconBg: 'bg-rose-500/15 border-rose-500/30',
          icon: AlertOctagon,
        };
      case 'stopped':
      default:
        return {
          title: 'Automation Runner Standby',
          subtitle: 'Choose a mode below to start: Full Pipeline (Redact + Data), Redact Only, or Data Required Only.',
          badge: 'STANDBY',
          dotBg: 'bg-slate-400',
          ringBg: 'ring-slate-400/25',
          glowText: 'text-slate-500 dark:text-slate-400',
          badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
          iconBg: 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10',
          icon: Square,
        };
    }
  };

  const details = getStatusDetails();
  const Icon = details.icon;

  const formattedTime = new Date(lastStatusChange).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      id="dashboard-bot-status-indicator-card"
      className="glass-panel p-4 sm:p-6 rounded-3xl relative overflow-hidden transition-all duration-300 shadow-xl"
    >
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5 sm:gap-6">
        {/* Visual State & Description */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center shadow-inner transition-colors ${details.iconBg}`}
            >
              <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${details.glowText}`} />
            </div>

            {/* Pulsing state ring */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4">
              {status === 'running' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-white dark:border-[#0f1120] ${details.dotBg}`}
              />
            </span>
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {details.title}
              </h2>
              <span
                id="bot-status-badge"
                className={`px-2.5 sm:px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase border shadow-sm ${details.badgeClass}`}
              >
                {details.badge}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              {details.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                State: <span className="font-semibold text-slate-700 dark:text-slate-200">{formattedTime}</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Playwright v2.5</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full xl:w-auto xl:justify-end shrink-0">
          {status !== 'running' ? (
            <>
              {/* Button 1: Start All (Full Pipeline) */}
              <button
                id="btn-start-all"
                onClick={() => onStart('all')}
                disabled={isLoadingAction}
                className="group relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/30"
                title="Start Full Pipeline: Auto-redacts pending receipts first, then processes Data Required submissions"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 fill-current group-hover:rotate-12 transition-transform" />
                <div className="flex flex-col text-left leading-none">
                  <span className="truncate">Start All</span>
                  <span className="text-[9px] font-normal opacity-85 mt-0.5">Redact + Data</span>
                </div>
              </button>

              {/* Button 2: Start Redact Only */}
              <button
                id="btn-start-redact"
                onClick={() => onStart('redact_only')}
                disabled={isLoadingAction}
                className="group relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] border border-purple-400/30"
                title="Start Redaction Only: Auto-redacts pricing values on Pending (Unredacted) queue only"
              >
                <FileEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col text-left leading-none">
                  <span className="truncate">Start Redact</span>
                  <span className="text-[9px] font-normal opacity-85 mt-0.5">Redact Only</span>
                </div>
              </button>

              {/* Button 3: Start Data Required Only */}
              <button
                id="btn-start-data-required"
                onClick={() => onStart('data_required_only')}
                disabled={isLoadingAction}
                className="group relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] border border-sky-400/30"
                title="Start Data Required Only: Directly processes Data Required submissions only"
              >
                <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col text-left leading-none">
                  <span className="truncate">Start Data Req</span>
                  <span className="text-[9px] font-normal opacity-85 mt-0.5">Data Only</span>
                </div>
              </button>
            </>
          ) : (
            /* When Running: Mode indicator pill */
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {currentMode === 'redact_only'
                  ? 'Redact Mode'
                  : currentMode === 'data_required_only'
                  ? 'Data Req Mode'
                  : 'Full Mode'}
              </span>
            </div>
          )}

          {/* Pause Bot Button */}
          <button
            id="btn-pause-bot"
            onClick={onPause}
            disabled={status !== 'running' || isLoadingAction}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              status !== 'running'
                ? 'opacity-40 bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-transparent'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Pause</span>
          </button>

          {/* Stop Bot Button */}
          <button
            id="btn-stop-bot"
            onClick={onStop}
            disabled={status === 'stopped' || isLoadingAction}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              status === 'stopped'
                ? 'opacity-40 bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-transparent'
                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
            <span>Stop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
