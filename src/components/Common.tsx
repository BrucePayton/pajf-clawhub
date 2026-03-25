import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-brand-500/90 text-white border-brand-400/20',
  error: 'bg-red-500/90 text-white border-red-400/20',
  info: 'bg-neutral-700/90 text-white border-neutral-500/20',
  loading: 'bg-amber-500/90 text-white border-amber-400/20',
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  if (type === 'success') return <CheckCircle className="w-5 h-5 shrink-0" />;
  if (type === 'error') return <AlertCircle className="w-5 h-5 shrink-0" />;
  if (type === 'loading') return <Loader2 className="w-5 h-5 shrink-0 animate-spin" />;
  return <Info className="w-5 h-5 shrink-0" />;
};

export const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (type === 'loading') return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, type]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClose}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 rounded-2xl shadow-2xl z-[100] border backdrop-blur-md cursor-pointer overflow-hidden min-w-[200px] max-w-[420px] ${toastStyles[type]}`}
    >
      <div className="flex items-center gap-3 px-5 py-3.5">
        <ToastIcon type={type} />
        <span className="font-semibold text-sm tracking-tight leading-snug">{message}</span>
      </div>
      {type !== 'loading' && (
        <div className="h-[2px] bg-white/20 w-full">
          <div
            className="h-full bg-white/50 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-neutral-100"
      >
        <h3 className="text-xl font-bold text-neutral-900 mb-2 tracking-tight">{title}</h3>
        <p className="text-neutral-500 text-sm mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-neutral-100 text-neutral-600 rounded-xl font-bold hover:bg-neutral-200 transition-all text-sm"
          >
            取消
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 text-sm"
          >
            确认删除
          </button>
        </div>
      </motion.div>
    </div>
  );
};
