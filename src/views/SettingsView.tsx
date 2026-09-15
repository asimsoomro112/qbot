import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  ShieldAlert,
  Calendar,
  Layers,
  KeyRound,
  Sparkles,
  Cpu,
  RefreshCw,
  Sliders,
  CheckCircle2,
  FileSearch,
  Laptop,
  Check,
  Plus,
  X
} from 'lucide-react';
import type { BotSettings, CustomRule } from '../types';
import { DEFAULT_BOT_SETTINGS } from '../types';

interface SettingsViewProps {
  settings: BotSettings;
  onSaveSettings: (updated: BotSettings) => Promise<void>;
  isSaving: boolean;
}

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  isSaving,
}) => {
  // Merge settings with defaults to guarantee all fields exist
  const getMergedSettings = (src: BotSettings): BotSettings => ({
    ...DEFAULT_BOT_SETTINGS,
    ...src,
    credentials: { ...DEFAULT_BOT_SETTINGS.credentials, ...(src.credentials || {}) },
    processing: { ...DEFAULT_BOT_SETTINGS.processing, ...(src.processing || {}) },
    safety: { ...DEFAULT_BOT_SETTINGS.safety, ...(src.safety || {}) },
    matching: { ...DEFAULT_BOT_SETTINGS.matching, ...(src.matching || {}) },
    schedule: { ...DEFAULT_BOT_SETTINGS.schedule, ...(src.schedule || {}) },
    veluxRules: { ...DEFAULT_BOT_SETTINGS.veluxRules, ...(src.veluxRules || {}) },
    customRules: src.customRules || DEFAULT_BOT_SETTINGS.customRules,
  });

  const [form, setForm] = useState<BotSettings>(() => getMergedSettings(settings));
  const [showPassword, setShowPassword] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // Tag input states
  const [prefixInput, setPrefixInput] = useState('');
  const [eligibleCodeInput, setEligibleCodeInput] = useState('');
  const [nonEligiblePrefixInput, setNonEligiblePrefixInput] = useState('');
  const [nonEligibleCodeInput, setNonEligibleCodeInput] = useState('');
  const [markerInput, setMarkerInput] = useState('');

  // Synchronize when settings prop updates from server
  useEffect(() => {
    setForm(getMergedSettings(settings));
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(form);
  };

  const handleResetToCurrent = () => {
    setForm(getMergedSettings(settings));
  };

  const handleResetToBotDefaults = () => {
    if (window.confirm('Reset all rules, credentials and automation parameters to bot.py code defaults?')) {
      setForm(JSON.parse(JSON.stringify(DEFAULT_BOT_SETTINGS)));
    }
  };

  const toggleDayOfWeek = (dayVal: number) => {
    const currentDays = form.schedule.daysOfWeek;
    let nextDays: number[];
    if (currentDays.includes(dayVal)) {
      nextDays = currentDays.filter((d) => d !== dayVal);
    } else {
      nextDays = [...currentDays, dayVal].sort();
    }
    setForm({
      ...form,
      schedule: {
        ...form.schedule,
        daysOfWeek: nextDays,
      },
    });
  };

  // Tag helper functions
  const handleAddPrefix = () => {
    if (!prefixInput.trim()) return;
    const clean = prefixInput.trim().toUpperCase();
    if (!form.matching.ignoredPrefixes.includes(clean)) {
      setForm({
        ...form,
        matching: {
          ...form.matching,
          ignoredPrefixes: [...form.matching.ignoredPrefixes, clean],
        },
      });
    }
    setPrefixInput('');
  };

  const handleRemovePrefix = (prefix: string) => {
    setForm({
      ...form,
      matching: {
        ...form.matching,
        ignoredPrefixes: form.matching.ignoredPrefixes.filter((p) => p !== prefix),
      },
    });
  };

  const handleAddEligibleCode = () => {
    if (!eligibleCodeInput.trim()) return;
    const clean = eligibleCodeInput.trim().toUpperCase();
    const current = form.veluxRules.knownProductCodes || [];
    if (!current.includes(clean)) {
      setForm({
        ...form,
        veluxRules: {
          ...form.veluxRules,
          knownProductCodes: [...current, clean],
        },
      });
    }
    setEligibleCodeInput('');
  };

  const handleRemoveEligibleCode = (code: string) => {
    setForm({
      ...form,
      veluxRules: {
        ...form.veluxRules,
        knownProductCodes: (form.veluxRules.knownProductCodes || []).filter((c) => c !== code),
      },
    });
  };

  const handleAddNonEligiblePrefix = () => {
    if (!nonEligiblePrefixInput.trim()) return;
    const clean = nonEligiblePrefixInput.trim().toUpperCase();
    const current = form.veluxRules.nonEligibleProductPrefixes || [];
    if (!current.includes(clean)) {
      setForm({
        ...form,
        veluxRules: {
          ...form.veluxRules,
          nonEligibleProductPrefixes: [...current, clean],
        },
      });
    }
    setNonEligiblePrefixInput('');
  };

  const handleRemoveNonEligiblePrefix = (prefix: string) => {
    setForm({
      ...form,
      veluxRules: {
        ...form.veluxRules,
        nonEligibleProductPrefixes: (form.veluxRules.nonEligibleProductPrefixes || []).filter((p) => p !== prefix),
      },
    });
  };

  const handleAddNonEligibleCode = () => {
    if (!nonEligibleCodeInput.trim()) return;
    const clean = nonEligibleCodeInput.trim().toUpperCase();
    const current = form.veluxRules.nonEligibleProductCodes || [];
    if (!current.includes(clean)) {
      setForm({
        ...form,
        veluxRules: {
          ...form.veluxRules,
          nonEligibleProductCodes: [...current, clean],
        },
      });
    }
    setNonEligibleCodeInput('');
  };

  const handleRemoveNonEligibleCode = (code: string) => {
    setForm({
      ...form,
      veluxRules: {
        ...form.veluxRules,
        nonEligibleProductCodes: (form.veluxRules.nonEligibleProductCodes || []).filter((c) => c !== code),
      },
    });
  };

  const handleAddMarker = () => {
    if (!markerInput.trim()) return;
    const clean = markerInput.trim().toLowerCase();
    const current = form.veluxRules.nonInvoiceDocumentMarkers || [];
    if (!current.includes(clean)) {
      setForm({
        ...form,
        veluxRules: {
          ...form.veluxRules,
          nonInvoiceDocumentMarkers: [...current, clean],
        },
      });
    }
    setMarkerInput('');
  };

  const handleRemoveMarker = (marker: string) => {
    setForm({
      ...form,
      veluxRules: {
        ...form.veluxRules,
        nonInvoiceDocumentMarkers: (form.veluxRules.nonInvoiceDocumentMarkers || []).filter((m) => m !== marker),
      },
    });
  };

  return (
    <form id="settings-configuration-form" onSubmit={handleSave} className="space-y-6 pb-16">
      {/* Header with Title and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-14 sm:top-16 z-20 py-2.5 sm:py-4 bg-slate-50/90 dark:bg-[#07090e]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 -mx-3 sm:-mx-6 px-3 sm:px-6 transition-colors">
        <div>
          <h1 className="text-lg sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Rules & Automation Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
            Configure portal access, bot engine behavior, safety limits, matching thresholds, and VELUX rules.
          </p>
        </div>

        {/* 3-Column Responsive Action Buttons on Mobile */}
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2.5 w-full sm:w-auto shrink-0">
          <button
            type="button"
            id="btn-reset-defaults"
            onClick={handleResetToBotDefaults}
            title="Reset to exact defaults in bot.py code"
            className="px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center justify-center gap-1 sm:gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate sm:hidden">Defaults</span>
            <span className="hidden sm:inline">Reset to Defaults</span>
          </button>

          <button
            type="button"
            id="btn-discard-settings"
            onClick={handleResetToCurrent}
            className="px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-1 sm:gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate sm:hidden">Discard</span>
            <span className="hidden sm:inline">Discard Changes</span>
          </button>

          <button
            type="submit"
            id="btn-save-settings"
            disabled={isSaving}
            className="px-3 sm:px-5 py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30 border border-purple-400/30 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Setting Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Portal Credentials Card */}
        <div className="p-6 rounded-2xl glass-panel shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Admin Portal Credentials & Keys
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Credentials used by Playwright to authenticate and Gemini for AI document analysis.
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Admin Platform Portal URL
              </label>
              <input
                id="input-portal-url"
                type="text"
                value={form.credentials.portalUrl}
                onChange={(e) =>
                  setForm({
                    ...form,
                    credentials: { ...form.credentials, portalUrl: e.target.value },
                  })
                }
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Automation Service Account Email
              </label>
              <input
                id="input-credentials-email"
                type="email"
                value={form.credentials.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    credentials: { ...form.credentials, email: e.target.value },
                  })
                }
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-500 text-[11px] flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                id="input-credentials-password"
                type={showPassword ? 'text' : 'password'}
                value={form.credentials.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    credentials: { ...form.credentials, password: e.target.value },
                  })
                }
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Gemini API Key (AI Invoice Extraction)
                </label>
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-500 text-[11px] flex items-center gap-1"
                >
                  {showGeminiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showGeminiKey ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                id="input-gemini-api-key"
                type={showGeminiKey ? 'text' : 'password'}
                value={form.credentials.geminiApiKey || ''}
                placeholder="AQ.Ab8RN..."
                onChange={(e) =>
                  setForm({
                    ...form,
                    credentials: { ...form.credentials, geminiApiKey: e.target.value },
                  })
                }
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Powers AI visual invoice number and supplier extraction for scanned receipts.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-slate-700 dark:text-slate-300 font-semibold block">
                  Session Keep-Alive / Timeout
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Auto re-login if inactivity exceeds this period.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="input-session-timeout"
                  type="number"
                  min="5"
                  max="240"
                  value={form.credentials.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      credentials: {
                        ...form.credentials,
                        sessionTimeoutMinutes: parseInt(e.target.value, 10) || 45,
                      },
                    })
                  }
                  className="w-20 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-slate-900 dark:text-slate-200 text-center font-mono text-xs focus:outline-none focus:border-purple-500"
                />
                <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Processing Scope & Engine Behavior Card */}
        <div className="p-6 rounded-2xl glass-panel shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Processing Scope & Engine Behavior
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Control queue filtering, batching, speed, retries, and browser execution mode.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Target Admin Tab / Filter
              </label>
              <select
                id="select-tab-filter"
                value={form.processing.tabFilter}
                onChange={(e) =>
                  setForm({
                    ...form,
                    processing: {
                      ...form.processing,
                      tabFilter: e.target.value as any,
                    },
                  })
                }
                className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
              >
                <option value="Data Required" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Data Required (Default bot queue)</option>
                <option value="Pending & Redacted" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Pending & Redacted</option>
                <option value="Pending Approval" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">Pending Approval (Second tier)</option>
                <option value="All" className="bg-white dark:bg-[#141428] text-slate-800 dark:text-slate-200">All Open Submissions</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-700 dark:text-slate-300 font-semibold block">Execution Mode</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Process continuous queue or single submission.</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      processing: { ...form.processing, processMode: 'batch' },
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    form.processing.processMode === 'batch'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Batch Run
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      processing: { ...form.processing, processMode: 'single' },
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    form.processing.processMode === 'single'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  One at a Time
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Rows Per Run
                </label>
                <input
                  id="input-rows-per-run"
                  type="number"
                  min="1"
                  max="100"
                  value={form.processing.rowsPerRun}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      processing: {
                        ...form.processing,
                        rowsPerRun: parseInt(e.target.value, 10) || 25,
                      },
                    })
                  }
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs text-center"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Max Auto Retries (Exceptions)
                </label>
                <input
                  id="input-max-retries"
                  type="number"
                  min="0"
                  max="10"
                  value={form.processing.maxRetries}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      processing: {
                        ...form.processing,
                        maxRetries: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs text-center"
                />
              </div>
            </div>

            {/* Headless vs Headed and SlowMo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/5">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Headless Mode
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {form.processing.headless ? 'Runs in background' : 'Visible Chrome window'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="check-headless-mode"
                  checked={!!form.processing.headless}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      processing: {
                        ...form.processing,
                        headless: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-white/20 bg-white dark:bg-black/50"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/5">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Slow-Mo Delay
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Delay per browser action (ms)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-slow-mo-ms"
                    type="number"
                    min="0"
                    max="2000"
                    step="50"
                    value={form.processing.slowMoMs ?? 250}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        processing: {
                          ...form.processing,
                          slowMoMs: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-16 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-center font-mono text-xs text-slate-900 dark:text-slate-200"
                  />
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Safety Guard: Auto-Submit Control Card (Full Width) */}
        <div className="p-6 rounded-2xl glass-panel border-2 border-purple-500/30 shadow-xl space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  Safety Guard: Auto-Submit & Redact Control
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    High Impact
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dictates whether Playwright automatically clicks Redact & Close or stops for human sign-off.
                </p>
              </div>
            </div>

            {/* Big Toggle Switch */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold font-mono">
                {form.safety.autoSubmit ? (
                  <span className="text-emerald-600 dark:text-emerald-400">AUTO-SUBMIT ON</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">MANUAL APPROVAL (OFF)</span>
                )}
              </span>
              <button
                type="button"
                id="toggle-auto-submit"
                onClick={() =>
                  setForm({
                    ...form,
                    safety: { ...form.safety, autoSubmit: !form.safety.autoSubmit },
                  })
                }
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ring-2 ring-purple-500/40 ${
                  form.safety.autoSubmit ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    form.safety.autoSubmit ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Safety Warning Banner */}
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed transition-all ${
              form.safety.autoSubmit
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">
                  {form.safety.autoSubmit
                    ? '⚠️ Warning: Auto-Submit is ENABLED'
                    : '🛡️ Safety Guard Active: Manual Operator Sign-Off'}
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {form.safety.autoSubmit
                    ? 'The bot will populate all invoice fields, add basket items, and automatically click the portal "Redact & Close" button for matched, eligible invoices.'
                    : 'The bot will extract data, cross-check numbers, and populate all fields and basket products in the portal, but will STOP and leave the submission open for your human operator to review before finalizing.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Require Review on Mismatch
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Always halts if invoice # differs.
                </span>
              </div>
              <input
                type="checkbox"
                id="check-human-review-mismatch"
                checked={form.safety.requireHumanReviewOnMismatch}
                onChange={(e) =>
                  setForm({
                    ...form,
                    safety: {
                      ...form.safety,
                      requireHumanReviewOnMismatch: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-white/20 bg-white dark:bg-black/50"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Stop Bot on Consecutive Errors
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Auto-pause bot if exceptions exceed.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  id="input-error-threshold"
                  type="number"
                  min="1"
                  max="20"
                  value={form.safety.stopOnErrorThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      safety: {
                        ...form.safety,
                        stopOnErrorThreshold: parseInt(e.target.value, 10) || 5,
                      },
                    })
                  }
                  className="w-14 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-center font-mono text-xs text-slate-900 dark:text-slate-200"
                />
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">errs</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Out-of-Date Limit (3 Months)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Hold for review if older than.
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  id="input-out-of-date-days"
                  type="number"
                  min="15"
                  max="365"
                  value={form.safety.maxInvoiceAgeDays ?? 90}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      safety: {
                        ...form.safety,
                        maxInvoiceAgeDays: parseInt(e.target.value, 10) || 90,
                      },
                    })
                  }
                  className="w-14 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-center font-mono text-xs text-slate-900 dark:text-slate-200"
                />
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">days</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Invoice Number Matching Rules Card */}
        <div className="p-6 rounded-2xl glass-panel shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Invoice Number Matching Rules
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure string comparison tolerances, supplier search, and prefixes.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Ignore Prefix letters toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Ignore Prefix Letters (e.g. RG, INV, RE-)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Strips non-numeric or standard invoice identifiers before comparing.
                </span>
              </div>
              <input
                type="checkbox"
                id="check-ignore-prefix"
                checked={form.matching.ignorePrefixLetters}
                onChange={(e) =>
                  setForm({
                    ...form,
                    matching: {
                      ...form.matching,
                      ignorePrefixLetters: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-white/20 bg-white dark:bg-black/50"
              />
            </div>

            {/* Tag list of ignored prefixes */}
            {form.matching.ignorePrefixLetters && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 space-y-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">
                  Configured Prefixes to Strip:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {form.matching.ignoredPrefixes.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-200 text-xs font-mono"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemovePrefix(p)}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add prefix (e.g. RN-)"
                    value={prefixInput}
                    onChange={(e) => setPrefixInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPrefix())}
                    className="bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1 text-slate-900 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-purple-500 w-36"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrefix}
                    className="px-2.5 py-1 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 text-purple-700 dark:text-purple-300 border border-purple-500/40 text-xs font-semibold transition-colors"
                  >
                    Add Prefix
                  </button>
                </div>
              </div>
            )}

            {/* Exact match toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Require Exact Digit Match
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Strict digit comparison without fuzzy fallback.
                </span>
              </div>
              <input
                type="checkbox"
                id="check-exact-match"
                checked={form.matching.requireExactMatch}
                onChange={(e) =>
                  setForm({
                    ...form,
                    matching: {
                      ...form.matching,
                      requireExactMatch: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-white/20 bg-white dark:bg-black/50"
              />
            </div>

            {/* Tolerate leading zeros */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Tolerate Leading Zeros
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Treats "004928" and "4928" as identical matches.
                </span>
              </div>
              <input
                type="checkbox"
                id="check-tolerate-zeros"
                checked={form.matching.tolerateLeadingZeros}
                onChange={(e) =>
                  setForm({
                    ...form,
                    matching: {
                      ...form.matching,
                      tolerateLeadingZeros: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-white/20 bg-white dark:bg-black/50"
              />
            </div>

            {/* Supplier search min chars */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Supplier Name Search Characters
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Number of characters bot types into admin portal search filter.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="input-supplier-min-chars"
                  type="number"
                  min="2"
                  max="15"
                  value={form.matching.supplierSearchMinChars}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      matching: {
                        ...form.matching,
                        supplierSearchMinChars: parseInt(e.target.value, 10) || 4,
                      },
                    })
                  }
                  className="w-16 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-center font-mono text-xs text-slate-900 dark:text-slate-200"
                />
                <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">chars</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Schedule Settings Card */}
        <div className="p-6 rounded-2xl glass-panel shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Automated Schedule Settings
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure recurrent execution vs manual on-demand execution.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100/90 dark:bg-black/30 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Run on Automated Schedule
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  When disabled, the bot only executes when manually triggered.
                </span>
              </div>
              <input
                type="checkbox"
                id="check-schedule-enabled"
                checked={form.schedule.enabled}
                onChange={(e) =>
                  setForm({
                    ...form,
                    schedule: { ...form.schedule, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-white/20 bg-white dark:bg-black/50"
              />
            </div>

            {form.schedule.enabled && (
              <div className="space-y-3.5 p-3.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Daily Trigger Time
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="input-schedule-time"
                      type="time"
                      value={form.schedule.time}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          schedule: { ...form.schedule, time: e.target.value },
                        })
                      }
                      className="bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-200 font-mono text-sm focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {form.schedule.timezone}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                    Active Days of the Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = form.schedule.daysOfWeek.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => toggleDayOfWeek(d.value)}
                          className={`w-9 h-9 rounded-xl font-mono text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40'
                              : 'bg-slate-200/80 dark:bg-white/5 text-slate-700 dark:text-slate-400 hover:text-purple-600 dark:hover:text-white border border-slate-300 dark:border-white/5'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. VELUX PLUS Campaign Rules Card (Full Width) */}
        <div className="p-6 rounded-2xl glass-panel shadow-xl space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  VELUX PLUS Campaign & Product Code Rules
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Exact specification rules for eligible basket materials (VCI Codes) and exclusions.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
              {(form.veluxRules.knownProductCodes || []).length} Eligible Codes Configured
            </span>
          </div>

          <div className="space-y-5 text-xs">
            {/* Campaign Start Date */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Campaign Start Date
              </label>
              <input
                type="date"
                value={form.veluxRules.campaignStartDate || '2025-01-01'}
                onChange={(e) =>
                  setForm({
                    ...form,
                    veluxRules: { ...form.veluxRules, campaignStartDate: e.target.value },
                  })
                }
                className="w-full sm:w-48 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Invoices dated before this date are flagged as ineligible for the campaign.
              </p>
            </div>

            {/* Eligible VCI Product Codes (G, V, C, S, M) */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold block">
                    Eligible VCI Basket Codes (Whitelist: G, V, C, S, M)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Products matching these codes are automatically added to the portal basket with their extracted quantities.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 rounded-lg bg-slate-200/60 dark:bg-black/30 border border-slate-300/80 dark:border-white/5">
                {(form.veluxRules.knownProductCodes || []).map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-semibold"
                  >
                    {code}
                    <button
                      type="button"
                      onClick={() => handleRemoveEligibleCode(code)}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-white"
                      title={`Remove ${code}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add eligible code (e.g. GGL)"
                  value={eligibleCodeInput}
                  onChange={(e) => setEligibleCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEligibleCode())}
                  className="bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-purple-500 w-48"
                />
                <button
                  type="button"
                  onClick={handleAddEligibleCode}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-200 border border-emerald-500/40 text-xs font-semibold transition-colors"
                >
                  Add Code
                </button>
              </div>
            </div>

            {/* Non-Eligible Product Prefixes */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="text-slate-800 dark:text-slate-200 font-semibold block">
                  Non-Eligible Material Prefixes (Strict Exclusions)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Materials starting with these prefixes must NEVER be put into the basket per VELUX specification.
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(form.veluxRules.nonEligibleProductPrefixes || []).map((prefix) => (
                  <span
                    key={prefix}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-mono font-semibold"
                  >
                    {prefix}*
                    <button
                      type="button"
                      onClick={() => handleRemoveNonEligiblePrefix(prefix)}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add prefix (e.g. MAG)"
                  value={nonEligiblePrefixInput}
                  onChange={(e) => setNonEligiblePrefixInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNonEligiblePrefix())}
                  className="bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-purple-500 w-48"
                />
                <button
                  type="button"
                  onClick={handleAddNonEligiblePrefix}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-700 dark:text-rose-200 border border-rose-500/40 text-xs font-semibold transition-colors"
                >
                  Add Prefix
                </button>
              </div>
            </div>

            {/* Non-Eligible Exact Codes */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="text-slate-800 dark:text-slate-200 font-semibold block">
                  Non-Eligible Exact Product Codes
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Exact codes excluded from campaign approval.
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(form.veluxRules.nonEligibleProductCodes || []).map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-mono font-semibold"
                  >
                    {code}
                    <button
                      type="button"
                      onClick={() => handleRemoveNonEligibleCode(code)}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add code (e.g. KALTRAUMFENSTER)"
                  value={nonEligibleCodeInput}
                  onChange={(e) => setNonEligibleCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNonEligibleCode())}
                  className="bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-purple-500 w-56"
                />
                <button
                  type="button"
                  onClick={handleAddNonEligibleCode}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-700 dark:text-rose-200 border border-rose-500/40 text-xs font-semibold transition-colors"
                >
                  Add Exclusion
                </button>
              </div>
            </div>

            {/* Non-Invoice Document Filter Markers */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-100/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/5">
              <div>
                <span className="text-slate-800 dark:text-slate-200 font-semibold block">
                  Non-Invoice Document Markers (Disqualification Filter)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Documents containing these markers (e.g. order confirmations or credit notes) are rejected as non-invoices.
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(form.veluxRules.nonInvoiceDocumentMarkers || []).map((marker) => (
                  <span
                    key={marker}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono"
                  >
                    {marker}
                    <button
                      type="button"
                      onClick={() => handleRemoveMarker(marker)}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add marker (e.g. gutschrift)"
                  value={markerInput}
                  onChange={(e) => setMarkerInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMarker())}
                  className="bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-purple-500 w-60"
                />
                <button
                  type="button"
                  onClick={handleAddMarker}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-700 dark:text-amber-200 border border-amber-500/40 text-xs font-semibold transition-colors"
                >
                  Add Marker
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
