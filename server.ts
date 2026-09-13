import express from 'express';
import path from 'path';
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { spawn, spawnSync, type ChildProcess } from 'child_process';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { DEFAULT_BOT_SETTINGS, type AlertItem, BotProgressStep, BotSettings, BotStatus, BotStats, LogEntry, ProcessedSubmission } from './src/types';
import { initFirestoreRelay, pushBotState, syncSubmission, syncAlert, syncLogEntry } from './server_firestore_relay';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

const PORT = Number(process.env.PORT || 3000);
const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const PYTHON = path.join(PROJECT_ROOT, '.venv', 'Scripts', 'python.exe');
const HISTORY_FILE = path.join(PROJECT_ROOT, 'history_store.json');
const SUBMITTED_LOG_FILE = path.join(PROJECT_ROOT, 'submitted_submissions.txt');
const SETTINGS_FILE = path.join(PROJECT_ROOT, 'bot_settings.json');

let botProcess: ChildProcess | null = null;
let processedSubmissions: ProcessedSubmission[] = [];
let alerts: AlertItem[] = [];
let activityLogs: LogEntry[] = [];
let currentSettings: BotSettings = { ...DEFAULT_BOT_SETTINGS };

function saveSettingsStore() {
  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Could not save bot_settings.json:', err);
  }
}

// Load persistent settings on startup
try {
  if (existsSync(SETTINGS_FILE)) {
    const saved = JSON.parse(readFileSync(SETTINGS_FILE, 'utf-8'));
    currentSettings = {
      ...DEFAULT_BOT_SETTINGS,
      ...saved,
      credentials: { ...DEFAULT_BOT_SETTINGS.credentials, ...(saved.credentials || {}) },
      processing: { ...DEFAULT_BOT_SETTINGS.processing, ...(saved.processing || {}) },
      safety: { ...DEFAULT_BOT_SETTINGS.safety, ...(saved.safety || {}) },
      matching: { ...DEFAULT_BOT_SETTINGS.matching, ...(saved.matching || {}) },
      schedule: { ...DEFAULT_BOT_SETTINGS.schedule, ...(saved.schedule || {}) },
      veluxRules: { ...DEFAULT_BOT_SETTINGS.veluxRules, ...(saved.veluxRules || {}) },
      customRules: saved.customRules || DEFAULT_BOT_SETTINGS.customRules,
    };
  } else {
    saveSettingsStore();
  }
} catch (err) {
  console.warn('Could not read bot_settings.json:', err);
}

let botStatus: BotStatus = {
  status: 'stopped', lastStatusChange: new Date().toISOString(), isConnected: false,
  botHostname: 'Local Windows runner', botVersion: 'bot.py', lastHeartbeat: '', currentlyProcessing: null,
  stats: { totalToday: 0, matchedSuccessfully: 0, mismatchesFound: 0, errorsEncountered: 0, avgProcessingTimeSec: 0, lastRunTime: '' },
};

function recomputeStats(): BotStats {
  // 1. Total processed matches the actual count of submissions in the system
  const totalToday = processedSubmissions.length;

  // 2. Matched successfully counts submissions with status === 'Success'
  const matchedSuccessfully = processedSubmissions.filter((s) => s.status === 'Success').length;

  // 3. Mismatches / manual reviews: all items flagged for human review or skipped
  const mismatchesFound = processedSubmissions.filter(
    (s) => s.status === 'Mismatch' || s.status === 'Needs Review' || s.status === 'Skipped'
  ).length;

  // 4. Technical / portal execution errors
  const errorsEncountered = processedSubmissions.filter((s) => s.status === 'Error').length;

  const times = processedSubmissions
    .map((s) => s.executionTimeMs)
    .filter((t) => typeof t === 'number' && t > 0);
  const avgProcessingTimeSec =
    times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000)
      : (botStatus.stats.avgProcessingTimeSec || 0);

  const lastRunTime =
    processedSubmissions.length > 0
      ? processedSubmissions[0].processedAt
      : (botStatus.stats.lastRunTime || '');

  botStatus.stats = {
    totalToday,
    matchedSuccessfully,
    mismatchesFound,
    errorsEncountered,
    avgProcessingTimeSec,
    lastRunTime,
  };

  return botStatus.stats;
}

