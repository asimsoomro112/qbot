import React from 'react';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  XOctagon,
  ArrowUpRight,
  Clock,
  Layers,
  HelpCircle,
  ShieldCheck,
  Split,
  CalendarX,
} from 'lucide-react';
import type { BotStats } from '../types';

interface StatCardsProps {
  stats: BotStats;
  onNavigateToAlerts?: () => void;
  onNavigateToHistory?: (filter?: 'All' | 'Needs Review' | 'Success' | 'Mismatch' | 'Error' | 'Skipped') => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  stats,
  onNavigateToAlerts,
  onNavigateToHistory,
}) => {
  const matchRate =
    stats.totalToday > 0
      ? Math.round((stats.matchedSuccessfully / stats.totalToday) * 100)
      : 100;

  const reviewRate =
    stats.totalToday > 0
      ? Math.round((stats.mismatchesFound / stats.totalToday) * 100)
      : 0;

  const errorRate =
    stats.totalToday > 0
      ? Math.round((stats.errorsEncountered / stats.totalToday) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* 1. Interactive Pipeline Distribution Bar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pipeline Health Breakdown
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold">
              {stats.totalToday} records
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Auto-Approved ({matchRate}%)
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Requires Review ({reviewRate}%)
            </span>
            {stats.errorsEncountered > 0 && (
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Errors ({errorRate}%)
              </span>
            )}
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-3 overflow-hidden flex shadow-inner">
          <div
            onClick={() => onNavigateToHistory?.('Success')}
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-700 hover:brightness-110 cursor-pointer"
            style={{ width: `${stats.totalToday > 0 ? matchRate : 100}%` }}
            title={`Auto-Approved: ${stats.matchedSuccessfully} (${matchRate}%)`}
          />
          <div
            onClick={() => onNavigateToHistory?.('Needs Review')}
            className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-700 hover:brightness-110 cursor-pointer"
            style={{ width: `${stats.totalToday > 0 ? reviewRate : 0}%` }}
            title={`Needs Review: ${stats.mismatchesFound} (${reviewRate}%)`}
          />
          <div
            onClick={() => onNavigateToHistory?.('Error')}
            className="bg-gradient-to-r from-rose-500 to-red-600 h-full transition-all duration-700 hover:brightness-110 cursor-pointer"
            style={{ width: `${stats.totalToday > 0 ? errorRate : 0}%` }}
            title={`Errors: ${stats.errorsEncountered} (${errorRate}%)`}
          />
        </div>
      </div>

      {/* 2. Four Dedicated KPI Cards — Responsive 2x2 on Mobile */}
      <div
        id="dashboard-summary-stat-cards"
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4"
      >
        {/* CARD 1: Total Volume (Inflow) */}
        <div
          id="stat-card-total-today"
          onClick={() => onNavigateToHistory?.('All')}
          className="glass-panel glass-panel-hover p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Total Inflow
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                {stats.totalToday}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">records</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed hidden sm:block">
              Total records evaluated in current queue batch
            </p>
          </div>

          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[10px] sm:text-xs font-medium">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
              <Clock className="w-3 h-3 text-purple-500" />
              Avg {stats.avgProcessingTimeSec}s
            </span>
            <span className="text-purple-600 dark:text-purple-400 flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
              All <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* CARD 2: Auto-Approved & Verified (Success) */}
        <div
          id="stat-card-matched-successfully"
          onClick={() => onNavigateToHistory?.('Success')}
          className="glass-panel glass-panel-hover p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                2. Auto-Approved
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                {stats.matchedSuccessfully}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300/90 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                {matchRate}% pass
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed hidden sm:block">
              Invoices matched & submitted directly
            </p>
          </div>

          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[10px] sm:text-xs font-medium">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* CARD 3: Needs Human Review (Flagged) */}
        <div
          id="stat-card-mismatches-found"
          onClick={onNavigateToAlerts}
          className="glass-panel glass-panel-hover p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                3. Review Queue
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-4xl font-black text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                {stats.mismatchesFound}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-300/90 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                flagged
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed hidden sm:block">
              Submissions flagged for discrepancies
            </p>
          </div>

          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[10px] sm:text-xs font-medium">
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Split className="w-3 h-3" />
              Review
            </span>
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
              Inspect <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* CARD 4: Technical Reliability (Errors) */}
        <div
          id="stat-card-errors-encountered"
          onClick={onNavigateToAlerts}
          className="glass-panel glass-panel-hover p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                4. Reliability
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                <XOctagon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-2xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 tracking-tight font-mono">
                {stats.errorsEncountered}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                {stats.errorsEncountered === 0 ? 'zero faults' : 'errors'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed hidden sm:block">
              Technical OCR failures or portal timeouts
            </p>
          </div>

          <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-[10px] sm:text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              100% Uptime
            </span>
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
              Logs <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
