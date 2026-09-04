import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Shield,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  CreditCard,
  Wallet,
  Coins,
  DollarSign,
  Plus,
  X,
  Check,
  Crown,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Lock,
  Unlock,
  RefreshCw,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  Timestamp,
  query,
  orderBy
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import { logAdminAction } from "../../lib/audit";

interface UserRecord {
  id: string;
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  role?: string;
  status?: string;
  isBlocked?: boolean;
  walletBalance?: number | string;
  vittaCoins?: number | string;
  pixKey?: string;
  pixKeyType?: string;
  // Assinatura & Plano
  subscriptionStatus?: string;
  plan?: string;
  planName?: string;
  planId?: string;
  planPrice?: number | string;
  planFrequency?: string;
  planStatus?: string;
  subscriptionStartDate?: string;
  subscriptionExpiresAt?: string;
  subscriptionId?: string;
  subscription?: {
    planId?: string;
    planName?: string;
    status?: string;
    price?: number;
    updatedAt?: string;
  };
  // Dados de Endereço
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  // Dados Profissionais / Médicos
  crm?: string;
  specialty?: string;
  bio?: string;
  consultationPrice?: number | string;
  // Dados Pessoais
  birthDate?: string;
  gender?: string;
  // Observações do Admin
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: number;
  frequency: string;
}

const DEFAULT_PLANS: PlanOption[] = [
  { id: "free", name: "Básico (Gratuito)", price: 0, frequency: "mensal" },
  { id: "individual", name: "ViTTA Individual", price: 39.90, frequency: "mensal" },
  { id: "familiar", name: "ViTTA Família", price: 79.90, frequency: "mensal" },
  { id: "premium", name: "ViTTA Premium VIP", price: 129.90, frequency: "mensal" },
];