// Load persistent history on startup
try {
  if (existsSync(HISTORY_FILE)) {
    const savedData = JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'));
    if (Array.isArray(savedData.submissions)) processedSubmissions = savedData.submissions;
    if (Array.isArray(savedData.alerts)) alerts = savedData.alerts;
    recomputeStats();
  }
} catch (err) {
  console.warn('Could not read history_store.json:', err);
}

function saveHistoryStore() {
  try {
    recomputeStats();
    writeFileSync(HISTORY_FILE, JSON.stringify({
      submissions: processedSubmissions,
      alerts,
      stats: botStatus.stats,
    }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Could not save history_store.json:', err);
  }
}

function removeSubmissionFromSubmittedLog(targetIdentifiers: string[]) {
  if (!existsSync(SUBMITTED_LOG_FILE)) return;
  try {
    const raw = readFileSync(SUBMITTED_LOG_FILE, 'utf-8');
    const lines = raw.split(/\r?\n/);
    const cleanedTargets = targetIdentifiers
      .map((id) => (id || '').trim().toLowerCase().replace(/^(sub-|#|id:|row:)/, ''))
      .filter((id) => id.length > 0);

    const keptLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return true;
      const key = trimmed.split('\t')[0].trim().toLowerCase();
      const cleanedKey = key.replace(/^(sub-|#|id:|row:)/, '');

      for (const target of cleanedTargets) {
        if (key === target || cleanedKey === target || key.includes(target) || (target.length >= 4 && key.includes(target))) {
          return false; // Remove this submission entry so it can be re-tested
        }
      }
      return true;
    });

    const newContent = keptLines.filter(Boolean).join('\n') + '\n';
    writeFileSync(SUBMITTED_LOG_FILE, newContent, 'utf-8');
  } catch (err) {
    console.error('Failed to update submitted_submissions.txt:', err);
  }
}

function clearSubmittedLog() {
  try {
    writeFileSync(SUBMITTED_LOG_FILE, '# Submission key\tSubmitted at\tInvoice number\n', 'utf-8');
  } catch (err) {
    console.error('Failed to clear submitted_submissions.txt:', err);
  }
}

function addLog(level: LogEntry['level'], message: string, submissionId?: string, step?: string) {
  const entry: LogEntry = { id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`, timestamp: new Date().toLocaleTimeString('en-GB'), level, message, submissionId, step };
  activityLogs.unshift(entry);
  activityLogs = activityLogs.slice(0, 250);
  syncLogEntry(entry);
}
function addHistory(item: ProcessedSubmission) {
  processedSubmissions = [item, ...processedSubmissions.filter((entry) => entry.id !== item.id && entry.submissionId !== item.submissionId)].slice(0, 500);
  botStatus.stats.lastRunTime = item.processedAt;
  recomputeStats();
  saveHistoryStore();
  syncSubmission(item);
  pushBotState(botStatus);
}
function addAlert(alert: AlertItem) {
  alerts = [alert, ...alerts.filter((entry) => entry.id !== alert.id)].slice(0, 250);
  recomputeStats();
  saveHistoryStore();
  syncAlert(alert);
  pushBotState(botStatus);
}
function statusPayload() {
  recomputeStats();
  return { ...botStatus, unresolvedAlertsCount: alerts.filter((alert) => alert.status === 'unresolved').length };
}

function stopBotProcess() {
  if (botProcess && botProcess.exitCode === null) {
    try {
      if (process.platform === 'win32' && botProcess.pid) {
        spawnSync('taskkill', ['/pid', String(botProcess.pid), '/t', '/f'], { windowsHide: true });
      } else {
        botProcess.kill();
      }
    } catch {}
  }
  botProcess = null;
  botStatus.status = 'stopped';
  botStatus.lastStatusChange = new Date().toISOString();
  botStatus.currentlyProcessing = null;
  addLog('warn', 'Dashboard command: bot stopped immediately.');
  pushBotState(botStatus);
}

function pauseBotProcess() {
  botStatus.status = 'paused';
  botStatus.lastStatusChange = new Date().toISOString();
  addLog('info', 'Dashboard command: bot paused.');
  pushBotState(botStatus);
}

function startPythonBot(retrySubmissionKey = '') {
  if (botProcess && botProcess.exitCode === null) return { started: false, message: 'Bot already running.' };
  if (!existsSync(PYTHON)) return { started: false, message: `Python environment missing: ${PYTHON}` };
  const pythonProbe = spawnSync(PYTHON, ['--version'], { windowsHide: true });
  if (pythonProbe.error || pythonProbe.status !== 0) {
    return { started: false, message: 'Python virtual environment is unusable. Recreate .venv with an installed Python 3.11, then install requirements.txt.' };
  }
  botStatus.status = 'running'; botStatus.isConnected = false; botStatus.lastStatusChange = new Date().toISOString();
  pushBotState(botStatus);
  addLog(
    'info',
    retrySubmissionKey
      ? `Dashboard command: retrying only submission ${retrySubmissionKey}.`
      : 'Dashboard command: starting local Python invoice bot.',
    retrySubmissionKey || undefined,
  );
  const pythonCmd = process.platform === 'win32' ? `"${PYTHON}"` : PYTHON;
  botProcess = spawn(pythonCmd, ['-u', 'bot.py', '--dashboard'], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      BOT_DASHBOARD_URL: `http://127.0.0.1:${PORT}`,
      ...(retrySubmissionKey ? { BOT_RETRY_SUBMISSION_KEY: retrySubmissionKey } : {}),
      PORTAL_LOGIN_URL: currentSettings.credentials.portalUrl,
      PORTAL_EMAIL: currentSettings.credentials.email,
      PORTAL_PASSWORD: currentSettings.credentials.password,
      GEMINI_API_KEY: currentSettings.credentials.geminiApiKey || process.env.GEMINI_API_KEY || '',
      HEADLESS: currentSettings.processing.headless ? 'true' : 'false',
    },
    detached: true,
    shell: true,
    windowsHide: true,
    stdio: 'pipe',
  });
  botProcess.stdout?.on('data', (data) => {
    const text = String(data).trim();
    if (!botStatus.isConnected && text) {
      addLog('info', text);
    }
  });
  botProcess.stderr?.on('data', (data) => addLog('error', String(data).trim()));
  botProcess.on('error', (error) => addLog('error', `Python process error: ${error.message}`));
  botProcess.on('close', (code) => {
    const wasStopped = botStatus.status === 'stopped';
    botProcess = null;
    botStatus.status = wasStopped || code === 0 ? 'stopped' : 'error';
    botStatus.isConnected = false;
    botStatus.currentlyProcessing = null;
    botStatus.lastStatusChange = new Date().toISOString();
    addLog(code === 0 || wasStopped ? 'info' : 'error', `Python bot exited (code ${code ?? 'unknown'}).`);
    pushBotState(botStatus);
  });
  return { started: true, message: 'Python bot start requested.' };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/api/status', (_req, res) => res.json(statusPayload()));
  app.get('/api/logs', (req, res) => { const limit = Math.max(1, Math.min(250, Number(req.query.limit || 80))); res.json({ logs: activityLogs.slice(0, limit), total: activityLogs.length }); });
  app.get('/api/history', (req, res) => { const limit = Math.max(1, Math.min(500, Number(req.query.limit || 50))); res.json({ items: processedSubmissions.slice(0, limit), total: processedSubmissions.length, page: 1, totalPages: 1 }); });
  app.get('/api/history/:id', (req, res) => { const item = processedSubmissions.find((entry) => entry.id === req.params.id || entry.submissionId === req.params.id); return item ? res.json(item) : res.status(404).json({ error: 'Submission not found' }); });
  function handleClearAll(res: express.Response) {
    const count = processedSubmissions.length;
    processedSubmissions = [];
    alerts = [];
    recomputeStats();
    clearSubmittedLog();
    saveHistoryStore();
    addLog('warn', `All test history, alerts and submission locks cleared (${count} records). Reset complete for fresh testing.`);
    return res.json({ success: true, clearedCount: count, stats: botStatus.stats });
  }

  app.delete('/api/history', (_req, res) => handleClearAll(res));
  app.delete('/api/history/all', (_req, res) => handleClearAll(res));
  app.post('/api/history/clear', (_req, res) => handleClearAll(res));

  app.delete('/api/history/:id', (req, res) => {
    const rawId = decodeURIComponent(req.params.id || '').trim();
    if (rawId.toLowerCase() === 'all' || rawId.toLowerCase() === 'clear') {
      return handleClearAll(res);
    }
    const cleanId = rawId.toLowerCase().replace(/^(sub-|#|id:|row:)/, '');

    const toDelete = processedSubmissions.filter((entry) => {
      const entryId = (entry.id || '').toLowerCase();
      const entrySubId = (entry.submissionId || '').toLowerCase();
      const cleanEntrySubId = entrySubId.replace(/^(sub-|#|id:|row:)/, '');
      const cleanEntryId = entryId.replace(/^(sub-|#|id:|row:)/, '');

      return (
        entryId === rawId.toLowerCase() ||
        entrySubId === rawId.toLowerCase() ||
        (cleanId.length > 0 && (cleanEntryId === cleanId || cleanEntrySubId === cleanId))
      );
    });

    if (toDelete.length === 0) {
      const fallback = processedSubmissions.find((entry) =>
        (entry.id && entry.id.includes(rawId)) ||
        (entry.submissionId && entry.submissionId.includes(rawId)) ||
        (cleanId.length >= 3 && entry.submissionId && entry.submissionId.includes(cleanId))
      );
      if (fallback) toDelete.push(fallback);
    }

    if (toDelete.length === 0) {
      return res.status(404).json({ error: 'Dashboard record not found' });
    }

    const deleteIds = new Set(toDelete.map((e) => e.id));
    const deleteSubIds = new Set(toDelete.map((e) => e.submissionId));
    processedSubmissions = processedSubmissions.filter((entry) => !deleteIds.has(entry.id) && !deleteSubIds.has(entry.submissionId));

    // Remove matching alerts
    alerts = alerts.filter((alert) => !deleteSubIds.has(alert.submissionId) && !deleteIds.has(alert.id));

    // Remove matching keys from submitted_submissions.txt
    const targetKeys: string[] = [rawId, cleanId];
    for (const item of toDelete) {
      if (item.id) targetKeys.push(item.id);
      if (item.submissionId) targetKeys.push(item.submissionId);
    }
    removeSubmissionFromSubmittedLog(targetKeys);

    recomputeStats();
    saveHistoryStore();
    addLog('warn', `Test history and submission locks deleted for #${rawId}. You can re-test this submission.`, rawId);
    return res.json({ success: true, deletedCount: toDelete.length, submissionId: rawId, stats: botStatus.stats });
  });

  app.post('/api/history/:id/verify', (req, res) => {
    const rawId = decodeURIComponent(req.params.id || '').trim();
    const cleanId = rawId.replace(/^(sub-|#|id:|row:)/i, '');
    const verification = req.body?.clientVerification;
    if (!['verified', 'unresolved', 'pending'].includes(verification)) {
      return res.status(400).json({ error: 'Invalid clientVerification status' });
    }

    const submission = processedSubmissions.find((s) =>
      s.id === rawId || s.submissionId === rawId || s.submissionId === cleanId || (s.id && s.id.includes(cleanId))
    );
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found in history' });
    }

    submission.clientVerification = verification;
    if (req.body?.note !== undefined) {
      submission.clientVerificationNote = req.body.note;
    }

    saveHistoryStore();
    const label = verification === 'verified' ? '✓ VERIFIED' : (verification === 'unresolved' ? '⚠ UNRESOLVED' : 'PENDING');
    addLog('info', `Client verification: Submission #${submission.submissionId} marked as ${label}.`, submission.submissionId);
    return res.json({ success: true, submission, stats: botStatus.stats });
  });
  app.get('/api/alerts', (_req, res) => res.json({ alerts, unresolvedCount: alerts.filter((alert) => alert.status === 'unresolved').length }));
  app.get('/api/settings', (_req, res) => res.json(currentSettings));
  app.post('/api/start', (_req, res) => { const result = startPythonBot(); return res.status(result.started || result.message === 'Bot already running.' ? 200 : 409).json({ success: result.started, ...result }); });
  app.post('/api/stop', (_req, res) => {
    stopBotProcess();
    return res.json({ success: true, status: 'stopped' });
  });
  app.post('/api/pause', (_req, res) => {
    pauseBotProcess();
    return res.json({ success: true, status: 'paused' });
  });
  app.post('/api/settings', (req, res) => {
    const incoming = req.body || {};
    currentSettings = {
      ...currentSettings,
      ...incoming,
      credentials: { ...currentSettings.credentials, ...(incoming.credentials || {}) },
      processing: { ...currentSettings.processing, ...(incoming.processing || {}) },
      safety: { ...currentSettings.safety, ...(incoming.safety || {}) },
      matching: { ...currentSettings.matching, ...(incoming.matching || {}) },
      schedule: { ...currentSettings.schedule, ...(incoming.schedule || {}) },
      veluxRules: { ...currentSettings.veluxRules, ...(incoming.veluxRules || {}) },
      customRules: incoming.customRules || currentSettings.customRules,
    };
    saveSettingsStore();
    addLog('info', 'Dashboard settings saved & written to bot_settings.json. Applied at next bot checkpoint.');
    pushBotState(botStatus);
    return res.json({ success: true, settings: currentSettings });
  });
  app.post('/api/alerts/resolve-all', (_req, res) => {
    let count = 0;
    for (const alert of alerts) {
      if (alert.status === 'unresolved') {
        alert.status = 'reviewed';
        alert.resolvedAt = new Date().toISOString();
        alert.resolvedBy = 'Dashboard operator';
        count++;
      }
    }
    recomputeStats();
    saveHistoryStore();
    addLog('info', `Marked all unresolved alerts (${count}) as reviewed.`);
    return res.json({ success: true, count, alerts, stats: botStatus.stats });
  });

  app.post('/api/alerts/:id/resolve', (req, res) => {
    const alert = alerts.find((entry) => entry.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    if (req.body?.action === 'retry') {
      const result = startPythonBot(alert.submissionId);
      if (!result.started) return res.status(409).json({ success: false, message: result.message });
      alert.status = 'retried';
      alert.resolvedAt = new Date().toISOString();
      alert.resolvedBy = 'Dashboard operator';
      addLog('info', `Targeted retry started for ${alert.submissionId}.`, alert.submissionId);
      recomputeStats();
      saveHistoryStore();
      return res.json({ success: true, alert, stats: botStatus.stats, message: result.message });
    }
    alert.status = 'reviewed';
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = 'Dashboard operator';
    addLog('info', `Alert ${alert.id} marked reviewed.`, alert.submissionId);
    recomputeStats();
    saveHistoryStore();
    return res.json({ success: true, alert, stats: botStatus.stats });
  });

  // Endpoints called by bot.py. They carry only real local runner events.
  app.get('/api/bot/control', (_req, res) => res.json({ command: botStatus.status, settings: currentSettings }));
  app.post('/api/bot/heartbeat', (req, res) => { botStatus.isConnected = true; botStatus.lastHeartbeat = new Date().toISOString(); if (req.body?.status) botStatus.status = req.body.status; pushBotState(botStatus); res.json({ acknowledged: true }); });
  app.post('/api/bot/log', (req, res) => { addLog(req.body?.level || 'info', req.body?.message || 'Python bot event', req.body?.submissionId, req.body?.step); res.json({ success: true }); });
  app.post('/api/bot/step', (req, res) => { const event = req.body || {}; botStatus.isConnected = true; botStatus.lastHeartbeat = new Date().toISOString(); if (event.step === 'completed') botStatus.currentlyProcessing = null; else botStatus.currentlyProcessing = { submissionId: event.submissionId || 'Unknown', supplierName: event.supplierName || 'Processing', invoiceNumber: event.invoiceNumber || '', step: (event.step || 'navigate') as BotProgressStep, stepLabel: event.stepLabel || 'Processing', progressPercent: event.progressPercent || 0, startedAt: event.startedAt || new Date().toISOString(), batchCurrent: event.batchCurrent || 1, batchTotal: event.batchTotal || 1 }; pushBotState(botStatus); res.json({ success: true }); });
  app.post('/api/bot/history', (req, res) => { addHistory(req.body as ProcessedSubmission); res.json({ success: true }); });
  app.post('/api/bot/alert', (req, res) => { addAlert(req.body as AlertItem); res.json({ success: true }); });

  // Debug Screenshots static directory and dynamic lookup endpoint
  const debugScreenshotsDir = path.join(PROJECT_ROOT, 'debug_screenshots');
  if (!existsSync(debugScreenshotsDir)) {
    try { mkdirSync(debugScreenshotsDir, { recursive: true }); } catch {}
  }
  app.use('/debug_screenshots', express.static(debugScreenshotsDir));
  app.use('/screenshots', express.static(debugScreenshotsDir));
  app.use('/project_images', express.static(PROJECT_ROOT));

  app.get('/api/submission-screenshot/:id', (req, res) => {
    const rawId = decodeURIComponent(req.params.id || '').trim();
    const cleanId = rawId.replace(/^(sub-|#|id:|row:)/i, '');
    if (!cleanId) return res.status(404).json({ error: 'Invalid ID' });

    // 1. Check if submission record in history already has screenshotUrl
    const existing = processedSubmissions.find((s) => s.id === rawId || s.submissionId === cleanId);
    if (existing && existing.screenshotUrl) {
      return res.json({ exists: true, url: existing.screenshotUrl, filename: path.basename(existing.screenshotUrl) });
    }

    // 2. Scan debug_screenshots for matching files (newest first)
    try {
      if (existsSync(debugScreenshotsDir)) {
        const files = readdirSync(debugScreenshotsDir);
        const matching = files
          .filter((f) => f.toLowerCase().includes(cleanId.toLowerCase()))
          .sort()
          .reverse();
        if (matching.length > 0) {
          return res.json({ exists: true, url: `/debug_screenshots/${matching[0]}`, filename: matching[0] });
        }
      }
    } catch (err) {
      console.error('Error scanning debug screenshots:', err);
    }

    // 3. Scan PROJECT_ROOT for debug_* matching cleanId
    try {
      const rootFiles = readdirSync(PROJECT_ROOT);
      const rootMatching = rootFiles
        .filter((f) => f.toLowerCase().startsWith('debug_') && f.toLowerCase().includes(cleanId.toLowerCase()))
        .sort()
        .reverse();
      if (rootMatching.length > 0) {
        return res.json({ exists: true, url: `/project_images/${rootMatching[0]}`, filename: rootMatching[0] });
      }
    } catch {}

    return res.status(404).json({ exists: false, error: 'No screenshot found' });
  });

  if (process.env.NODE_ENV === 'development') { const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares); }
  else { const distPath = path.join(process.cwd(), 'dist'); app.use(express.static(distPath)); app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html'))); }

  // Initialize two-way Firestore cloud relay for remote Vercel dashboard
  initFirestoreRelay({
    getBotStatus: () => botStatus,
    getSettings: () => currentSettings,
    getSubmissions: () => processedSubmissions,
    getAlerts: () => alerts,
    onStartBot: (submissionId) => startPythonBot(submissionId),
    onStopBot: () => stopBotProcess(),
    onPauseBot: () => pauseBotProcess(),
    onUpdateSettings: (newSettings) => {
      currentSettings = { ...currentSettings, ...newSettings };
      saveSettingsStore();
      pushBotState(botStatus);
    },
  });

  app.listen(PORT, '127.0.0.1', () => console.log(`Dashboard: http://127.0.0.1:${PORT}`));
}
startServer();
 