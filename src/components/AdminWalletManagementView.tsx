import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  orderBy,
  where,
  increment,
  getDocs,
  Timestamp
} from "firebase/firestore";
import { addDoc, updateDoc } from "../lib/firestore-wrappers";
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
  DollarSign,
  Lock,
  Unlock,
  History,
  FileText,
  ShieldAlert,
  ArrowDownLeft,
  Search
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { logAdminAction, recordAuditLog } from "../lib/audit";
import { motion, AnimatePresence } from "motion/react";

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
  liquidationCode?: string;
}

interface PartnerUser {
  id: string;
  name: string;
  email: string;
  role: "professional" | "conveniado";
  walletBalance?: number;
  feeRate?: number;
  pixKey?: string;
  isWalletFrozen?: boolean;
  walletFrozenReason?: string;
}

interface UserTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  grossAmount?: number;
  feeAmount?: number;
  netAmount?: number;
  title: string;
  category?: string;
  date?: string;
  createdAt?: any;
  status?: string;
  liquidationCode?: string;
}

export const AdminWalletManagementView = () => {
  const { addToast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [approvingWithdrawal, setApprovingWithdrawal] = useState<Withdrawal | null>(null);
  const [liquidationCode, setLiquidationCode] = useState("");
  const [liquidationNotes, setLiquidationNotes] = useState("");
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Manual Adjustment Modal
  const [adjustingPartner, setAdjustingPartner] = useState<PartnerUser | null>(null);
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustJustification, setAdjustJustification] = useState("");
  const [isProcessingAdjust, setIsProcessingAdjust] = useState(false);

  // Fee Editing
  const [editingFeePartnerId, setEditingFeePartnerId] = useState<string | null>(null);
  const [newFeeRate, setNewFeeRate] = useState<string>("");

  // Drawer User History
  const [historyPartner, setHistoryPartner] = useState<PartnerUser | null>(null);
  const [userHistory, setUserHistory] = useState<UserTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Freeze Confirmation Modal
  const [freezingPartner, setFreezingPartner] = useState<PartnerUser | null>(null);
  const [freezeReason, setFreezeReason] = useState("");

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
          pixKey: doc.data().pixKey || "",
          isWalletFrozen: !!doc.data().isWalletFrozen,
          walletFrozenReason: doc.data().walletFrozenReason || ""
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

  // Open User History Drawer
  const handleOpenHistory = async (partner: PartnerUser) => {
    setHistoryPartner(partner);
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, "transactions"),
        where("userId", "==", partner.id)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as UserTransaction[];
      // Sort in memory by date descending
      list.sort((a, b) => {
        const dateA = a.date || (a.createdAt?.toDate ? a.createdAt.toDate().toISOString() : "") || "";
        const dateB = b.date || (b.createdAt?.toDate ? b.createdAt.toDate().toISOString() : "") || "";
        return dateB.localeCompare(dateA);
      });
      setUserHistory(list);
    } catch (err) {
      console.error("Erro ao carregar extrato:", err);
      addToast("Erro ao carregar histórico de transações.", "error");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Confirm Pix Approval with Liquidation Code
  const handleConfirmApproval = async () => {
    if (!approvingWithdrawal) return;
    if (!liquidationCode.trim()) {
      addToast("Por favor, insira o código de liquidação bancária / comprovante PIX.", "error");
      return;
    }

    setIsProcessingApproval(true);
    const w = approvingWithdrawal;
    try {
      // 1. Update withdrawal doc
      await updateDoc(doc(db, "withdrawals", w.id), {
        status: "approved",
        liquidationCode: liquidationCode.trim(),
        liquidationNotes: liquidationNotes.trim(),
        processedAt: new Date().toISOString()
      });

      // 2. Add transaction record
      await addDoc(collection(db, "transactions"), {
        userId: w.userId,
        type: "payout_request",
        amount: w.amount,
        grossAmount: w.amount,
        feeRate: w.feeRate,
        feeAmount: w.feeAmount,
        netAmount: w.netAmount,
        title: `Saque PIX Liquidado (${liquidationCode.trim()})`,
        category: "Saque",
        status: "completed",
        liquidationCode: liquidationCode.trim(),
        date: new Date().toISOString()
      });

      // 3. Send in-app notification to the professional
      await addDoc(collection(db, "notifications"), {
        userId: w.userId,
        title: "Saque PIX Concluído",
        message: `Seu saque no valor líquido de R$ ${w.netAmount.toFixed(2)} foi creditado via PIX. Código de autenticação: ${liquidationCode.trim()}`,
        type: "financial",
        read: false,
        createdAt: Timestamp.now()
      });

      // 4. Record audit log
      await logAdminAction(
        "APPROVE_WITHDRAWAL",
        `Aprovou saque PIX de R$ ${w.amount.toFixed(2)} para ${w.userName} (Líquido: R$ ${w.netAmount.toFixed(2)}). Cód. Liquidação: ${liquidationCode.trim()}`,
        { withdrawalId: w.id, userId: w.userId, amount: w.amount, liquidationCode: liquidationCode.trim() }
      );

      addToast(`Saque de ${w.userName} aprovado com sucesso! Cód: ${liquidationCode.trim()}`, "success");
      setApprovingWithdrawal(null);
      setLiquidationCode("");
      setLiquidationNotes("");
    } catch (error) {
      console.error("Erro ao aprovar saque:", error);
      addToast("Erro ao processar liquidação do saque.", "error");
    } finally {
      setIsProcessingApproval(false);
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
        status: "rejected",
        rejectedAt: new Date().toISOString()
      });

      // 3. Log a refund credit transaction in their ledger
      await addDoc(collection(db, "transactions"), {
        userId: w.userId,
        type: "appointment_refund",
        amount: w.amount,
        title: "Saque Recusado - Saldo Estornado",
        category: "Estorno",
        date: new Date().toISOString()
      });

      // 4. Send notification
      await addDoc(collection(db, "notifications"), {
        userId: w.userId,
        title: "Solicitação de Saque Recusada",
        message: `Sua solicitação de saque de R$ ${w.amount.toFixed(2)} foi recusada e o saldo foi estornado para sua carteira.`,
        type: "financial",
        read: false,
        createdAt: Timestamp.now()
      });

      // 5. Audit log
      await logAdminAction(
        "REJECT_WITHDRAWAL",
        `Recusou saque PIX de R$ ${w.amount.toFixed(2)} para ${w.userName}. Saldo estornado.`,
        { withdrawalId: w.id, userId: w.userId, amount: w.amount }
      );

      addToast(`Saque de ${w.userName} recusado. Saldo estornado para a carteira.`, "info");
    } catch (error) {
      console.error("Erro ao recusar saque:", error);
      addToast("Erro ao recusar solicitação de saque.", "error");
    }
  };

  // Process Manual Balance Adjustment with mandatory justification
  const handleExecuteAdjustment = async () => {
    if (!adjustingPartner) return;
    const amountVal = parseFloat(adjustAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      addToast("Informe um valor numérico válido maior que zero.", "error");
      return;
    }
    if (!adjustJustification.trim()) {
      addToast("A justificativa é obrigatória para qualquer ajuste de saldo.", "error");
      return;
    }

    setIsProcessingAdjust(true);
    try {
      const partnerRef = doc(db, "users", adjustingPartner.id);
      const delta = adjustType === "credit" ? amountVal : -amountVal;
      const prevBal = adjustingPartner.walletBalance || 0;
      const newBal = prevBal + delta;

      if (adjustType === "debit" && prevBal < amountVal) {
        addToast("Aviso: O débito resultará em saldo negativo ou excede o saldo atual.", "info");
      }

      await updateDoc(partnerRef, {
        walletBalance: increment(delta)
      });

      // Add transaction entry
      await addDoc(collection(db, "transactions"), {
        userId: adjustingPartner.id,
        type: "manual_adjustment",
        amount: amountVal,
        delta: delta,
        title: `Ajuste Administrativo (${adjustType === "credit" ? "Crédito" : "Débito"}): ${adjustJustification.trim()}`,
        category: "Ajuste Manual",
        justification: adjustJustification.trim(),
        status: "completed",
        date: new Date().toISOString()
      });

      // Record in audit log with before/after and strict justification
      await recordAuditLog({
        action: "MANUAL_BALANCE_ADJUSTMENT",
        description: `Ajuste de Saldo (${adjustType === "credit" ? "+R$" : "-R$"}${amountVal.toFixed(2)}) para ${adjustingPartner.name}. Motivo: ${adjustJustification.trim()}`,
        before: { walletBalance: prevBal },
        after: { walletBalance: newBal, justification: adjustJustification.trim() }
      });

      // Send notification
      await addDoc(collection(db, "notifications"), {
        userId: adjustingPartner.id,
        title: "Ajuste de Saldo em Carteira",
        message: `Foi realizado um ${adjustType === "credit" ? "crédito" : "débito"} de R$ ${amountVal.toFixed(2)} na sua carteira. Motivo: ${adjustJustification.trim()}`,
        type: "financial",
        read: false,
        createdAt: Timestamp.now()
      });

      addToast(`Ajuste de R$ ${amountVal.toFixed(2)} processado com sucesso!`, "success");
      setAdjustingPartner(null);
      setAdjustAmount("");
      setAdjustJustification("");
    } catch (err) {
      console.error("Erro ao realizar ajuste de saldo:", err);
      addToast("Erro ao processar ajuste de saldo.", "error");
    } finally {
      setIsProcessingAdjust(false);
    }
  };

  // Toggle Preventive Wallet Freeze
  const handleToggleFreeze = async (partner: PartnerUser) => {
    const willFreeze = !partner.isWalletFrozen;
    try {
      await updateDoc(doc(db, "users", partner.id), {
        isWalletFrozen: willFreeze,
        walletFrozenReason: willFreeze ? (freezeReason.trim() || "Bloqueio preventivo administrativo") : "",
        walletFrozenAt: willFreeze ? new Date().toISOString() : null
      });

      await logAdminAction(
        willFreeze ? "FREEZE_WALLET" : "UNFREEZE_WALLET",
        `${willFreeze ? "Congelou" : "Descongelou"} preventivamente a carteira de ${partner.name}.${willFreeze ? ` Motivo: ${freezeReason.trim() || "Sem motivo informado"}` : ""}`,
        { userId: partner.id, willFreeze, reason: freezeReason.trim() }
      );

      // Notification
      await addDoc(collection(db, "notifications"), {
        userId: partner.id,
        title: willFreeze ? "Carteira Bloqueada Preventivamente" : "Carteira Desbloqueada",
        message: willFreeze
          ? `Sua carteira ViTTA foi temporariamente congelada. Motivo: ${freezeReason.trim() || "Verificação preventiva"}. Entre em contato com o suporte.`
          : "Sua carteira ViTTA foi reativada com sucesso para movimentações.",
        type: "system",
        read: false,
        createdAt: Timestamp.now()
      });

      addToast(
        willFreeze
          ? `Carteira de ${partner.name} foi congelada.`
          : `Carteira de ${partner.name} foi desbloqueada.`,
        willFreeze ? "info" : "success"
      );
      setFreezingPartner(null);
      setFreezeReason("");
    } catch (err) {
      console.error("Erro ao alterar status de congelamento:", err);
      addToast("Erro ao atualizar status da carteira.", "error");
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
      await logAdminAction("UPDATE_FEE_RATE", `Atualizou taxa fee para ${rate}% do credenciado ${userId}`);
      addToast("Taxa Fee atualizada com sucesso!", "success");
      setEditingFeePartnerId(null);
      setNewFeeRate("");
    } catch (error) {
      console.error("Erro ao atualizar taxa fee:", error);
      addToast("Falha ao salvar taxa Fee.", "error");
    }
  };

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.pixKey && p.pixKey.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Conveniados & Profissionais</p>
              <h3 className="text-3xl font-black mt-1">
                {partners.length} Parceiros
              </h3>
              <p className="text-[10px] text-blue-200 mt-2">
                Total de credenciados habilitados para faturamento e gestão de carteiras.
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
            <p className="text-xs text-vitta-text-secondary">Controle administrativo e liquidação oficial de saques com split discriminado</p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold uppercase rounded-full">
            Liquidação Bancária
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-vitta-surface-2 text-vitta-text-muted text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Data / Hora</th>
                <th className="px-6 py-4">Profissional / Tipo</th>
                <th className="px-6 py-4">Valor Bruto</th>
                <th className="px-6 py-4">Taxa ViTTA (Split)</th>
                <th className="px-6 py-4">Valor Líquido</th>
                <th className="px-6 py-4">Chave PIX</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className="text-rose-500 font-bold">
                        - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(w.feeAmount || 0)}
                      </span>
                      <span className="text-[10px] text-vitta-text-muted ml-1 font-semibold">({w.feeRate || 0}%)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-emerald-600 text-sm">
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
                        {w.status === "pending" ? "Pendente" : w.status === "approved" ? "Liquidado (PIX)" : "Recusado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {w.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setApprovingWithdrawal(w);
                              setLiquidationCode(`PIX-${Date.now().toString().slice(-8)}`);
                            }}
                            title="Aprovar e Liquidar Saque PIX"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <Check size={14} />
                            Liquidar
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(w)}
                            title="Recusar e Estornar Saldo"
                            className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-vitta-text-muted">
                          {w.liquidationCode ? (
                            <span className="font-mono text-[10px] bg-vitta-surface-2 px-2 py-0.5 rounded border border-vitta-border" title="Código de Liquidação">
                              {w.liquidationCode}
                            </span>
                          ) : "-"}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relação de Carteiras e Credenciados com Congelamento e Ajustes */}
      <div className="bg-vitta-surface rounded-3xl border border-vitta-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-vitta-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-vitta-text-primary">Carteiras de Profissionais e Conveniados</h3>
            <p className="text-xs text-vitta-text-secondary">Ajustes manuais auditados, congelamento preventivo e taxas personalizadas</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
            <input
              type="text"
              placeholder="Buscar parceiro ou PIX..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-vitta-surface-2 text-vitta-text-muted text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Credenciado</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Status da Carteira</th>
                <th className="px-6 py-4">Saldo Atual</th>
                <th className="px-6 py-4">Taxa Fee (%)</th>
                <th className="px-6 py-4">Chave PIX</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {loadingPartners ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-vitta-text-secondary">
                    Carregando parceiros credenciados...
                  </td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-vitta-text-secondary italic">
                    Nenhum credenciado encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((p) => (
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.isWalletFrozen ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                          <Lock size={10} />
                          Congelada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          <Unlock size={10} />
                          Ativa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-vitta-text-primary text-sm">
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
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Extrato / Histórico */}
                        <button
                          onClick={() => handleOpenHistory(p)}
                          title="Ver Extrato de Transações"
                          className="p-2 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-secondary rounded-xl transition-all"
                        >
                          <History size={14} />
                        </button>

                        {/* Ajuste Manual de Saldo */}
                        <button
                          onClick={() => {
                            setAdjustingPartner(p);
                            setAdjustType("credit");
                            setAdjustAmount("");
                            setAdjustJustification("");
                          }}
                          title="Ajuste Manual de Saldo (Auditado)"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          <DollarSign size={13} />
                          Ajustar
                        </button>

                        {/* Toggle Congelar Carteira */}
                        <button
                          onClick={() => {
                            setFreezingPartner(p);
                            setFreezeReason(p.walletFrozenReason || "");
                          }}
                          title={p.isWalletFrozen ? "Descongelar Carteira" : "Congelar Carteira Preventivamente"}
                          className={`p-2 rounded-xl transition-all ${
                            p.isWalletFrozen
                              ? "bg-rose-500 hover:bg-rose-600 text-white"
                              : "bg-vitta-surface-2 hover:bg-rose-500/10 text-vitta-text-muted hover:text-rose-500"
                          }`}
                        >
                          {p.isWalletFrozen ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Liquidação de Saque PIX */}
      <AnimatePresence>
        {approvingWithdrawal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-lg rounded-3xl border border-vitta-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-emerald-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-vitta-text-primary">Liquidação de Saque PIX</h3>
                    <p className="text-xs text-vitta-text-secondary">Confirme os dados e insira o código de liquidação bancária</p>
                  </div>
                </div>
                <button
                  onClick={() => setApprovingWithdrawal(null)}
                  className="p-2 text-vitta-text-muted hover:bg-vitta-surface-2 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border">
                  <div>
                    <span className="text-vitta-text-muted block text-[10px] uppercase font-bold">Favorecido</span>
                    <span className="font-bold text-vitta-text-primary text-sm">{approvingWithdrawal.userName}</span>
                  </div>
                  <div>
                    <span className="text-vitta-text-muted block text-[10px] uppercase font-bold">Chave PIX</span>
                    <span className="font-mono font-bold text-vitta-accent text-xs">{approvingWithdrawal.pixKey}</span>
                  </div>
                  <div>
                    <span className="text-vitta-text-muted block text-[10px] uppercase font-bold">Valor Bruto</span>
                    <span className="font-semibold text-vitta-text-secondary">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(approvingWithdrawal.amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-vitta-text-muted block text-[10px] uppercase font-bold">Valor Líquido (A Transferir)</span>
                    <span className="font-extrabold text-emerald-600 text-sm">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(approvingWithdrawal.netAmount)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-vitta-text-primary uppercase mb-1">
                    Código de Liquidação Bancária / EndToEndId (PIX) *
                  </label>
                  <input
                    type="text"
                    required
                    value={liquidationCode}
                    onChange={(e) => setLiquidationCode(e.target.value)}
                    placeholder="Ex: E1234567820260831123456789 ou Cód. Comprovante"
                    className="w-full px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl font-mono text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-vitta-text-muted mt-1">Este código será gravado no comprovante e enviado ao profissional.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-vitta-text-primary uppercase mb-1">
                    Observações Internas (Opcional)
                  </label>
                  <input
                    type="text"
                    value={liquidationNotes}
                    onChange={(e) => setLiquidationNotes(e.target.value)}
                    placeholder="Ex: Liquidado via Banco Inter / Itaú Empresas"
                    className="w-full px-4 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-vitta-surface-2 border-t border-vitta-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setApprovingWithdrawal(null)}
                  className="px-4 py-2 text-vitta-text-secondary hover:bg-vitta-border rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isProcessingApproval}
                  onClick={handleConfirmApproval}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isProcessingApproval ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Confirmar Liquidação
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Ajuste Manual de Saldo com Justificativa Obrigatória */}
      <AnimatePresence>
        {adjustingPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-3xl border border-vitta-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-indigo-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-vitta-text-primary">Ajuste de Saldo em Carteira</h3>
                    <p className="text-xs text-vitta-text-secondary">Registro com auditoria rigorosa</p>
                  </div>
                </div>
                <button
                  onClick={() => setAdjustingPartner(null)}
                  className="p-2 text-vitta-text-muted hover:bg-vitta-surface-2 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-vitta-surface-2 rounded-2xl border border-vitta-border">
                  <span className="text-vitta-text-muted block text-[10px] uppercase font-bold">Credenciado</span>
                  <span className="font-bold text-vitta-text-primary text-sm">{adjustingPartner.name}</span>
                  <span className="text-[10px] text-vitta-text-muted block mt-1">
                    Saldo atual: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(adjustingPartner.walletBalance || 0)}
                  </span>
                </div>

                {/* Type toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("credit")}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      adjustType === "credit"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                        : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"
                    }`}
                  >
                    <ArrowDownLeft size={14} />
                    Crédito (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("debit")}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      adjustType === "debit"
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                        : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"
                    }`}
                  >
                    <ArrowUpRight size={14} />
                    Débito (-)
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-vitta-text-primary uppercase mb-1">
                    Valor do Ajuste (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm font-bold text-vitta-text-primary outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-vitta-text-primary uppercase mb-1">
                    Justificativa / Motivo da Operação *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={adjustJustification}
                    onChange={(e) => setAdjustJustification(e.target.value)}
                    placeholder="Ex: Correção de repasse duplicado / Bonificação promocional aprovada pela diretoria"
                    className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-vitta-danger font-semibold mt-1">
                    * Campo obrigatório. Ficará registrado permanentemente no rastro de auditoria.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-vitta-surface-2 border-t border-vitta-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingPartner(null)}
                  className="px-4 py-2 text-vitta-text-secondary hover:bg-vitta-border rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isProcessingAdjust}
                  onClick={handleExecuteAdjustment}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isProcessingAdjust ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Salvar Ajuste
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Congelamento Preventivo de Carteira */}
      <AnimatePresence>
        {freezingPartner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-3xl border border-vitta-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-rose-500/5">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${freezingPartner.isWalletFrozen ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-vitta-text-primary">
                      {freezingPartner.isWalletFrozen ? "Descongelar Carteira" : "Congelar Carteira Preventivamente"}
                    </h3>
                    <p className="text-xs text-vitta-text-secondary">{freezingPartner.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setFreezingPartner(null)}
                  className="p-2 text-vitta-text-muted hover:bg-vitta-surface-2 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-vitta-text-secondary leading-relaxed">
                  {freezingPartner.isWalletFrozen
                    ? "Ao descongelar, o usuário voltará a ter permissão para receber repasses e solicitar saques normalmente."
                    : "Ao congelar a carteira, todas as operações de débito, crédito e solicitações de resgate ficarão bloqueadas para este parceiro até uma liberação administrativa."}
                </p>

                {!freezingPartner.isWalletFrozen && (
                  <div>
                    <label className="block text-[11px] font-bold text-vitta-text-primary uppercase mb-1">
                      Motivo do Bloqueio Preventivo
                    </label>
                    <input
                      type="text"
                      value={freezeReason}
                      onChange={(e) => setFreezeReason(e.target.value)}
                      placeholder="Ex: Suspeita de fraude / Divergência cadastral"
                      className="w-full px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-vitta-surface-2 border-t border-vitta-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFreezingPartner(null)}
                  className="px-4 py-2 text-vitta-text-secondary hover:bg-vitta-border rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleFreeze(freezingPartner)}
                  className={`px-6 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                    freezingPartner.isWalletFrozen
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                      : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                  }`}
                >
                  {freezingPartner.isWalletFrozen ? <Unlock size={14} /> : <Lock size={14} />}
                  {freezingPartner.isWalletFrozen ? "Desbloquear Carteira" : "Confirmar Congelamento"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drawer Lateral: Histórico e Extrato de Transações do Usuário */}
      <AnimatePresence>
        {historyPartner && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-vitta-surface w-full max-w-xl h-full shadow-2xl border-l border-vitta-border flex flex-col"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-vitta-accent/10 text-vitta-accent rounded-2xl">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-vitta-text-primary">Extrato de Transações</h3>
                    <p className="text-xs text-vitta-text-secondary">{historyPartner.name} • {historyPartner.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryPartner(null)}
                  className="p-2 text-vitta-text-muted hover:bg-vitta-surface-2 rounded-xl"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 bg-vitta-accent/5 border-b border-vitta-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-vitta-text-muted">Saldo em Custódia</span>
                  <p className="text-xl font-extrabold text-vitta-text-primary">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(historyPartner.walletBalance || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-vitta-text-muted">Taxa Fee</span>
                  <p className="text-sm font-bold text-vitta-accent">{historyPartner.feeRate || 0}%</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {loadingHistory ? (
                  <div className="py-20 text-center">
                    <RefreshCw size={24} className="animate-spin text-vitta-accent mx-auto mb-2" />
                    <p className="text-xs text-vitta-text-secondary">Carregando extrato...</p>
                  </div>
                ) : userHistory.length === 0 ? (
                  <div className="py-20 text-center text-vitta-text-muted italic text-xs">
                    Nenhuma transação financeira registrada para este credenciado.
                  </div>
                ) : (
                  userHistory.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border space-y-2 hover:border-vitta-accent/30 transition-all text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-vitta-text-primary block">{tx.title}</span>
                          <span className="text-[10px] text-vitta-text-muted">
                            {tx.date ? new Date(tx.date).toLocaleString("pt-BR") : "Data não informada"}
                          </span>
                        </div>
                        <span className={`font-extrabold text-sm ${
                          tx.type === "credit" || tx.type === "appointment_split" || tx.type === "deposit"
                            ? "text-emerald-600"
                            : "text-rose-500"
                        }`}>
                          {tx.type === "credit" || tx.type === "appointment_split" || tx.type === "deposit" ? "+" : "-"}
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tx.amount || 0)}
                        </span>
                      </div>

                      {/* Discriminador de split se houver */}
                      {(tx.grossAmount !== undefined || tx.feeAmount !== undefined) && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-vitta-border text-[10px] text-vitta-text-muted">
                          <div>
                            <span>Bruto: </span>
                            <span className="font-semibold text-vitta-text-secondary">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tx.grossAmount || tx.amount || 0)}
                            </span>
                          </div>
                          <div>
                            <span>Taxa ViTTA: </span>
                            <span className="font-semibold text-rose-500">
                              - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tx.feeAmount || 0)}
                            </span>
                          </div>
                          <div>
                            <span>Líquido: </span>
                            <span className="font-semibold text-emerald-600">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(tx.netAmount || tx.amount || 0)}
                            </span>
                          </div>
                        </div>
                      )}

                      {tx.liquidationCode && (
                        <div className="text-[10px] font-mono bg-vitta-surface px-2 py-1 rounded border border-vitta-border text-vitta-text-secondary">
                          Cód. Liquidação: {tx.liquidationCode}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-vitta-surface-2 border-t border-vitta-border flex justify-end">
                <button
                  onClick={() => setHistoryPartner(null)}
                  className="px-6 py-2 bg-vitta-text-primary text-white rounded-xl text-xs font-bold"
                >
                  Fechar Extrato
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
