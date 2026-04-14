import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextData {
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((state) => state.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const toast = {
      id,
      message,
      type,
      duration,
    };

    setToasts((state) => [...state, toast]);

    if (duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Internal Container Component
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-md w-full sm:w-auto">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; removeToast: (id: string) => void }> = ({ toast, removeToast }) => {
  const icons = {
    success: <CheckCircle className="text-vitta-green" size={20} />,
    error: <AlertCircle className="text-vitta-danger" size={20} />,
    warning: <AlertTriangle className="text-vitta-amber" size={20} />,
    info: <Info className="text-vitta-accent" size={20} />,
  };

  const colors = {
    success: 'bg-vitta-green-bg border-vitta-green/20',
    error: 'bg-vitta-danger/10 border-vitta-danger/20',
    warning: 'bg-vitta-amber/10 border-vitta-amber/20',
    info: 'bg-vitta-accent-bg border-vitta-accent/20',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md ${colors[toast.type]} min-w-[300px]`}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-vitta-text-primary leading-tight">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-vitta-text-muted hover:text-vitta-text-primary transition-colors p-0.5"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};
