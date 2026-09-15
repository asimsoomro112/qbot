import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Server,
  Database,
  ArrowRight,
  ShieldCheck,
  Terminal,
  ExternalLink
} from 'lucide-react';

interface PythonIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonIntegrationModal: React.FC<PythonIntegrationModalProps> = ({ isOpen, onClose }) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rest' | 'firestore'>('rest');

  if (!isOpen) return null;

  const pythonSnippetREST = `"""
Quantum-h Invoice Verification Automation
Playwright Bot Integration with Control Panel API
"""
import time
import requests
import os
import sys

DASHBOARD_URL = os.getenv("DASHBOARD_URL", "http://localhost:3000")
API_BASE = f"{DASHBOARD_URL}/api"

def report_step(submission_id, supplier, inv, step, label, progress):
    """Sends live progress updates back to the Node/React dashboard"""
    try:
        requests.post(f"{API_BASE}/bot/step", json={
            "submissionId": submission_id,
            "supplierName": supplier,
            "invoiceNumber": inv,
            "step": step,
            "stepLabel": label,
            "progressPercent": progress
        }, timeout=2)
    except:
        pass

def send_log(level, message, submission_id=None, step=None):
    try:
        requests.post(f"{API_BASE}/logs", json={
            "level": level,
            "message": message,
            "submissionId": submission_id,
            "step": step
        }, timeout=2)
    except:
        pass

def fetch_config():
    """Dynamically reads the dashboard rules on startup"""
    try:
        res = requests.get(f"{API_BASE}/settings")
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print(f"Failed to reach dashboard at {API_BASE}: {e}")
        sys.exit(1)

def run_invoice_verification():
    # 1. Boot sequence & Dashboard Sync
    config = fetch_config()
    print(f"Connecting to portal: {config['credentials']['portalUrl']}")
    
    # Map Velux Rules from Dashboard
    CAMPAIGN_START_DATE = config['veluxRules']['campaignStartDate']
    NON_ELIGIBLE_CODES = config['veluxRules']['nonEligibleProductCodes']
    AUTO_SUBMIT = config['safety']['autoSubmit']
    
    # Send Heartbeat
    requests.post(f"{API_BASE}/bot/heartbeat", json={
        "hostname": "Python-Playwright-Worker-1",
        "version": "v1.0"
    })

    # ... Playwright initialization here (sync_playwright) ...
    # This loop structure replaces the generic steps with the Velux flow.
    
    dummy_sub_id = "8819203"
    
    report_step(dummy_sub_id, "Knauf Gips", "", "login", "Authenticating...", 10)
    time.sleep(2) # Simulate Playwright logic
    
    report_step(dummy_sub_id, "Knauf Gips", "", "navigate", "Opening 'Data Required' tab", 30)
    time.sleep(2)
    
    report_step(dummy_sub_id, "Knauf Gips", "INV-102", "extract_pdfs", "Downloading and OCRing receipts...", 50)
    time.sleep(2)
    send_log("info", "PDF Stream Extracted", dummy_sub_id, "extract_pdfs")

    report_step(dummy_sub_id, "Knauf Gips", "INV-102", "velux_rules_check", "Applying VELUX PLUS rules...", 70)
    time.sleep(2)
    send_log("success", "VELUX Rules Check Passed", dummy_sub_id, "velux_rules_check")
    
    report_step(dummy_sub_id, "Knauf Gips", "INV-102", "fill_form", "Populating fields", 90)
    time.sleep(2)
    
    if AUTO_SUBMIT:
        send_log("success", "Auto-submitted successfully", dummy_sub_id, "awaiting_submit")
    else:
        report_step(dummy_sub_id, "Knauf Gips", "INV-102", "awaiting_submit", "Waiting for manual confirmation", 100)
        
    # Send Final History Record (in real app, POST to /api/history)
    requests.get(f"{API_BASE}/history") 

if __name__ == "__main__":
    run_invoice_verification()
`;

  const pythonSnippetFirestore = `"""
Quantum-h Invoice Bot - Direct Firestore State Sync
"""
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# 1. Listen or fetch active config
config_ref = db.collection("settings").document("active_config")
settings = config_ref.get().to_dict()

# 2. Update Bot Status & Currently Processing live
status_ref = db.collection("bot_status").document("main_bot")
status_ref.set({
    "status": "running",
    "lastHeartbeat": firestore.SERVER_TIMESTAMP,
    "currentlyProcessing": {
        "submissionId": "2169407",
        "supplierName": "Theodor WÖLPERT GmbH & Co. KG",
        "invoiceNumber": "58208485",
        "step": "extract_pdfs",
        "progressPercent": 65
    }
}, merge=True)

# 3. Append to logs collection
db.collection("logs").add({
    "timestamp": firestore.SERVER_TIMESTAMP,
    "level": "info",
    "message": "Extracted PDF stream matched PO record",
    "submissionId": "2169407"
})
`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div
      id="python-integration-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden"
      onClick={onClose}
    >
      <div
        id="python-integration-modal-card"
        className="relative w-full max-w-4xl bg-white dark:bg-[#121224] border-t sm:border border-slate-200 dark:border-purple-500/25 rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-purple-950/20 overflow-hidden text-slate-800 dark:text-slate-200 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-3.5 sm:p-6 border-b border-slate-200 dark:border-purple-500/15 bg-white/95 dark:bg-[#121224]/95 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 dark:bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="truncate">Python Bot Client</span>
                <span className="text-[9px] sm:text-[11px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 shrink-0">
                  Ready
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Real-time Playwright integration guide
              </p>
            </div>
          </div>
          <button
            id="close-python-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-white/10 px-3.5 sm:px-6 bg-slate-100/70 dark:bg-black/20 gap-2 sm:gap-4 pt-2 sm:pt-3 overflow-x-auto">
          <button
            id="tab-rest-api"
            onClick={() => setActiveTab('rest')}
            className={`flex items-center gap-1.5 pb-2.5 sm:pb-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'rest'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Direct REST API</span>
          </button>
          <button
            id="tab-firestore-sync"
            onClick={() => setActiveTab('firestore')}
            className={`flex items-center gap-1.5 pb-2.5 sm:pb-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'firestore'
                ? 'border-purple-600 text-purple-700 dark:text-purple-300 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Cloud Firestore Sync</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto custom-scrollbar">
          {/* Architecture overview pill */}
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-300">
              <ShieldCheck className="w-4 h-4" />
              Complete Separation of Concerns
            </div>
            <p className="leading-relaxed">
              Your browser automation (Playwright/Selenium) runs securely on your internal server or VM. It sends live step notifications to this dashboard so operations staff can monitor progress, start/stop the queue, and change matching rules without touching Python code.
            </p>
          </div>

          {/* Code block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                {activeTab === 'rest'
                  ? 'playwright_bot_client.py (REST Mode)'
                  : 'playwright_bot_firestore.py (Firestore Mode)'}
              </span>
              <button
                id="copy-code-btn"
                onClick={() =>
                  handleCopy(
                    activeTab === 'rest' ? pythonSnippetREST : pythonSnippetFirestore,
                    activeTab
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 transition-all font-semibold"
              >
                {copiedTab === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-900 dark:bg-black/60 border border-slate-800 dark:border-white/10 font-mono text-[11px] leading-relaxed text-slate-200 overflow-x-auto max-h-72 shadow-inner">
              {activeTab === 'rest' ? pythonSnippetREST : pythonSnippetFirestore}
            </pre>
          </div>

          {/* Endpoints schema reference */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#17172e] border border-slate-200 dark:border-white/10 space-y-2.5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Control Panel API Endpoints Reference
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">GET /api/status</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Polling bot status</span>
              </div>
              <div className="p-2 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-xs">
                <span className="text-cyan-700 dark:text-cyan-400 font-bold">POST /api/bot/step</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Live progress stepper</span>
              </div>
              <div className="p-2 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-xs">
                <span className="text-purple-700 dark:text-purple-400 font-bold">GET /api/settings</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Read active rules</span>
              </div>
              <div className="p-2 rounded bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-xs">
                <span className="text-amber-700 dark:text-amber-400 font-bold">POST /api/logs</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Write activity logs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 px-6 border-t border-slate-200 dark:border-purple-500/15 bg-slate-50 dark:bg-black/40">
          <button
            id="close-python-modal-footer-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
