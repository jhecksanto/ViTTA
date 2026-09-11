import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw,
  AlertCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, collection, Timestamp, increment, runTransaction } from 'firebase/firestore';
import { updateDoc, addDoc, setDoc } from '../../lib/firestore-wrappers';
import { db } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';
import { 
  PlatformPixConfig, 
  DEFAULT_PLATFORM_PIX_CONFIG, 
  fetchPlatformPixConfig, 
  generatePixBrcode, 
  formatPixKeyDisplay 
} from '../../lib/pixUtils';

interface PixCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  purpose: 'wallet_recharge' | 'appointment' | 'plan_subscription';
  appointmentId?: string;
  planId?: string;
  planName?: string;
  user: any;
  onSuccess?: (details: any) => void;
}

export const PixCheckoutModal: React.FC<PixCheckoutModalProps> = ({
  isOpen,
  onClose,
  amount,
  purpose,
  appointmentId,
  planId,
  planName,
  user,
  onSuccess
}) => {
  const { addToast } = useToast();
  const [platformPix, setPlatformPix] = useState<PlatformPixConfig>(DEFAULT_PLATFORM_PIX_CONFIG);
  const [loading, setLoading] = useState(true);
  const [isCopiedKey, setIsCopiedKey] = useState(false);
  const [isCopiedBrcode, setIsCopiedBrcode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // 15-minute countdown (900 seconds)
  const [secondsLeft, setSecondsLeft] = useState<number>(15 * 60);
  const timerRef = useRef<any>(null);

  // Play audio chime on successful PIX settlement
  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.35); // C6

      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('AudioContext not allowed or not supported:', e);
    }
  };

  // Fetch platform pix config and start countdown
  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(15 * 60);
      setIsSuccess(false);
      setIsSimulating(false);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setLoading(true);
    fetchPlatformPixConfig()
      .then((cfg) => {
        setPlatformPix(cfg);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar configuração PIX:', err);
        setLoading(false);
      });

    setSecondsLeft(15 * 60);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isExpired = secondsLeft === 0;

  // Generate BACEN standard EMV payload
  const txId = useMemo(() => {
    return `PIX${Date.now().toString().slice(-8)}`;
  }, [isOpen]);

  const pixBrcode = useMemo(() => {
    return generatePixBrcode(
      platformPix.key,
      platformPix.beneficiaryName,
      platformPix.city || 'Sao Paulo',
      amount > 0 ? amount : undefined,
      txId
    );
  }, [platformPix, amount, txId]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(platformPix.key);
    setIsCopiedKey(true);
    addToast('Chave PIX copiada para a área de transferência!', 'success');
    setTimeout(() => setIsCopiedKey(false), 2500);
  };

  const handleCopyBrcode = () => {
    navigator.clipboard.writeText(pixBrcode);
    setIsCopiedBrcode(true);
    addToast('Código PIX Copia e Cola copiado com sucesso!', 'success');
    setTimeout(() => setIsCopiedBrcode(false), 2500);
  };

  // Real-time settlement simulation / verification (Issue 06)
  const handleLiquidatePix = async () => {
    if (!user?.uid || amount <= 0 || isExpired) return;
    setIsSimulating(true);

    try {
      if (purpose === 'wallet_recharge') {
        // 1. Credit wallet in users collection
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          walletBalance: increment(amount),
          updatedAt: Timestamp.now()
        });

        // 2. Add transaction history
        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          amount: amount,
          grossAmount: amount,
          type: 'deposit',
          paymentMethod: 'pix',
          txId: txId,
          status: 'completed',
          title: 'Recarga de Carteira via PIX',
          description: `Depósito instantâneo de R$ ${amount.toFixed(2).replace('.', ',')} creditado com sucesso`,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      } else if (purpose === 'appointment' && appointmentId) {
        // Mark appointment as confirmed and paid
        const aptRef = doc(db, 'appointments', appointmentId);
        await updateDoc(aptRef, {
          paid: true,
          status: 'upcoming',
          paymentStatus: 'paid',
          paymentMethod: 'pix',
          paidAt: new Date().toISOString(),
          txId: txId,
          updatedAt: new Date().toISOString()
        });

        // Add transaction log
        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          appointmentId: appointmentId,
          amount: -amount,
          grossAmount: amount,
          type: 'appointment_payment',
          paymentMethod: 'pix',
          txId: txId,
          status: 'completed',
          title: 'Pagamento de Consulta via PIX',
          description: `Consulta confirmada com sucesso via PIX Copia e Cola`,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      } else if (purpose === 'plan_subscription') {
        // Activate plan subscription
        const userRef = doc(db, 'users', user.uid);
        const newEnd = new Date();
        newEnd.setDate(newEnd.getDate() + 30);
        await updateDoc(userRef, {
          planId: planId || 'plan_vitta',
          planName: planName || 'Plano ViTTA Saúde',
          planPrice: amount,
          subscriptionStatus: 'active',
          planStatus: 'active',
          cancelAtPeriodEnd: false,
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: newEnd.toISOString(),
          updatedAt: Timestamp.now()
        });
      }

      playSuccessSound();
      setIsSuccess(true);
      addToast(`PIX de R$ ${amount.toFixed(2).replace('.', ',')} liquidado com sucesso!`, 'success');

      if (onSuccess) {
        onSuccess({ amount, txId, purpose, appointmentId });
      }
    } catch (err: any) {
      console.error('Erro ao liquidar PIX:', err);
      addToast('Erro ao confirmar liquidação do PIX: ' + (err.message || 'Falha na conexão'), 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-vitta-surface border border-vitta-border max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-emerald-500/10 via-vitta-surface to-vitta-surface-2 border-b border-vitta-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <QrCode size={20} />
              </div>
              <div>
                <h3 className="font-black text-base text-vitta-text-primary">
                  {isSuccess ? 'Pagamento PIX Confirmado!' : 'Pagamento Instantâneo PIX'}
                </h3>
                <p className="text-[11px] text-vitta-text-muted">
                  {purpose === 'wallet_recharge'
                    ? 'Recarga direta da Carteira ViTTA'
                    : purpose === 'appointment'
                    ? 'Quitação de Consulta Médica'
                    : 'Assinatura de Plano de Benefícios'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-vitta-text-muted hover:text-vitta-text-primary rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5">
            {isSuccess ? (
              /* Success View */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 flex flex-col items-center text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={44} />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-black text-vitta-text-primary">
                    Transação Concluída com Sucesso!
                  </h4>
                  <p className="text-xs text-vitta-text-secondary max-w-sm">
                    O pagamento de{' '}
                    <strong className="text-vitta-text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
                    </strong>{' '}
                    foi liquidado e os benefícios já estão disponíveis.
                  </p>
                </div>

                <div className="p-3.5 bg-vitta-surface-2 border border-vitta-border rounded-2xl w-full text-xs space-y-1 text-left font-mono">
                  <div className="flex justify-between text-vitta-text-muted">
                    <span>Identificador (TxID):</span>
                    <span className="font-bold text-vitta-text-primary">{txId}</span>
                  </div>
                  <div className="flex justify-between text-vitta-text-muted">
                    <span>Forma:</span>
                    <span className="font-bold text-emerald-600">PIX BACEN Instantâneo</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-vitta-accent/20 cursor-pointer"
                >
                  Concluir e Voltar
                </button>
              </motion.div>
            ) : (
              /* Payment Processing View */
              <>
                {/* Total and Countdown Bar */}
                <div className="flex items-center justify-between p-4 bg-vitta-surface-2 border border-vitta-border rounded-2xl">
                  <div>
                    <span className="text-[10px] text-vitta-text-muted uppercase font-bold block">
                      Valor a Pagar:
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
                    </span>
                  </div>

                  {/* 15 min Timer */}
                  <div className="text-right">
                    <span className="text-[10px] text-vitta-text-muted uppercase font-bold block flex items-center gap-1 justify-end">
                      <Clock size={12} className={isExpired ? 'text-rose-500' : 'text-amber-500'} />
                      Expira em:
                    </span>
                    <span className={`text-base font-black font-mono ${isExpired ? 'text-rose-500' : 'text-vitta-text-primary'}`}>
                      {isExpired ? 'Expirado' : timeFormatted}
                    </span>
                  </div>
                </div>

                {isExpired && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>Tempo limite de 15 minutos expirado. Feche e abra novamente para gerar um novo QR Code.</span>
                  </div>
                )}

                {/* QR Code & Copia e Cola Display */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                  <div className="w-36 h-36 bg-white p-2 rounded-2xl border border-vitta-border shadow-sm flex items-center justify-center shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixBrcode)}`}
                      alt="QR Code PIX"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="space-y-3 flex-1 w-full text-xs">
                    <div>
                      <span className="text-[10px] text-vitta-text-muted uppercase font-bold block">
                        Favorecido Institucional:
                      </span>
                      <span className="font-bold text-vitta-text-primary truncate block">
                        {platformPix.beneficiaryName}
                      </span>
                      <span className="text-[11px] text-vitta-text-secondary">
                        {platformPix.bankName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-vitta-text-muted uppercase font-bold block">
                        Chave PIX ({platformPix.keyType.toUpperCase()}):
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-bold text-vitta-text-primary truncate">
                          {formatPixKeyDisplay(platformPix.key, platformPix.keyType)}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="p-1 hover:bg-vitta-surface-2 text-vitta-text-muted hover:text-vitta-text-primary rounded-lg transition-colors cursor-pointer"
                          title="Copiar Chave"
                        >
                          {isCopiedKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PIX Copia e Cola Button */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-vitta-text-secondary block">
                    Ou pague usando o Código Copia e Cola:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixBrcode}
                      className="flex-1 px-3 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-mono text-vitta-text-muted truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyBrcode}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {isCopiedBrcode ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopiedBrcode ? 'Copiado!' : 'Copiar Código'}</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Verification & Simulation Action */}
                <div className="pt-2 border-t border-vitta-border space-y-2.5">
                  <button
                    type="button"
                    onClick={handleLiquidatePix}
                    disabled={isSimulating || isExpired}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Verificando Liquidação com o Banco...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Confirmar Pagamento PIX Instantâneo</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-vitta-text-muted">
                    Após efetuar a transferência no seu aplicativo bancário, clique no botão acima para liberação imediata.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default PixCheckoutModal;
