import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Bell,
  Sliders,
  Play,
  Square,
  Pause,
  Zap,
  RotateCw,
} from 'lucide-react';
import type { ActiveTab } from './Sidebar';
import type { BotStatusState } from '../types';

interface BottomNavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  botStatus: BotStatusState;
  unresolvedAlertsCount: number;
  onStartBot?: () => void;
  onPauseBot?: () => void;
  onStopBot?: () => void;
  isLoadingAction?: boolean;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({
  activeTab,
  onSelectTab,
  botStatus,
  unresolvedAlertsCount,
  onStartBot,
  onPauseBot,
  onStopBot,
  isLoadingAction = false,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: FileSpreadsheet },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unresolvedAlertsCount },
    { id: 'settings', label: 'Rules', icon: Sliders },
  ];

  const handleQuickBotAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoadingAction) return;
    if (botStatus === 'running') {
      if (onPauseBot) onPauseBot();
    } else {
      if (onStartBot) onStartBot();
    }
  };

  const getBotStatusDot = () => {
    switch (botStatus) {
      case 'running':
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse';
      case 'paused':
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
      case 'error':
        return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]';
      case 'stopped':
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      id="quantum-liquid-bottom-navbar"
      className="fixed bottom-2.5 sm:bottom-5 inset-x-0 z-40 flex justify-center px-3 pointer-events-none lg:hidden"
    >
      <div className="liquid-glass-pill-2 pointer-events-auto relative flex items-center justify-between gap-1 p-1.5 rounded-full max-w-[420px] w-full select-none shadow-2xl backdrop-blur-2xl">
        {/* Specular Rim Light Top Sheen */}
        <div
          className="liquid-specular-sheen absolute top-0 inset-x-6 h-[1.5px] rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Navigation Tabs */}
        <div className="flex items-center justify-around flex-1 gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`bottom-nav-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-2 px-2 sm:px-3 rounded-full transition-all duration-300 min-w-[56px] sm:min-w-[64px] min-h-[46px] group ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
              >
                {/* Active Fluid Liquid Pill */}
                {isActive && (
                  <motion.div
                    layoutId="liquid-pill-active-bubble"
                    className="liquid-active-pill-glow absolute inset-0 rounded-full z-0"
                    transition={{
                      type: 'spring',
                      stiffness: 480,
                      damping: 34,
                      mass: 0.8,
                    }}
                  />
                )}

                {/* Content Icon & Label */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive ? 'scale-110 stroke-[2.2]' : 'group-hover:scale-105 stroke-[1.8]'
                      }`}
                    />

                    {/* Unresolved Alerts Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        id="bottom-nav-alerts-badge"
                        className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse border border-white dark:border-black"
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-bold tracking-tight mt-0.5 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-70 text-[9.5px]'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Separator Line */}
        <div
          className="w-[1px] h-7 bg-slate-200/80 dark:bg-white/10 shrink-0 mx-1"
          aria-hidden="true"
        />

        {/* Quick Bot Runner Action Pill */}
        <button
          id="bottom-nav-quick-runner-btn"
          onClick={handleQuickBotAction}
          disabled={isLoadingAction}
          title={
            botStatus === 'running'
              ? 'Click to pause bot'
              : 'Click to start bot runner'
          }
          className={`relative z-10 shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 border ${
            botStatus === 'running'
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/30'
              : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400/40 shadow-purple-600/30'
          } ${isLoadingAction ? 'opacity-50 cursor-wait' : ''}`}
        >
          {isLoadingAction ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : botStatus === 'running' ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}

          <div className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${getBotStatusDot()}`}
              aria-hidden="true"
            />
            <span className="text-[11px] font-mono tracking-tight uppercase">
              {botStatus === 'running' ? 'Pause' : 'Start'}
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
};
