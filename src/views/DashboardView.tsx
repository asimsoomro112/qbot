import React from 'react';
import { StatusIndicator } from '../components/StatusIndicator';
import { StatCards } from '../components/StatCards';
import { CurrentlyProcessingCard } from '../components/CurrentlyProcessingCard';
import { ActivityLogPanel } from '../components/ActivityLogPanel';
import type { BotStatus, LogEntry } from '../types';

interface DashboardViewProps {
  botStatus: BotStatus;
  logs: LogEntry[];
  onStartBot: () => void;
  onStopBot: () => void;
  onPauseBot: () => void;
  isLoadingAction: boolean;
  onClearLogs: () => void;
  onOpenSubmissionModal: (submissionId: string) => void;
  onNavigateToAlerts: () => void;
  onNavigateToHistory: (filter?: 'All' | 'Needs Review' | 'Success' | 'Mismatch' | 'Error' | 'Skipped') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  botStatus,
  logs,
  onStartBot,
  onStopBot,
  onPauseBot,
  isLoadingAction,
  onClearLogs,
  onOpenSubmissionModal,
  onNavigateToAlerts,
  onNavigateToHistory,
}) => {
  return (
    <div id="view-dashboard-container" className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bot Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring and controls for the Quantum-h invoice verification automation bot.
          </p>
        </div>
      </div>

      {/* 1. Bot Status Indicator & Primary Action Controls */}
      <StatusIndicator
        status={botStatus.status}
        lastStatusChange={botStatus.lastStatusChange}
        onStart={onStartBot}
        onStop={onStopBot}
        onPause={onPauseBot}
        isLoadingAction={isLoadingAction}
        currentlyProcessing={botStatus.currentlyProcessing}
      />

      {/* 2. Summary Stat Cards */}
      <StatCards
        stats={botStatus.stats}
        onNavigateToAlerts={onNavigateToAlerts}
        onNavigateToHistory={onNavigateToHistory}
      />

      {/* 3. Currently Processing Card */}
      <CurrentlyProcessingCard
        current={botStatus.currentlyProcessing}
        botStatusState={botStatus.status}
      />

      {/* 4. Live Activity Log Feed */}
      <ActivityLogPanel
        logs={logs}
        onClearLogs={onClearLogs}
        onOpenSubmissionModal={onOpenSubmissionModal}
      />
    </div>
  );
};
