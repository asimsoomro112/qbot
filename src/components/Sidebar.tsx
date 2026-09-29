import React from 'react';
import {
  LayoutDashboard,
  Sliders,
  History,
  AlertTriangle,
  Cpu,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Scissors,
  FileSpreadsheet,
} from 'lucide-react';
import type { BotStatus } from '../types';

export type ActiveTab = 'dashboard' | 'settings' | 'history' | 'alerts';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  botStatus: BotStatus;
  unresolvedAlertsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenPythonModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSelectOperation?: (op: 'all' | 'redaction' | 'data_fill') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  botStatus,
  unresolvedAlertsCount,
  isOpenMobile,
  onCloseMobile,
  onOpenPythonModal,
  isCollapsed,
  onToggleCollapse,
  onSelectOperation,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      description: 'Live bot monitor & controls',
      icon: LayoutDashboard,
    },
    {
      id: 'history' as ActiveTab,
      label: 'History & Logs',
      description: 'Processed invoice records',
      icon: History,
    },
    {
      id: 'alerts' as ActiveTab,
      label: 'Alerts & Reviews',
      description: 'Flagged for operator review',
      icon: AlertTriangle,
      badge: unresolvedAlertsCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Rules & Settings',
      description: 'Automation parameters & rules',
      icon: Sliders,
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        id="app-main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between transition-all duration-300 ease-in-out glass-panel border-r border-slate-200/80 dark:border-white/10 ${
          isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64 xl:w-72'}`}
      >
        {/* Top Header / Collapse Controller */}
        <div>
          <div className="h-20 px-4 flex items-center justify-between border-b border-slate-200/60 dark:border-white/5">
            <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-purple-600/30 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    Quantum-h
                  </div>
                  <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 leading-tight">
                    Operations Center
                  </div>
                </div>
              )}
            </div>

            {/* Minimize toggle button on desktop */}
            <button
              onClick={onToggleCollapse}
              className={`hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all ${
                isCollapsed ? 'hidden' : ''
              }`}
              title="Minimize sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items List */}
          <div className="p-3 space-y-4 overflow-y-auto custom-scrollbar">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-400/80">
                Operations Menu
              </div>
            )}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <div key={item.id} className="relative group">
                    <button
                      id={`nav-link-${item.id}`}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                        isCollapsed ? 'justify-center p-3.5' : 'justify-between'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-600/25 border border-purple-400/30'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {!isCollapsed && (
                          <div className="text-left">
                            <div className="text-sm font-semibold leading-none">{item.label}</div>
                            <div className={`text-[11px] mt-1 leading-none ${isActive ? 'text-purple-100' : 'text-slate-400'}`}>
                              {item.description}
                            </div>
                          </div>
                        )}
                      </div>

                      {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                        <span
                          id={`sidebar-badge-${item.id}`}
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.badgeColor} shadow-sm animate-pulse`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Floating Tooltip in collapsed mode */}
                    {isCollapsed && (
                      <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-xl glass-pill shadow-xl text-xs font-semibold whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                        <div className="text-slate-900 dark:text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Dedicated Queue Breakdown: Redaction vs Data Required */}
            {!isCollapsed && (
              <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 space-y-1">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-400/80 mb-1.5">
                  Bot Queues Breakdown
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectOperation) onSelectOperation('redaction');
                    else handleSelect('history');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-500/10 text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-colors text-xs font-semibold group cursor-pointer border border-transparent hover:border-amber-500/20"
                  title="View Only Redacted Submissions"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-amber-500/15 text-amber-500">
                      <Scissors className="w-3.5 h-3.5" />
                    </span>
                    <span>Only Redaction</span>
                  </div>
                  <span className="font-mono px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                    {botStatus.stats.totalRedacted ?? 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectOperation) onSelectOperation('data_fill');
                    else handleSelect('history');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 hover:text-emerald-500 transition-colors text-xs font-semibold group cursor-pointer border border-transparent hover:border-emerald-500/20"
                  title="View Only Data Required Submissions"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-500/15 text-emerald-500">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </span>
                    <span>Only Data Required</span>
                  </div>
                  <span className="font-mono px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    {botStatus.stats.totalDataFilled ?? 0}
                  </span>
                </button>
              </div>
            )}

            {/* Quick Stats Summary (expanded mode only) */}
            {!isCollapsed && (
              <div className="mt-6 p-4 rounded-2xl glass-inset space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500 dark:text-slate-400">Today's Pipeline</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {botStatus.stats.totalToday} total
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                    style={{
                      width: `${
                        botStatus.stats.totalToday > 0
                          ? Math.round((botStatus.stats.matchedSuccessfully / botStatus.stats.totalToday) * 100)
                          : 0
                      }%`,
                    }}
                    title="Matched Successfully"
                  />
                  <div
                    className="bg-amber-500 h-full transition-all duration-500"
                    style={{
                      width: `${
                        botStatus.stats.totalToday > 0
                          ? Math.round((botStatus.stats.mismatchesFound / botStatus.stats.totalToday) * 100)
                          : 0
                      }%`,
                    }}
                    title="Needs Review / Skipped"
                  />
                  <div
                    className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
                    style={{
                      width: `${
                        botStatus.stats.totalToday > 0
                          ? Math.round((botStatus.stats.errorsEncountered / botStatus.stats.totalToday) * 100)
                          : 0
                      }%`,
                    }}
                    title="Errors"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {botStatus.stats.matchedSuccessfully} OK
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {botStatus.stats.mismatchesFound} Review
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {botStatus.stats.errorsEncountered} Err
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Connection Status Card */}
        <div className="p-3 border-t border-slate-200/60 dark:border-white/5 space-y-2">
          {!isCollapsed ? (
            <div className="p-3 rounded-2xl glass-inset space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {botStatus.isConnected ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </>
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    )}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {botStatus.isConnected ? 'Runner Connected' : 'Runner Standby'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                  {botStatus.botVersion}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 font-mono">
                <Cpu className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                <span className="truncate">{botStatus.botHostname}</span>
              </div>

              <button
                onClick={onOpenPythonModal}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-600 border border-purple-500/20 transition-all shadow-sm"
              >
                <span>Playwright API Guide</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2 gap-2">
              <div
                className={`w-3 h-3 rounded-full ${botStatus.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
                title={botStatus.isConnected ? 'Runner Connected' : 'Runner Offline'}
              />
              <button
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-purple-500 transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
