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
} from 'lucide-react';
import type { BotStatusState, CurrentlyProcessing } from '../types';

interface StatusIndicatorProps {
  status: BotStatusState;
  lastStatusChange: string;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  isLoadingAction: boolean;
  currentlyProcessing?: CurrentlyProcessing | null;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  lastStatusChange,
  onStart,
  onStop,
  onPause,
  isLoadingAction,
  currentlyProcessing,
}) => {
  const getStatusDetails = () => {
    switch (status) {
      case 'running': {
        const hasSub = !!currentlyProcessing?.submissionId;
        return {
          title: hasSub
            ? `Processing Row #${currentlyProcessing.submissionId}`
            : 'Automation Runner is Active',
          subtitle: hasSub
            ? `Current Step: ${currentlyProcessing.stepLabel || 'Working in portal'} ${
                currentlyProcessing.supplierName ? `• Supplier: ${currentlyProcessing.supplierName}` : ''
              }`
            : 'Continuously monitoring portal queue, downloading receipts, and cross-checking invoice details.',
          badge: hasSub ? `ROW #${currentlyProcessing.submissionId}` : 'RUNNING',
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
          subtitle: 'Browser automation engine is idle. Ready to initiate automated verification or scheduled batches.',
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
      className="glass-panel p-6 rounded-3xl relative overflow-hidden transition-all duration-300 shadow-xl"
    >
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Visual State & Description */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner transition-colors ${details.iconBg}`}
            >
              <Icon className={`w-7 h-7 ${details.glowText}`} />
            </div>

            {/* Pulsing state ring */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              {status === 'running' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white dark:border-[#0f1120] ${details.dotBg}`}
              />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {details.title}
              </h2>
              <span
                id="bot-status-badge"
                className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase border shadow-sm ${details.badgeClass}`}
              >
                {details.badge}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              {details.subtitle}
            </p>

            <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                State changed: <span className="font-semibold text-slate-700 dark:text-slate-200">{formattedTime}</span>
              </span>
              <span>•</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Playwright Engine v2.5</span>
            </div>
          </div>
        </div>

        {/* Big Action Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Start Bot Button */}
          <button
            id="btn-start-bot"
            onClick={onStart}
            disabled={status === 'running' || isLoadingAction}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg ${
              status === 'running'
                ? 'opacity-40 bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-transparent'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/30'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Runner</span>
          </button>

          {/* Pause Bot Button */}
          <button
            id="btn-pause-bot"
            onClick={onPause}
            disabled={status !== 'running' || isLoadingAction}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all shadow-sm ${
              status !== 'running'
                ? 'opacity-40 bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-transparent'
                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </button>

          {/* Stop Bot Button */}
          <button
            id="btn-stop-bot"
            onClick={onStop}
            disabled={status === 'stopped' || isLoadingAction}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all shadow-sm ${
              status === 'stopped'
                ? 'opacity-40 bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-transparent'
                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop Runner</span>
          </button>
        </div>
      </div>
    </div>
  );
};
