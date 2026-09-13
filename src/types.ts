export type BotStatusState = 'running' | 'stopped' | 'paused' | 'error';

export type BotProgressStep =
  | 'login'
  | 'navigate'
  | 'extract_pdfs'
  | 'velux_rules_check'
  | 'fill_form'
  | 'basket_pim'
  | 'submission_details'
  | 'redact_close'
  | 'awaiting_submit'
  | 'completed';

export interface CurrentlyProcessing {
  submissionId: string;
  supplierName: string;
  invoiceNumber: string;
  step: BotProgressStep;
  stepLabel: string;
  progressPercent: number;
  startedAt: string;
  batchCurrent: number;
  batchTotal: number;
}

export interface BotStats {
  totalToday: number;
  matchedSuccessfully: number;
  mismatchesFound: number;
  errorsEncountered: number;
  avgProcessingTimeSec: number;
  lastRunTime: string;
}

export interface BotStatus {
  status: BotStatusState;
  lastStatusChange: string;
  isConnected: boolean;
  botHostname: string;
  botVersion: string;
  lastHeartbeat: string;
  currentlyProcessing: CurrentlyProcessing | null;
  stats: BotStats;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  submissionId?: string;
  step?: string;
}

export interface CustomRule {
  id: string;
  name: string;
  field: 'invoice_number' | 'supplier_name' | 'total_amount' | 'currency' | 'confidence_score';
  condition: 'contains' | 'equals' | 'not_equals' | 'greater_than' | 'starts_with' | 'is_empty';
  value: string;
  action: 'flag_review' | 'auto_approve' | 'skip_submission' | 'raise_alert';
  enabled: boolean;
}

export interface BotSettings {
  credentials: {
    portalUrl: string;
    email: string;
    password: string;
    geminiApiKey?: string;
    sessionTimeoutMinutes: number;
  };
  processing: {
    tabFilter: 'Pending & Redacted' | 'Data Required' | 'Pending Approval' | 'All';
    processMode: 'batch' | 'single';
    rowsPerRun: number;
    delayBetweenSubmissionsSec: number;
    maxRetries: number;
    headless?: boolean;
    slowMoMs?: number;
  };
  safety: {
    autoSubmit: boolean;
    requireHumanReviewOnMismatch: boolean;
    stopOnErrorThreshold: number;
    maxInvoiceAgeDays?: number;
    pauseOnFailureMs?: number;
  };
  matching: {
    ignorePrefixLetters: boolean;
    ignoredPrefixes: string[];
    requireExactMatch: boolean;
    tolerateLeadingZeros: boolean;
    supplierSearchMinChars: number;
    fuzzyMatchThreshold: number;
  };
  schedule: {
    enabled: boolean;
    time: string;
    daysOfWeek: number[];
    timezone: string;
  };
  veluxRules: {
    campaignStartDate: string;
    nonEligibleProductCodes: string[];
    nonEligibleProductPrefixes: string[];
    knownProductCodes: string[];
    nonInvoiceDocumentMarkers?: string[];
  };
  customRules: CustomRule[];
}

export const DEFAULT_BOT_SETTINGS: BotSettings = {
  credentials: {
    portalUrl: 'https://admin.velux.quantum-h.com/admin/login',
    email: 'saima.idress@quantum-h.com',
    password: '',
    geminiApiKey: '',
    sessionTimeoutMinutes: 45,
  },
  processing: {
    tabFilter: 'Data Required',
    processMode: 'batch',
    rowsPerRun: 25,
    delayBetweenSubmissionsSec: 0,
    maxRetries: 3,
    headless: false,
    slowMoMs: 250,
  },
  safety: {
    autoSubmit: true,
    requireHumanReviewOnMismatch: true,
    stopOnErrorThreshold: 5,
    maxInvoiceAgeDays: 90,
    pauseOnFailureMs: 0,
  },
  matching: {
    ignorePrefixLetters: true,
    ignoredPrefixes: ['RG', 'INV', 'RE-', 'RN-', 'RE'],
    requireExactMatch: true,
    tolerateLeadingZeros: true,
    supplierSearchMinChars: 4,
    fuzzyMatchThreshold: 100,
  },
  schedule: {
    enabled: false,
    time: '09:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    timezone: 'Europe/Berlin',
  },
  veluxRules: {
    campaignStartDate: '2025-01-01',
    knownProductCodes: [
      'GGU', 'GGL', 'GPU', 'GPL', 'GIL', 'GIU', 'GXL', 'GXU', 'GTL', 'GTU', 'GEL', 'GDL', 'GGLS',
      'VU', 'VL', 'VKU', 'VIU', 'VFA', 'VFB', 'VFE',
      'CFP', 'CVP', 'CXP', 'CSP', 'CFJ', 'CVJ', 'CSJ', 'CVU', 'CFU',
      'SSL', 'SML', 'SST', 'SMG', 'SMH', 'SSS', 'SSI',
      'MML', 'MSL', 'MSG', 'MSI', 'MSU', 'MSLS'
    ],
    nonEligibleProductPrefixes: ['MHL', 'MAL', 'MH', 'MA', 'MAG'],
    nonEligibleProductCodes: ['KALTRAUMFENSTER'],
    nonInvoiceDocumentMarkers: [
      'auftragsbestätigung', 'order confirmation', 'gutschrift', 'credit note',
      'korrekturbeleg', 'correction document'
    ],
  },
  customRules: [],
};

export interface ExtractedPdfData {
  invoiceNumber: string;
  date: string;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  supplierName: string;
  iban: string;
  confidenceScore: number;
  productCodes?: string[];
  basketProducts?: Array<{ code: string; quantity: number }>;
  reviewStatus?: string;
}

export interface ComparisonData {
  orderNumber?: string;
  targetInvoiceNumber: string;
  matched: boolean;
  discrepancyNote?: string;
}

export interface FormFilledData {
  supplierInput: string;
  invoiceNumberInput: string;
  totalAmountInput: string;
  submissionCategory: string;
  submittedAutomatically: boolean;
}

export interface AuditStep {
  step: string;
  timestamp: string;
  status: 'completed' | 'failed' | 'skipped';
}

export interface ProcessedSubmission {
  id: string;
  submissionId: string;
  processedAt: string;
  status: 'Success' | 'Incomplete' | 'Mismatch' | 'Error' | 'Skipped' | 'Needs Review';
  invoiceNumber: string;
  supplierName: string;
  actionTaken: string;
  executionTimeMs: number;
  extractedPdfData: ExtractedPdfData;
  comparisonData: ComparisonData;
  formFilledData: FormFilledData;
  auditSteps: AuditStep[];
  screenshotUrl?: string;
  receiptScreenshotUrl?: string;
  basketScreenshotUrl?: string;
  clientVerification?: 'verified' | 'unresolved' | 'pending';
  clientVerificationNote?: string;
}

export interface AlertItem {
  id: string;
  submissionId: string;
  supplierName: string;
  invoiceNumber: string;
  detectedAt: string;
  type: 'mismatch' | 'extraction_failure' | 'portal_error' | 'validation_error';
  reason: string;
  status: 'unresolved' | 'reviewed' | 'retried';
  resolvedBy?: string;
  resolvedAt?: string;
  externalAdminUrl?: string;
  submissionRef?: ProcessedSubmission;
}