export const UserConfigView: React.FC = () => {
  const { addToast } = useToast();
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>(DEFAULT_PLANS);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"personal" | "subscription" | "wallet" | "access" | "address">("personal");
  const [isSaving, setIsSaving] = useState(false);

  // Quick Plan Change Modal State
  const [quickPlanUser, setQuickPlanUser] = useState<UserRecord | null>(null);
  const [selectedQuickPlanId, setSelectedQuickPlanId] = useState<string>("");
  const [selectedQuickPlanStatus, setSelectedQuickPlanStatus] = useState<string>("active");

  // Subscribe to Users
  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as UserRecord[];
        setUsersList(list);
      },
      (error) => {
        console.error("Erro ao carregar lista de usuários:", error);
        addToast("Erro ao sincronizar usuários com o banco de dados.", "error");
      }
    );

    // Subscribe to custom subscription plans from subscription_plans collection
    const unsubPlans = onSnapshot(
      collection(db, "subscription_plans"),
      (snapshot) => {
        const customPlans: PlanOption[] = [];
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const planName = data.name || data.reason;
          if (planName) {
            customPlans.push({
              id: d.id,
              name: planName,
              price: Number(data.price || data.auto_recurring?.transaction_amount || 0),
              frequency: data.frequencyType === "months" ? (data.frequency === 12 ? "anual" : "mensal") : (data.frequency || "mensal"),
            });
          }
        });

        // Merge default and custom plans without duplicate IDs
        const merged = [...DEFAULT_PLANS];
        customPlans.forEach((cp) => {
          if (!merged.some((p) => p.id === cp.id || p.name.toLowerCase() === cp.name.toLowerCase())) {
            merged.push(cp);
          }
        });
        setAvailablePlans(merged);
      },
      (err) => {
        console.warn("Plano local subscription_plans indisponível, usando catálogo padrão:", err);
      }
    );

    return () => {
      unsubUsers();
      unsubPlans();
    };
  }, []);

  // Alteração rápida de perfil (Role)
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
      await logAdminAction(
        "UPDATE_USER_ROLE",
        `Admin Master alterou perfil de acesso do usuário ${userId} para ${newRole.toUpperCase()}`,
        { userId, newRole }
      );
      addToast(`Perfil atualizado para "${newRole}".`, "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao atualizar perfil do usuário.", "error");
    }
  };

  // Alteração de Bloqueio/Desbloqueio de Usuário
  const handleToggleBlockUser = async (u: UserRecord) => {
    const nextBlockedState = !u.isBlocked;
    try {
      await updateDoc(doc(db, "users", u.id), {
        isBlocked: nextBlockedState,
        status: nextBlockedState ? "blocked" : "active",
        updatedAt: new Date().toISOString(),
      });
      await logAdminAction(
        nextBlockedState ? "BLOCK_USER" : "UNBLOCK_USER",
        `Admin Master ${nextBlockedState ? "bloqueou" : "desbloqueou"} o usuário ${u.name || u.email} (${u.id})`,
        { userId: u.id, isBlocked: nextBlockedState }
      );
      addToast(
        nextBlockedState ? `Usuário "${u.name || u.email}" bloqueado.` : `Usuário "${u.name || u.email}" desbloqueado com sucesso.`,
        nextBlockedState ? "warning" : "success"
      );
    } catch (err) {
      console.error(err);
      addToast("Erro ao alterar status de bloqueio.", "error");
    }
  };

  // Alteração Rápida de Plano de Assinatura
  const handleApplyQuickPlan = async () => {
    if (!quickPlanUser) return;
    const chosenPlan = availablePlans.find((p) => p.id === selectedQuickPlanId) || {
      id: selectedQuickPlanId,
      name: selectedQuickPlanId === "free" ? "Básico (Gratuito)" : selectedQuickPlanId,
      price: selectedQuickPlanId === "free" ? 0 : 39.90,
      frequency: "mensal"
    };

    try {
      setIsSaving(true);
      const isFree = chosenPlan.id === "free" || selectedQuickPlanStatus === "inactive";
      const planStatusVal = isFree ? "inactive" : selectedQuickPlanStatus;
      const subStatusVal = isFree ? "inactive" : selectedQuickPlanStatus;

      const payload = {
        plan: chosenPlan.id,
        planName: chosenPlan.name,
        planId: chosenPlan.id,
        planPrice: Number(chosenPlan.price) || 0,
        planFrequency: chosenPlan.frequency || "mensal",
        planStatus: planStatusVal,
        subscriptionStatus: subStatusVal,
        subscription: {
          planId: chosenPlan.id,
          planName: chosenPlan.name,
          status: subStatusVal,
          price: Number(chosenPlan.price) || 0,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "users", quickPlanUser.id), payload);

      // Notificar usuário sobre a alteração do plano
      await addDoc(collection(db, "notifications"), {
        userId: quickPlanUser.id,
        title: "Plano ViTTA Atualizado!",
        message: `Seu plano foi atualizado para "${chosenPlan.name}" com status ${subStatusVal === "active" ? "Ativo" : "Inativo"}. Aproveite os benefícios exclusivos.`,
        type: "plan_update",
        read: false,
        createdAt: Timestamp.now(),
      });

      await logAdminAction(
        "UPDATE_USER_SUBSCRIPTION",
        `Admin Master alterou o plano de ${quickPlanUser.name || quickPlanUser.email} para "${chosenPlan.name}" (${subStatusVal})`,
        { userId: quickPlanUser.id, before: quickPlanUser.plan, after: payload }
      );

      addToast(`Plano de "${quickPlanUser.name || quickPlanUser.email}" alterado para ${chosenPlan.name}!`, "success");
      setQuickPlanUser(null);
    } catch (err) {
      console.error("Erro ao alterar plano do usuário:", err);
      addToast("Erro ao alterar plano de assinatura.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Salvar Edição Completa com Todos os Campos do Usuário
  const handleSaveAllUserData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsSaving(true);

      const parsedWallet = parseFloat(String(editingUser.walletBalance)) || 0;
      const parsedCoins = parseFloat(String(editingUser.vittaCoins)) || 0;
      const parsedPlanPrice = parseFloat(String(editingUser.planPrice)) || 0;
      const parsedConsultationPrice = parseFloat(String(editingUser.consultationPrice)) || 0;

      const updatedPayload: any = {
        name: editingUser.name || "",
        email: editingUser.email || "",
        cpf: editingUser.cpf || "",
        phone: editingUser.phone || "",
        birthDate: editingUser.birthDate || "",
        gender: editingUser.gender || "",
        role: editingUser.role || "patient",
        status: editingUser.status || (editingUser.isBlocked ? "blocked" : "active"),
        isBlocked: !!editingUser.isBlocked,

        // Assinatura & Plano (Acesso total garantido)
        subscriptionStatus: editingUser.subscriptionStatus || "inactive",
        planStatus: editingUser.subscriptionStatus === "active" ? "active" : "inactive",
        plan: editingUser.plan || "free",
        planName: editingUser.planName || (editingUser.plan === "free" ? "Básico (Gratuito)" : editingUser.plan || "Básico"),
        planId: editingUser.planId || editingUser.plan || "free",
        planPrice: parsedPlanPrice,
        planFrequency: editingUser.planFrequency || "mensal",
        subscriptionStartDate: editingUser.subscriptionStartDate || "",
        subscriptionExpiresAt: editingUser.subscriptionExpiresAt || "",
        subscriptionId: editingUser.subscriptionId || "",
        subscription: {
          planId: editingUser.planId || editingUser.plan || "free",
          planName: editingUser.planName || editingUser.plan || "Básico",
          status: editingUser.subscriptionStatus || "inactive",
          price: parsedPlanPrice,
          updatedAt: new Date().toISOString(),
        },

        // Financeiro & Moedas
        walletBalance: parsedWallet,
        vittaCoins: parsedCoins,
        pixKey: editingUser.pixKey || "",
        pixKeyType: editingUser.pixKeyType || "cpf",

        // Endereço
        cep: editingUser.cep || "",
        address: editingUser.address || "",
        number: editingUser.number || "",
        complement: editingUser.complement || "",
        neighborhood: editingUser.neighborhood || "",
        city: editingUser.city || "",
        state: editingUser.state || "",

        // Dados Médicos / Profissionais
        crm: editingUser.crm || "",
        specialty: editingUser.specialty || "",
        bio: editingUser.bio || "",
        consultationPrice: parsedConsultationPrice,

        // Notas do Admin Master
        adminNotes: editingUser.adminNotes || "",
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "users", editingUser.id), updatedPayload);

      await logAdminAction(
        "ADMIN_MASTER_FULL_USER_UPDATE",
        `Admin Master atualizou todos os dados do usuário ${editingUser.name || editingUser.email} (${editingUser.id})`,
        { userId: editingUser.id, updatedPayload }
      );

      addToast("Todos os dados do usuário foram salvos com sucesso!", "success");
      setEditingUser(null);
    } catch (err) {
      console.error("Erro ao salvar dados completos do usuário:", err);
      addToast("Erro ao salvar dados do usuário no banco.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir Usuário com permissão de Admin Master
  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`ATENÇÃO ADMIN MASTER:\nDeseja realmente excluir permanentemente o cadastro de "${name}"?\nEsta ação é irreversível e removerá o documento do usuário.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "users", userId));
      await logAdminAction(
        "DELETE_USER",
        `Admin Master excluiu permanentemente o usuário ${userId} (${name})`,
        { userId, name }
      );
      addToast(`Usuário "${name}" removido com sucesso.`, "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao remover usuário do banco de dados.", "error");
    }
  };

  // Filtragem dos usuários
  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.cpf || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q) ||
      (u.plan || "").toLowerCase().includes(q) ||
      (u.planName || "").toLowerCase().includes(q);

    const matchesRole =
      roleFilter === "all" ||
      u.role === roleFilter ||
      (roleFilter === "patient" && (!u.role || u.role === "patient"));

    const isSubActive = u.subscriptionStatus === "active" || u.planStatus === "active";
    const matchesPlan =
      planFilter === "all" ||
      (planFilter === "active" && isSubActive) ||
      (planFilter === "inactive" && !isSubActive) ||
      (planFilter === "individual" && (u.plan === "individual" || u.planName?.toLowerCase().includes("individual"))) ||
      (planFilter === "familiar" && (u.plan === "familiar" || u.planName?.toLowerCase().includes("família") || u.planName?.toLowerCase().includes("familia"))) ||
      (planFilter === "premium" && (u.plan === "premium" || u.planName?.toLowerCase().includes("premium")));

    return matchesSearch && matchesRole && matchesPlan;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Admin Master Privilege Confirmation */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-vitta-surface to-vitta-surface border border-emerald-500/30 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Crown size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-vitta-text-primary tracking-tight">
                Gestão Master de Usuários & Assinaturas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Admin Master • Acesso Total
              </span>
            </div>
            <p className="text-xs text-vitta-text-secondary mt-0.5">
              Visualização e edição irrestrita de todos os campos: dados cadastrais, planos de saúde ViTTA, saldos, credenciais e permissões.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-vitta-surface-2 border border-vitta-border flex items-center gap-2">
            <Users size={15} className="text-vitta-accent" />
            <span className="font-bold text-vitta-text-primary">{usersList.length}</span>
            <span className="text-vitta-text-muted">Usuários</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <Sparkles size={15} className="text-emerald-500" />
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {usersList.filter((u) => u.subscriptionStatus === "active" || u.planStatus === "active").length}
            </span>
            <span className="text-emerald-700/80 dark:text-emerald-400/80">Planos Ativos</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-vitta-surface p-4 rounded-2xl border border-vitta-border">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === "all"
                ? "bg-vitta-accent text-white shadow-sm"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Todos ({usersList.length})
          </button>
          <button
            onClick={() => setRoleFilter("patient")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === "patient"
                ? "bg-vitta-accent text-white shadow-sm"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Pacientes ({usersList.filter((u) => u.role === "patient" || !u.role).length})
          </button>
          <button
            onClick={() => setRoleFilter("professional")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === "professional"
                ? "bg-vitta-accent text-white shadow-sm"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Médicos ({usersList.filter((u) => u.role === "professional").length})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === "admin"
                ? "bg-vitta-accent text-white shadow-sm"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Admins ({usersList.filter((u) => u.role === "admin" || u.role === "master").length})
          </button>
          <button
            onClick={() => setRoleFilter("liberal")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              roleFilter === "liberal"
                ? "bg-vitta-accent text-white shadow-sm"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Liberais ({usersList.filter((u) => u.role === "liberal").length})
          </button>
        </div>

        {/* Plan Filter & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-vitta-text-muted whitespace-nowrap">Plano:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-bold text-vitta-text-primary focus:outline-none focus:border-vitta-accent w-full sm:w-auto"
            >
              <option value="all">Todos os Planos</option>
              <option value="active">✓ Somente Assinantes Ativos</option>
              <option value="inactive">Sem Plano / Básico</option>
              <option value="individual">ViTTA Individual</option>
              <option value="familiar">ViTTA Família</option>
              <option value="premium">ViTTA Premium VIP</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
            <input
              type="text"
              placeholder="Buscar nome, email, CPF, telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
            />
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-vitta-surface rounded-3xl border border-vitta-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-vitta-text-primary">
            <thead className="bg-vitta-surface-2 text-vitta-text-muted uppercase text-[10px] tracking-wider font-black border-b border-vitta-border">
              <tr>
                <th className="p-4">Usuário / Identificação</th>
                <th className="p-4">Nível de Acesso (Role)</th>
                <th className="p-4">Plano de Assinatura</th>
                <th className="p-4">Saldo / Carteira</th>
                <th className="p-4">Status Conta</th>
                <th className="p-4 text-right">Ações Master</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-vitta-text-muted">
                    <Users size={36} className="mx-auto mb-2 text-vitta-text-muted/60 opacity-60" />
                    <p className="font-bold text-sm">Nenhum usuário encontrado</p>
                    <p className="text-xs">Tente ajustar os termos da busca ou os filtros de perfil e plano.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSubActive = u.subscriptionStatus === "active" || u.planStatus === "active";
                  const planDisplayName = u.planName || (u.plan === "individual" ? "ViTTA Individual" : u.plan === "familiar" ? "ViTTA Família" : u.plan === "premium" ? "ViTTA Premium" : (u.plan || "Básico"));
                  const planDisplayPrice = u.planPrice ? Number(u.planPrice) : (u.plan === "individual" ? 39.9 : u.plan === "familiar" ? 79.9 : u.plan === "premium" ? 129.9 : 0);

                  return (
                    <tr key={u.id} className="hover:bg-vitta-surface-2/50 transition-colors">
                      {/* Identificação */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-vitta-accent/20 to-teal-500/20 text-vitta-accent font-black text-xs flex items-center justify-center border border-vitta-accent/20 shrink-0">
                            {(u.name || u.email || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-vitta-text-primary flex items-center gap-1.5">
                              {u.name || "Usuário sem nome"}
                              {u.role === "master" && (
                                <span title="Admin Master">
                                  <Crown size={13} className="text-amber-500" />
                                </span>
                              )}
                              {u.role === "admin" && (
                                <span title="Administrador">
                                  <Shield size={13} className="text-blue-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-vitta-text-muted flex items-center gap-2">
                              <span>{u.email}</span>
                            </div>
                            <div className="text-[10px] text-vitta-text-muted/80 flex items-center gap-2 mt-0.5">
                              {u.cpf && <span>CPF: {u.cpf}</span>}
                              {u.phone && <span>• Tel: {u.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Perfil / Role */}
                      <td className="p-4">
                        <select
                          value={u.role || "patient"}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border focus:outline-none transition-all ${
                            u.role === "master"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : u.role === "admin"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                              : u.role === "professional"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                              : u.role === "liberal"
                              ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30"
                              : "bg-vitta-surface-2 text-vitta-text-primary border-vitta-border"
                          }`}
                        >
                          <option value="patient">Paciente</option>
                          <option value="professional">Médico / Profissional</option>
                          <option value="liberal">Profissional Liberal</option>
                          <option value="admin">Administrador</option>
                          <option value="master">Admin Master</option>
                        </select>
                      </td>

                      {/* Plano de Assinatura com botão de troca rápida */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                                isSubActive
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20"
                              }`}
                            >
                              <Sparkles size={10} />
                              {planDisplayName}
                            </span>
                            <span className="text-[10px] font-bold text-vitta-text-muted">
                              {planDisplayPrice > 0 ? `R$ ${planDisplayPrice.toFixed(2)}` : "Grátis"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setQuickPlanUser(u);
                                setSelectedQuickPlanId(u.plan || "individual");
                                setSelectedQuickPlanStatus(u.subscriptionStatus || "active");
                              }}
                              className="text-[11px] font-bold text-vitta-accent hover:underline flex items-center gap-0.5"
                              title="Alterar plano de assinatura deste usuário"
                            >
                              <CreditCard size={12} />
                              Alterar Plano
                            </button>
                            <span className="text-[10px] text-vitta-text-muted">
                              • {isSubActive ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Saldo Carteira */}
                      <td className="p-4">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          R$ {(Number(u.walletBalance) || 0).toFixed(2)}
                        </div>
                        {u.vittaCoins && Number(u.vittaCoins) > 0 ? (
                          <div className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                            <Coins size={10} />
                            {u.vittaCoins} ViTTA Coins
                          </div>
                        ) : null}
                      </td>

                      {/* Status Conta */}
                      <td className="p-4">
                        {u.isBlocked ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 inline-flex items-center gap-1">
                            <Lock size={10} /> Bloqueado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                            <Unlock size={10} /> Ativo
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão de Edição Completa de Todos os Campos */}
                          <button
                            onClick={() => {
                              setEditingUser({ ...u });
                              setActiveModalTab("personal");
                            }}
                            className="p-2 text-vitta-accent hover:bg-vitta-accent/10 rounded-xl transition-all font-bold text-xs flex items-center gap-1 border border-vitta-accent/20"
                            title="Editar Todos os Campos dos Dados do Usuário"
                          >
                            <Edit size={14} />
                            <span>Editar Tudo</span>
                          </button>

                          {/* Botão Bloquear / Desbloquear */}
                          <button
                            onClick={() => handleToggleBlockUser(u)}
                            className={`p-2 rounded-xl transition-all border ${
                              u.isBlocked
                                ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30"
                                : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-500/30"
                            }`}
                            title={u.isBlocked ? "Desbloquear Usuário" : "Bloquear Usuário"}
                          >
                            {u.isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>

                          {/* Botão Excluir */}
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name || u.email || "Usuário")}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-500/20 rounded-xl transition-all"
                            title="Excluir Usuário Permanentemente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ALTERAÇÃO RÁPIDA DE PLANO DE ASSINATURA */}
      {quickPlanUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-vitta-surface w-full max-w-lg rounded-3xl shadow-2xl border border-vitta-border p-6 space-y-5">
            <div className="flex justify-between items-start border-b border-vitta-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-vitta-accent/10 text-vitta-accent flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-vitta-text-primary">
                    Alterar Plano de Assinatura
                  </h3>
                  <p className="text-xs text-vitta-text-secondary">
                    Usuário: <strong className="text-vitta-text-primary">{quickPlanUser.name || quickPlanUser.email}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickPlanUser(null)}
                className="p-1.5 text-vitta-text-muted hover:text-vitta-text-primary rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-vitta-text-secondary mb-1.5 block">
                  Selecione o Novo Plano ViTTA:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availablePlans.map((plan) => {
                    const isSelected = selectedQuickPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedQuickPlanId(plan.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-vitta-accent bg-vitta-accent/10 ring-1 ring-vitta-accent"
                            : "border-vitta-border bg-vitta-surface-2 hover:border-vitta-accent/50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-xs text-vitta-text-primary">{plan.name}</span>
                          {isSelected && <Check size={14} className="text-vitta-accent" />}
                        </div>
                        <div className="text-xs font-black text-vitta-accent mt-1">
                          {plan.price > 0 ? `R$ ${plan.price.toFixed(2)}` : "Gratuito"}
                          <span className="text-[10px] font-normal text-vitta-text-muted"> /{plan.frequency}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-vitta-text-secondary mb-1.5 block">
                  Status da Assinatura:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuickPlanStatus("active")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedQuickPlanStatus === "active"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500"
                        : "bg-vitta-surface-2 text-vitta-text-secondary border-vitta-border"
                    }`}
                  >
                    ✓ Ativa
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedQuickPlanStatus("trial")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedQuickPlanStatus === "trial"
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500"
                        : "bg-vitta-surface-2 text-vitta-text-secondary border-vitta-border"
                    }`}
                  >
                    Período Teste
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedQuickPlanStatus("inactive")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedQuickPlanStatus === "inactive"
                        ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500"
                        : "bg-vitta-surface-2 text-vitta-text-secondary border-vitta-border"
                    }`}
                  >
                    Inativa / Cancelada
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  O Admin Master tem autonomia total para conceder, migrar ou revogar qualquer plano sem necessidade de cobrança prévia. O paciente receberá uma notificação instantânea.
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuickPlanUser(null)}
                className="flex-1 py-2.5 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold hover:bg-vitta-border transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleApplyQuickPlan}
                className="flex-1 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold shadow-lg shadow-vitta-accent/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                Confirmar Alteração
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PAINEL COMPLETO DE ACESSO TOTAL A TODOS OS CAMPOS DO USUÁRIO */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-vitta-surface w-full max-w-2xl rounded-3xl shadow-2xl border border-vitta-border p-6 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-vitta-border pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Crown size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-vitta-text-primary flex items-center gap-2">
                    Acesso Total aos Dados do Usuário
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      Master
                    </span>
                  </h3>
                  <p className="text-xs text-vitta-text-secondary">
                    ID Firestore: <span className="font-mono text-vitta-text-muted">{editingUser.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-vitta-text-muted hover:text-vitta-text-primary rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs Inside Modal */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-vitta-border shrink-0 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveModalTab("personal")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeModalTab === "personal"
                    ? "bg-vitta-accent text-white"
                    : "text-vitta-text-secondary hover:bg-vitta-surface-2"
                }`}
              >
                <Users size={14} />
                Dados Pessoais
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab("subscription")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeModalTab === "subscription"
                    ? "bg-vitta-accent text-white"
                    : "text-vitta-text-secondary hover:bg-vitta-surface-2"
                }`}
              >
                <CreditCard size={14} />
                Plano de Assinatura
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab("wallet")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeModalTab === "wallet"
                    ? "bg-vitta-accent text-white"
                    : "text-vitta-text-secondary hover:bg-vitta-surface-2"
                }`}
              >
                <Wallet size={14} />
                Carteira & Moedas
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab("access")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeModalTab === "access"
                    ? "bg-vitta-accent text-white"
                    : "text-vitta-text-secondary hover:bg-vitta-surface-2"
                }`}
              >
                <Shield size={14} />
                Nível & Permissões
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab("address")}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeModalTab === "address"
                    ? "bg-vitta-accent text-white"
                    : "text-vitta-text-secondary hover:bg-vitta-surface-2"
                }`}
              >
                <MapPin size={14} />
                Endereço & Médico
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="master-edit-user-form" onSubmit={handleSaveAllUserData} className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* TAB 1: DADOS PESSOAIS */}
              {activeModalTab === "personal" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Nome Completo</label>
                      <input
                        type="text"
                        value={editingUser.name || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        placeholder="Nome do usuário"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">E-mail Cadastrado</label>
                      <input
                        type="email"
                        value={editingUser.email || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        placeholder="usuario@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">CPF</label>
                      <input
                        type="text"
                        value={editingUser.cpf || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, cpf: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        value={editingUser.phone || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Data de Nascimento</label>
                      <input
                        type="date"
                        value={editingUser.birthDate || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, birthDate: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Gênero</label>
                      <select
                        value={editingUser.gender || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      >
                        <option value="">Não especificado</option>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro / Prefere não informar</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PLANO DE ASSINATURA (FOCO TOTAL NA SOLICITAÇÃO) */}
              {activeModalTab === "subscription" && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Alteração Direta do Plano de Saúde pelo Admin Master
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                      Full Access
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Status da Assinatura</label>
                      <select
                        value={editingUser.subscriptionStatus || "inactive"}
                        onChange={(e) => setEditingUser({ ...editingUser, subscriptionStatus: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-bold text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      >
                        <option value="active">✓ Ativa (Acesso Total aos Benefícios)</option>
                        <option value="trial">Período de Testes (Trial)</option>
                        <option value="inactive">Inativa / Básico (Sem Mensalidade)</option>
                        <option value="canceled">Cancelada</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Plano Selecionado</label>
                      <select
                        value={editingUser.plan || "free"}
                        onChange={(e) => {
                          const chosen = availablePlans.find((p) => p.id === e.target.value);
                          setEditingUser({
                            ...editingUser,
                            plan: e.target.value,
                            planId: e.target.value,
                            planName: chosen?.name || e.target.value,
                            planPrice: chosen ? chosen.price : editingUser.planPrice,
                          });
                        }}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-bold text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      >
                        {availablePlans.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.price > 0 ? `(R$ ${p.price.toFixed(2)}/mês)` : "(Grátis)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Valor Mensal (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingUser.planPrice ?? 0}
                        onChange={(e) => setEditingUser({ ...editingUser, planPrice: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Periodicidade</label>
                      <select
                        value={editingUser.planFrequency || "mensal"}
                        onChange={(e) => setEditingUser({ ...editingUser, planFrequency: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      >
                        <option value="mensal">Mensal</option>
                        <option value="trimestral">Trimestral</option>
                        <option value="semestral">Semestral</option>
                        <option value="anual">Anual</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">ID de Referência</label>
                      <input
                        type="text"
                        value={editingUser.subscriptionId || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, subscriptionId: e.target.value })}
                        placeholder="Ex: MP-SUB-12345"
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Data Início do Plano</label>
                      <input
                        type="date"
                        value={editingUser.subscriptionStartDate || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, subscriptionStartDate: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Data de Expiração / Renovação</label>
                      <input
                        type="date"
                        value={editingUser.subscriptionExpiresAt || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, subscriptionExpiresAt: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CARTEIRA & MOEDAS */}
              {activeModalTab === "wallet" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">
                        Saldo Carteira ViTTA Pay (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingUser.walletBalance ?? 0}
                        onChange={(e) => setEditingUser({ ...editingUser, walletBalance: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">
                        Moedas Bônus (ViTTA Coins)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={editingUser.vittaCoins ?? 0}
                        onChange={(e) => setEditingUser({ ...editingUser, vittaCoins: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-bold text-amber-500 focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Chave PIX Cadastrada</label>
                      <input
                        type="text"
                        value={editingUser.pixKey || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, pixKey: e.target.value })}
                        placeholder="CPF, email ou telefone"
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Tipo de Chave PIX</label>
                      <select
                        value={editingUser.pixKeyType || "cpf"}
                        onChange={(e) => setEditingUser({ ...editingUser, pixKeyType: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      >
                        <option value="cpf">CPF / CNPJ</option>
                        <option value="email">E-mail</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Chave Aleatória</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: NÍVEL DE ACESSO & PERMISSÕES */}
              {activeModalTab === "access" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Perfil do Sistema (Role)</label>
                      <select
                        value={editingUser.role || "patient"}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-bold text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      >
                        <option value="patient">Paciente</option>
                        <option value="professional">Profissional de Saúde / Médico</option>
                        <option value="liberal">Profissional Liberal</option>
                        <option value="admin">Administrador Geral</option>
                        <option value="master">Admin Master (Acesso Irrestrito)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Status da Conta</label>
                      <select
                        value={editingUser.isBlocked ? "blocked" : (editingUser.status || "active")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingUser({
                            ...editingUser,
                            status: val,
                            isBlocked: val === "blocked",
                          });
                        }}
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs font-bold text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      >
                        <option value="active">✓ Ativa & Liberada</option>
                        <option value="blocked">⛔ Bloqueada (Impedir Login)</option>
                        <option value="suspended">⚠️ Suspensa Temporariamente</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-vitta-text-secondary">
                      Notas Internas do Admin Master (Privadas)
                    </label>
                    <textarea
                      rows={3}
                      value={editingUser.adminNotes || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, adminNotes: e.target.value })}
                      placeholder="Anotações internas sobre concessão de plano, suporte, histórico do usuário..."
                      className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: ENDEREÇO & PROFISSIONAL */}
              {activeModalTab === "address" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">CEP</label>
                      <input
                        type="text"
                        value={editingUser.cep || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, cep: e.target.value })}
                        placeholder="00000-000"
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Logradouro / Endereço</label>
                      <input
                        type="text"
                        value={editingUser.address || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                        placeholder="Rua, Avenida..."
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Número</label>
                      <input
                        type="text"
                        value={editingUser.number || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, number: e.target.value })}
                        placeholder="123"
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Bairro</label>
                      <input
                        type="text"
                        value={editingUser.neighborhood || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, neighborhood: e.target.value })}
                        placeholder="Bairro"
                        className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-vitta-text-secondary">Cidade / UF</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={editingUser.city || ""}
                          onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                          placeholder="Cidade"
                          className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                        <input
                          type="text"
                          maxLength={2}
                          value={editingUser.state || ""}
                          onChange={(e) => setEditingUser({ ...editingUser, state: e.target.value.toUpperCase() })}
                          placeholder="UF"
                          className="w-14 px-2 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados específicos de médico/profissional */}
                  <div className="pt-2 border-t border-vitta-border space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-vitta-text-muted">
                      Dados Profissionais (Caso seja Médico/Profissional):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-vitta-text-secondary">CRM / Registro</label>
                        <input
                          type="text"
                          value={editingUser.crm || ""}
                          onChange={(e) => setEditingUser({ ...editingUser, crm: e.target.value })}
                          placeholder="Ex: CRM/SP 123456"
                          className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-vitta-text-secondary">Especialidade</label>
                        <input
                          type="text"
                          value={editingUser.specialty || ""}
                          onChange={(e) => setEditingUser({ ...editingUser, specialty: e.target.value })}
                          placeholder="Ex: Cardiologia"
                          className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-vitta-text-secondary">Preço Consulta (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingUser.consultationPrice ?? 0}
                          onChange={(e) => setEditingUser({ ...editingUser, consultationPrice: e.target.value })}
                          className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Modal Footer Controls */}
            <div className="flex gap-3 pt-3 border-t border-vitta-border shrink-0">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2.5 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold hover:bg-vitta-border transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="master-edit-user-form"
                disabled={isSaving}
                className="flex-1 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold shadow-lg shadow-vitta-accent/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                Salvar Todos os Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
