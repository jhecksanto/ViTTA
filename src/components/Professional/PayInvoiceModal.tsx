import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Wallet,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Building2,
  RefreshCw,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useToast } from '../../contexts/ToastContext';
import {
  PlatformPixConfig,
  DEFAULT_PLATFORM_PIX_CONFIG,
  generatePixBrcode,
  processInvoicePayment,
  formatPixKeyDisplay
} from '../../lib/pixUtils';

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  walletBalance: number;
  totalUnpaidFees: number;
  unpaidItemsCount?: number;
  onPaymentSuccess?: () => void;
}

export const PayInvoiceModal: React.FC<PayInvoiceModalProps> = ({
  isOpen,
  onClose,
  user,
  walletBalance,
  totalUnpaidFees,
  unpaidItemsCount = 0,
  onPaymentSuccess,
}) => {
  const { addToast } = useToast();
  const [platformPix, setPlatformPix] = useState<PlatformPixConfig>(DEFAULT_PLATFORM_PIX_CONFIG);
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'pix' | 'hybrid'>('wallet');
  const [walletAmountToUse, setWalletAmountToUse] = useState<number>(0);
  const [pixAmountToPay, setPixAmountToPay] = useState<number>(0);
  const [hybridRemainingAction, setHybridRemainingAction] = useState<'pay_pix' | 'leave_open'>('pay_pix');
  const [pixProof, setPixProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopiedKey, setIsCopiedKey] = useState(false);
  const [isCopiedBrcode, setIsCopiedBrcode] = useState(false);

  // Escutar configuração da Chave PIX da plataforma em tempo real
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'system_configs', 'platform_pix'),
      (snap) => {
        if (snap.exists()) {
          setPlatformPix({ ...DEFAULT_PLATFORM_PIX_CONFIG, ...snap.data() } as PlatformPixConfig);
        }
      },
      (err) => {
        console.warn('Erro ao carregar chave PIX da plataforma:', err);
      }
    );
    return () => unsub();
  }, []);

  // Inicializar montantes ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      if (walletBalance >= totalUnpaidFees) {
        setSelectedMethod('wallet');
        setWalletAmountToUse(totalUnpaidFees);
        setPixAmountToPay(0);
      } else if (walletBalance > 0) {
        setSelectedMethod('hybrid');
        setWalletAmountToUse(walletBalance);
        setPixAmountToPay(totalUnpaidFees - walletBalance);
        setHybridRemainingAction('pay_pix');
      } else {
        setSelectedMethod('pix');
        setWalletAmountToUse(0);
        setPixAmountToPay(totalUnpaidFees);
      }
      setPixProof('');
      setIsCopiedKey(false);
      setIsCopiedBrcode(false);
    }
  }, [isOpen, walletBalance, totalUnpaidFees]);

  // Recalcular quando o método selecionado muda
  const handleMethodChange = (method: 'wallet' | 'pix' | 'hybrid') => {
    setSelectedMethod(method);
    if (method === 'wallet') {
      const maxWallet = Math.min(walletBalance, totalUnpaidFees);
      setWalletAmountToUse(maxWallet);
      setPixAmountToPay(0);
    } else if (method === 'pix') {
      setWalletAmountToUse(0);
      setPixAmountToPay(totalUnpaidFees);
    } else if (method === 'hybrid') {
      const availableWallet = Math.min(walletBalance, totalUnpaidFees);
      setWalletAmountToUse(availableWallet);
      setPixAmountToPay(totalUnpaidFees - availableWallet);
    }
  };

  const calculatedRemainingUnpaid = useMemo(() => {
    if (selectedMethod === 'wallet') {
      return Math.max(0, totalUnpaidFees - walletAmountToUse);
    }
    if (selectedMethod === 'pix') {
      return 0;
    }
    if (selectedMethod === 'hybrid') {
      if (hybridRemainingAction === 'pay_pix') {
        return 0;
      }
      return Math.max(0, totalUnpaidFees - walletAmountToUse);
    }
    return 0;
  }, [selectedMethod, totalUnpaidFees, walletAmountToUse, hybridRemainingAction]);

  const totalPaymentNow = useMemo(() => {
    if (selectedMethod === 'wallet') {
      return walletAmountToUse;
    }
    if (selectedMethod === 'pix') {
      return totalUnpaidFees;
    }
    if (selectedMethod === 'hybrid') {
      return hybridRemainingAction === 'pay_pix' ? totalUnpaidFees : walletAmountToUse;
    }
    return 0;
  }, [selectedMethod, totalUnpaidFees, walletAmountToUse, hybridRemainingAction]);

  const pixAmountForBrcode = useMemo(() => {
    if (selectedMethod === 'pix') return totalUnpaidFees;
    if (selectedMethod === 'hybrid' && hybridRemainingAction === 'pay_pix') {
      return Math.max(0, totalUnpaidFees - walletAmountToUse);
    }
    return 0;
  }, [selectedMethod, totalUnpaidFees, walletAmountToUse, hybridRemainingAction]);

  // Gerar payload PIX Copia e Cola padrão BACEN EMV
  const pixBrcode = useMemo(() => {
    return generatePixBrcode(
      platformPix.key,
      platformPix.beneficiaryName,
      platformPix.city || 'Sao Paulo',
      pixAmountForBrcode > 0 ? pixAmountForBrcode : undefined,
      `FAT${Date.now().toString().slice(-6)}`
    );
  }, [platformPix, pixAmountForBrcode]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(platformPix.key);
    setIsCopiedKey(true);
    addToast('Chave PIX copiada com sucesso!', 'success');
    setTimeout(() => setIsCopiedKey(false), 3000);
  };

  const handleCopyBrcode = () => {
    navigator.clipboard.writeText(pixBrcode);
    setIsCopiedBrcode(true);
    addToast('Código PIX Copia e Cola copiado!', 'success');
    setTimeout(() => setIsCopiedBrcode(false), 3000);
  };

  const handleConfirmPayment = async () => {
    if (totalPaymentNow <= 0) {
      addToast('O valor a pagar deve ser maior que R$ 0,00.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalWalletAmount = 0;
      let finalPixAmount = 0;
      let methodType: 'wallet_only' | 'pix_only' | 'wallet_and_pix' = 'wallet_only';

      if (selectedMethod === 'wallet') {
        finalWalletAmount = walletAmountToUse;
        finalPixAmount = 0;
        methodType = 'wallet_only';
      } else if (selectedMethod === 'pix') {
        finalWalletAmount = 0;
        finalPixAmount = totalUnpaidFees;
        methodType = 'pix_only';
      } else if (selectedMethod === 'hybrid') {
        finalWalletAmount = walletAmountToUse;
        finalPixAmount = hybridRemainingAction === 'pay_pix' ? Math.max(0, totalUnpaidFees - walletAmountToUse) : 0;
        methodType = finalPixAmount > 0 ? 'wallet_and_pix' : 'wallet_only';
      }

      const res = await processInvoicePayment({
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.name || 'Profissional',
        totalUnpaidAmount: totalUnpaidFees,
        walletAmountToUse: finalWalletAmount,
        pixAmountToPay: finalPixAmount,
        paymentMethod: methodType,
        pixProofInfo: pixProof.trim() || undefined,
      });

      addToast(res.message, 'success');
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Erro ao processar pagamento de fatura:', err);
      addToast(err.message || 'Erro ao processar pagamento. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-vitta-surface w-full max-w-xl rounded-3xl border border-vitta-border overflow-hidden shadow-2xl my-auto"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-vitta-border bg-gradient-to-r from-vitta-accent/10 via-vitta-surface-2 to-vitta-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-vitta-accent/15 text-vitta-accent flex items-center justify-center shrink-0">
              <DollarSign size={22} />
            </div>
            <div>
              <h3 className="font-black text-lg text-vitta-text-primary">
                Pagar Fatura de Taxas ViTTA
              </h3>
              <p className="text-xs text-vitta-text-secondary">
                Liquidação das taxas de intermediação de consultas presenciais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-vitta-text-muted hover:text-vitta-text-primary hover:bg-vitta-surface-3 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Card de Resumo de Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Valor da Fatura */}
            <div className="p-4 bg-vitta-amber-bg/40 border border-vitta-amber/20 rounded-2xl">
              <span className="text-[10px] font-bold text-vitta-amber uppercase tracking-wider block">
                Valor Total da Fatura em Aberto
              </span>
              <span className="text-2xl font-black text-vitta-amber mt-1 block">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalUnpaidFees)}
              </span>
              {unpaidItemsCount > 0 && (
                <span className="text-[10px] text-vitta-text-muted mt-1 block">
                  {unpaidItemsCount} atendimento(s) pendente(s)
                </span>
              )}
            </div>

            {/* Saldo em Conta Disponível */}
            <div className="p-4 bg-vitta-surface-2 border border-vitta-border rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-vitta-text-secondary uppercase tracking-wider block">
                  Saldo em Conta Disponível
                </span>
                <Wallet size={16} className="text-vitta-accent" />
              </div>
              <span className="text-2xl font-black text-vitta-text-primary mt-1 block">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(walletBalance)}
              </span>
              <span className="text-[10px] text-vitta-text-muted mt-1 block">
                Disponível na sua carteira ViTTA
              </span>
            </div>
          </div>

          {/* Opções de Forma de Pagamento */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-vitta-text-primary block">
              Selecione como deseja realizar o pagamento:
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Opção 1: Integral com Saldo em Conta */}
              {walletBalance >= totalUnpaidFees && (
                <button
                  type="button"
                  onClick={() => handleMethodChange('wallet')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                    selectedMethod === 'wallet'
                      ? 'bg-vitta-accent/10 border-vitta-accent ring-2 ring-vitta-accent/20'
                      : 'bg-vitta-surface-2 border-vitta-border hover:bg-vitta-surface-3'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-vitta-accent/15 text-vitta-accent flex items-center justify-center shrink-0 mt-0.5">
                      <Wallet size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-vitta-text-primary">
                          Debitar Integralmente do Saldo em Conta
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-xs text-vitta-text-secondary mt-0.5">
                        Quita 100% da fatura instantaneamente utilizando seu saldo acumulado de R${' '}
                        {walletBalance.toFixed(2)}.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={selectedMethod === 'wallet'}
                    onChange={() => handleMethodChange('wallet')}
                    className="accent-vitta-accent mt-1"
                  />
                </button>
              )}

              {/* Opção 2: Híbrido (Saldo em Conta + Restante) quando o saldo é positivo mas menor que o total */}
              {walletBalance > 0 && walletBalance < totalUnpaidFees && (
                <button
                  type="button"
                  onClick={() => handleMethodChange('hybrid')}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                    selectedMethod === 'hybrid'
                      ? 'bg-vitta-accent/10 border-vitta-accent ring-2 ring-vitta-accent/20'
                      : 'bg-vitta-surface-2 border-vitta-border hover:bg-vitta-surface-3'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-vitta-accent/15 text-vitta-accent flex items-center justify-center shrink-0 mt-0.5">
                      <Wallet size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-vitta-text-primary block">
                        Usar Saldo em Conta (R$ {walletBalance.toFixed(2)}) + PIX / Em Aberto
                      </span>
                      <p className="text-xs text-vitta-text-secondary mt-0.5">
                        Abate todo o seu saldo disponível (R$ {walletBalance.toFixed(2)}) e você escolhe pagar a diferença via PIX ou manter em aberto.
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    checked={selectedMethod === 'hybrid'}
                    onChange={() => handleMethodChange('hybrid')}
                    className="accent-vitta-accent mt-1"
                  />
                </button>
              )}

              {/* Opção 3: Integralmente via PIX */}
              <button
                type="button"
                onClick={() => handleMethodChange('pix')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                  selectedMethod === 'pix'
                    ? 'bg-vitta-accent/10 border-vitta-accent ring-2 ring-vitta-accent/20'
                    : 'bg-vitta-surface-2 border-vitta-border hover:bg-vitta-surface-3'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-vitta-green/15 text-vitta-green flex items-center justify-center shrink-0 mt-0.5">
                    <QrCode size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-vitta-text-primary block">
                      Pagar Integralmente via PIX da Plataforma
                    </span>
                    <p className="text-xs text-vitta-text-secondary mt-0.5">
                      Transfira o valor total de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalUnpaidFees)} para a chave PIX institucional da ViTTA sem mexer no seu saldo em conta.
                    </p>
                  </div>
                </div>
                <input
                  type="radio"
                  checked={selectedMethod === 'pix'}
                  onChange={() => handleMethodChange('pix')}
                  className="accent-vitta-accent mt-1"
                />
              </button>
            </div>
          </div>

          {/* Seção Híbrida: Escolha para o restante */}
          {selectedMethod === 'hybrid' && (
            <div className="p-4 bg-vitta-surface-2 border border-vitta-border rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-vitta-text-secondary">Valor abatido do saldo em conta:</span>
                <span className="font-black text-emerald-600">
                  - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(walletAmountToUse)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-vitta-text-secondary">Diferença restante da fatura:</span>
                <span className="font-black text-vitta-amber">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalUnpaidFees - walletAmountToUse)}
                </span>
              </div>

              <div className="pt-2 border-t border-vitta-border space-y-2">
                <span className="text-[11px] font-bold text-vitta-text-primary block">
                  O que deseja fazer com a diferença restante (R$ {(totalUnpaidFees - walletAmountToUse).toFixed(2)})?
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHybridRemainingAction('pay_pix')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      hybridRemainingAction === 'pay_pix'
                        ? 'bg-vitta-green/10 border-vitta-green text-vitta-green ring-1 ring-vitta-green/20'
                        : 'bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:text-vitta-text-primary'
                    }`}
                  >
                    <span>Pagar diferença agora via PIX</span>
                    <input
                      type="radio"
                      checked={hybridRemainingAction === 'pay_pix'}
                      onChange={() => setHybridRemainingAction('pay_pix')}
                      className="accent-vitta-green"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setHybridRemainingAction('leave_open')}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      hybridRemainingAction === 'leave_open'
                        ? 'bg-vitta-amber/10 border-vitta-amber text-vitta-amber ring-1 ring-vitta-amber/20'
                        : 'bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:text-vitta-text-primary'
                    }`}
                  >
                    <span>Deixar restante em aberto</span>
                    <input
                      type="radio"
                      checked={hybridRemainingAction === 'leave_open'}
                      onChange={() => setHybridRemainingAction('leave_open')}
                      className="accent-vitta-amber"
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Área de Detalhes da Chave PIX da Plataforma (quando envolve pagamento PIX) */}
          {(selectedMethod === 'pix' || (selectedMethod === 'hybrid' && hybridRemainingAction === 'pay_pix')) && (
            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-500/5 via-vitta-surface-2 to-vitta-surface border border-emerald-500/20 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-vitta-border pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-emerald-600" />
                  <span className="text-xs font-black text-vitta-text-primary uppercase tracking-wide">
                    Chave PIX Institucional da Plataforma
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  {platformPix.keyType.toUpperCase()}
                </span>
              </div>

              {/* Informações da Conta ViTTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-vitta-text-muted block">Favorecido / Razão Social:</span>
                  <span className="font-bold text-vitta-text-primary">{platformPix.beneficiaryName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-vitta-text-muted block">Banco / Instituição:</span>
                  <span className="font-bold text-vitta-text-primary">{platformPix.bankName}</span>
                </div>
              </div>

              {/* Chave PIX com botão copiar */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-vitta-text-secondary uppercase tracking-wider block">
                  Chave PIX para Transferência:
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl font-mono text-xs font-bold text-vitta-text-primary select-all truncate">
                    {formatPixKeyDisplay(platformPix.key, platformPix.keyType)}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 cursor-pointer shrink-0"
                  >
                    {isCopiedKey ? <Check size={14} /> : <Copy size={14} />}
                    <span>{isCopiedKey ? 'Copiado!' : 'Copiar Chave'}</span>
                  </button>
                </div>
              </div>

              {/* PIX Copia e Cola & QR Code */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-vitta-border/60">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white p-2 rounded-xl border border-vitta-border shrink-0 shadow-sm flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixBrcode)}`}
                    alt="QR Code PIX ViTTA"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider">
                      Código PIX Copia e Cola
                    </span>
                    <span className="text-xs font-black text-emerald-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pixAmountForBrcode)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyBrcode}
                    className="w-full py-2 bg-vitta-surface-2 hover:bg-vitta-surface-3 text-vitta-text-primary border border-vitta-border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isCopiedBrcode ? <Check size={14} className="text-emerald-600" /> : <QrCode size={14} />}
                    <span>{isCopiedBrcode ? 'Código Copiado!' : 'Copiar Código Copia e Cola'}</span>
                  </button>
                </div>
              </div>

              {/* Campo opcional de identificador do pagamento / comprovante */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider block">
                  Autenticação ou Comprovante bancário (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: E2E-20260408-PIX-9821 ou número da transação"
                  value={pixProof}
                  onChange={(e) => setPixProof(e.target.value)}
                  className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-mono text-vitta-text-primary outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          )}

          {/* Resumo Final do Pagamento */}
          <div className="p-4 bg-vitta-surface-2 border border-vitta-border rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between text-vitta-text-secondary">
              <span>Total da Fatura:</span>
              <span className="font-bold text-vitta-text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalUnpaidFees)}
              </span>
            </div>
            {walletAmountToUse > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Débito do Saldo em Conta:</span>
                <span className="font-bold">
                  - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(walletAmountToUse)}
                </span>
              </div>
            )}
            {pixAmountForBrcode > 0 && (
              <div className="flex justify-between text-vitta-accent">
                <span>Pagamento via PIX Plataforma:</span>
                <span className="font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pixAmountForBrcode)}
                </span>
              </div>
            )}
            {calculatedRemainingUnpaid > 0 && (
              <div className="flex justify-between text-vitta-amber pt-1 border-t border-vitta-border font-bold">
                <span>Restante que ficará em aberto:</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedRemainingUnpaid)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-vitta-border bg-vitta-surface-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/3 py-3 bg-vitta-surface hover:bg-vitta-surface-3 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isSubmitting || totalPaymentNow <= 0}
            onClick={handleConfirmPayment}
            className="w-full sm:w-2/3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Processando Pagamento...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>
                  Confirmar Pagamento (
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaymentNow)}
                  )
                </span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
