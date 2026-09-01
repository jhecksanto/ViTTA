import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Receipt, 
  X, 
  Download, 
  FileText, 
  Search, 
  Filter, 
  Percent, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  Timestamp,
  doc,
  increment
} from 'firebase/firestore';
import { db } from '../../firebase';
import { updateDoc, addDoc } from '../../lib/firestore-wrappers';
import { useToast } from '../../contexts/ToastContext';
import { validatePixKey, formatDateForDisplay } from '../../lib/utils';
import { PayoutReceiptModal } from './PayoutReceiptModal';

interface ProfessionalFinanceViewProps {
  user: any;
  professional?: any;
  setActiveTab?: (tab: string) => void;
}

export const ProfessionalFinanceView: React.FC<ProfessionalFinanceViewProps> = ({
  user,
  professional,
  setActiveTab
}) => {
  const { addToast } = useToast();
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [consultationsTxs, setConsultationsTxs] = useState<any[]>([]);
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab: 'statement' | 'transactions' | 'invoices'
  const [activeSubTab, setActiveSubTab] = useState<'statement' | 'transactions'>('statement');

  // Payout Modal states
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<string | null>(null);
  const [pixKeyError, setPixKeyError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Receipt Modal states
  const [selectedReceiptPayout, setSelectedReceiptPayout] = useState<any>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Statement Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');

  useEffect(() => {
    if (!user || !user.uid) return;

    setLoading(true);

    const unsubscribeWallet = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setWalletBalance(docSnap.data().walletBalance || 0);
        }
      },
      (error) => {
        console.error('Error fetching wallet balance:', error);
      }
    );

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(50)
    );

    const unsubscribeTransactions = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTransactions(list);

        // Filter consultation splits and credits
        const consults = list.filter(
          (t: any) =>
            t.type === 'appointment_split' ||
            (t.type === 'credit' && t.category === 'Rendimento')
        );
        setConsultationsTxs(consults);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching transactions:', error);
        setLoading(false);
      }
    );

    const qAll = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribeAll = onSnapshot(
      qAll,
      (snapshot) => {
        const allDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        const cashTxs = allDocs.filter(
          (t: any) => t.isCash === true && (t.feeCharged !== undefined || t.feeCharged > 0)
        );
        setCashTransactions(cashTxs);
      },
      (error) => {
        console.error('Error fetching cash transactions:', error);
      }
    );

    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
      unsubscribeAll();
    };
  }, [user?.uid]);

  const handlePixKeyChange = (val: string) => {
    setPixKey(val);
    if (!val.trim()) {
      setPixKeyType(null);
      setPixKeyError(null);
      return;
    }
    const validation = validatePixKey(val);
    if (validation.valid) {
      setPixKeyType(validation.type?.toUpperCase() || 'VÁLIDA');
      setPixKeyError(null);
    } else {
      setPixKeyType(null);
      setPixKeyError(validation.message || 'Chave PIX inválida');
    }
  };

  const handleRequestPayout = async () => {
    const numAmount = parseFloat(payoutAmount.replace(',', '.'));
    if (!numAmount || numAmount <= 0) {
      addToast('Informe um valor de saque válido.', 'error');
      return;
    }
    if (numAmount > walletBalance) {
      addToast('Saldo insuficiente para esta solicitação.', 'error');
      return;
    }

    const pixValidation = validatePixKey(pixKey);
    if (!pixValidation.valid) {
      addToast(pixValidation.message || 'Chave PIX inválida. Verifique os dados.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Deduct balance from user
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletBalance: increment(-numAmount),
      });

      // 2. Create withdraw request transaction
      const authCode = `VITTA-TX-${Math.floor(100000 + Math.random() * 900000)}-${user.uid.substring(0, 4).toUpperCase()}`;
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: 'withdraw_request',
        amount: numAmount,
        description: `Solicitação de Saque - PIX (${pixValidation.type?.toUpperCase()}): ${pixKey}`,
        pixKey: pixKey,
        pixType: pixValidation.type,
        authCode: authCode,
        beneficiaryName: user.displayName || professional?.name || 'Profissional ViTTA',
        date: new Date().toISOString(),
        status: 'pending', // Pending admin release
        createdAt: Timestamp.now()
      });

      addToast('Solicitação de saque PIX enviada com sucesso!', 'success');
      setIsPayoutModalOpen(false);
      setPayoutAmount('');
      setPixKey('');
      setPixKeyType(null);
      setPixKeyError(null);
    } catch (err) {
      console.error('Erro ao solicitar saque:', err);
      addToast('Erro ao processar saque.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalUnpaidFees = cashTransactions
    .filter((t) => t.invoicePaid !== true)
    .reduce((sum, t) => sum + (t.feeCharged || 0), 0);

  const totalPaidFees = cashTransactions
    .filter((t) => t.invoicePaid === true)
    .reduce((sum, t) => sum + (t.feeCharged || 0), 0);

  // Statement calculations
  const filteredStatement = consultationsTxs.filter((t) => {
    const matchSearch =
      !searchTerm ||
      (t.patientName && t.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchSearch) return false;

    if (filterMonth !== 'all' && t.date) {
      const monthStr = t.date.substring(0, 7); // YYYY-MM
      return monthStr === filterMonth;
    }
    return true;
  });

  const totalGross = filteredStatement.reduce((acc, t) => {
    const gross = t.grossAmount || (t.amount + (t.feeCharged || 0));
    return acc + gross;
  }, 0);

  const totalFees = filteredStatement.reduce((acc, t) => acc + (t.feeCharged || 0), 0);
  const totalNet = filteredStatement.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
          <div className="bg-vitta-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-vitta-border animate-in zoom-in-95 space-y-5">
            <div className="flex justify-between items-center border-b border-vitta-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-vitta-accent/10 flex items-center justify-center text-vitta-accent font-bold">
                  PIX
                </div>
                <h3 className="text-lg font-bold text-vitta-text-primary">
                  Solicitar Saque PIX
                </h3>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-vitta-text-muted hover:bg-vitta-surface-2 p-2 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Valor do Saque (R$)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-1 focus:ring-vitta-accent transition-all text-vitta-text-primary font-bold mt-1"
                />
                <div className="flex justify-between items-center text-xs text-vitta-text-secondary mt-1.5 px-1">
                  <span>Disponível em carteira:</span>
                  <span className="font-bold text-emerald-500">
                    R$ {walletBalance.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                    Chave PIX Destino
                  </label>
                  {pixKeyType && (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Tipo: {pixKeyType}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="CPF, CNPJ, E-mail, Celular ou Chave Aleatória (EVP)"
                  value={pixKey}
                  onChange={(e) => handlePixKeyChange(e.target.value)}
                  className={`w-full px-4 py-3 bg-vitta-surface-2 border rounded-xl text-sm focus:ring-1 transition-all text-vitta-text-primary mt-1 ${
                    pixKeyError 
                      ? 'border-rose-500 focus:ring-rose-500' 
                      : pixKeyType 
                        ? 'border-emerald-500 focus:ring-emerald-500' 
                        : 'border-vitta-border focus:ring-vitta-accent'
                  }`}
                />
                {pixKeyError && (
                  <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1 px-1">
                    <AlertCircle size={12} /> {pixKeyError}
                  </p>
                )}
                <p className="text-[10px] text-vitta-text-muted mt-1 px-1">
                  Formatos suportados: CPF (11 dígitos), CNPJ (14 dígitos), E-mail, Celular com DDD ou Chave EVP (UUID).
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRequestPayout}
                  disabled={isProcessing || !pixKeyType || !payoutAmount}
                  className="w-full py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isProcessing ? 'Processando Transferência...' : 'Confirmar Solicitação de Saque'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Receipt Modal */}
      {isReceiptModalOpen && selectedReceiptPayout && (
        <PayoutReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedReceiptPayout(null);
          }}
          payout={selectedReceiptPayout}
          professionalName={user.displayName || professional?.name}
        />
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Wallet Balance */}
        <div className="relative overflow-hidden bg-gradient-to-br from-vitta-accent to-sky-600 p-8 rounded-3xl shadow-xl shadow-vitta-accent/20 text-white flex flex-col justify-between min-h-[200px]">
          <div className="absolute top-0 right-0 p-6 opacity-15">
            <Wallet size={90} />
          </div>
          <div className="relative z-10 space-y-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">
                Saldo Disponível na Carteira
              </p>
              <h2 className="text-4xl font-black tracking-tight">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(walletBalance)}
              </h2>
            </div>

            <button
              onClick={() => setIsPayoutModalOpen(true)}
              className="w-full py-3 bg-white text-vitta-accent rounded-xl text-xs font-bold shadow-md hover:bg-white/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowUpRight size={16} /> Solicitar Saque via PIX
            </button>
          </div>
        </div>

        {/* Card 2: Invoice Summary (Fatura Consultório) */}
        <div className="bg-vitta-surface border border-vitta-border p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h4 className="text-xs font-bold text-vitta-text-primary uppercase tracking-wider">
                  Fatura de Consultório
                </h4>
                <p className="text-[10px] text-vitta-text-muted mt-0.5">
                  Taxas de atendimentos presenciais
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                  totalUnpaidFees > 0
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}
              >
                {totalUnpaidFees > 0 ? 'Fatura Aberta' : 'Em Dia'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-vitta-border/50">
              <div>
                <span className="text-[10px] text-vitta-text-muted uppercase font-bold tracking-widest block">
                  A Pagar
                </span>
                <span className="text-base font-bold text-vitta-text-primary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalUnpaidFees)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-vitta-text-muted uppercase font-bold tracking-widest block">
                  Taxas Liquidadas
                </span>
                <span className="text-base font-bold text-vitta-text-secondary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalPaidFees)}
                </span>
              </div>
            </div>
          </div>

          {setActiveTab && (
            <button
              onClick={() => setActiveTab('wallets')}
              className="w-full py-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>💳 Ver Detalhes na Carteira</span>
            </button>
          )}
        </div>

        {/* Card 3: Fee Rate Summary */}
        <div className="bg-vitta-surface border border-vitta-border p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Percent size={18} className="text-vitta-accent" />
              <h4 className="text-xs font-bold text-vitta-text-primary uppercase tracking-wider">
                Taxa de Intermediação ViTTA
              </h4>
            </div>
            <div className="text-3xl font-black text-vitta-text-primary pt-2">
              {professional?.feeRate !== undefined ? `${professional.feeRate}%` : '10%'}
            </div>
            <p className="text-[11px] text-vitta-text-secondary leading-relaxed">
              O split automático é liberado imediatamente na finalização da teleconsulta e repassado sem burocracia.
            </p>
          </div>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
            <ShieldCheck size={14} className="shrink-0" /> Repasses garantidos com PIX 24/7
          </div>
        </div>

      </div>

      {/* Main Financial Workspace Tabs */}
      <div className="bg-vitta-surface border border-vitta-border rounded-3xl shadow-sm overflow-hidden">
        
        {/* Navigation Bar */}
        <div className="p-6 border-b border-vitta-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex bg-vitta-surface-2 p-1 rounded-2xl border border-vitta-border">
            <button
              onClick={() => setActiveSubTab('statement')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === 'statement'
                  ? 'bg-vitta-accent text-white shadow-md'
                  : 'text-vitta-text-secondary hover:text-vitta-text-primary'
              }`}
            >
              <FileText size={14} /> Extrato Detalhado de Consultas
            </button>
            <button
              onClick={() => setActiveSubTab('transactions')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSubTab === 'transactions'
                  ? 'bg-vitta-accent text-white shadow-md'
                  : 'text-vitta-text-secondary hover:text-vitta-text-primary'
              }`}
            >
              <ArrowRightLeft size={14} /> Histórico Geral de Transações
            </button>
          </div>

          {activeSubTab === 'statement' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar paciente ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:border-vitta-accent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Extrato Detalhado de Consultas */}
        {activeSubTab === 'statement' && (
          <div className="p-6 space-y-6">
            
            {/* Statement Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-vitta-surface-2 border border-vitta-border p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider block">
                  Faturamento Bruto
                </span>
                <span className="text-xl font-bold text-vitta-text-primary mt-1 block">
                  R$ {totalGross.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="bg-vitta-surface-2 border border-vitta-border p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider block">
                  Taxas ViTTA Retidas
                </span>
                <span className="text-xl font-bold text-rose-500 mt-1 block">
                  - R$ {totalFees.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="bg-vitta-surface-2 border border-vitta-border p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider block">
                  Líquido Creditado
                </span>
                <span className="text-xl font-bold text-emerald-500 mt-1 block">
                  R$ {totalNet.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-vitta-border text-[10px] uppercase font-bold text-vitta-text-muted tracking-wider">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Paciente</th>
                    <th className="py-3 px-4 text-right">Valor Bruto</th>
                    <th className="py-3 px-4 text-right">Taxa ViTTA</th>
                    <th className="py-3 px-4 text-right">Líquido Creditado</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vitta-border/50 text-vitta-text-primary">
                  {filteredStatement.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-vitta-text-muted">
                        Nenhum atendimento liquidado registrado no período.
                      </td>
                    </tr>
                  ) : (
                    filteredStatement.map((item) => {
                      const gross = item.grossAmount || (item.amount + (item.feeCharged || 0));
                      const fee = item.feeCharged || 0;
                      const feeRatio = item.feeRatio !== undefined ? item.feeRatio : 10;
                      return (
                        <tr key={item.id} className="hover:bg-vitta-surface-2/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-vitta-text-secondary">
                            {item.date ? formatDateForDisplay(item.date) : 'Data recente'}
                          </td>
                          <td className="py-3.5 px-4 font-bold">
                            {item.patientName || item.title?.replace('Recebimento - Consulta de ', '') || 'Paciente ViTTA'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-vitta-text-secondary">
                            R$ {gross.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-3.5 px-4 text-right text-rose-400 font-medium">
                            - R$ {fee.toFixed(2).replace('.', ',')} ({feeRatio}%)
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-500">
                            R$ {item.amount.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              Creditado
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 2: Histórico Geral de Transações */}
        {activeSubTab === 'transactions' && (
          <div className="p-6 space-y-3">
            {loading ? (
              <p className="text-sm text-vitta-text-secondary">Carregando movimentações...</p>
            ) : transactions.length > 0 ? (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border hover:shadow-md transition-shadow gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        t.type === 'credit' ||
                        t.type === 'appointment_split' ||
                        t.type === 'refund' ||
                        (t.type === 'admin_adjustment' && t.amount > 0)
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : t.type === 'withdraw_request' && t.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : t.type === 'withdraw_request' && t.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {t.type === 'credit' || t.type === 'appointment_split' ? (
                        <ArrowDownRight size={18} />
                      ) : t.type === 'withdraw_request' && t.status === 'completed' ? (
                        <CheckCircle2 size={18} />
                      ) : t.type === 'withdraw_request' && t.status === 'pending' ? (
                        <Clock size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-vitta-text-primary">
                        {t.title || t.description}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-vitta-text-secondary mt-0.5">
                        <Calendar size={12} />
                        {new Date(t.date).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}

                        {t.status === 'pending' && (
                          <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                            Em análise
                          </span>
                        )}
                        {t.status === 'rejected' && (
                          <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full font-medium">
                            Recusado
                          </span>
                        )}
                        {t.status === 'completed' && (
                          <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                            Efetivado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <p
                      className={`font-bold text-sm ${
                        t.type === 'credit' ||
                        t.type === 'appointment_split' ||
                        t.type === 'refund' ||
                        (t.type === 'admin_adjustment' && t.amount > 0)
                          ? 'text-emerald-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {t.type === 'credit' ||
                      t.type === 'appointment_split' ||
                      t.type === 'refund' ||
                      (t.type === 'admin_adjustment' && t.amount > 0)
                        ? '+'
                        : '-'}{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Math.abs(t.amount))}
                    </p>

                    {/* Receipt button for completed withdrawals */}
                    {t.type === 'withdraw_request' && t.status === 'completed' && (
                      <button
                        onClick={() => {
                          setSelectedReceiptPayout(t);
                          setIsReceiptModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-vitta-accent/10 hover:bg-vitta-accent/20 text-vitta-accent rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download size={12} /> Comprovante
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-vitta-text-muted bg-vitta-surface-2 rounded-2xl border border-dashed border-vitta-border">
                <Receipt className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm">Nenhuma transação encontrada.</p>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
export default ProfessionalFinanceView;
