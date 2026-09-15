import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Terminal,
  ShieldAlert,
  HelpCircle,
  FileText,
  Trash2,
  Maximize2,
  ZoomIn,
  Image as ImageIcon,
} from 'lucide-react';
import type { ProcessedSubmission } from '../types';

interface SubmissionDetailModalProps {
  submission: ProcessedSubmission | null;
  onClose: () => void;
  onDeleteSubmission?: (submission: ProcessedSubmission) => void;
  onVerifySubmission?: (submissionId: string, status: 'verified' | 'unresolved' | 'pending', note?: string) => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  submission,
  onClose,
  onDeleteSubmission,
  onVerifySubmission,
}) => {
  if (!submission) return null;

  const cleanId = (submission.submissionId || submission.id || '').replace(/^(sub-|#|id:|row:)/i, '').trim();
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(submission.screenshotUrl || null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(
    submission.receiptScreenshotUrl || (cleanId ? `/debug_screenshots/receipt_${cleanId}.png` : null)
  );
  const [basketUrl, setBasketUrl] = useState<string | null>(
    submission.basketScreenshotUrl || (cleanId ? `/debug_screenshots/basket_${cleanId}.png` : null) || submission.screenshotUrl || null
  );
  const [clientVerification, setClientVerification] = useState<'verified' | 'unresolved' | 'pending'>(
    submission.clientVerification || 'pending'
  );
  const [updatingVerification, setUpdatingVerification] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedTitle, setZoomedTitle] = useState<string>('');
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);

  useEffect(() => {
    setClientVerification(submission.clientVerification || 'pending');
    setReceiptUrl(submission.receiptScreenshotUrl || (cleanId ? `/debug_screenshots/receipt_${cleanId}.png` : null));
    setBasketUrl(submission.basketScreenshotUrl || (cleanId ? `/debug_screenshots/basket_${cleanId}.png` : null) || submission.screenshotUrl || null);

    if (submission.screenshotUrl) {
      setScreenshotUrl(submission.screenshotUrl);
      return;
    }

    // Try to resolve screenshot dynamically from backend (e.g. matching debug files)
    if (cleanId) {
      setLoadingScreenshot(true);
      fetch(`/api/submission-screenshot/${encodeURIComponent(cleanId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.url) {
            setScreenshotUrl(data.url);
            if (!basketUrl) setBasketUrl(data.url);
          } else {
            setScreenshotUrl(null);
          }
        })
        .catch(() => setScreenshotUrl(null))
        .finally(() => setLoadingScreenshot(false));
    } else {
      setScreenshotUrl(null);
    }
  }, [submission, cleanId]);

  const handleVerify = async (status: 'verified' | 'unresolved' | 'pending') => {
    setUpdatingVerification(true);
    try {
      if (onVerifySubmission) {
        await onVerifySubmission(cleanId || submission.submissionId || submission.id, status);
        setClientVerification(status);
        submission.clientVerification = status;
      } else {
        const res = await fetch(`/api/history/${encodeURIComponent(cleanId || submission.id)}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientVerification: status }),
        });
        if (res.ok) {
          setClientVerification(status);
          submission.clientVerification = status;
        }
      }
    } catch (err) {
      console.error('Failed to update client verification:', err);
    } finally {
      setUpdatingVerification(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified & Matched
          </span>
        );
      case 'Incomplete':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Incomplete (Basket Issues)
          </span>
        );
      case 'Mismatch':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Invoice Mismatch
          </span>
        );
      case 'Error':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Processing Error
          </span>
        );
      case 'Needs Review':
      case 'Manual Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Needs Manual Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Skipped
          </span>
        );
    }
  };

  return (
    <div
      id="submission-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-hidden"
      onClick={onClose}
    >
      <div
        id="submission-detail-modal-card"
        className="relative w-full max-w-5xl bg-white dark:bg-[#121224] border-t sm:border border-slate-200 dark:border-purple-500/20 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200 flex flex-col max-h-[92vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 p-3.5 sm:p-5 border-b border-slate-200 dark:border-purple-500/15 bg-white/95 dark:bg-[#121224]/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  Submission #{submission.submissionId}
                </h2>
                {getStatusBadge(submission.status)}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="truncate max-w-[140px] sm:max-w-none">{submission.supplierName}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                  <Clock className="w-3 h-3" />
                  {new Date(submission.processedAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px] sm:text-[11px]">
                  {submission.executionTimeMs}ms
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`https://admin.velux.quantum-h.com/admin/submissions/${submission.submissionId.replace('id:', '').trim()}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 transition-colors"
            >
              <span>Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              id="close-submission-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Client Verification Action Bar */}
          {/* Client Verification Action Bar */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-gradient-to-r dark:from-[#171732] dark:via-[#14142a] dark:to-[#171732] border border-slate-200 dark:border-purple-500/25 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  clientVerification === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : clientVerification === 'unresolved'
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : 'bg-slate-200/80 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-500/30'
                }`}
              >
                {clientVerification === 'verified' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : clientVerification === 'unresolved' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </div>
              <div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400">
                  Client Submission Verification
                </div>
                <div className="text-sm font-semibold flex items-center gap-2 mt-0.5">
                  {clientVerification === 'verified' ? (
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      Verified by Client (Sahi Hua Hai)
                    </span>
                  ) : clientVerification === 'unresolved' ? (
                    <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-bold">
                      <XCircle className="w-4 h-4" />
                      Unresolved — Client Flagged Problem (Masla Hai)
                    </span>
                  ) : (
                    <span className="text-slate-800 dark:text-slate-300 font-medium">
                      Pending Client Verification (Proofs check karke verify karein)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
              <button
                id="modal-client-verify-btn"
                onClick={() => handleVerify('verified')}
                disabled={updatingVerification}
                className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                  clientVerification === 'verified'
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                    : 'bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>✓ Sahi Hua Hai</span>
              </button>
              <button
                id="modal-client-unresolved-btn"
                onClick={() => handleVerify('unresolved')}
                disabled={updatingVerification}
                className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                  clientVerification === 'unresolved'
                    ? 'bg-rose-600 text-white ring-2 ring-rose-400/50'
                    : 'bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                }`}
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span>⚠ Masla Hai</span>
              </button>
            </div>
          </div>
          {/* Manual Review Required Banner (if not Success) */}
          {submission.status !== 'Success' && (
            <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400 font-bold flex items-center gap-2">
                    <span>Manual Review Required</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-900 dark:text-amber-300 text-[10px] font-mono font-bold">
                      Status: {submission.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 font-medium">
                    {submission.comparisonData.discrepancyNote || submission.actionTaken || "Discrepancy detected during automated verification."}
                  </p>
                </div>
              </div>
              <a
                href={`https://admin.velux.quantum-h.com/admin/submissions/${submission.submissionId.replace('id:', '').trim()}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all shadow-md shrink-0"
              >
                <span>Open for Manual Review</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Action Taken Banner */}
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/15 border border-purple-200 dark:border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-700 dark:text-purple-300">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-purple-700 dark:text-purple-400 font-bold">
                  Action Executed by Playwright Automation
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {submission.actionTaken}
                </div>
              </div>
            </div>
            {submission.extractedPdfData.confidenceScore && (
              <div className="text-right">
                <div className="text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold">
                  OCR Confidence
                </div>
                <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {submission.extractedPdfData.confidenceScore}%
                </div>
              </div>
            )}
          </div>

          {/* Comparison Side-by-Side */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Data Verification Comparison
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Extracted PDF Stream vs Internal Portal PO Record
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PDF Extracted Data */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#17172e] border border-slate-200 dark:border-white/10 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                      Incoming Supplier PDF
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    Parsed via OCR & Regex
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/80 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Extracted Invoice #:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {submission.extractedPdfData.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Supplier Name:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200 text-right">
                      {submission.extractedPdfData.supplierName}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Invoice Date:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-300 font-medium">
                      {submission.extractedPdfData.date}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Net Amount:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-300 font-medium">
                      €{submission.extractedPdfData.netAmount?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Tax Amount (19%):</span>
                    <span className="font-mono text-slate-800 dark:text-slate-300 font-medium">
                      €{submission.extractedPdfData.taxAmount?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-700 dark:text-slate-400 font-bold">Gross Total:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      €{submission.extractedPdfData.totalAmount?.toLocaleString('de-DE', { minimumFractionDigits: 2 })}{' '}
                      {submission.extractedPdfData.currency}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-slate-200/80 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">IBAN:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-400 text-[11px]">
                      {submission.extractedPdfData.iban || '—'}
                    </span>
                  </div>
                  {submission.extractedPdfData.productCodes && submission.extractedPdfData.productCodes.length > 0 && (
                    <div className="flex justify-between py-1 border-t border-slate-200/80 dark:border-white/5 items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">VCI Codes:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                        {submission.extractedPdfData.productCodes.map((code, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {submission.extractedPdfData.basketProducts && submission.extractedPdfData.basketProducts.length > 0 && (
                    <div className="py-2 border-t border-slate-200 dark:border-white/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-800 dark:text-slate-300 font-bold">Basket Details (PIM):</span>
                        <span className="text-[10px] text-purple-700 dark:text-purple-300 font-mono font-semibold">
                          {submission.extractedPdfData.basketProducts.length} item(s) added
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {submission.extractedPdfData.basketProducts.map((bp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-500/40 flex items-center gap-1.5 font-bold"
                          >
                            <span>{bp.code}</span>
                            <span className="text-purple-900 dark:text-purple-300 bg-purple-200/70 dark:bg-purple-900/60 px-1 rounded text-[10px]">
                              Qty: {bp.quantity}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {submission.extractedPdfData.reviewStatus && (
                    <div className="flex justify-between py-1 border-t border-slate-200/80 dark:border-white/5 items-center">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Review Status:</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                        {submission.extractedPdfData.reviewStatus}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Target / Expected PO Record */}
              <div
                className={`p-4 rounded-xl border space-y-3 shadow-xs ${
                  submission.comparisonData.matched
                    ? 'bg-emerald-50/70 dark:bg-[#151c2c] border-emerald-300 dark:border-emerald-500/30'
                    : 'bg-rose-50/70 dark:bg-[#291720] border-rose-300 dark:border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        submission.comparisonData.matched ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        submission.comparisonData.matched ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      Admin Portal PO Record
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                      submission.comparisonData.matched
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                    }`}
                  >
                    {submission.comparisonData.matched ? 'Match Confirmed' : 'Mismatch Flagged'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/80 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Purchase Order #:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {submission.comparisonData.orderNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Target Invoice #:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {submission.comparisonData.targetInvoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/80 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Match Verdict:</span>
                    <span
                      className={`font-bold ${
                        submission.comparisonData.matched ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {submission.comparisonData.matched ? 'Passed 100%' : 'Mismatch Detected'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 text-[11px] leading-relaxed text-slate-800 dark:text-slate-300 shadow-xs">
                    <span className="font-bold text-purple-700 dark:text-purple-300">Rule Note: </span>
                    {submission.comparisonData.discrepancyNote}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Injected Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#17172e] border border-slate-200 dark:border-white/10 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Values Keyed Into Admin Portal Fields
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Supplier Field</span>
                <span className="font-bold text-slate-900 dark:text-slate-200 truncate block mt-0.5">
                  {submission.formFilledData.supplierInput || '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Invoice Number Field</span>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300 block mt-0.5">
                  {submission.formFilledData.invoiceNumberInput || '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Total Gross Field</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200 block mt-0.5">
                  €{submission.formFilledData.totalAmountInput || '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-black/40 border border-slate-200 dark:border-white/5 shadow-xs">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Auto-Submit Mode</span>
                <span className="font-bold text-amber-700 dark:text-amber-400 block mt-0.5">
                  {submission.formFilledData.submittedAutomatically ? 'Direct Auto-Submit' : 'Manual Approval Required'}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Audit Trail */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#17172e] border border-slate-200 dark:border-white/10 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Bot Execution Step Timestamps
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {submission.auditSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <span className="text-slate-800 dark:text-slate-200 truncate font-medium">{step.step}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-semibold">
                    {step.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Verification Proofs (Beleg vs Eingetragener Warenkorb) */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#17172e] border border-purple-200 dark:border-purple-500/25 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  Verification Proof Artifacts (Screenshots)
                </h3>
                {submission.status === 'Error' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 animate-pulse">
                    🚨 ERROR CAPTURE
                  </span>
                ) : submission.status === 'Incomplete' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                    ⚠️ INCOMPLETE BASKET SNAPSHOT
                  </span>
                ) : submission.status === 'Mismatch' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                    ⚠️ MISMATCH SNAPSHOT
                  </span>
                ) : submission.status === 'Needs Review' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40">
                    📋 MANUAL REVIEW REQUIRED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                    ✓ VERIFIED PROOFS
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Click any proof to inspect in full resolution
              </span>
            </div>

            {/* Side-by-Side Dual Proof Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Proof 1: Original Receipt / Beleg */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-black/60 flex flex-col shadow-sm">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      1. Original Receipt / Beleg (Products Proof)
                    </span>
                  </div>
                  {receiptUrl && (
                    <button
                      onClick={() => {
                        setZoomedImage(receiptUrl);
                        setZoomedTitle(`Original Receipt / Beleg — #${submission.submissionId}`);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold bg-purple-100 dark:bg-purple-600/30 hover:bg-purple-200 dark:hover:bg-purple-600/50 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-500/30 transition-colors"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Expand</span>
                    </button>
                  )}
                </div>

                <div
                  className="relative flex-1 min-h-[260px] max-h-[420px] p-2 flex items-center justify-center bg-slate-100 dark:bg-black/50 cursor-zoom-in group"
                  onClick={() => {
                    if (receiptUrl) {
                      setZoomedImage(receiptUrl);
                      setZoomedTitle(`Original Receipt / Beleg — #${submission.submissionId}`);
                    }
                  }}
                  title="Click to view full resolution"
                >
                  {receiptUrl ? (
                    <>
                      <img
                        src={receiptUrl}
                        alt={`Original receipt for #${submission.submissionId}`}
                        className="max-h-[400px] w-auto max-w-full object-contain rounded-lg shadow-xl transition-transform group-hover:scale-[1.01]"
                        onError={() => setReceiptUrl(null)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 shadow-xl">
                          <ZoomIn className="w-3.5 h-3.5 text-purple-400" />
                          View Full Size
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 space-y-2">
                      <FileText className="w-10 h-10 text-purple-400/40 mx-auto" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-300">Receipt Image Artifact</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Receipt snapshot will appear here when processed by the bot.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Proof 2: Velux Portal Basket Added */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-black/60 flex flex-col shadow-sm">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      2. Velux Portal Basket Added (PIM Proof)
                    </span>
                  </div>
                  {basketUrl && (
                    <button
                      onClick={() => {
                        setZoomedImage(basketUrl);
                        setZoomedTitle(`Velux Portal Basket Added — #${submission.submissionId}`);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold bg-purple-100 dark:bg-purple-600/30 hover:bg-purple-200 dark:hover:bg-purple-600/50 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-500/30 transition-colors"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Expand</span>
                    </button>
                  )}
                </div>

                <div
                  className="relative flex-1 min-h-[260px] max-h-[420px] p-2 flex items-center justify-center bg-slate-100 dark:bg-black/50 cursor-zoom-in group"
                  onClick={() => {
                    if (basketUrl) {
                      setZoomedImage(basketUrl);
                      setZoomedTitle(`Velux Portal Basket Added — #${submission.submissionId}`);
                    }
                  }}
                  title="Click to view full resolution"
                >
                  {loadingScreenshot ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-2">
                      <span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin inline-block" />
                      <p className="text-xs">Checking for basket screenshot...</p>
                    </div>
                  ) : basketUrl ? (
                    <>
                      <img
                        src={basketUrl}
                        alt={`Portal basket for #${submission.submissionId}`}
                        className="max-h-[400px] w-auto max-w-full object-contain rounded-lg shadow-xl transition-transform group-hover:scale-[1.01]"
                        onError={() => setBasketUrl(null)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur text-xs font-bold text-white border border-white/20 flex items-center gap-1.5 shadow-xl">
                          <ZoomIn className="w-3.5 h-3.5 text-purple-400" />
                          View Full Size
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 space-y-2">
                      <Terminal className="w-10 h-10 text-purple-400/40 mx-auto" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-300">Portal Basket Snapshot</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Screenshot of the portal basket table will be automatically captured after product entry.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 px-4 sm:px-6 border-t border-slate-200 dark:border-purple-500/15 bg-white/95 dark:bg-[#121224]/95 backdrop-blur-md">
          <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
            ID: <span className="font-mono text-slate-900 dark:text-slate-300 font-bold">{submission.submissionId || submission.id}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {onDeleteSubmission && (
              <button
                id="modal-footer-delete-btn"
                onClick={() => {
                  onDeleteSubmission(submission);
                  onClose();
                }}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-rose-100 dark:bg-rose-500/20 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white border border-rose-300 dark:border-rose-500/40 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Test</span>
              </button>
            )}
            <button
              id="modal-footer-close-btn"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Screenshot Lightbox */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col p-3 sm:p-4 animate-in fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="font-mono font-bold text-white text-xs sm:text-sm truncate">
                {zoomedTitle || `Snapshot — #${submission.submissionId}`}
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                (Click ESC or Close to exit)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={zoomedImage}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/30 text-purple-200 border border-purple-500/40 hover:bg-purple-600/50 transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">Open in New Tab</span>
                <span className="sm:hidden">Full</span>
              </a>
              <button
                onClick={() => setZoomedImage(null)}
                className="px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-1 sm:p-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={zoomedImage}
              alt="Full viewport snapshot"
              className="max-w-full w-auto max-h-[82vh] sm:max-h-none sm:max-w-none object-contain rounded-lg shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};
