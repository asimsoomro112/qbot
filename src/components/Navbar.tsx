import React from 'react';
import {
  Zap,
  Activity,
  Code2,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from 'lucide-react';
import type { BotStatusState } from '../types';

interface NavbarProps {
  status: BotStatusState;
  unresolvedAlertsCount: number;
  onOpenPythonModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onToggleSidebar: () => void;
  onNavigateToAlerts: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isSidebarCollapsed: boolean;
  isConnected?: boolean;
  isCloudRelay?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  unresolvedAlertsCount,
  onOpenPythonModal,
  onRefresh,
  isRefreshing,
  onToggleSidebar,
  onNavigateToAlerts,
  theme,
  onToggleTheme,
  isSidebarCollapsed,
  isConnected = true,
  isCloudRelay = false,
}) => {
  const getStatusDisplay = () => {
    if (isCloudRelay && !isConnected) {
      return {
        label: 'Laptop Offline (Sleeping)',
        dotClass: 'bg-amber-400 ring-4 ring-amber-400/20',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
    }
    switch (status) {
      case 'running':
        return {
          label: isCloudRelay ? 'Bot Running (Cloud Live)' : 'Bot Running',
          dotClass: 'bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'paused':
        return {
          label: 'Bot Paused',
          dotClass: 'bg-amber-500 ring-4 ring-amber-500/20',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case 'error':
        return {
          label: 'Bot Error',
          dotClass: 'bg-rose-500 ring-4 ring-rose-500/20',
          badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case 'stopped':
      default:
        return {
          label: isCloudRelay ? 'Bot Standby (Cloud Ready)' : 'Bot Standby',
          dotClass: 'bg-slate-400',
          badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
        };
    }
  };

  const statusConfig = getStatusDisplay();

  return (
    <header
      id="main-top-navbar"
      className="sticky top-2 z-40 w-full px-3 sm:px-6 pointer-events-none"
    >
      <div className="max-w-7xl mx-auto h-14 sm:h-16 px-3 sm:px-5 rounded-full glass-pill pointer-events-auto flex items-center justify-between transition-all duration-300">
        {/* Left side: Sidebar Toggle & Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop & Mobile Sidebar Collapse/Expand Toggle */}
          <button
            id="toggle-sidebar-collapse-btn"
            onClick={onToggleSidebar}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-200/70 dark:hover:bg-white/10 transition-all shadow-sm"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle sidebar"
          >
            <span className="hidden lg:inline-flex">
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </span>
            <span className="lg:hidden">
              <Menu className="w-4 h-4" />
            </span>
          </button>

          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-purple-500/25 border border-white/40">
              <span className="font-black text-white text-sm sm:text-base tracking-tighter">Q</span>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0f1120]" />
            </div>

            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm sm:text-base">
                  Quantum-h
                </span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold text-xs sm:text-sm">
                  Invoice Bot
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/25">
                  v2.5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Real-time Status Badge */}
        <div className="flex items-center">
          <div
            id="navbar-bot-status-pill"
            className={`flex items-center gap-2 px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border ${statusConfig.badgeClass} shadow-sm backdrop-blur-md`}
          >
            <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
            <span className="truncate">{statusConfig.label}</span>
          </div>
        </div>

        {/* Right side: Action controls & Theme Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Light / Dark Mode Toggle */}
          <button
            id="navbar-theme-toggle-btn"
            onClick={onToggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform -rotate-12 hover:rotate-0" />
            )}
          </button>

          {/* Python Client API Guide Button */}
          <button
            id="navbar-open-python-modal-btn"
            onClick={onOpenPythonModal}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-500/25 transition-all shadow-sm"
            title="View Python Playwright Integration Guide"
          >
            <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Python API</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            id="navbar-refresh-btn"
            onClick={onRefresh}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all shadow-sm ${
              isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            title="Refresh Bot State & Submissions"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-purple-600 dark:text-purple-400' : ''}`} />
          </button>

          {/* Alerts Bell Button with Count Badge */}
          <button
            id="navbar-alerts-btn"
            onClick={onNavigateToAlerts}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-all shadow-sm"
            title={`${unresolvedAlertsCount} unresolved alerts`}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {unresolvedAlertsCount > 0 && (
              <span
                id="navbar-alerts-badge"
                className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse shadow-sm"
              >
                {unresolvedAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-white/10">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                Admin Ops
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                Velux Portal
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
