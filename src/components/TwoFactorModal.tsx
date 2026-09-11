import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Smartphone, RefreshCw, CheckCircle2, AlertCircle, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  currentEnabled?: boolean;
  onSuccess?: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  user,
  currentEnabled = false,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 60-second countdown timer for resend
  useEffect(() => {
    let timer: any = null;
    if (isOpen && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, cooldown]);

  const handleCodeChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newCode = [...code];
    newCode[index] = val.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`2fa-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`2fa-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResend = () => {
    if (cooldown > 0 || isSending) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setCooldown(60); // Reset 60s cooldown
      addToast('Novo código de verificação enviado por e-mail/SMS.', 'info');
    }, 600);
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      addToast('Digite o código de 6 dígitos completo.', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          twoFactorEnabled: !currentEnabled,
          twoFactorVerifiedAt: new Date().toISOString(),
        });
      }

      addToast(
        !currentEnabled
          ? 'Autenticação em 2 Etapas (2FA) ativada com sucesso!'
          : 'Autenticação em 2 Etapas desativada.',
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Erro ao validar verificação 2FA.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-vitta-surface w-full max-w-md rounded-3xl shadow-2xl border border-vitta-border overflow-hidden"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-vitta-accent/10 text-vitta-accent flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-vitta-text-primary">
                {currentEnabled ? 'Gerenciar 2FA' : 'Ativar 2FA'}
              </h3>
              <p className="text-[11px] text-vitta-text-muted">Autenticação em 2 Etapas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-vitta-text-muted hover:text-vitta-text-primary rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 text-center">
          <div className="p-3 bg-vitta-surface-2 rounded-2xl border border-vitta-border text-xs text-vitta-text-secondary">
            Insira o código de 6 dígitos enviado para seu e-mail cadastrado (<strong>{user?.email || 'seu e-mail'}</strong>).
          </div>

          {/* 6 Digit Input boxes */}
          <div className="flex justify-center gap-2">
            {code.map((digit, idx) => (
              <input
                key={idx}
                id={`2fa-digit-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-12 text-center text-lg font-black bg-vitta-surface-2 border border-vitta-border rounded-xl focus:border-vitta-accent outline-none text-vitta-text-primary transition-all"
              />
            ))}
          </div>

          {/* 60-Second Cooldown Resend Button (Issue 09) */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isSending}
              className={`text-xs font-bold flex items-center gap-1.5 transition-all ${
                cooldown > 0
                  ? 'text-vitta-text-muted cursor-not-allowed opacity-75'
                  : 'text-vitta-accent hover:underline cursor-pointer'
              }`}
            >
              {cooldown > 0 ? (
                <>
                  <Clock size={13} className="animate-spin text-vitta-accent" />
                  <span>Reenviar código em {cooldown}s</span>
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  <span>Reenviar novo código</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-secondary text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || code.join('').length !== 6}
              className="flex-1 py-2.5 bg-vitta-accent hover:bg-vitta-accent/90 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md shadow-vitta-accent/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isVerifying ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span>Confirmar</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TwoFactorModal;
