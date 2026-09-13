import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, type ActiveTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { SettingsView } from './views/SettingsView';
import { HistoryView } from './views/HistoryView';
import { AlertsView } from './views/AlertsView';
import { SubmissionDetailModal } from './components/SubmissionDetailModal';
import { PythonIntegrationModal } from './components/PythonIntegrationModal';
import { Toast, type ToastMessage } from './components/Toast';
import type {
  BotStatus,
  BotSettings,
  LogEntry,
  ProcessedSubmission,
  AlertItem,
} from './types';
import {
  subscribeBotStatus,
  subscribeActivityLogs,
  subscribeSubmissions,
  subscribeAlerts,
  subscribeSettings,
  sendStartCommand,
  sendPauseCommand,
  sendStopCommand,
  saveBotSettings,
  updateSubmissionVerificationRemote,
  deleteSubmissionRemote,
  isFirebaseConfigured,
} from './services/botService';

// Default initial fallbacks in case network is delayed
const DEFAULT_STATUS: BotStatus = {
  status: 'stopped',
  lastStatusChange: new Date().toISOString(),
  isConnected: false,
  botHostname: 'Local Windows runner',
  botVersion: 'bot.py',
  lastHeartbeat: '',
  currentlyProcessing: null,
  stats: {
    totalToday: 0,
    matchedSuccessfully: 0,
    mismatchesFound: 0,
    errorsEncountered: 0,
    avgProcessingTimeSec: 0,
    lastRunTime: '',
  },
};

