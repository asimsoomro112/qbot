import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Clock,
  ArrowUpDown,
  Trash2,
  ExternalLink,
  Camera,
} from 'lucide-react';
import type { ProcessedSubmission } from '../types';

interface HistoryViewProps {
  submissions: ProcessedSubmission[];
  isLoading: boolean;
  onSelectSubmission: (submission: ProcessedSubmission) => void;
  onStartBot: () => void;
  onDeleteSubmission: (submission: ProcessedSubmission) => void;
  onClearAllHistory?: () => void;
  onVerifySubmission?: (submissionId: string, status: 'verified' | 'unresolved' | 'pending', note?: string) => void;
  initialStatusFilter?: 'All' | 'Needs Review' | 'Success' | 'Mismatch' | 'Error' | 'Skipped';
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  submissions,
  isLoading,
  onSelectSubmission,
  onStartBot,
  onDeleteSubmission,
  onClearAllHistory,
  onVerifySubmission,
  initialStatusFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Needs Review' | 'Success' | 'Mismatch' | 'Error' | 'Skipped' | 'Multiple Invoices Submitted'>(initialStatusFilter || 'All');
  const [verificationFilter, setVerificationFilter] = useState<'All' | 'Verified' | 'Unresolved' | 'Pending'>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
      setCurrentPage(1);
    }
  }, [initialStatusFilter]);

  // Filter logic
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Status filter
      if (statusFilter === 'Needs Review') {
        if (sub.status === 'Success') return false;
      } else if (statusFilter === 'Skipped') {
        if (sub.status !== 'Skipped' && sub.status !== 'Multiple Invoices Submitted') return false;
      } else if (statusFilter !== 'All' && sub.status !== statusFilter) {
        return false;
      }

      // Client verification filter
      if (verificationFilter === 'Verified') {
        if (sub.clientVerification !== 'verified') return false;
      } else if (verificationFilter === 'Unresolved') {
        if (sub.clientVerification !== 'unresolved') return false;
      } else if (verificationFilter === 'Pending') {
        if (sub.clientVerification === 'verified' || sub.clientVerification === 'unresolved') return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchId = sub.submissionId.toLowerCase().includes(q);
        const matchSupplier = sub.supplierName.toLowerCase().includes(q);
        const matchInv = sub.invoiceNumber.toLowerCase().includes(q);
        if (!matchId && !matchSupplier && !matchInv) return false;
      }

      // Date filter
      if (dateFilter === 'today') {
        const itemDate = new Date(sub.processedAt).toDateString();
        const today = new Date().toDateString();
        if (itemDate !== today) return false;
      } else if (dateFilter === 'week') {
        const itemTime = new Date(sub.processedAt).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (itemTime < sevenDaysAgo) return false;
      }

      return true;
    });
  }, [submissions, statusFilter, searchQuery, dateFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubmissions.slice(start, start + itemsPerPage);
  }, [filteredSubmissions, currentPage, itemsPerPage]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) return;

    const headers = [
      'Submission ID',
      'Date Processed',
      'Status',
      'Invoice Number',
      'Supplier Name',
      'Action Taken',
      'Net Amount (EUR)',
      'Gross Total (EUR)',
      'OCR Confidence',
      'Execution Time (ms)',
    ];

    const rows = filteredSubmissions.map((sub) => [
      sub.submissionId,
      new Date(sub.processedAt).toISOString(),
      sub.status,
      `"${sub.invoiceNumber}"`,
      `"${sub.supplierName}"`,
      `"${sub.actionTaken}"`,
      sub.extractedPdfData?.netAmount ?? '',
      sub.extractedPdfData?.totalAmount ?? '',
      sub.extractedPdfData?.confidenceScore ? `${sub.extractedPdfData.confidenceScore}%` : '',
      sub.executionTimeMs,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quantum_h_invoice_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Success
            </span>
            <span className="text-[9px] text-emerald-400/80 mt-0.5 pl-0.5">
              All products verified — no action needed
            </span>
          </div>
        );
      case 'Incomplete':
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              Incomplete
            </span>
            <span className="text-[9px] text-amber-400/80 mt-0.5 pl-0.5">
              Basket item missing / needs review
            </span>
          </div>
        );
      case 'Mismatch':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <AlertTriangle className="w-3.5 h-3.5" />
            Mismatch
          </span>
        );
      case 'Error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <XCircle className="w-3.5 h-3.5" />
            Error
          </span>
        );
      case 'Needs Review':
      case 'Manual Review':
      case 'Out of Date':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Needs Review
          </span>
        );
      case 'Multiple Invoices Submitted':
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
              <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />
              Multiple Invoices
            </span>
            <span className="text-[9px] text-purple-400/80 mt-0.5 pl-0.5">
              Flagged &amp; Redacted (Info added)
            </span>
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/25">
            {status || 'Skipped'}
          </span>
        );
    }
  };

  return (
    <div id="view-history-container" className="space-y-6 pb-16">
      {/* Title & Top Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Submission History & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Search, filter, and inspect past automated verifications and side-by-side PDF comparison records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onClearAllHistory && submissions.length > 0 && (
            <button
              id="btn-clear-all-history"
              onClick={onClearAllHistory}
              title="Clear all test submissions and unlock submitted_submissions.txt for new test runs"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 hover:border-rose-400/50 transition-all shadow-sm shrink-0"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Reset / Clear All Records</span>
            </button>
          )}
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            disabled={filteredSubmissions.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600/10 dark:bg-purple-600/20 hover:bg-purple-600/20 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-200 border border-purple-500/30 hover:border-purple-400/50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Export CSV ({filteredSubmissions.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-2xl glass-panel shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search by submission ID, supplier, or invoice #..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <select
              id="history-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="All" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">All Statuses</option>
              <option value="Needs Review" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">⚠️ Needs Review (Errors, Mismatches & Incomplete)</option>
              <option value="Success" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Success (All Products Verified)</option>
              <option value="Incomplete" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Incomplete (Basket Issues)</option>
              <option value="Mismatch" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Mismatches</option>
              <option value="Error" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Errors</option>
              <option value="Skipped" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Skipped</option>
              <option value="Multiple Invoices Submitted" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Multiple Invoices Submitted</option>
            </select>
          </div>

          {/* Client Verification Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <select
              id="history-verification-filter"
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="All" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">All Verifications</option>
              <option value="Verified" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">✓ Sahi Hua Hai (Verified)</option>
              <option value="Unresolved" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">⚠ Unresolved (Masla Hai)</option>
              <option value="Pending" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Pending Proof Check</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <select
              id="history-date-filter"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">All Dates</option>
              <option value="today" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Today</option>
              <option value="week" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Past 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-2xl glass-panel shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table id="history-submissions-table" className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-purple-950/20 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-4 pl-6">Submission ID</th>
                <th className="p-4">Date Processed</th>
                <th className="p-4">Status</th>
                <th className="p-4">Client Verification</th>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Supplier Name</th>
                <th className="p-4">Gross Total</th>
                <th className="p-4">Action Taken</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading submission history...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <FileSpreadsheet className="w-10 h-10 text-purple-500/50 mx-auto" />
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        No submissions processed yet.
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {submissions.length === 0
                          ? 'Start the bot from the dashboard to begin automated invoice verification.'
                          : 'No submissions matched your current search filters.'}
                      </p>
                      {submissions.length === 0 && (
                        <button
                          onClick={onStartBot}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-colors"
                        >
                          Start Bot Now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((sub) => {
                  const isNeedsReview =
                    sub.status === 'Needs Review' ||
                    sub.status === 'Mismatch' ||
                    sub.status === 'Error' ||
                    sub.clientVerification === 'unresolved' ||
                    sub.actionTaken?.toLowerCase().includes('out of date') ||
                    sub.actionTaken?.toLowerCase().includes('manual review') ||
                    sub.comparisonData?.discrepancyNote?.toLowerCase().includes('out of date') ||
                    sub.comparisonData?.discrepancyNote?.toLowerCase().includes('manual review');

                  const rawDate = sub.processedAt || (sub as any).dateProcessed;
                  const dateObj = rawDate ? new Date(rawDate) : new Date();
                  const validDate = !isNaN(dateObj.getTime());

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => onSelectSubmission(sub)}
                      className={`hover:bg-purple-500/5 dark:hover:bg-purple-950/20 cursor-pointer transition-colors group ${
                        isNeedsReview ? 'border-l-4 border-l-rose-500 bg-rose-500/5' : ''
                      }`}
                    >
                    <td className="p-4 pl-6 font-mono font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300">
                      #{sub.submissionId}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {validDate ? (
                        <>
                          {dateObj.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {dateObj.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </>
                      ) : (
                        'Recent'
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">{getStatusBadge(sub.status)}</td>
                    <td className="p-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {sub.clientVerification === 'verified' ? (
                          <span
                            id={`status-verified-${sub.submissionId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm"
                            title="Client verified: Sahi submit hua hai"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>✓ Sahi Hua Hai</span>
                          </span>
                        ) : sub.clientVerification === 'unresolved' ? (
                          <span
                            id={`status-unresolved-${sub.submissionId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm"
                            title="Client flagged: Masla hai (Unresolved)"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>⚠ Unresolved</span>
                          </span>
                        ) : (
                          <span
                            id={`status-pending-${sub.submissionId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20"
                            title="Pending client proof check"
                          >
                            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>Pending</span>
                          </span>
                        )}

                        {/* Quick Tick / Masla Toggle Buttons */}
                        {onVerifySubmission && (
                          <div className="flex items-center gap-1 ml-1 opacity-80 hover:opacity-100">
                            <button
                              id={`btn-tick-verify-${sub.submissionId}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onVerifySubmission(sub.submissionId, sub.clientVerification === 'verified' ? 'pending' : 'verified');
                              }}
                              title={sub.clientVerification === 'verified' ? 'Undo verification (mark pending)' : 'Tick: Mark Sahi Hua Hai'}
                              className={`p-1 rounded-md transition-all ${
                                sub.clientVerification === 'verified'
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-flag-unresolved-${sub.submissionId}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onVerifySubmission(sub.submissionId, sub.clientVerification === 'unresolved' ? 'pending' : 'unresolved');
                              }}
                              title={sub.clientVerification === 'unresolved' ? 'Undo unresolved flag' : 'Mark as Unresolved (Masla hai)'}
                              className={`p-1 rounded-md transition-all ${
                                sub.clientVerification === 'unresolved'
                                  ? 'bg-rose-500 text-white hover:bg-rose-400'
                                  : 'bg-rose-500/10 hover:bg-rose-500/30 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {sub.invoiceNumber}
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100 max-w-xs truncate" title={sub.supplierName}>
                      {sub.supplierName}
                    </td>
                    <td className="p-4 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {sub.extractedPdfData?.totalAmount > 0 ? (
                        <div>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            €{sub.extractedPdfData.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </span>
                          {sub.extractedPdfData.productCodes && sub.extractedPdfData.productCodes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {sub.extractedPdfData.productCodes.slice(0, 2).map((c, i) => (
                                <span key={i} className="px-1 py-0.2 rounded text-[9px] bg-purple-500/15 text-purple-700 dark:text-purple-300">
                                  {c}
                                </span>
                              ))}
                              {sub.extractedPdfData.productCodes.length > 2 && (
                                <span className="text-[9px] text-slate-500 dark:text-slate-400">+{sub.extractedPdfData.productCodes.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate" title={sub.actionTaken}>
                      {sub.actionTaken}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="inline-flex items-center gap-2">
                        {(sub.receiptScreenshotUrl || sub.basketScreenshotUrl || sub.screenshotUrl) && (
                          <button
                            id={`btn-proofs-${sub.submissionId}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSubmission(sub);
                            }}
                            title="View Receipt & Basket Screenshots Proof"
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 transition-all"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Proofs</span>
                          </button>
                        )}
                        {sub.status !== 'Success' && (
                          <a
                            id={`btn-manual-review-${sub.submissionId}`}
                            href={`https://admin.velux.quantum-h.com/admin/submissions/${sub.submissionId.replace('id:', '').trim()}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Open in Velux Portal for manual review"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 border border-amber-500/40 hover:border-amber-300 transition-all shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Manual Review</span>
                          </a>
                        )}
                        <button
                          id={`btn-view-details-${sub.submissionId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSubmission(sub);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 group-hover:bg-purple-600 text-purple-700 dark:text-purple-300 group-hover:text-white transition-all border border-purple-500/20"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          id={`btn-delete-test-submission-${sub.submissionId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSubmission(sub);
                          }}
                          title="Delete test record and unlock for re-testing"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-purple-500/15 bg-slate-50/70 dark:bg-black/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="text-slate-900 dark:text-slate-200 font-bold">{paginatedItems.length}</span> of{' '}
            <span className="text-slate-900 dark:text-slate-200 font-bold">{filteredSubmissions.length}</span> results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
