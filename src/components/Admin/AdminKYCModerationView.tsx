import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { updateDoc, addDoc } from "../../lib/firestore-wrappers";
import { db } from "../../firebase";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  Search,
  AlertCircle,
  ExternalLink,
  Filter,
  Eye,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { logAdminAction } from "../../lib/audit";
import { motion, AnimatePresence } from "motion/react";

export const AdminKYCModerationView: React.FC = () => {
  const { addToast } = useToast();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [selectedProf, setSelectedProf] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "professionals"), orderBy("name", "asc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setProfessionals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao carregar profissionais para moderação KYC:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleDecision = async (prof: any, approve: boolean, reason?: string) => {
    setProcessing(true);
    try {
      // 1. Update professional KYC status
      await updateDoc(doc(db, "professionals", prof.id), {
        kycStatus: approve ? "approved" : "rejected",
        status: approve ? "active" : "pending",
        approvedAt: approve ? new Date().toISOString() : null,
        rejectedAt: !approve ? new Date().toISOString() : null,
        rejectionReason: !approve ? reason || "Documentação pendente ou ilegível" : null,
      });

      // 2. Dispatch real-time in-app notification
      const recipientUserId = prof.userId || prof.uid || prof.id;
      if (recipientUserId) {
        if (approve) {
          await addDoc(collection(db, "notifications"), {
            userId: recipientUserId,
            title: "Documentação Aprovada!",
            message: "Seu cadastro profissional foi validado com sucesso pela equipe ViTTA. Sua agenda e perfil já estão ativos para agendamentos.",
            type: "kyc_approved",
            read: false,
            createdAt: Timestamp.now(),
          });
        } else {
          await addDoc(collection(db, "notifications"), {
            userId: recipientUserId,
            title: "Documentação Pendente / Recusada",
            message: `Identificamos pendências no seu cadastro: ${reason || "Por favor, revise os documentos enviados no painel profissional."}`,
            type: "kyc_rejected",
            read: false,
            createdAt: Timestamp.now(),
          });
        }
      }

      // 3. Audit Log
      await logAdminAction(
        "KYC_APPROVAL",
        `${approve ? "Aprovou" : "Rejeitou"} documentação KYC de ${prof.name} (${prof.specialty || "Médico"})`
      );

      addToast(
        approve ? "Profissional aprovado e ativado com sucesso!" : "Documentação marcada como recusada.",
        approve ? "success" : "info"
      );

      setShowRejectModal(false);
      setSelectedProf(null);
      setRejectionReason("");
    } catch (err) {
      console.error(err);
      addToast("Erro ao processar validação KYC.", "error");
    } finally {
      setProcessing(false);
    }
  };

  const filtered = professionals.filter((p) => {
    const matchesSearch =
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.crm || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.specialty || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (filter === "pending") return p.kycStatus === "pending" || !p.kycStatus;
    return p.kycStatus === filter;
  });

  return (
    <div className="space-y-6">
      <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-vitta-accent/10 text-vitta-accent flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-vitta-text-primary">Moderação KYC & Documentos</h2>
            <p className="text-xs text-vitta-text-muted">
              Validação cadastral, diplomas, CRM/RQE e autorização de exercício profissional
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-vitta-surface-2 rounded-2xl border border-vitta-border text-xs">
          {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all cursor-pointer ${
                filter === tab
                  ? "bg-vitta-accent text-white shadow-sm"
                  : "text-vitta-text-secondary hover:text-vitta-text-primary"
              }`}
            >
              {tab === "pending"
                ? `Pendentes (${professionals.filter((p) => p.kycStatus === "pending" || !p.kycStatus).length})`
                : tab === "approved"
                ? "Aprovados"
                : tab === "rejected"
                ? "Recusados"
                : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
        <input
          type="text"
          placeholder="Buscar por médico, CRM ou especialidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-2xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-xs text-vitta-text-muted">
            Carregando fila de moderação KYC...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full bg-vitta-surface p-12 rounded-3xl border border-vitta-border text-center space-y-2">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto opacity-70" />
            <h4 className="font-bold text-sm text-vitta-text-primary">Nenhum profissional na fila</h4>
            <p className="text-xs text-vitta-text-muted">Nenhum registro encontrado para este filtro.</p>
          </div>
        ) : (
          filtered.map((prof) => {
            const isPending = prof.kycStatus === "pending" || !prof.kycStatus;
            const isApproved = prof.kycStatus === "approved";
            const isRejected = prof.kycStatus === "rejected";

            return (
              <div
                key={prof.id}
                className="bg-vitta-surface p-5 rounded-3xl border border-vitta-border shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-vitta-text-primary">{prof.name}</h4>
                      <p className="text-xs text-vitta-text-secondary">{prof.specialty || "Clínico Geral"}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isApproved
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : isRejected
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {isApproved ? "Aprovado" : isRejected ? "Recusado" : "Pendente"}
                    </span>
                  </div>

                  <div className="p-3 bg-vitta-surface-2 rounded-2xl border border-vitta-border space-y-1 text-[11px] text-vitta-text-muted font-medium">
                    <div className="flex justify-between">
                      <span>CRM:</span>
                      <span className="font-mono text-vitta-text-primary">{prof.crm || "Não informado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cidade / UF:</span>
                      <span className="text-vitta-text-primary">{prof.city || "São Paulo"}/{prof.uf || "SP"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Preço Consulta:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {Number(prof.price || 0).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>

                  {prof.rejectionReason && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-200 dark:border-rose-900/30 rounded-xl text-[11px] text-rose-600 dark:text-rose-400">
                      <strong>Motivo Recusa:</strong> {prof.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-vitta-border flex items-center gap-2">
                  <button
                    onClick={() => handleDecision(prof, true)}
                    disabled={processing}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <CheckCircle2 size={13} />
                    Aprovar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProf(prof);
                      setShowRejectModal(true);
                    }}
                    disabled={processing}
                    className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <XCircle size={13} />
                    Recusar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && selectedProf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-3xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              <div className="p-5 border-b border-vitta-border bg-vitta-surface-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertCircle size={18} />
                  <h3 className="font-bold text-sm text-vitta-text-primary">Recusar Validação KYC</h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-vitta-text-secondary">
                  Informe o motivo da recusa para <strong>{selectedProf.name}</strong>. Esta justificativa será enviada em tempo real para a caixa de notificações do profissional:
                </p>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ex: Foto do CRM ilegível, diploma sem selo do MEC ou comprovante de endereço com mais de 90 dias..."
                  rows={4}
                  className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent resize-none"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedProf(null);
                    }}
                    className="flex-1 py-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-secondary rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(selectedProf, false, rejectionReason)}
                    disabled={!rejectionReason.trim() || processing}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    Confirmar Recusa
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminKYCModerationView;
