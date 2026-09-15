import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="global-toast-container"
      className="fixed bottom-24 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => {
        let borderBg = 'border-purple-500/40 bg-[#16162c] text-purple-300';
        let Icon = Info;
        if (toast.type === 'success') {
          borderBg = 'border-emerald-500/40 bg-[#121c1f] text-emerald-300';
          Icon = CheckCircle2;
        } else if (toast.type === 'error') {
          borderBg = 'border-rose-500/40 bg-[#221319] text-rose-300';
          Icon = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl shadow-black/40 flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${borderBg}`}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-slate-100">{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
