import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type {
  BotStatus,
  BotSettings,
  LogEntry,
  ProcessedSubmission,
  AlertItem,
} from '../types';

export { isFirebaseConfigured };

/**
 * Checks if a heartbeat timestamp is fresh (within 30 seconds)
 */
export function isHeartbeatActive(lastHeartbeat?: string): boolean {
  if (!lastHeartbeat) return false;
  const hbTime = new Date(lastHeartbeat).getTime();
  if (isNaN(hbTime)) return false;
  return Date.now() - hbTime < 35000;
}

/**
 * 1. Subscribe to Live Bot Status & Metrics
 */
export function subscribeBotStatus(
  onUpdate: (status: BotStatus) => void,
  onError?: (err: any) => void
): () => void {
  if (isFirebaseConfigured && db) {
    console.log('[botService] Subscribed to Firestore system/bot_state');
    const unsubscribe = onSnapshot(
      doc(db, 'system', 'bot_state'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as BotStatus;
          const fresh = isHeartbeatActive(data.lastHeartbeat);
          onUpdate({
            ...data,
            isConnected: fresh && Boolean(data.isConnected),
            status: fresh ? data.status : 'stopped',
          });
        }
      },
      (err) => {
        console.error('[botService] Firestore bot_state error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  }

  // Local fallback: HTTP Polling
  let active = true;
  const poll = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok && active) {
        const data = await res.json();
        onUpdate(data);
      }
    } catch (err) {
      if (active && onError) onError(err);
    }
  };

  poll();
  const interval = setInterval(poll, 2500);
  return () => {
    active = false;
    clearInterval(interval);
  };
}

/**
 * 2. Subscribe to Real-Time Activity Logs
 */
export function subscribeActivityLogs(
  onUpdate: (logs: LogEntry[]) => void,
  onError?: (err: any) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'activity_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as LogEntry[];
        onUpdate(logs);
      },
      (err) => {
        console.error('[botService] Firestore activity_logs error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  }

  // Local fallback
  let active = true;
  const poll = async () => {
    try {
      const res = await fetch('/api/logs?limit=80');
      if (res.ok && active) {
        const data = await res.json();
        if (data.logs) onUpdate(data.logs);
      }
    } catch (err) {
      if (active && onError) onError(err);
    }
  };

  poll();
  const interval = setInterval(poll, 3000);
  return () => {
    active = false;
    clearInterval(interval);
  };
}

/**
 * 3. Subscribe to Processed Submissions History
 */
export function subscribeSubmissions(
  onUpdate: (submissions: ProcessedSubmission[]) => void,
  onError?: (err: any) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'submissions'),
      orderBy('dateProcessed', 'desc'),
      limit(150)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const subs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ProcessedSubmission[];
        onUpdate(subs);
      },
      (err) => {
        console.error('[botService] Firestore submissions error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  }

  // Local fallback
  let active = true;
  const fetchSubs = async () => {
    try {
      const res = await fetch('/api/history?limit=100');
      if (res.ok && active) {
        const data = await res.json();
        if (data.submissions) onUpdate(data.submissions);
      }
    } catch (err) {
      if (active && onError) onError(err);
    }
  };

  fetchSubs();
  const interval = setInterval(fetchSubs, 8000);
  return () => {
    active = false;
    clearInterval(interval);
  };
}

/**
 * 4. Subscribe to Alerts & Anomalies
 */
export function subscribeAlerts(
  onUpdate: (alerts: AlertItem[]) => void,
  onError?: (err: any) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'alerts'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const alerts = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AlertItem[];
        onUpdate(alerts);
      },
      (err) => {
        console.error('[botService] Firestore alerts error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  }

  // Local fallback
  let active = true;
  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok && active) {
        const data = await res.json();
        if (data.alerts) onUpdate(data.alerts);
      }
    } catch (err) {
      if (active && onError) onError(err);
    }
  };

  fetchAlerts();
  const interval = setInterval(fetchAlerts, 10000);
  return () => {
    active = false;
    clearInterval(interval);
  };
}

/**
 * 5. Subscribe to Bot Settings
 */
export function subscribeSettings(
  onUpdate: (settings: BotSettings) => void,
  onError?: (err: any) => void
): () => void {
  if (isFirebaseConfigured && db) {
    const unsubscribe = onSnapshot(
      doc(db, 'system', 'bot_settings'),
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as BotSettings);
        }
      },
      (err) => {
        console.error('[botService] Firestore bot_settings error:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  }

  // Local fallback
  let active = true;
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok && active) {
        const data = await res.json();
        onUpdate(data);
      }
    } catch (err) {
      if (active && onError) onError(err);
    }
  };

  fetchSettings();
  return () => {
    active = false;
  };
}

/**
 * 6. Send Command: START
 */
export async function sendStartCommand(): Promise<{ success: boolean; message: string }> {
  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, 'bot_commands'), {
        action: 'START',
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'vercel_dashboard',
      });
      return { success: true, message: 'Start command dispatched to local bot via Cloud Firestore' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to dispatch command' };
    }
  }

  // Local HTTP call
  const res = await fetch('/api/runner/start', { method: 'POST' });
  const data = await res.json();
  return { success: res.ok, message: data.message || (res.ok ? 'Runner started' : 'Failed') };
}

/**
 * 7. Send Command: PAUSE
 */
export async function sendPauseCommand(): Promise<{ success: boolean; message: string }> {
  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, 'bot_commands'), {
        action: 'PAUSE',
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'vercel_dashboard',
      });
      return { success: true, message: 'Pause command dispatched to local bot via Cloud Firestore' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to dispatch pause command' };
    }
  }

  const res = await fetch('/api/runner/pause', { method: 'POST' });
  const data = await res.json();
  return { success: res.ok, message: data.message || (res.ok ? 'Runner paused' : 'Failed') };
}

/**
 * 8. Send Command: STOP
 */
export async function sendStopCommand(): Promise<{ success: boolean; message: string }> {
  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, 'bot_commands'), {
        action: 'STOP',
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'vercel_dashboard',
      });
      return { success: true, message: 'Stop command dispatched to local bot via Cloud Firestore' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to dispatch stop command' };
    }
  }

  const res = await fetch('/api/runner/stop', { method: 'POST' });
  const data = await res.json();
  return { success: res.ok, message: data.message || (res.ok ? 'Runner stopped' : 'Failed') };
}

/**
 * 9. Save Settings
 */
export async function saveBotSettings(
  settings: BotSettings
): Promise<{ success: boolean; message: string }> {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'system', 'bot_settings'), settings, { merge: true });
      await addDoc(collection(db, 'bot_commands'), {
        action: 'UPDATE_SETTINGS',
        payload: settings,
        status: 'pending',
        createdAt: serverTimestamp(),
        source: 'vercel_dashboard',
      });
      return { success: true, message: 'Settings saved & synced to Cloud Firestore' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to save settings' };
    }
  }

  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  return { success: res.ok, message: data.message || (res.ok ? 'Settings saved' : 'Failed') };
}
