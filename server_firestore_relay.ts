import os from 'os';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import type { BotStatus, BotSettings, ProcessedSubmission, AlertItem, LogEntry } from './src/types';

export interface RelayHooks {
  getBotStatus: () => BotStatus;
  getSettings: () => BotSettings;
  getSubmissions: () => ProcessedSubmission[];
  getAlerts: () => AlertItem[];
  onStartBot: (submissionId?: string) => { started: boolean; message: string };
  onStopBot: () => void;
  onPauseBot: () => void;
  onUpdateSettings: (settings: BotSettings) => void;
  onDeleteSubmission?: (submissionId: string) => void;
}

let dbInstance: Firestore | null = null;
let heartbeatTimer: NodeJS.Timeout | null = null;

/**
 * Check if Firebase cloud sync is explicitly enabled.
 * Default: DISABLED for local use. Set ENABLE_FIREBASE_SYNC=true in .env to enable.
 */
function isFirebaseSyncEnabled(): boolean {
  const flag = (process.env.ENABLE_FIREBASE_SYNC || '').trim().toLowerCase();
  return flag === 'true' || flag === '1' || flag === 'yes';
}

export function loadFirebaseConfig(): Record<string, string> | null {
  // Gate: Firebase sync must be explicitly opted-in
  if (!isFirebaseSyncEnabled()) {
    return null;
  }

  // 1. Check local or parent firebase_config.json
  const localConfigPath = path.resolve(process.cwd(), 'firebase_config.json');
  const parentConfigPath = path.resolve(process.cwd(), '..', 'firebase_config.json');

  if (existsSync(localConfigPath)) {
    try {
      return JSON.parse(readFileSync(localConfigPath, 'utf-8'));
    } catch {}
  }
  if (existsSync(parentConfigPath)) {
    try {
      return JSON.parse(readFileSync(parentConfigPath, 'utf-8'));
    } catch {}
  }

  // 2. Check environment variables
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
    };
  }

  return null;
}

export function initFirestoreRelay(hooks: RelayHooks) {
  const config = loadFirebaseConfig();
  if (!config) {
    if (isFirebaseSyncEnabled()) {
      console.log('\n[Firestore Relay] Note: Firebase credentials not found in .env or firebase_config.json.');
    }
    console.log('[Dashboard] Running in LOCAL-ONLY mode (HTTP polling). Firebase cloud sync is OFF.');
    console.log('[Dashboard] To enable remote Vercel sync, set ENABLE_FIREBASE_SYNC=true in .env\n');
    return null;
  }

  try {
    let app: FirebaseApp;
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      app = initializeApp(config, 'LocalRunnerRelay');
    }
    dbInstance = getFirestore(app);
    console.log(`\n============================================================`);
    console.log(`[Firestore Relay] CONNECTED to Firebase Project: ${config.projectId}`);
    console.log(`[Firestore Relay] Two-way cloud sync & remote Vercel control ACTIVE`);
    console.log(`============================================================\n`);

    // 1. Initial State Push
    pushBotState(hooks.getBotStatus());

    // 1b. Throttled initial sync — batch with delays to avoid quota exhaustion
    (async () => {
      try {
        const existingSubs = hooks.getSubmissions();
        const existingAlerts = hooks.getAlerts();
        const BATCH_SIZE = 5;
        const BATCH_DELAY_MS = 1000;

        // Sync submissions in small batches
        for (let i = 0; i < existingSubs.length; i += BATCH_SIZE) {
          const batch = existingSubs.slice(i, i + BATCH_SIZE);
          await Promise.allSettled(batch.map(sub => syncSubmission(sub)));
          if (i + BATCH_SIZE < existingSubs.length) {
            await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
          }
        }

        // Sync alerts in small batches
        for (let i = 0; i < existingAlerts.length; i += BATCH_SIZE) {
          const batch = existingAlerts.slice(i, i + BATCH_SIZE);
          await Promise.allSettled(batch.map(a => syncAlert(a)));
          if (i + BATCH_SIZE < existingAlerts.length) {
            await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
          }
        }

        if (existingSubs.length > 0 || existingAlerts.length > 0) {
          console.log(`[Firestore Relay] Synced ${existingSubs.length} submissions and ${existingAlerts.length} alerts to Firestore (throttled).`);
        }
      } catch (err) {
        console.warn('[Firestore Relay] Initial sync warning (non-fatal):', (err as any)?.message || err);
      }
    })();

    // 2. Heartbeat loop (every 30 seconds — reduced from 5s to avoid quota issues)
    heartbeatTimer = setInterval(() => {
      pushBotState(hooks.getBotStatus());
    }, 30000);

    // 3. Listen for pending commands from Vercel
    const commandsQuery = query(
      collection(dbInstance, 'bot_commands'),
      where('status', '==', 'pending')
    );

    const unsubscribeCommands = onSnapshot(commandsQuery, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const cmdDoc = change.doc;
          const data = cmdDoc.data();
          const action = (data.action || '').toUpperCase();
          console.log(`[Firestore Relay] Received remote command from Vercel: [${action}] (ID: ${cmdDoc.id})`);

          let resultMsg = 'OK';
          if (action === 'START') {
            const res = hooks.onStartBot(data.submissionId);
            resultMsg = res.message;
          } else if (action === 'STOP') {
            hooks.onStopBot();
            resultMsg = 'Bot stopped by remote operator';
          } else if (action === 'PAUSE') {
            hooks.onPauseBot();
            resultMsg = 'Bot paused by remote operator';
          } else if (action === 'UPDATE_SETTINGS' && data.payload) {
            hooks.onUpdateSettings(data.payload);
            resultMsg = 'Settings updated via cloud';
          } else if (action === 'DELETE_SUBMISSION') {
            const cleanId = (data.submissionId || data.id || '').replace(/^(sub-|#|id:|row:)/, '');
            hooks.onDeleteSubmission?.(cleanId);
            resultMsg = `Submission #${cleanId} unlocked locally`;
          }

          try {
            await updateDoc(cmdDoc.ref, {
              status: 'completed',
              resultMessage: resultMsg,
              executedAt: new Date().toISOString(),
              executedBy: `Laptop runner (${os.hostname()})`,
            });
            // Immediately push updated state
            pushBotState(hooks.getBotStatus());
          } catch (err) {
            console.error('[Firestore Relay] Error updating command document:', err);
          }
        }
      }
    });

    // 4. Clean shutdown hook
    process.on('SIGINT', async () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (dbInstance) {
        try {
          const current = hooks.getBotStatus();
          await setDoc(doc(dbInstance, 'system', 'bot_state'), {
            ...current,
            isConnected: false,
            status: 'stopped',
            lastHeartbeat: new Date().toISOString(),
          }, { merge: true });
        } catch {}
      }
    });

    return {
      db: dbInstance,
      unsubscribe: () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        unsubscribeCommands();
      },
    };
  } catch (err) {
    console.error('[Firestore Relay] Initialization error:', err);
    return null;
  }
}

