import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'info'
}) => {
  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertCircle className="text-vitta-danger" size={24} />;
      case 'warning': return <AlertTriangle className="text-vitta-amber" size={24} />;
      default: return <Info className="text-vitta-accent" size={24} />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-vitta-danger hover:bg-vitta-danger/90 shadow-vitta-danger/20';
      case 'warning': return 'bg-vitta-amber hover:bg-vitta-amber/90 shadow-vitta-amber/20';
      default: return 'bg-vitta-accent hover:bg-vitta-accent/90 shadow-vitta-accent/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-vitta-surface rounded-2xl shadow-2xl overflow-hidden border border-vitta-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-vitta-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${
                  type === 'danger' ? 'bg-vitta-danger/10' : 
                  type === 'warning' ? 'bg-vitta-amber/10' : 
                  'bg-vitta-accent/10'
                }`}>
                  {getIcon()}
                </div>
                <h3 className="text-lg font-bold text-vitta-text-primary">{title}</h3>
              </div>
              <button 
                onClick={onCancel}
                className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors text-vitta-text-muted hover:text-vitta-text-primary"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-vitta-text-secondary leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 bg-vitta-surface-2/50 border-t border-vitta-border">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 text-sm font-bold text-vitta-text-secondary hover:text-vitta-text-primary transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 ${getButtonClass()}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
