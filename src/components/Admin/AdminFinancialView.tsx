import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  orderBy,
  limit,
  increment,
  getDocFromCache,
  getDocFromServer,
  getDocs,
  Timestamp,
  setDoc
} from "firebase/firestore";
import { addDoc, updateDoc } from "../../lib/firestore-wrappers";
import { db } from "../../firebase";
import {
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  FileText,
  Filter,
  ShieldCheck,
  Building2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Receipt,
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  Wallet
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { logAdminAction } from "../../lib/audit";
import { motion, AnimatePresence } from "motion/react";

interface PayoutItem {
  id: string;
  source: "transactions" | "withdrawals";
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  amount: number;
  grossAmount?: number;
  feeRate?: number;
  feeAmount?: number;
  netAmount: number;
  pixKey?: string;
  pixType?: string;
  authCode?: string;
  description?: string;
  status: "pending" | "completed" | "approved" | "rejected";
  date: string;
  createdAt?: any;
  processedAt?: string;
  handledBy?: string;
  handledAt?: string;
  liquidationCode?: string;
  liquidationNotes?: string;
  rejectionReason?: string;
}

export const AdminFinancialView = ({ adminUser }: { adminUser: any }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [users, setUsers] = useState<{ [key: string]: { name: string; email: string; role?: string } }>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending_payouts" | "processed_payouts" | "all_transactions">("pending_payouts");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "rejected">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7days" | "30days">("all");
  
  // Modals
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [approvingPayout, setApprovingPayout] = useState<PayoutItem | null>(null);
  const [liquidationCode, setLiquidationCode] = useState("");
  const [liquidationNotes, setLiquidationNotes] = useState("");
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const [rejectingPayout, setRejectingPayout] = useState<PayoutItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const [viewingReceipt, setViewingReceipt] = useState<PayoutItem | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const { addToast } = useToast();

  // Escutar transações
  useEffect(() => {
    const qTransactions = query(
      collection(db, "transactions"),
      orderBy("date", "desc"),
      limit(250)
    );
    const unsubTx = onSnapshot(
      qTransactions,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setTransactions(data);
        setLoading(false);

        // Fetch missing users
        const uids = [...new Set(data.map((t: any) => t.userId))].filter(Boolean) as string[];
        fetchUsersData(uids);
      },
      (error) => {
        console.warn("Could not listen to transactions:", error);
      }
    );

    // Escutar coleção 'withdrawals' (se houver dados legados ou paralelos)
    const qWithdrawals = query(
      collection(db, "withdrawals"),
      orderBy("createdAt", "desc"),
      limit(150)
    );
    const unsubWd = onSnapshot(
      qWithdrawals,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setWithdrawalsList(data);
        const uids = [...new Set(data.map((w: any) => w.userId))].filter(Boolean) as string[];
        fetchUsersData(uids);
      },
      (error) => {
        console.warn("Could not listen to withdrawals collection:", error);
      }
    );

    return () => {
      unsubTx();
      unsubWd();
    };
  }, []);

  const fetchUsersData = (uids: string[]) => {
    uids.forEach((uid) => {
      if (!users[uid]) {
        getDocFromCache(doc(db, "users", uid))
          .then((docSnap) => {
            if (docSnap.exists()) {
              const uData = docSnap.data();
              setUsers((prev) => ({
                ...prev,
                [uid]: {
                  name: uData.name || uData.displayName || "Usuário sem nome",
                  email: uData.email || "",
                  role: uData.role,
                },
              }));
            } else {
              getDocFromServer(doc(db, "users", uid))
                .then((srvSnap) => {
                  if (srvSnap.exists()) {
                    const sData = srvSnap.data();
                    setUsers((prev) => ({
                      ...prev,
                      [uid]: {
                        name: sData.name || sData.displayName || "Usuário sem nome",
                        email: sData.email || "",
                        role: sData.role,
                      },
                    }));
                  }
                })
                .catch((err) => console.error("Error fetching user data", err));
            }
          })
          .catch(() => {});
      }
    });
  };

  // Unificar solicitações de saque (Payouts)
  const allPayouts = useMemo<PayoutItem[]>(() => {
    const list: PayoutItem[] = [];
    const seenTxIds = new Set<string>();

    // 1. A partir de transactions com type 'withdraw_request' ou 'payout_request'
    transactions.forEach((tx) => {
      if (tx.type === "withdraw_request" || tx.type === "payout_request") {
        seenTxIds.add(tx.id);
        const u = users[tx.userId];
        const rawAmount = tx.amount || 0;
        const feeAmount = tx.feeAmount || tx.feeCharged || 0;
        const netAmount = tx.netAmount || (rawAmount - feeAmount);

        list.push({
          id: tx.id,
          source: "transactions",
          userId: tx.userId,
          userName: tx.beneficiaryName || u?.name || "Profissional ViTTA",
          userEmail: u?.email || "",
          userRole: u?.role || "professional",
          amount: rawAmount,
          grossAmount: tx.grossAmount || rawAmount,
          feeRate: tx.feeRate || 0,
          feeAmount: feeAmount,
          netAmount: netAmount > 0 ? netAmount : rawAmount,
          pixKey: tx.pixKey || (tx.description?.match(/PIX.*?:\s*([^\s,]+)/i)?.[1] || "Não informada"),
          pixType: tx.pixType || "PIX",
          authCode: tx.authCode || tx.id.substring(0, 8).toUpperCase(),
          description: tx.description,
          status: tx.status === "completed" || tx.status === "approved" ? "approved" : tx.status === "rejected" ? "rejected" : "pending",
          date: tx.date || (tx.createdAt?.toDate ? tx.createdAt.toDate().toISOString() : new Date().toISOString()),
          processedAt: tx.handledAt || tx.processedAt,
          handledBy: tx.handledBy,
          liquidationCode: tx.liquidationCode,
          liquidationNotes: tx.liquidationNotes,
          rejectionReason: tx.rejectionReason,
        });
      }
    });

    // 2. A partir da coleção 'withdrawals' (se não duplicado)
    withdrawalsList.forEach((w) => {
      if (!seenTxIds.has(w.id)) {
        const u = users[w.userId];
        list.push({
          id: w.id,
          source: "withdrawals",
          userId: w.userId,
          userName: w.userName || u?.name || "Profissional ViTTA",
          userEmail: w.userEmail || u?.email || "",
          userRole: w.userRole || u?.role || "professional",
          amount: w.amount || 0,
          grossAmount: w.amount || 0,
          feeRate: w.feeRate || 0,
          feeAmount: w.feeAmount || 0,
          netAmount: w.netAmount || w.amount || 0,
          pixKey: w.pixKey || "Não informada",
          authCode: w.id.substring(0, 8).toUpperCase(),
          description: `Solicitação de Saque - PIX: ${w.pixKey}`,
          status: w.status === "approved" || w.status === "completed" ? "approved" : w.status === "rejected" ? "rejected" : "pending",
          date: w.createdAt || new Date().toISOString(),
          processedAt: w.processedAt || w.handledAt,
          handledBy: w.handledBy,
          liquidationCode: w.liquidationCode,
          liquidationNotes: w.liquidationNotes,
          rejectionReason: w.rejectionReason,
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, withdrawalsList, users]);

  // Separação estrita: Pendentes vs Processados
  const pendingPayouts = useMemo(() => {
    return allPayouts.filter((p) => p.status === "pending");
  }, [allPayouts]);

  const processedPayouts = useMemo(() => {
    return allPayouts.filter((p) => p.status === "approved" || p.status === "rejected");
  }, [allPayouts]);

  // Filtros de busca e datas
  const filterByDateAndTerm = (itemDate: string, searchFields: string[]) => {
    // Busca textual
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matches = searchFields.some((f) => (f || "").toLowerCase().includes(term));
      if (!matches) return false;
    }

    // Filtro temporal
    if (dateFilter !== "all") {
      const now = new Date().getTime();
      const target = new Date(itemDate).getTime();
      const diffHours = (now - target) / (1000 * 60 * 60);

      if (dateFilter === "today" && diffHours > 24) return false;
      if (dateFilter === "7days" && diffHours > 24 * 7) return false;
      if (dateFilter === "30days" && diffHours > 24 * 30) return false;
    }

    return true;
  };

  const filteredPending = useMemo(() => {
    return pendingPayouts.filter((p) =>
      filterByDateAndTerm(p.date, [p.userName, p.userEmail || "", p.pixKey || "", p.authCode || "", p.id])
    );
  }, [pendingPayouts, searchTerm, dateFilter]);

  const filteredProcessed = useMemo(() => {
    return processedPayouts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return filterByDateAndTerm(p.processedAt || p.date, [
        p.userName,
        p.userEmail || "",
        p.pixKey || "",
        p.authCode || "",
        p.liquidationCode || "",
        p.id,
      ]);
    });
  }, [processedPayouts, statusFilter, searchTerm, dateFilter]);

  const filteredAllTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const userName = users[t.userId]?.name || "";
      const desc = t.description || "";
      return filterByDateAndTerm(t.date || "", [userName, desc, t.type || "", t.id]);
    });
  }, [transactions, users, searchTerm, dateFilter]);

  // Métricas financeiras e de conciliação
  const metrics = useMemo(() => {
    const totalCredited = transactions.reduce((acc, curr) => {
      if (curr.type === "credit" || curr.type === "admin_adjustment" || curr.type === "refund") {
        if (curr.amount > 0) return acc + curr.amount;
      }
      return acc;
    }, 0);

    const totalDebited = transactions.reduce((acc, curr) => {
      if (curr.type === "debit" || (curr.type === "withdraw_request" && curr.status === "completed") || curr.type === "payout_request") {
        return acc + Math.abs(curr.amount || 0);
      }
      return acc;
    }, 0);

    const pendingTotalAmount = pendingPayouts.reduce((sum, p) => sum + p.netAmount, 0);
    const approvedTotalAmount = processedPayouts
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + p.netAmount, 0);
    const platformFeesTotal = processedPayouts
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + (p.feeAmount || 0), 0);

    return {
      totalCredited,
      totalDebited,
      pendingCount: pendingPayouts.length,
      pendingTotalAmount,
      approvedCount: processedPayouts.filter((p) => p.status === "approved").length,
      approvedTotalAmount,
      rejectedCount: processedPayouts.filter((p) => p.status === "rejected").length,
      platformFeesTotal,
    };
  }, [transactions, pendingPayouts, processedPayouts]);

  // Ações de conciliação: Aprovar Saque com Código de Liquidação Bancária / E2E
  const handleConfirmApproval = async () => {
    if (!approvingPayout) return;
    if (!liquidationCode.trim()) {
      addToast("Informe o código de liquidação bancária / comprovante E2E do PIX.", "error");
      return;
    }

    setIsSubmittingApproval(true);
    const p = approvingPayout;
    const nowIso = new Date().toISOString();

    try {
      if (p.source === "transactions") {
        await updateDoc(doc(db, "transactions", p.id), {
          status: "completed",
          liquidationCode: liquidationCode.trim(),
          liquidationNotes: liquidationNotes.trim(),
          handledBy: adminUser.uid,
          handledAt: nowIso,
          processedAt: nowIso,
        });
      } else {
        await updateDoc(doc(db, "withdrawals", p.id), {
          status: "approved",
          liquidationCode: liquidationCode.trim(),
          liquidationNotes: liquidationNotes.trim(),
          handledBy: adminUser.uid,
          processedAt: nowIso,
        });
      }

      // Notificação ao usuário
      await addDoc(collection(db, "notifications"), {
        userId: p.userId,
        title: "Saque PIX Processado com Sucesso",
        message: `Seu saque no valor líquido de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.netAmount)} foi liquidado. Código: ${liquidationCode.trim()}`,
        type: "financial",
        read: false,
        createdAt: Timestamp.now(),
      });

      // Log de Auditoria
      await logAdminAction(
        "CONCILIATION_APPROVE_PAYOUT",
        `Liquidou saque de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.netAmount)} para ${p.userName}. Cód. Liquidação: ${liquidationCode.trim()}`,
        { payoutId: p.id, userId: p.userId, amount: p.netAmount, pixKey: p.pixKey, liquidationCode: liquidationCode.trim() }
      );

      addToast("Saque liquidado e registrado na conciliação!", "success");
      setApprovingPayout(null);
      setLiquidationCode("");
      setLiquidationNotes("");
    } catch (err) {
      console.error(err);
      addToast("Erro ao confirmar liquidação do saque.", "error");
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Ações de conciliação: Recusar Saque com Estorno Automático
  const handleConfirmRejection = async () => {
    if (!rejectingPayout) return;
    if (!rejectionReason.trim()) {
      addToast("Informe o motivo da recusa para o profissional.", "error");
      return;
    }

    setIsSubmittingRejection(true);
    const p = rejectingPayout;
    const nowIso = new Date().toISOString();

    try {
      // 1. Estornar saldo na carteira do usuário
      const userRef = doc(db, "users", p.userId);
      await updateDoc(userRef, {
        walletBalance: increment(p.amount),
      });

      // 2. Atualizar registro do saque
      if (p.source === "transactions") {
        await updateDoc(doc(db, "transactions", p.id), {
          status: "rejected",
          rejectionReason: rejectionReason.trim(),
          handledBy: adminUser.uid,
          handledAt: nowIso,
          processedAt: nowIso,
        });
      } else {
        await updateDoc(doc(db, "withdrawals", p.id), {
          status: "rejected",
          rejectionReason: rejectionReason.trim(),
          handledBy: adminUser.uid,
          processedAt: nowIso,
        });
      }

      // 3. Registrar transação de estorno
      await addDoc(collection(db, "transactions"), {
        userId: p.userId,
        type: "refund",
        amount: p.amount,
        description: `Estorno de Saque Recusado: ${rejectionReason.trim()}`,
        date: nowIso,
        status: "completed",
        handledBy: adminUser.uid,
      });

      // 4. Notificar usuário
      await addDoc(collection(db, "notifications"), {
        userId: p.userId,
        title: "Solicitação de Saque Recusada",
        message: `Sua solicitação de saque de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.amount)} foi recusada e o saldo foi estornado para sua carteira. Motivo: ${rejectionReason.trim()}`,
        type: "financial",
        read: false,
        createdAt: Timestamp.now(),
      });

      // 5. Auditoria
      await logAdminAction(
        "CONCILIATION_REJECT_PAYOUT",
        `Recusou saque de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.amount)} para ${p.userName}. Motivo: ${rejectionReason.trim()}`,
        { payoutId: p.id, userId: p.userId, amount: p.amount, reason: rejectionReason.trim() }
      );

      addToast("Saque recusado e valor estornado com sucesso.", "success");
      setRejectingPayout(null);
      setRejectionReason("");
    } catch (err) {
      console.error(err);
      addToast("Erro ao recusar saque.", "error");
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  // Copiar chave PIX
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    addToast("Chave PIX copiada para a área de transferência!", "success");
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Exportar relatório de conciliação para CSV
  const handleExportCSV = () => {
    const listToExport = activeTab === "pending_payouts"
      ? filteredPending
      : activeTab === "processed_payouts"
      ? filteredProcessed
      : filteredAllTransactions;

    if (listToExport.length === 0) {
      addToast("Nenhum dado disponível para exportar no filtro atual.", "error");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === "all_transactions") {
      csvContent += "ID,Data,Usuario,Descricao,Tipo,Status,Valor\n";
      listToExport.forEach((item: any) => {
        const userName = users[item.userId]?.name || "N/A";
        const dateStr = new Date(item.date).toLocaleString("pt-BR");
        const cleanDesc = (item.description || "").replace(/,/g, ";");
        csvContent += `"${item.id}","${dateStr}","${userName}","${cleanDesc}","${item.type}","${item.status}","${item.amount}"\n`;
      });
    } else {
      csvContent += "ID,Data_Solicitacao,Data_Processamento,Beneficiario,Email,Chave_PIX,Valor_Bruto,Taxa_ViTTA,Valor_Liquido,Status,Codigo_Liquidacao,Admin_Responsavel\n";
      listToExport.forEach((p: any) => {
        const dateSol = new Date(p.date).toLocaleString("pt-BR");
        const dateProc = p.processedAt ? new Date(p.processedAt).toLocaleString("pt-BR") : "Pendente";
        csvContent += `"${p.id}","${dateSol}","${dateProc}","${p.userName}","${p.userEmail || ""}","${p.pixKey}","${p.amount}","${p.feeAmount || 0}","${p.netAmount}","${p.status}","${p.liquidationCode || ""}","${p.handledBy || ""}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vitta_conciliacao_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Relatório CSV de conciliação exportado!", "success");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header com Ações Globais */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-vitta-accent/10 flex items-center justify-center text-vitta-accent border border-vitta-accent/20">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-vitta-text-primary tracking-tight">
                Conciliação & Gestão Financeira
              </h2>
              <p className="text-xs text-vitta-text-secondary">
                Rastreabilidade de saques (payouts), liquidações bancárias e controle de fundos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-vitta-border transition-all shadow-sm cursor-pointer"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-vitta-accent/90 transition-all shadow-md shadow-vitta-accent/20 cursor-pointer"
          >
            <DollarSign size={15} />
            <span>Ajustar Saldo Manual</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas de Conciliação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saques Pendentes */}
        <div
          onClick={() => setActiveTab("pending_payouts")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "pending_payouts"
              ? "bg-amber-500/10 border-amber-500/40 ring-2 ring-amber-500/20"
              : "bg-vitta-surface border-vitta-border hover:border-amber-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Saques Pendentes
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-vitta-text-primary mt-2">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.pendingTotalAmount)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20">{metrics.pendingCount} solicitações</span>
            <span>aguardando repasse</span>
          </div>
        </div>

        {/* Saques Processados / Liquidados */}
        <div
          onClick={() => setActiveTab("processed_payouts")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "processed_payouts"
              ? "bg-emerald-500/10 border-emerald-500/40 ring-2 ring-emerald-500/20"
              : "bg-vitta-surface border-vitta-border hover:border-emerald-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Saques Liquidados
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-vitta-text-primary mt-2">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.approvedTotalAmount)}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20">{metrics.approvedCount} pagos</span>
            <span>{metrics.rejectedCount > 0 && `• ${metrics.rejectedCount} recusados`}</span>
          </div>
        </div>

        {/* Total Creditado / Entradas */}
        <div
          onClick={() => setActiveTab("all_transactions")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "all_transactions"
              ? "bg-vitta-accent/10 border-vitta-accent/40 ring-2 ring-vitta-accent/20"
              : "bg-vitta-surface border-vitta-border hover:border-vitta-accent/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-vitta-text-muted">
              Total Entradas (Créditos)
            </span>
            <div className="w-8 h-8 rounded-xl bg-vitta-green/10 flex items-center justify-center text-vitta-green">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-vitta-text-primary mt-2">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.totalCredited)}
          </p>
          <p className="text-[11px] font-bold text-vitta-text-muted mt-1">
            Consultas, recargas e ajustes
          </p>
        </div>

        {/* Total Debitado / Saídas */}
        <div
          onClick={() => setActiveTab("all_transactions")}
          className="p-5 rounded-2xl border bg-vitta-surface border-vitta-border hover:border-vitta-border/80 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-vitta-text-muted">
              Total Saídas (Débitos)
            </span>
            <div className="w-8 h-8 rounded-xl bg-vitta-danger/10 flex items-center justify-center text-vitta-danger">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-vitta-text-primary mt-2">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.totalDebited)}
          </p>
          <p className="text-[11px] font-bold text-vitta-text-muted mt-1">
            Repasses pagos e débitos de serviços
          </p>
        </div>
      </div>

      {/* Navegação por Abas Principais */}
      <div className="bg-vitta-surface rounded-3xl border border-vitta-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-vitta-border bg-vitta-surface-2 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Tabs Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-vitta-surface rounded-2xl border border-vitta-border overflow-x-auto">
            <button
              onClick={() => setActiveTab("pending_payouts")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "pending_payouts"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "text-vitta-text-secondary hover:text-vitta-text-primary"
              }`}
            >
              <Clock size={14} />
              <span>⏳ Saques Pendentes</span>
              {metrics.pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === "pending_payouts" ? "bg-white text-amber-600" : "bg-amber-500 text-white animate-pulse"
                }`}>
                  {metrics.pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("processed_payouts")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "processed_payouts"
                  ? "bg-vitta-accent text-white shadow-md shadow-vitta-accent/20"
                  : "text-vitta-text-secondary hover:text-vitta-text-primary"
              }`}
            >
              <CheckCircle2 size={14} />
              <span>✅ Saques Processados (Histórico & Conciliação)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === "processed_payouts" ? "bg-white/20 text-white" : "bg-vitta-surface-2 text-vitta-text-secondary"
              }`}>
                {processedPayouts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("all_transactions")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "all_transactions"
                  ? "bg-vitta-surface-2 text-vitta-accent border border-vitta-accent/30 shadow-sm"
                  : "text-vitta-text-secondary hover:text-vitta-text-primary"
              }`}
            >
              <Receipt size={14} />
              <span>📊 Extrato Geral</span>
            </button>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter (Para processados) */}
            {activeTab === "processed_payouts" && (
              <div className="flex items-center bg-vitta-surface rounded-xl border border-vitta-border p-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    statusFilter === "all" ? "bg-vitta-surface-2 text-vitta-text-primary" : "text-vitta-text-muted"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    statusFilter === "approved" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "text-vitta-text-muted"
                  }`}
                >
                  Liquidados
                </button>
                <button
                  onClick={() => setStatusFilter("rejected")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    statusFilter === "rejected" ? "bg-rose-500/20 text-rose-700 dark:text-rose-300" : "text-vitta-text-muted"
                  }`}
                >
                  Recusados
                </button>
              </div>
            )}

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              className="bg-vitta-surface border border-vitta-border rounded-xl px-3 py-1.5 text-xs font-bold text-vitta-text-primary outline-none cursor-pointer"
            >
              <option value="all">Todo o período</option>
              <option value="today">Hoje (24h)</option>
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={14} />
              <input
                type="text"
                placeholder="Buscar por profissional, PIX, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-medium text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ABA 1: TABELA DE SAQUES PENDENTES                        */}
        {/* ========================================================= */}
        {activeTab === "pending_payouts" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={28} className="text-vitta-accent animate-spin" />
                <span className="text-xs text-vitta-text-secondary font-bold">Carregando solicitações de saques...</span>
              </div>
            ) : filteredPending.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h4 className="text-sm font-bold text-vitta-text-primary">Nenhuma solicitação de saque pendente</h4>
                <p className="text-xs text-vitta-text-secondary max-w-md mx-auto">
                  Todas as transferências PIX solicitadas foram processadas e conciliadas.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-vitta-surface-3 text-vitta-text-muted uppercase text-[10px] font-black tracking-wider border-b border-vitta-border">
                  <tr>
                    <th className="p-4">Solicitação</th>
                    <th className="p-4">Profissional / Parceiro</th>
                    <th className="p-4">Chave PIX de Destino</th>
                    <th className="p-4 text-right">Valor Bruto</th>
                    <th className="p-4 text-right">Taxa ViTTA</th>
                    <th className="p-4 text-right text-emerald-700 dark:text-emerald-400">Líquido a Transferir</th>
                    <th className="p-4 text-center">Ações de Conciliação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vitta-border bg-vitta-surface">
                  {filteredPending.map((payout) => (
                    <tr key={payout.id} className="hover:bg-amber-500/5 transition-colors">
                      {/* Data & Código */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-vitta-text-primary">
                          {new Date(payout.date).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-[10px] text-vitta-text-muted">
                          {new Date(payout.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <span className="inline-block mt-1 font-mono text-[9px] px-1.5 py-0.5 rounded bg-vitta-surface-2 text-vitta-text-muted border border-vitta-border">
                          {payout.authCode}
                        </span>
                      </td>

                      {/* Profissional */}
                      <td className="p-4">
                        <div className="font-black text-vitta-text-primary flex items-center gap-1.5">
                          <span>{payout.userName}</span>
                        </div>
                        {payout.userEmail && (
                          <div className="text-[11px] text-vitta-text-secondary truncate max-w-xs">
                            {payout.userEmail}
                          </div>
                        )}
                        <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider text-vitta-accent">
                          {payout.userRole === "conveniado" ? "Convênio Parceiro" : "Profissional Liberal"}
                        </span>
                      </td>

                      {/* Chave PIX */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-vitta-text-primary text-xs bg-vitta-surface-2 px-2.5 py-1 rounded-lg border border-vitta-border">
                            {payout.pixKey}
                          </span>
                          <button
                            onClick={() => copyToClipboard(payout.pixKey || "", payout.id)}
                            title="Copiar Chave PIX"
                            className="p-1.5 rounded-lg bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-secondary hover:text-vitta-text-primary transition-colors cursor-pointer"
                          >
                            {copiedKeyId === payout.id ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-vitta-text-muted mt-1 block">
                          Tipo: {payout.pixType || "PIX"}
                        </span>
                      </td>

                      {/* Valor Bruto */}
                      <td className="p-4 text-right whitespace-nowrap font-bold text-vitta-text-secondary">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payout.amount)}
                      </td>

                      {/* Taxa ViTTA */}
                      <td className="p-4 text-right whitespace-nowrap font-bold text-vitta-text-muted">
                        {payout.feeAmount && payout.feeAmount > 0 ? (
                          <span className="text-vitta-accent">
                            - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payout.feeAmount)}
                          </span>
                        ) : (
                          "R$ 0,00"
                        )}
                      </td>

                      {/* Valor Líquido */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <span className="font-black text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payout.netAmount)}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setApprovingPayout(payout);
                              setLiquidationCode(`E2E-${Date.now().toString().slice(-6)}-PIX`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
                          >
                            <Check size={13} />
                            <span>Liquidar (Pago)</span>
                          </button>
                          <button
                            onClick={() => setRejectingPayout(payout)}
                            className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl font-bold flex items-center gap-1 transition-all border border-rose-500/20 cursor-pointer"
                          >
                            <X size={13} />
                            <span>Recusar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: TABELA DE SAQUES PROCESSADOS (HISTÓRICO CONCILIADO) */}
        {/* ========================================================= */}
        {activeTab === "processed_payouts" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={28} className="text-vitta-accent animate-spin" />
                <span className="text-xs text-vitta-text-secondary font-bold">Carregando histórico conciliado...</span>
              </div>
            ) : filteredProcessed.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Receipt size={32} className="mx-auto text-vitta-text-muted" />
                <h4 className="text-sm font-bold text-vitta-text-primary">Nenhum saque processado encontrado</h4>
                <p className="text-xs text-vitta-text-secondary max-w-md mx-auto">
                  Ajuste os filtros de status ou o termo de busca para visualizar outros registros.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-vitta-surface-3 text-vitta-text-muted uppercase text-[10px] font-black tracking-wider border-b border-vitta-border">
                  <tr>
                    <th className="p-4">Datas (Solicitado / Liquidado)</th>
                    <th className="p-4">Beneficiário</th>
                    <th className="p-4">Chave PIX</th>
                    <th className="p-4">Status & Liquidação</th>
                    <th className="p-4 text-right">Valor Líquido</th>
                    <th className="p-4 text-right">Taxa Retida</th>
                    <th className="p-4 text-center">Comprovante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vitta-border bg-vitta-surface">
                  {filteredProcessed.map((payout) => {
                    const isApproved = payout.status === "approved" || payout.status === "completed";
                    return (
                      <tr key={payout.id} className="hover:bg-vitta-surface-2 transition-colors">
                        {/* Datas */}
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-bold text-vitta-text-primary">
                            {new Date(payout.date).toLocaleDateString("pt-BR")}
                          </div>
                          {payout.processedAt && (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                              <Check size={11} />
                              <span>{new Date(payout.processedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span>
                            </div>
                          )}
                        </td>

                        {/* Beneficiário */}
                        <td className="p-4">
                          <div className="font-bold text-vitta-text-primary">
                            {payout.userName}
                          </div>
                          {payout.userEmail && (
                            <div className="text-[10px] text-vitta-text-muted truncate max-w-xs">
                              {payout.userEmail}
                            </div>
                          )}
                        </td>

                        {/* Chave PIX */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-mono font-medium text-vitta-text-secondary text-xs">
                            {payout.pixKey}
                          </span>
                        </td>

                        {/* Status & Código de Liquidação */}
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black w-fit ${
                                isApproved
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {isApproved ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                              {isApproved ? "Liquidado (Pago)" : "Recusado (Estornado)"}
                            </span>

                            {isApproved && payout.liquidationCode && (
                              <span className="font-mono text-[10px] text-vitta-text-muted">
                                E2E: <strong className="text-vitta-text-primary">{payout.liquidationCode}</strong>
                              </span>
                            )}

                            {!isApproved && payout.rejectionReason && (
                              <span className="text-[10px] text-rose-600 dark:text-rose-400 italic truncate max-w-xs">
                                "{payout.rejectionReason}"
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Valor Líquido */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <span className={`font-black text-sm ${isApproved ? "text-emerald-700 dark:text-emerald-400" : "text-vitta-text-muted line-through"}`}>
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payout.netAmount)}
                          </span>
                        </td>

                        {/* Taxa Retida */}
                        <td className="p-4 text-right whitespace-nowrap font-bold text-vitta-text-muted">
                          {payout.feeAmount && payout.feeAmount > 0
                            ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(payout.feeAmount)
                            : "-"}
                        </td>

                        {/* Recibo */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setViewingReceipt(payout)}
                            className="px-2.5 py-1.5 rounded-xl bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary text-xs font-bold flex items-center gap-1.5 mx-auto border border-vitta-border transition-colors cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>Ver Recibo</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: EXTRATO GERAL DE TODAS AS TRANSAÇÕES                */}
        {/* ========================================================= */}
        {activeTab === "all_transactions" && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex justify-center">
                <RefreshCw size={28} className="text-vitta-accent animate-spin" />
              </div>
            ) : filteredAllTransactions.length === 0 ? (
              <div className="p-12 text-center text-vitta-text-secondary">
                Nenhuma transação encontrada no filtro selecionado.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-vitta-surface-3 text-vitta-text-muted uppercase text-[10px] font-black tracking-wider border-b border-vitta-border">
                  <tr>
                    <th className="p-4">Data/Hora</th>
                    <th className="p-4">Usuário</th>
                    <th className="p-4">Tipo & Descrição</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vitta-border bg-vitta-surface">
                  {filteredAllTransactions.map((tx) => {
                    const isPositive =
                      tx.type === "credit" ||
                      tx.type === "admin_adjustment" ||
                      tx.type === "refund";
                    const u = users[tx.userId];
                    return (
                      <tr key={tx.id} className="hover:bg-vitta-surface-2 transition-colors">
                        <td className="p-4 whitespace-nowrap text-vitta-text-secondary">
                          {new Date(tx.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="p-4 font-bold text-vitta-text-primary">
                          {u?.name || tx.beneficiaryName || "Usuário Geral"}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-vitta-text-primary">
                            {tx.description || tx.title || "Transação"}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-vitta-accent">
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === "completed" || tx.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : tx.status === "rejected"
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          }`}>
                            {tx.status === "completed" || tx.status === "approved"
                              ? "Concluído"
                              : tx.status === "rejected"
                              ? "Recusado"
                              : "Pendente"}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <span className={`font-black ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {isPositive ? "+" : "-"}
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(tx.amount || 0))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: LIQUIDAR / APROVAR SAQUE (CÓDIGO DE CONCILIAÇÃO)   */}
      {/* ========================================================= */}
      {approvingPayout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-vitta-surface w-full max-w-lg rounded-3xl border border-vitta-border overflow-hidden shadow-2xl space-y-0"
          >
            <div className="p-6 border-b border-vitta-border bg-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={22} />
                <h3 className="font-black text-lg">Liquidar Saque Bancário (PIX)</h3>
              </div>
              <button
                onClick={() => setApprovingPayout(null)}
                className="p-1.5 rounded-full hover:bg-vitta-surface-2 text-vitta-text-muted hover:text-vitta-text-primary transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-vitta-surface-2 p-4 rounded-2xl border border-vitta-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-vitta-text-secondary font-bold">Beneficiário:</span>
                  <span className="font-black text-vitta-text-primary">{approvingPayout.userName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-vitta-text-secondary font-bold">Chave PIX:</span>
                  <span className="font-mono font-black text-vitta-accent">{approvingPayout.pixKey}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-vitta-border">
                  <span className="text-vitta-text-secondary font-bold">Valor Líquido a Transferir:</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(approvingPayout.netAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-black text-vitta-text-primary block">
                  Código de Liquidação / E2E do PIX *
                </label>
                <input
                  type="text"
                  required
                  value={liquidationCode}
                  onChange={(e) => setLiquidationCode(e.target.value)}
                  placeholder="Ex: E12345678202609040001PIX..."
                  className="w-full px-3.5 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl font-mono text-xs focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                />
                <p className="text-[10px] text-vitta-text-muted">
                  Insira o ID da transação bancária para rastreabilidade e auditoria na conciliação.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-vitta-text-secondary block">
                  Observações Internas (Opcional)
                </label>
                <textarea
                  value={liquidationNotes}
                  onChange={(e) => setLiquidationNotes(e.target.value)}
                  placeholder="Ex: Transferência concluída via Banco Inter às 14:30..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs outline-none text-vitta-text-primary"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingPayout(null)}
                  className="flex-1 py-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-secondary rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmittingApproval || !liquidationCode.trim()}
                  onClick={handleConfirmApproval}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingApproval ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Confirmar Liquidação</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECUSAR SAQUE & ESTORNAR SALDO                      */}
      {/* ========================================================= */}
      {rejectingPayout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-vitta-surface w-full max-w-md rounded-3xl border border-vitta-border overflow-hidden shadow-2xl space-y-0"
          >
            <div className="p-6 border-b border-vitta-border bg-rose-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <XCircle size={22} />
                <h3 className="font-black text-lg">Recusar e Estornar Saque</h3>
              </div>
              <button
                onClick={() => setRejectingPayout(null)}
                className="p-1.5 rounded-full hover:bg-vitta-surface-2 text-vitta-text-muted hover:text-vitta-text-primary transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-vitta-text-secondary">
                Ao recusar, o valor integral de{" "}
                <strong className="text-vitta-text-primary">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rejectingPayout.amount)}
                </strong>{" "}
                será automaticamente <strong>devolvido para a carteira</strong> de {rejectingPayout.userName}.
              </p>

              <div className="space-y-1.5">
                <label className="font-black text-vitta-text-primary block">
                  Motivo da Recusa *
                </label>
                <textarea
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Chave PIX inválida / CPF divergente do titular..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs outline-none text-vitta-text-primary"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingPayout(null)}
                  className="flex-1 py-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-secondary rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={isSubmittingRejection || !rejectionReason.trim()}
                  onClick={handleConfirmRejection}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingRejection ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                  <span>Confirmar Estorno</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VISUALIZADOR DE RECIBO / COMPROVANTE               */}
      {/* ========================================================= */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-vitta-surface w-full max-w-lg rounded-3xl border border-vitta-border overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-vitta-border flex items-center justify-between bg-vitta-surface-2">
              <div className="flex items-center gap-2">
                <Receipt size={20} className="text-vitta-accent" />
                <h3 className="font-black text-base text-vitta-text-primary">Comprovante de Liquidação ViTTA</h3>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1.5 rounded-full hover:bg-vitta-surface-3 text-vitta-text-muted hover:text-vitta-text-primary transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="text-center pb-4 border-b border-vitta-border">
                <span className="text-[10px] uppercase font-black tracking-widest text-vitta-text-muted block">
                  Comprovante de Transferência PIX
                </span>
                <p className="text-3xl font-black text-vitta-text-primary mt-1">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(viewingReceipt.netAmount)}
                </p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                  viewingReceipt.status === "approved" || viewingReceipt.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                }`}>
                  {viewingReceipt.status === "approved" || viewingReceipt.status === "completed" ? "Transferência Realizada" : "Solicitação Recusada"}
                </span>
              </div>

              <div className="space-y-2 bg-vitta-surface-2 p-4 rounded-2xl border border-vitta-border">
                <div className="flex justify-between">
                  <span className="text-vitta-text-secondary">Beneficiário:</span>
                  <span className="font-bold text-vitta-text-primary">{viewingReceipt.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vitta-text-secondary">Chave PIX:</span>
                  <span className="font-mono font-bold text-vitta-text-primary">{viewingReceipt.pixKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vitta-text-secondary">Data da Solicitação:</span>
                  <span className="font-medium text-vitta-text-primary">{new Date(viewingReceipt.date).toLocaleString("pt-BR")}</span>
                </div>
                {viewingReceipt.processedAt && (
                  <div className="flex justify-between">
                    <span className="text-vitta-text-secondary">Data de Liquidação:</span>
                    <span className="font-medium text-vitta-text-primary">{new Date(viewingReceipt.processedAt).toLocaleString("pt-BR")}</span>
                  </div>
                )}
                {viewingReceipt.liquidationCode && (
                  <div className="flex justify-between pt-2 border-t border-vitta-border">
                    <span className="text-vitta-text-secondary">Código Bancário (E2E):</span>
                    <span className="font-mono font-bold text-vitta-accent">{viewingReceipt.liquidationCode}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => window.print()}
                  className="w-full py-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary rounded-xl font-bold flex items-center justify-center gap-2 border border-vitta-border transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Imprimir / Salvar PDF</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: AJUSTE MANUAL DE SALDO (ADMIN)                      */}
      {/* ========================================================= */}
      {isAdjustModalOpen && (
        <AdminAdjustBalanceModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          adminUser={adminUser}
        />
      )}
    </div>
  );
};

export const AdminAdjustBalanceModal = ({
  isOpen,
  onClose,
  adminUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  adminUser: any;
}) => {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"credit" | "debit">("credit");
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      getDocs(query(collection(db, "users"), orderBy("name", "asc")))
        .then((snapshot) => {
          const usr = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((u: any) => u.role !== "admin");
          setUsersList(usr);
        })
        .catch((err) => console.error("Erro ao carregar usuários:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      addToast("Selecione um usuário", "error");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      addToast("Insira um valor numérico válido", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const modifier = adjustmentType === "credit" ? numericAmount : -numericAmount;
      const userRef = doc(db, "users", selectedUserId);
      await updateDoc(userRef, {
        walletBalance: increment(modifier),
      });

      const transactionRef = doc(collection(db, "transactions"));
      await setDoc(transactionRef, {
        userId: selectedUserId,
        type: "admin_adjustment",
        amount: numericAmount,
        description:
          description ||
          `Ajuste manual de saldo (${adjustmentType === "credit" ? "Crédito" : "Débito"})`,
        date: new Date().toISOString(),
        status: "completed",
        handledBy: adminUser.uid,
      });

      await logAdminAction(
        "MANUAL_BALANCE_ADJUST",
        `Ajustou ${adjustmentType === "credit" ? "+" : "-"} R$ ${numericAmount.toFixed(2)} para usuário ${selectedUserId}`,
        { userId: selectedUserId, amount: numericAmount, type: adjustmentType, description }
      );

      addToast("Saldo ajustado com sucesso", "success");
      onClose();
    } catch (error) {
      console.error(error);
      addToast("Houve um erro no processamento do ajuste", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-vitta-surface w-full max-w-md rounded-3xl border border-vitta-border overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2">
          <h2 className="text-lg font-black text-vitta-text-primary flex items-center gap-2">
            <DollarSign size={18} className="text-vitta-accent" />
            <span>Ajuste Manual de Saldo</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-vitta-text-muted hover:text-vitta-text-primary rounded-full hover:bg-vitta-surface-3 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block font-bold text-vitta-text-primary mb-1.5">
              Usuário / Profissional Destino *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-vitta-surface-2 border border-vitta-border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-vitta-accent text-vitta-text-primary cursor-pointer"
              required
            >
              <option value="" disabled>
                Selecione o usuário ou profissional
              </option>
              {usersList.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email} ({u.role || "paciente"}) - Saldo atual: R$ {(u.walletBalance || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-vitta-text-primary mb-1.5">
              Tipo de Ajuste
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType("credit")}
                className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  adjustmentType === "credit"
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                    : "border-vitta-border bg-vitta-surface-2 text-vitta-text-secondary"
                }`}
              >
                <Plus size={14} /> Crédito (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("debit")}
                className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  adjustmentType === "debit"
                    ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300"
                    : "border-vitta-border bg-vitta-surface-2 text-vitta-text-secondary"
                }`}
              >
                <Trash2 size={14} /> Débito (-)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-vitta-text-primary mb-1.5">
              Valor do Ajuste (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full bg-vitta-surface-2 border border-vitta-border rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-vitta-accent text-vitta-text-primary"
            />
          </div>

          <div>
            <label className="block font-bold text-vitta-text-primary mb-1.5">
              Motivo / Descrição *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Estorno de consulta cancelada / Ajuste de split..."
              className="w-full bg-vitta-surface-2 border border-vitta-border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-vitta-accent text-vitta-text-primary min-h-[70px]"
              required
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold border border-vitta-border hover:bg-vitta-border transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              <span>Aplicar Ajuste</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