/**
 * Pushes the live bot status to system/bot_state in Firestore
 */
export async function pushBotState(status: BotStatus) {
  if (!dbInstance) return;
  try {
    await setDoc(
      doc(dbInstance, 'system', 'bot_state'),
      {
        ...status,
        isConnected: true,
        lastHeartbeat: new Date().toISOString(),
        botHostname: os.hostname(),
        botVersion: 'bot.py v2.5',
      },
      { merge: true }
    );
  } catch (err) {
    // Suppress repeated network hiccups in console
  }
}

/**
 * Syncs a processed submission record to Firestore
 */
export async function syncSubmission(submission: ProcessedSubmission) {
  if (!dbInstance) return;
  try {
    const docId = submission.id || `sub-${submission.submissionId || Date.now()}`;
    const dateProcessed = submission.processedAt || (submission as any).dateProcessed || new Date().toISOString();
    await setDoc(doc(dbInstance, 'submissions', docId), {
      ...submission,
      processedAt: dateProcessed,
      dateProcessed: dateProcessed,
    }, { merge: true });
  } catch (err) {
    console.error('[Firestore Relay] Error syncing submission:', err);
  }
}

/**
 * Syncs an alert item to Firestore
 */
export async function syncAlert(alert: AlertItem) {
  if (!dbInstance) return;
  try {
    const docId = alert.id || `alert-${Date.now()}`;
    const detectedAt = alert.detectedAt || (alert as any).timestamp || new Date().toISOString();
    await setDoc(doc(dbInstance, 'alerts', docId), {
      ...alert,
      detectedAt,
      timestamp: detectedAt,
    }, { merge: true });
  } catch (err) {
    console.error('[Firestore Relay] Error syncing alert:', err);
  }
}

/**
 * Syncs a log entry to Firestore
 */
export async function syncLogEntry(log: LogEntry) {
  if (!dbInstance) return;
  try {
    const docId = log.id || `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await setDoc(doc(dbInstance, 'activity_logs', docId), {
      ...log,
      serverTime: Date.now(),
    });
  } catch (err) {
    // Non-blocking log sync
  }
}

