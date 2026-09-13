import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Clock,
  Filter,
  CheckCheck,
  FileSearch,
  XOctagon,
  Sparkles
} from 'lucide-react';
import type { AlertItem } from '../types';

interface AlertsViewProps {
  alerts: AlertItem[];
  onResolveAlert: (id: string, action: 'reviewed' | 'retry') => Promise<void>;
  onResolveAllAlerts?: () => Promise<void>;
  onInspectSubmission?: (submissionId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onResolveAlert,
  onResolveAllAlerts,
  onInspectSubmission,
}) => {
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'reviewed'>('unresolved');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [isResolvingAll, setIsResolvingAll] = useState(false);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return alert.status === 'unresolved';
    if (filter === 'reviewed') return alert.status === 'reviewed' || alert.status === 'retried';
    return true;
  });

  const unresolvedCount = alerts.filter((a) => a.status === 'unresolved').length;

  const handleAction = async (id: string, action: 'reviewed' | 'retry') => {
    setResolvingId(id);
    try {
      await onResolveAlert(id, action);
    } finally {
      setResolvingId(null);
    }
  };

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'mismatch':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'extraction_failure':
        return <FileSearch className="w-5 h-5 text-rose-400" />;
      case 'portal_error':
      case 'validation_error':
      default:
        return <XOctagon className="w-5 h-5 text-rose-400" />;
    }
  };

  return (
    <div id="view-alerts-container" className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Alerts & Mismatches Queue
            </h1>
            {unresolvedCount > 0 && (
              <span
                id="alerts-unresolved-header-pill"
                className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 animate-pulse"
              >
                {unresolvedCount} Action Required
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submissions flagged for manual operator review due to invoice number discrepancies or OCR extraction faults.
          </p>
        </div>

        {/* Right Actions & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {unresolvedCount > 0 && onResolveAllAlerts && (
            <button
              id="btn-mark-all-reviewed"
              disabled={isResolvingAll}
              onClick={async () => {
                setIsResolvingAll(true);
                try {
                  await onResolveAllAlerts();
                } finally {
                  setIsResolvingAll(false);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 shadow-md transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Reviewed ({unresolvedCount})</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#141428] border border-slate-200 dark:border-white/10 rounded-xl">
            <button
              onClick={() => setFilter('unresolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'unresolved'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Unresolved ({unresolvedCount})
            </button>
            <button
              onClick={() => setFilter('reviewed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'reviewed'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Reviewed
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({alerts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 rounded-2xl glass-panel text-center space-y-3">
            <CheckCheck className="w-12 h-12 text-emerald-500 dark:text-emerald-400/80 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">All Clear!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              There are no {filter === 'unresolved' ? 'unresolved' : ''} alerts requiring manual intervention. All automated cross-checks have passed or were resolved.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isUnresolved = alert.status === 'unresolved';
            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`p-6 rounded-2xl border transition-all duration-200 space-y-4 shadow-xl glass-panel ${
                  isUnresolved
                    ? 'border-amber-500/40 bg-amber-500/5 dark:bg-gradient-to-r dark:from-[#201426] dark:to-[#16142a]'
                    : 'border-slate-200 dark:border-white/10 opacity-85'
                }`}
              >
                {/* Alert Top Line */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        alert.type === 'mismatch'
                          ? 'bg-amber-500/15 border-amber-500/30'
                          : 'bg-rose-500/15 border-rose-500/30'
                      }`}
                    >
                      {getAlertIcon(alert.type)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                          Submission #{alert.submissionId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider ${
                            isUnresolved
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {alert.supplierName} • Target Ref: {alert.invoiceNumber}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(alert.detectedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* "Why It Needs Attention" Reason Banner */}
                <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider text-[10px]">
                      Why It Needs Attention:
                    </span>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                      {alert.reason}
                    </p>
                  </div>
                </div>

                {/* Operator Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {onInspectSubmission && (
                      <button
                        onClick={() => onInspectSubmission(alert.submissionId)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors"
                      >
                        Inspect Full Submission
                      </button>
                    )}

                    <a
                      href={alert.externalAdminUrl || `https://admin.velux.quantum-h.com/admin/submissions/${alert.submissionId.replace('id:', '').trim()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors"
                    >
                      <span>Open in Velux Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {isUnresolved && (
                    <div className="flex items-center gap-2">
                      <button
                        id={`btn-retry-alert-${alert.id}`}
                        disabled={resolvingId === alert.id}
                        onClick={() => handleAction(alert.id, 'retry')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/10 dark:bg-purple-600/30 hover:bg-purple-600/20 dark:hover:bg-purple-600/50 text-purple-700 dark:text-purple-200 border border-purple-500/40 transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry with Bot</span>
                      </button>

                      <button
                        id={`btn-mark-reviewed-${alert.id}`}
                        disabled={resolvingId === alert.id}
                        onClick={() => handleAction(alert.id, 'reviewed')}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark as Reviewed</span>
                      </button>
                    </div>
                  )}

                  {!isUnresolved && alert.resolvedBy && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Resolved by: <span className="text-emerald-600 dark:text-emerald-300 font-bold">{alert.resolvedBy}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