const DEFAULT_SETTINGS: BotSettings = {
  credentials: {
    portalUrl: 'https://admin.quantum-h-portal.internal/invoices/v2',
    email: 'ops-automation@quantum-h.com',
    password: '••••••••••••••••',
    sessionTimeoutMinutes: 45,
  },
  processing: {
    tabFilter: 'Pending & Redacted',
    processMode: 'batch',
    rowsPerRun: 25,
    delayBetweenSubmissionsSec: 3,
    maxRetries: 2,
  },
  safety: {
    autoSubmit: false,
    requireHumanReviewOnMismatch: true,
    stopOnErrorThreshold: 5,
  },
  matching: {
    ignorePrefixLetters: true,
    ignoredPrefixes: ['RG', 'INV', 'RE-', 'RN-', 'RE'],
    requireExactMatch: false,
    tolerateLeadingZeros: true,
    supplierSearchMinChars: 4,
    fuzzyMatchThreshold: 90,
  },
  schedule: {
    enabled: true,
    time: '09:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    timezone: 'Europe/Berlin (UTC+1)',
  },
  veluxRules: {
    campaignStartDate: '2025-01-01',
    nonEligibleProductCodes: ['KALTRAUMFENSTER'],
    nonEligibleProductPrefixes: ['MHL', 'MAL', 'MH', 'MA', 'MAG'],
    knownProductCodes: ['GGU', 'GGL', 'GPU', 'GPL', 'GIL', 'GIU', 'GXU', 'GTL', 'GTU', 'GEL', 'GDL', 'GGLS', 'VU', 'VL', 'VKU', 'VIU', 'VFA', 'VFB', 'VFE', 'CFP', 'CVP', 'CXP', 'CSP', 'CFJ', 'CVJ', 'CSJ', 'SSL', 'SML', 'SST', 'SMS', 'SMSS', 'SMSSS', 'SSI', 'MML', 'MSL', 'MSG', 'MSI', 'MSU', 'MSLS'],
  },
  customRules: [
    {
      id: 'rule-1',
      name: 'High Value Threshold Review',
      field: 'total_amount',
      condition: 'greater_than',
      value: '10000',
      action: 'flag_review',
      enabled: true,
    },
    {
      id: 'rule-2',
      name: 'Special Supplier Auto-Validation',
      field: 'supplier_name',
      condition: 'contains',
      value: 'WÖLPERT',
      action: 'auto_approve',
      enabled: true,
    },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [botStatus, setBotStatus] = useState<BotStatus>(DEFAULT_STATUS);
  const [settings, setSettings] = useState<BotSettings>(DEFAULT_SETTINGS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [submissions, setSubmissions] = useState<ProcessedSubmission[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ProcessedSubmission | null>(null);
  const [historyInitialFilter, setHistoryInitialFilter] = useState<'All' | 'Needs Review' | 'Success' | 'Mismatch' | 'Error' | 'Skipped'>('All');

  // Theme & Layout States
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quantum_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('quantum_sidebar_collapsed') === 'true';
    }
    return false;
  });

  // Sync theme with document class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('quantum_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('quantum_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Modals & UI States
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Live Subscriptions (Dual Mode: Firebase Real-Time Firestore OR Local HTTP)
  useEffect(() => {
    const unsubStatus = subscribeBotStatus((status) => {
      setBotStatus((prev) => ({ ...prev, ...status }));
    });

    const unsubLogs = subscribeActivityLogs((newLogs) => {
      setLogs(newLogs);
    });

    const unsubSubs = subscribeSubmissions((subs) => {
      setSubmissions(subs);
    });

    const unsubAlerts = subscribeAlerts((al) => {
      setAlerts(al);
    });

    const unsubSettings = subscribeSettings((st) => {
      setSettings(st);
    });

    return () => {
      unsubStatus();
      unsubLogs();
      unsubSubs();
      unsubAlerts();
      unsubSettings();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (!isFirebaseConfigured) {
        const [statusRes, logsRes, settingsRes, historyRes, alertsRes] = await Promise.all([
          fetch('/api/status'),
          fetch('/api/logs?limit=80'),
          fetch('/api/settings'),
          fetch('/api/history?limit=50'),
          fetch('/api/alerts'),
        ]);
        if (statusRes.ok) setBotStatus((prev) => ({ ...prev, ...(statusRes.json() as any) }));
        if (logsRes.ok) {
          const l = await logsRes.json();
          if (l.logs) setLogs(l.logs);
        }
        if (settingsRes.ok) setSettings(await settingsRes.json());
        if (historyRes.ok) {
          const h = await historyRes.json();
          if (h.items) setSubmissions(h.items);
        }
        if (alertsRes.ok) {
          const a = await alertsRes.json();
          if (a.alerts) setAlerts(a.alerts);
        }
      }
      addToast('info', 'Dashboard refreshed.');
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  // Action handlers using Unified Cloud & Local Dispatcher
  const handleStartBot = async () => {
    setIsLoadingAction(true);
    try {
      const res = await sendStartCommand();
      if (res.success) {
        setBotStatus((prev) => ({
          ...prev,
          status: 'running',
          lastStatusChange: new Date().toISOString(),
        }));
        addToast('success', res.message);
      } else {
        addToast('error', res.message);
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to dispatch start command.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleStopBot = async () => {
    setIsLoadingAction(true);
    try {
      const res = await sendStopCommand();
      if (res.success) {
        setBotStatus((prev) => ({
          ...prev,
          status: 'stopped',
          currentlyProcessing: null,
          lastStatusChange: new Date().toISOString(),
        }));
        addToast('info', res.message);
      } else {
        addToast('error', res.message);
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to dispatch stop command.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handlePauseBot = async () => {
    setIsLoadingAction(true);
    try {
      const res = await sendPauseCommand();
      if (res.success) {
        setBotStatus((prev) => ({
          ...prev,
          status: 'paused',
          lastStatusChange: new Date().toISOString(),
        }));
        addToast('info', res.message);
      } else {
        addToast('error', res.message);
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to pause bot.');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleSaveSettings = async (updated: BotSettings) => {
    setIsSavingSettings(true);
    try {
      const res = await saveBotSettings(updated);
      if (res.success) {
        setSettings(updated);
        addToast('success', res.message);
      } else {
        addToast('error', res.message);
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Network error while saving settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleResolveAlert = async (id: string, action: 'reviewed' | 'retry') => {
    try {
      const res = await fetch(`/api/alerts/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: action === 'retry' ? 'retried' : 'reviewed',
                  resolvedBy: action === 'retry' ? 'Ops Lead (Retry)' : 'Ops Lead (Reviewed)',
                  resolvedAt: new Date().toISOString(),
                }
              : a
          )
        );
        if (data.stats) {
          setBotStatus((prev) => ({
            ...prev,
            stats: data.stats,
          }));
        } else {
          fetchStatusAndLogs();
        }
        addToast(
          'success',
          action === 'retry'
            ? 'Submission queued for immediate re-execution.'
            : 'Alert marked as reviewed and archived.'
        );
      } else {
        const data = await res.json().catch(() => ({}));
        addToast('error', data.message || 'Retry could not be started. Stop the currently running bot first.');
      }
    } catch (err) {
      addToast('error', 'Failed to resolve alert.');
    }
  };

  const handleResolveAllAlerts = async () => {
    try {
      const res = await fetch('/api/alerts/resolve-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAlerts((prev) =>
          prev.map((a) => ({
            ...a,
            status: 'reviewed',
            resolvedBy: 'Ops Lead (Reviewed)',
            resolvedAt: new Date().toISOString(),
          }))
        );
        if (data.stats) {
          setBotStatus((prev) => ({
            ...prev,
            stats: data.stats,
          }));
        } else {
          fetchStatusAndLogs();
        }
        addToast('success', `All unresolved alerts marked as reviewed.`);
      } else {
        addToast('error', 'Failed to mark alerts as reviewed.');
      }
    } catch (err) {
      addToast('error', 'Failed to resolve all alerts.');
    }
  };

  const handleDeleteTestSubmission = async (submission: ProcessedSubmission) => {
    const confirmed = window.confirm(
      `Delete local test record #${submission.submissionId}?\n\nThis will also unlock the submission in submitted_submissions.txt so it can be re-tested by the bot immediately.`,
    );
    if (!confirmed) return;
    try {
      await deleteSubmissionRemote(submission);
      setSubmissions((previous) => previous.filter((entry) => entry.id !== submission.id && entry.submissionId !== submission.submissionId));
      setAlerts((previous) => previous.filter((alert) => alert.submissionId !== submission.submissionId));
      addToast('success', `Test record #${submission.submissionId} deleted and unlocked for re-testing.`);
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Could not delete the test record.');
    }
  };

  const handleClearAllHistory = async () => {
    const confirmed = window.confirm(
      `Clear ALL test submission history and reset bot locks?\n\nThis will remove local records and reset submitted_submissions.txt so all invoices can be re-tested from scratch.`
    );
    if (!confirmed) return;
    try {
      let res = await fetch('/api/history', { method: 'DELETE' });
      if (!res.ok) {
        res = await fetch('/api/history/all', { method: 'DELETE' });
      }
      if (!res.ok) {
        res = await fetch('/api/history/clear', { method: 'POST' });
      }
      if (!res.ok && submissions.length > 0) {
        await Promise.allSettled(
          submissions.map((sub) => deleteSubmissionRemote(sub))
        );
      }
      setSubmissions([]);
      setAlerts([]);
      setBotStatus((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalToday: 0,
          matchedSuccessfully: 0,
          mismatchesFound: 0,
          errorsEncountered: 0,
        },
      }));
      addToast('success', 'All test history and bot submission locks cleared. Ready for fresh testing.');
    } catch (err) {
      addToast('error', 'Failed to clear test history.');
    }
  };

  const handleVerifySubmission = async (
    submissionId: string,
    verification: 'verified' | 'unresolved' | 'pending',
    note?: string
  ) => {
    try {
      const cleanId = (submissionId || '').replace(/^(sub-|#|id:|row:)/i, '').trim();
      await updateSubmissionVerificationRemote(submissionId, verification, note);

      setSubmissions((prev) =>
        prev.map((s) => {
          const sClean = (s.submissionId || s.id || '').replace(/^(sub-|#|id:|row:)/i, '').trim();
          if (sClean === cleanId || s.submissionId === submissionId || s.id === submissionId) {
            return {
              ...s,
              clientVerification: verification,
              clientVerificationNote: note !== undefined ? note : s.clientVerificationNote,
            };
          }
          return s;
        })
      );

      if (selectedSubmission) {
        const selClean = (selectedSubmission.submissionId || selectedSubmission.id || '').replace(/^(sub-|#|id:|row:)/i, '').trim();
        if (selClean === cleanId || selectedSubmission.submissionId === submissionId || selectedSubmission.id === submissionId) {
          setSelectedSubmission((prev) =>
            prev
              ? {
                  ...prev,
                  clientVerification: verification,
                  clientVerificationNote: note !== undefined ? note : prev.clientVerificationNote,
                }
              : null
          );
        }
      }

      const msg =
        verification === 'verified'
          ? `✓ Submission #${cleanId} marked as Verified (Sahi Hua Hai)`
          : verification === 'unresolved'
          ? `⚠ Submission #${cleanId} flagged as Unresolved (Masla Hai)`
          : `Submission #${cleanId} reset to pending`;
      addToast(verification === 'unresolved' ? 'error' : 'success', msg);
    } catch (err) {
      addToast('error', 'Failed to update verification status.');
    }
  };

  const handleOpenSubmissionModalById = async (submissionId: string) => {
    // Look up in existing submissions
    const found = submissions.find((s) => s.submissionId === submissionId);
    if (found) {
      setSelectedSubmission(found);
      return;
    }

    try {
      const res = await fetch(`/api/history/${submissionId}`);
      if (res.ok) {
        const item = await res.json();
        setSelectedSubmission(item);
      } else {
        addToast('info', `Submission details for #${submissionId} loading from active queue...`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    addToast('info', 'Local log display cleared.');
  };

  const unresolvedAlertsCount = alerts.filter((a) => a.status === 'unresolved').length;

  return (
    <div
      id="quantum-h-bot-app"
      className="min-h-screen bg-slate-50 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white relative overflow-x-hidden transition-colors duration-300"
    >
      {/* Ambient Liquid Mesh Glow */}
      <div className="liquid-mesh-bg" aria-hidden="true">
        <div className="liquid-orb-1" />
        <div className="liquid-orb-2" />
        <div className="liquid-orb-3" />
      </div>

      {/* Top Floating Pill Navbar */}
      <Navbar
        status={botStatus.status}
        unresolvedAlertsCount={unresolvedAlertsCount}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onToggleSidebar={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsMobileSidebarOpen((prev) => !prev);
          } else {
            handleToggleSidebarCollapse();
          }
        }}
        onNavigateToAlerts={() => setActiveTab('alerts')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isSidebarCollapsed={isSidebarCollapsed}
        isConnected={botStatus.isConnected}
        isCloudRelay={isFirebaseConfigured}
      />

      <div className="flex-1 flex relative z-10">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'history') setHistoryInitialFilter('All');
            setActiveTab(tab);
          }}
          botStatus={botStatus}
          unresolvedAlertsCount={unresolvedAlertsCount}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenPythonModal={() => setIsPythonModalOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
        />

        {/* Main Content Area */}
        <main
          id="main-app-content-stage"
          className={`flex-1 transition-all duration-300 w-full min-w-0 ${
            isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64 xl:pl-72'
          }`}
        >
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {activeTab === 'dashboard' && (
              <DashboardView
                botStatus={botStatus}
                logs={logs}
                onStartBot={handleStartBot}
                onStopBot={handleStopBot}
                onPauseBot={handlePauseBot}
                isLoadingAction={isLoadingAction}
                onClearLogs={handleClearLogs}
                onOpenSubmissionModal={handleOpenSubmissionModalById}
                onNavigateToAlerts={() => setActiveTab('alerts')}
                onNavigateToHistory={(filter) => {
                  setHistoryInitialFilter(filter || 'All');
                  setActiveTab('history');
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
                isSaving={isSavingSettings}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                submissions={submissions}
                isLoading={isLoadingHistory}
                onSelectSubmission={(sub) => setSelectedSubmission(sub)}
                onStartBot={handleStartBot}
                onDeleteSubmission={handleDeleteTestSubmission}
                onClearAllHistory={handleClearAllHistory}
                onVerifySubmission={handleVerifySubmission}
                initialStatusFilter={historyInitialFilter}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsView
                alerts={alerts}
                onResolveAlert={handleResolveAlert}
                onResolveAllAlerts={handleResolveAllAlerts}
                onInspectSubmission={handleOpenSubmissionModalById}
              />
            )}
          </div>
        </main>
      </div>

      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onDeleteSubmission={handleDeleteTestSubmission}
        onVerifySubmission={handleVerifySubmission}
      />

      {/* Python Integration Modal */}
      <PythonIntegrationModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
