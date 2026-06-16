import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  orderBy,
  where,
  increment,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Wallet,
  Check,
  X,
  Landmark,
  Percent,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Users,
  DollarSign
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";

interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  pixKey: string;
  amount: number;
  feeRate: number;
  feeAmount: number;
  netAmount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface PartnerUser {
  id: string;
  name: string;
  email: string;
  role: "professional" | "conveniado";
  walletBalance?: number;
  feeRate?: number;
  pixKey?: string;
}

export const AdminWalletManagementView = () => {
  const { addToast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [loadingPartners, setLoadingPartners] = useState(true);

  // Quick action states
  const [editingFeePartnerId, setEditingFeePartnerId] = useState<string | null>(null);
  const [newFeeRate, setNewFeeRate] = useState<string>("");
  const [isCreditingPartnerId, setIsCreditingPartnerId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>("");

  // Totals calculations
  const [totalCustody, setTotalCustody] = useState(0);
  const [totalPlatformFees, setTotalPlatformFees] = useState(0);

  // Fetch withdrawals requests
  useEffect(() => {
    const q = query(collection(db, "withdrawals"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Withdrawal[];
        setWithdrawals(list);
        setLoadingWithdrawals(false);

        // Calculate earned fees from approved withdrawals
        const approvedFees = list
          .filter((w) => w.status === "approved")
          .reduce((sum, w) => sum + (w.feeAmount || 0), 0);
        setTotalPlatformFees(approvedFees);
      },
      (error) => {
        console.error("Erro ao escutar solicitações de saques:", error);
        setLoadingWithdrawals(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch partners (Professional & Conveniado)
  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "in", ["professional", "conveniado"])
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "Parceiro sem nome",
          email: doc.data().email || "",
          role: doc.data().role,
          walletBalance: doc.data().walletBalance || 0,
          feeRate: doc.data().feeRate || 0,
          pixKey: doc.data().pixKey || ""
        })) as PartnerUser[];
        setPartners(list);
        setLoadingPartners(false);

        // Balance held in custody
        const sumCustody = list.reduce((sum, p) => sum + (p.walletBalance || 0), 0);
        setTotalCustody(sumCustody);
      },
      (error) => {
        console.error("Erro ao escutar usuários parceiros:", error);
        setLoadingPartners(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Approve a withdrawal request (informative control)
  const handleApproveWithdrawal = async (w: Withdrawal) => {
    try {
      // Mark withdrawal as approved
      await updateDoc(doc(db, "withdrawals", w.id), {
        status: "approved"
      });

      // Also create a final transaction log in professional's ledger representing completion
      await addDoc(collection(db, "transactions"), {
        userId: w.userId,
        type: "debit",
        amount: w.amount,
        title: `Saque Concluído (PIX) - Desconto Taxa ${w.feeRate}%`,
        category: "Saque",
        date: new Date().toISOString()
      });

      addToast(`Saque de ${w.userName} aprovado. Chave PIX: ${w.pixKey}`, "success");
    } catch (error) {
      console.error("Erro ao aprovar saque:", error);
      addToast("Erro ao processar aprovação de saque.", "error");
    }
  };

  // Reject a withdrawal request (refunds the balance to professional)
  const handleRejectWithdrawal = async (w: Withdrawal) => {
    try {
      // 1. Return the amount to partner's walletBalance
      await updateDoc(doc(db, "users", w.userId), {
        walletBalance: increment(w.amount)
      });

      // 2. Mark withdrawal as rejected
      await updateDoc(doc(db, "withdrawals", w.id), {
        status: "rejected"
      });

      // 3. Log a refund credit transaction in their ledger
      await addDoc(collection(db, "transactions"), {
        userId: w.userId,
        type: "credit",
        amount: w.amount,
        title: "Saque Recusado - Saldo Estornado",
        category: "Estorno",
        date: new Date().toISOString()
      });

      addToast(`Saque de ${w.userName} recusado. Saldo estornado para a carteira.`, "info");
    } catch (error) {
      console.error("Erro ao recusar saque:", error);
      addToast("Erro ao recusar solicitação de saque.", "error");
    }
  };

  // Save updated feeRate (%)
  const handleSaveFee = async (userId: string) => {
    const rate = parseFloat(newFeeRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      addToast("Taxa Fee inválida. Insira um número de 0 a 100.", "error");
      return;
    }

    try {
      await updateDoc(doc(db, "users", userId), {
        feeRate: rate
      });
      addToast("Taxa Fee atualizada com sucesso!", "success");
      setEditingFeePartnerId(null);
      setNewFeeRate("");
    } catch (error) {
      console.error("Erro ao atualizar taxa fee:", error);
      addToast("Falha ao salvar taxa Fee.", "error");
    }
  };

  // Credit receiving amount manually (informative test transaction with automated fee deduction)
  const handleCreditAmount = async (partner: PartnerUser) => {
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      addToast("Valor inválido para o lançamento.", "error");
      return;
    }

    const feePct = partner.feeRate || 0;
    const feeAmount = (amount * feePct) / 100;
    const netCredit = amount; // Net in-wallet for partner is the complete amount, or they keep the custody from the client buy

    try {
      // Credit partner's balance
      await updateDoc(doc(db, "users", partner.id), {
        walletBalance: increment(netCredit)
      });

      // Log transaction
      await addDoc(collection(db, "transactions"), {
        userId: partner.id,
        type: "credit",
        amount: netCredit,
        title: "Recebimento de Consulta / Serviço",
        category: "Rendimento",
        date: new Date().toISOString()
      });

      addToast(`Lançamento efetuado! Creditado R$ ${amount.toFixed(2)} para ${partner.name}.`, "success");
      setIsCreditingPartnerId(null);
      setCreditAmount("");
    } catch (error) {
      console.error("Erro ao lançar recebimento:", error);
      addToast("Erro ao processar lançamento.", "error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Cards de Métricas e Master Wallet Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Master Custody Wallet */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-vitta-purple p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/10 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
            <Landmark size={140} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Landmark size={20} />
            </div>
            <div>
              <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Carteira Master (Custódia / Comodato)</p>
              <h3 className="text-3xl font-black mt-1">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalCustody)}
              </h3>
              <p className="text-[10px] text-indigo-200 mt-2">
                Soma total dos saldos ativos sob custódia temporária aguardando saque.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Earned Platform Fees */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden">
          <div className="absolute right-2 bottom-2 opacity-10">
            <Percent size={120} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider font-bold">Taxas Fee Acumuladas</p>
              <h3 className="text-3xl font-black mt-1">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPlatformFees)}
              </h3>
              <p className="text-[10px] text-emerald-100 mt-2">
                Faturamento retido de taxas administrativas de transações de saques executados.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Partners Managed */}
        <div className="bg-gradient-to-br from-vitta-accent to-blue-700 p-6 rounded-3xl text-white shadow-lg shadow-vitta-accent/15 relative overflow-hidden">
          <div className="absolute right-2 bottom-2 opacity-10">
            <Users size={120} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Conveniais & Profissionais</p>
              <h3 className="text-3xl font-black mt-1">
                {partners.length} Parceiros
              </h3>
              <p className="text-[10px] text-blue-200 mt-2">
                Total de credenciados habilitados para faturamento de taxas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Solicitações de Saques */}
      <div className="bg-vitta-surface rounded-3xl border border-vitta-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-vitta-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-vitta-text-primary">Solicitações de Resgate (PIX)</h3>
            <p className="text-xs text-vitta-text-secondary">Controle administrativo e aprovação informativa de saques</p>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-extrabold uppercase rounded-full">
            Controle Informativo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-vitta-surface-2 text-vitta-text-muted text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Profissional / Tipo</th>
                <th className="px-6 py-4">Valor Bruto</th>
                <th className="px-6 py-4">Taxa Fee (%)</th>
                <th className="px-6 py-4">Valor Líquido</th>
                <th className="px-6 py-4">Chave PIX Cadastrada</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {loadingWithdrawals ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-vitta-text-secondary">
                    Carregando solicitações de saques...
                  </td>
                </tr>
              ) : withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-vitta-text-secondary italic">
                    Nenhuma solicitação de saque identificada.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-vitta-surface-2 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-vitta-text-secondary">
                      {new Date(w.createdAt).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-vitta-text-primary text-xs">{w.userName}</div>
                      <div className="text-[10px] text-vitta-text-secondary uppercase">
                        {w.userRole === "professional" ? "Profissional" : "Conveniado"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-vitta-text-secondary">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(w.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-vitta-text-muted">
                      {w.feeRate || 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-emerald-600">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(w.netAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-vitta-text-primary font-bold">
                      {w.pixKey || <span className="text-vitta-danger text-[10px] uppercase">Sem Chave</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full ${
                        w.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500"
                          : w.status === "approved"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                      }`}>
                        {w.status === "pending" ? "Pendente" : w.status === "approved" ? "Pago (PIX)" : "Recusado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {w.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApproveWithdrawal(w)}
                            title="Confirmar Transferência Efetuada"
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(w)}
                            title="Recusar e Estornar Saldo"
                            className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-vitta-text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relação de Carteiras e Taxas dos Credenciados */}
      <div className="bg-vitta-surface rounded-3xl border border-vitta-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-vitta-border">
          <h3 className="text-lg font-bold text-vitta-text-primary">Carteiras de Profissionais e Conveniados</h3>
          <p className="text-xs text-vitta-text-secondary">Configure e realize ajustes manuais das taxas no perfil</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-vitta-surface-2 text-vitta-text-muted text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Saldo da Carteira</th>
                <th className="px-6 py-4">Taxa Fee (%)</th>
                <th className="px-6 py-4">Chave PIX</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {loadingPartners ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-vitta-text-secondary">
                    Carregando parceiros credenciados...
                  </td>
                </tr>
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-vitta-text-secondary italic">
                    Nenhum credenciado conveniado ou profissional encontrado.
                  </td>
                </tr>
              ) : (
                partners.map((p) => (
                  <tr key={p.id} className="hover:bg-vitta-surface-2 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-vitta-text-primary text-xs">{p.name}</div>
                      <div className="text-[10px] text-vitta-text-secondary">{p.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full ${
                        p.role === "professional"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      }`}>
                        {p.role === "professional" ? "Profissional" : "Conveniado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-vitta-text-primary">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.walletBalance || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingFeePartnerId === p.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={newFeeRate}
                            onChange={(e) => setNewFeeRate(e.target.value)}
                            className="w-16 px-2 py-1 bg-vitta-surface border rounded text-xs text-vitta-text-primary"
                          />
                          <button
                            onClick={() => handleSaveFee(p.id)}
                            className="p-1 bg-emerald-600 rounded text-white"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setEditingFeePartnerId(null)}
                            className="p-1 bg-rose-600 rounded text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-vitta-accent">{p.feeRate || 0}%</span>
                          <button
                            onClick={() => {
                              setEditingFeePartnerId(p.id);
                              setNewFeeRate(String(p.feeRate || 0));
                            }}
                            className="text-[10px] text-vitta-text-muted hover:text-vitta-text-primary border border-vitta-border rounded px-1.5 py-0.5"
                          >
                            Editar
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-vitta-text-secondary font-bold">
                      {p.pixKey || <span className="text-vitta-danger text-[10px] uppercase">Não Cadastrada</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isCreditingPartnerId === p.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Valor"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            className="w-20 px-2 py-1 bg-vitta-surface border rounded text-xs text-vitta-text-primary"
                          />
                          <button
                            onClick={() => handleCreditAmount(p)}
                            className="px-2.5 py-1 bg-emerald-600 rounded text-white text-xs font-bold"
                          >
                            Lançar
                          </button>
                          <button
                            onClick={() => setIsCreditingPartnerId(null)}
                            className="p-1 bg-rose-600 rounded text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setIsCreditingPartnerId(p.id);
                            setCreditAmount("");
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-vitta-accent hover:bg-vitta-accent/90 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-vitta-accent/10 ml-auto"
                        >
                          <ArrowUpRight size={12} />
                          Lançar Recebimento
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
