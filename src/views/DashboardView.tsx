import React, { useState } from 'react';
import {
  Activity,
  Scissors,
  FileSpreadsheet,
  ArrowUpRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { StatusIndicator } from '../components/StatusIndicator';
import { StatCards } from '../components/StatCards';
import { CurrentlyProcessingCard } from '../components/CurrentlyProcessingCard';
import { ActivityLogPanel } from '../components/ActivityLogPanel';
import type { BotStatus, LogEntry, BotRunMode, ProcessedSubmission } from '../types';

interface DashboardViewProps {
  botStatus: BotStatus;
  logs: LogEntry[];
  submissions?: ProcessedSubmission[];
  onStartBot: (mode?: BotRunMode) => void;
  onStopBot: () => void;
  onPauseBot: () => void;
  isLoadingAction: boolean;
  onClearLogs: () => void;
  onOpenSubmissionModal: (submissionId: string) => void;
  onNavigateToAlerts: () => void;
  onNavigateToHistory: (filter?: 'All' | 'Needs Review' | 'Success' | 'Mismatch' | 'Error' | 'Skipped', operation?: 'all' | 'redaction' | 'data_fill') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  botStatus,
  logs,
  submissions = [],
  onStartBot,
  onStopBot,
  onPauseBot,
  isLoadingAction,
  onClearLogs,
  onOpenSubmissionModal,
  onNavigateToAlerts,
  onNavigateToHistory,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'redaction' | 'data_fill'>('overview');

  const isRedaction = (s: ProcessedSubmission) => {
    if (s.operationType === 'redaction') return true;
    if (s.status === 'Redacted') return true;
    const act = (s.actionTaken || '').toLowerCase();
    return (act.includes('redact') && !act.includes('submitted & redacted')) || act.startsWith('redacted');
  };

  const redactedSubmissions = submissions.filter(isRedaction);
  const dataFilledSubmissions = submissions.filter((s) => !isRedaction(s));

  return (
    <div id="view-dashboard-container" className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bot Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring and controls for the Quantum-h invoice verification automation bot.
          </p>
        </div>
      </div>

      {/* 1. Bot Status Indicator & Primary Action Controls */}
      <StatusIndicator
        status={botStatus.status}
        lastStatusChange={botStatus.lastStatusChange}
        onStart={onStartBot}
        onStop={onStopBot}
        onPause={onPauseBot}
        isLoadingAction={isLoadingAction}
        currentlyProcessing={botStatus.currentlyProcessing}
        currentMode={botStatus.mode}
      />

      {/* 2. Dual Operations Hero Metric Cards & Summary Stats */}
      <StatCards
        stats={botStatus.stats}
        onNavigateToAlerts={onNavigateToAlerts}
        onNavigateToHistory={onNavigateToHistory}
        onSelectOperation={(op) => {
          if (op === 'redaction') setActiveSection('redaction');
          else if (op === 'data_fill') setActiveSection('data_fill');
          else setActiveSection('overview');
        }}
        onStartBot={onStartBot}
        isLoadingAction={isLoadingAction}
      />

      {/* 3. Operational Section Switcher: Overview vs Redaction Queue vs Data Required Queue */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-slate-200/70 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'overview'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Monitor & Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('redaction')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'redaction'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>✂️ Only Redaction Queue</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white font-mono">
              {botStatus.stats.totalRedacted ?? 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('data_fill')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'data_fill'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>📝 Only Data Required</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white font-mono">
              {botStatus.stats.totalDataFilled ?? 0}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToHistory('All', activeSection === 'overview' ? 'all' : activeSection)}
          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Full History Table ({submissions.length})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4. Active Section Content Rendering */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <CurrentlyProcessingCard
            current={botStatus.currentlyProcessing}
            botStatusState={botStatus.status}
          />
          <ActivityLogPanel
            logs={logs}
            onClearLogs={onClearLogs}
            onOpenSubmissionModal={onOpenSubmissionModal}
          />
        </div>
      )}

      {activeSection === 'redaction' && (
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-amber-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Scissors className="w-4 h-4" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Redaction Queue Activity (Phase 1)
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Showing all submissions where invoices were downloaded, pricing redacted, and closed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStartBot('redact_only')}
                disabled={isLoadingAction}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Redaction Only</span>
              </button>
            </div>
          </div>

          {redactedSubmissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Scissors className="w-8 h-8 mx-auto text-amber-500/40 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Redacted Submissions Recorded Yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Click "Start Redaction Only" above or trigger Phase 1 to automatically redact pending invoices.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Submission ID</th>
                    <th className="py-2.5 px-3">Invoices Redacted</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Action Taken</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                  {redactedSubmissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-amber-500/5 transition-colors cursor-pointer"
                      onClick={() => onOpenSubmissionModal(sub.submissionId)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                        #{sub.submissionId}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {sub.invoicesRedactedCount ?? 1} invoice(s)
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Redacted &amp; Closed
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {sub.actionTaken || 'Redacted'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(sub.processedAt).toLocaleTimeString('en-GB')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSubmissionModal(sub.submissionId);
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition-all"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSection === 'data_fill' && (
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-emerald-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  <FileSpreadsheet className="w-4 h-4" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Data Required Queue Activity (Phase 2)
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Showing all submissions where OCR was parsed, supplier matched, and form filled.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onStartBot('data_required_only')}
                disabled={isLoadingAction}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Data Only</span>
              </button>
            </div>
          </div>

          {dataFilledSubmissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-emerald-500/40 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No Data-Filled Submissions Recorded Yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Click "Start Data Only" above to run Phase 2 form filling on Data Required items.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Submission ID</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Gross Total</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Verification</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                  {dataFilledSubmissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-emerald-500/5 transition-colors cursor-pointer"
                      onClick={() => onOpenSubmissionModal(sub.submissionId)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                        #{sub.submissionId}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                        {sub.supplierName || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {sub.invoiceNumber || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {sub.extractedPdfData?.totalAmount ? `€${sub.extractedPdfData.totalAmount.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'Success'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                            : (sub.status === 'Mismatch' || sub.status === 'Needs Review'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-500 border border-rose-500/30')
                        }`}>
                          {sub.status === 'Success' && <CheckCircle2 className="w-3 h-3" />}
                          {sub.status !== 'Success' && <AlertTriangle className="w-3 h-3" />}
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold ${
                          sub.clientVerification === 'verified'
                            ? 'text-emerald-500'
                            : (sub.clientVerification === 'unresolved' ? 'text-rose-500' : 'text-slate-400')
                        }`}>
                          {sub.clientVerification === 'verified' ? '✓ Verified' : (sub.clientVerification === 'unresolved' ? '⚠ Unresolved' : 'Pending')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenSubmissionModal(sub.submissionId);
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

