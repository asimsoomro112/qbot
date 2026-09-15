import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Filter,
  Search,
  Trash2,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Pause,
  Play,
} from 'lucide-react';
import type { LogEntry } from '../types';

interface ActivityLogPanelProps {
  logs: LogEntry[];
  onClearLogs?: () => void;
  onOpenSubmissionModal?: (submissionId: string) => void;
}

export const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({
  logs,
  onClearLogs,
  onOpenSubmissionModal,
}) => {
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'success' | 'warn' | 'error'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest_top' | 'newest_bottom'>('newest_top');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        (log.submissionId && log.submissionId.toLowerCase().includes(q)) ||
        (log.step && log.step.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sort logs
  const displayedLogs =
    sortOrder === 'newest_top' ? filteredLogs : [...filteredLogs].reverse();

  // Handle auto-scroll if enabled
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      if (sortOrder === 'newest_bottom') {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      } else {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [logs, autoScroll, sortOrder]);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            SUCCESS
          </span>
        );
      case 'warn':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 shrink-0">
            <AlertTriangle className="w-3 h-3" />
            WARN
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20 shrink-0">
            <XCircle className="w-3 h-3" />
            ERROR
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded-md border border-cyan-500/20 shrink-0">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  return (
    <div
      id="dashboard-activity-log-panel"
      className="rounded-3xl glass-panel overflow-hidden flex flex-col h-[400px] sm:h-[520px] shadow-lg border border-slate-200/80 dark:border-white/10"
    >
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Activity Stream
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {displayedLogs.length} events logged
              </p>
            </div>
          </div>

          {/* Clear Logs Button (Mobile Top-Right) */}
          {onClearLogs && (
            <button
              id="clear-logs-btn-mobile"
              onClick={onClearLogs}
              className="sm:hidden p-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors"
              title="Clear activity feed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter Dropdown */}
          <select
            id="log-level-filter-select"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="text-[11px] sm:text-xs bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2 sm:px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-500 font-medium"
          >
            <option value="all">All Levels</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
            <option value="warn">Warnings</option>
            <option value="error">Errors</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="log-search-input"
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-[11px] sm:text-xs bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-2.5 py-1.5 text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-purple-500 w-full sm:w-40 font-medium"
            />
          </div>

          {/* Auto-scroll Toggle */}
          <button
            id="toggle-auto-scroll-btn"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-mono font-semibold border transition-all flex items-center gap-1 shadow-sm ${
              autoScroll
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300'
                : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
            }`}
            title="Auto-scroll on incoming events"
          >
            {autoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span className="hidden sm:inline">Auto-scroll</span>
          </button>

          {/* Sort Order Toggle */}
          <button
            id="toggle-log-sort-btn"
            onClick={() =>
              setSortOrder(sortOrder === 'newest_top' ? 'newest_bottom' : 'newest_top')
            }
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
            title={sortOrder === 'newest_top' ? 'Showing newest at top' : 'Showing newest at bottom'}
          >
            {sortOrder === 'newest_top' ? (
              <ArrowDown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            ) : (
              <ArrowUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            )}
          </button>

          {/* Clear Logs Button (Desktop) */}
          {onClearLogs && (
            <button
              id="clear-logs-btn"
              onClick={onClearLogs}
              className="hidden sm:inline-flex p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-white/10 hover:border-rose-500/30 text-slate-500 hover:text-rose-600 dark:hover:text-rose-300 transition-colors shadow-sm"
              title="Clear activity feed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Log Feed List */}
      <div
        ref={scrollContainerRef}
        id="activity-log-scroll-container"
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 font-mono text-xs custom-scrollbar bg-slate-50/50 dark:bg-[#0e0e1a]/80"
      >
        {displayedLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-12">
            <Terminal className="w-8 h-8 opacity-40" />
            <p className="text-xs">No activity logs match your filter criteria.</p>
          </div>
        ) : (
          displayedLogs.map((log) => (
            <div
              key={log.id}
              className="group p-2.5 rounded-xl bg-white dark:bg-black/40 hover:bg-purple-50/70 dark:hover:bg-purple-950/20 border border-slate-200/80 dark:border-white/5 hover:border-purple-400/40 dark:hover:border-purple-500/30 transition-all flex items-start justify-between gap-3 leading-relaxed shadow-sm"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="text-slate-400 text-[11px] shrink-0 select-none pt-0.5">
                  [{log.timestamp}]
                </span>
                {getLevelBadge(log.level)}
                <span className="text-slate-800 dark:text-slate-200 break-words font-medium">{log.message}</span>
              </div>

              {log.submissionId && (
                <button
                  id={`log-submission-pill-${log.submissionId}`}
                  onClick={() => onOpenSubmissionModal && onOpenSubmissionModal(log.submissionId!)}
                  className="px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/25 text-purple-700 dark:text-purple-300 text-[10px] font-mono shrink-0 transition-colors font-bold shadow-sm"
                  title="Inspect submission proof"
                >
                  #{log.submissionId}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="p-2.5 px-4 border-t border-slate-200/80 dark:border-purple-500/10 bg-slate-100/70 dark:bg-black/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Playwright IPC Pipe Connected • Real-time Stream
        </span>
        <span>
          Showing {displayedLogs.length} of {logs.length} events
        </span>
      </div>
    </div>
  );
};
