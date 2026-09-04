import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  X,
  Check,
  CheckCircle,
  XCircle,
  Upload,
  MapPin,
  Mail,
  Phone,
  Tag,
  Stethoscope,
  Percent,
  DollarSign,
  ShieldCheck,
  Crown,
  Receipt,
  Clock,
  Sparkles,
  Building,
  FileText,
  Award,
  CreditCard,
  UserCheck,
  HelpCircle,
  Globe,
  Video,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import { logAdminAction } from "../../lib/audit";
import { fetchAddressByCep } from "../../lib/utils";

interface ProfessionalsManagementViewProps {
  onOpenAgenda?: (prof: any) => void;
}

const defaultProfessionalValues = {
  name: "",
  specialty: "Médico",
  vittaHealthDiscount: "20% OFF",
  registrationNumber: "",
  rqe: "",
  cpf: "",
  cnpj: "",
  availableDays: "Segunda a Sexta",
  availableHours: "08:00 às 18:00",
  durationMinutes: 30,
  price: "R$ 150,00",
  city: "",
  imageUrl: "",
  bio: "",
  whatsapp: "",
  phone: "",
  email: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  localidade: "",
  uf: "",
  feeRate: 15,
  billingModel: "per_consultation", // Lançamento individual de fatura por consulta
  telemedicineEnabled: true,
  inPersonEnabled: true,
  telemedicineRoomUrl: "",
  pixKey: "",
  pixKeyType: "cpf",
  bankName: "",
  status: "active",
  kycStatus: "approved",
  isVerified: true,
  featured: false,
  adminNotes: "",
};

export const ProfessionalsManagementView: React.FC<ProfessionalsManagementViewProps> = ({
  onOpenAgenda,
}) => {
  const { addToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"list" | "categories" | "pending">("list");
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreating, setIsCreating] = useState<"professional" | "category" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  const [newItem, setNewItem] = useState({ ...defaultProfessionalValues });

  useEffect(() => {
    const unsubProfs = onSnapshot(collection(db, "professionals"), (snapshot) => {
      setProfessionals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubCats = onSnapshot(collection(db, "categories"), (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCategories(all.filter((c: any) => c.type === "professional"));
    });

    return () => {
      unsubProfs();
      unsubCats();
    };
  }, []);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewItem((prev) => ({ ...prev, cep: val }));
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length === 8) {
      setLoadingCep(true);
      try {
        const addr = await fetchAddressByCep(cleaned);
        if (addr) {
          setNewItem((prev) => ({
            ...prev,
            logradouro: addr.street || prev.logradouro || "",
            bairro: addr.neighborhood || prev.bairro || "",
            localidade: addr.city || prev.localidade || "",
            uf: addr.state || prev.uf || "",
            city: addr.city ? `${addr.city} - ${addr.state}` : prev.city,
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleEditingCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditingItem((prev: any) => ({ ...prev, cep: val }));
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length === 8) {
      setLoadingCep(true);
      try {
        const addr = await fetchAddressByCep(cleaned);
        if (addr) {
          setEditingItem((prev: any) => ({
            ...prev,
            logradouro: addr.street || prev.logradouro || "",
            bairro: addr.neighborhood || prev.bairro || "",
            localidade: addr.city || prev.localidade || "",
            uf: addr.state || prev.uf || "",
            city: addr.city ? `${addr.city} - ${addr.state}` : prev.city,
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleOpenEdit = (prof: any) => {
    setEditingItem({
      ...defaultProfessionalValues,
      ...prof,
      type: "professional",
      feeRate:
        prof.feeRate !== undefined && !isNaN(Number(prof.feeRate))
          ? Number(prof.feeRate)
          : 15,
      telemedicineEnabled: prof.telemedicineEnabled !== false,
      inPersonEnabled: prof.inPersonEnabled !== false,
      status: prof.status || "active",
      kycStatus: prof.kycStatus || "approved",
      billingModel: prof.billingModel || "per_consultation",
      isVerified: prof.isVerified ?? true,
      featured: prof.featured ?? false,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreating === "professional") {
        const docRef = await addDoc(collection(db, "professionals"), {
          ...newItem,
          feeRate: Number(newItem.feeRate) || 15,
          createdAt: new Date().toISOString(),
          status: newItem.status || "active",
          kycStatus: newItem.kycStatus || "approved",
        });
        await logAdminAction("CREATE_PROFESSIONAL", `Criou profissional ${newItem.name} com Taxa ViTTA de ${newItem.feeRate}%`);
        addToast("Profissional cadastrado com sucesso!", "success");
      } else if (isCreating === "category") {
        await addDoc(collection(db, "categories"), {
          name: newItem.name,
          slug: newItem.name.toLowerCase().replace(/\s+/g, "-"),
          type: "professional",
          createdAt: new Date().toISOString(),
        });
        await logAdminAction("CREATE_CATEGORY", `Criou categoria ${newItem.name}`);
        addToast("Categoria criada com sucesso!", "success");
      }
      setIsCreating(null);
      setNewItem({ ...defaultProfessionalValues });
    } catch (err) {
      console.error(err);
      addToast("Erro ao cadastrar.", "error");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const coll = editingItem.type === "category" ? "categories" : "professionals";
      
      const payload: any = {
        ...editingItem,
        feeRate: Number(editingItem.feeRate) || 15,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, coll, editingItem.id), payload);

      // Sincroniza dados com a coleção de usuários se houver vínculo
      if (editingItem.userId) {
        try {
          await updateDoc(doc(db, "users", editingItem.userId), {
            name: editingItem.name,
            specialty: editingItem.specialty,
            crm: editingItem.registrationNumber || "",
            phone: editingItem.whatsapp || editingItem.phone || "",
            feeRate: Number(editingItem.feeRate) || 15,
            pixKey: editingItem.pixKey || "",
            pixKeyType: editingItem.pixKeyType || "cpf",
            vittaHealthDiscount: editingItem.vittaHealthDiscount || "20% OFF",
            city: editingItem.city || "",
          });
        } catch (syncErr) {
          console.warn("Vínculo de usuário não encontrado ou sem permissão de sync:", syncErr);
        }
      }

      await logAdminAction(
        "EDIT_ITEM",
        `Master editou ${coll}: ${editingItem.name} (Taxa ViTTA: ${editingItem.feeRate}%, Faturamento: ${editingItem.billingModel || 'per_consultation'})`
      );
      addToast("Profissional atualizado com sucesso!", "success");
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      addToast("Erro ao salvar alterações.", "error");
    }
  };

  const handleDelete = async (id: string, type: "professional" | "category", name: string) => {
    if (!window.confirm(`Deseja realmente remover "${name}"?`)) return;
    try {
      const coll = type === "category" ? "categories" : "professionals";
      await deleteDoc(doc(db, coll, id));
      await logAdminAction("DELETE_ITEM", `Removeu ${type}: ${name}`);
      addToast(`${type === "category" ? "Categoria" : "Profissional"} removido(a).`, "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao remover.", "error");
    }
  };

  const handleApproveKYC = async (prof: any, approve: boolean) => {
    try {
      await updateDoc(doc(db, "professionals", prof.id), {
        kycStatus: approve ? "approved" : "rejected",
        status: approve ? "active" : "pending",
        approvedAt: new Date().toISOString(),
      });

      const recipientUserId = prof.userId || prof.uid || prof.id;
      if (recipientUserId) {
        if (approve) {
          await addDoc(collection(db, "notifications"), {
            userId: recipientUserId,
            title: "Documentação Aprovada!",
            message: "Seu cadastro profissional foi validado com sucesso pela equipe ViTTA. Sua agenda já está disponível para pacientes.",
            type: "kyc_approved",
            read: false,
            createdAt: Timestamp.now(),
          });
        } else {
          await addDoc(collection(db, "notifications"), {
            userId: recipientUserId,
            title: "Documentação Pendente / Recusada",
            message: "Foram identificadas pendências na verificação dos seus documentos. Por favor, acesse seu painel profissional e reenvie seu CRM/diploma para nova análise.",
            type: "kyc_rejected",
            read: false,
            createdAt: Timestamp.now(),
          });
        }
      }

      await logAdminAction("KYC_APPROVAL", `${approve ? "Aprovou" : "Rejeitou"} KYC de ${prof.name}`);
      addToast(`Profissional ${approve ? "aprovado" : "rejeitado"} com sucesso.`, "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao atualizar status KYC.", "error");
    }
  };

  const filteredProfessionals = professionals.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeSubTab === "pending") return matchesSearch && (p.kycStatus === "pending" || p.status === "pending");
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Sub tabs & header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-vitta-surface p-4 rounded-2xl border border-vitta-border">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("list")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "list"
                ? "bg-vitta-accent text-white shadow-md shadow-vitta-accent/20"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Profissionais ({professionals.length})
          </button>
          <button
            onClick={() => setActiveSubTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "categories"
                ? "bg-vitta-accent text-white shadow-md shadow-vitta-accent/20"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Especialidades ({categories.length})
          </button>
          <button
            onClick={() => setActiveSubTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "pending"
                ? "bg-vitta-accent text-white shadow-md shadow-vitta-accent/20"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Pendentes KYC ({professionals.filter((p) => p.kycStatus === "pending" || p.status === "pending").length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nome, CRM, especialidade ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent w-48 lg:w-72"
            />
          </div>
          {activeSubTab === "categories" ? (
            <button
              onClick={() => setIsCreating("category")}
              className="px-4 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-vitta-accent/90 transition-all shadow-md shadow-vitta-accent/20"
            >
              <Plus size={16} />
              Nova Especialidade
            </button>
          ) : (
            <button
              onClick={() => {
                setNewItem({ ...defaultProfessionalValues });
                setIsCreating("professional");
              }}
              className="px-4 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-vitta-accent/90 transition-all shadow-md shadow-vitta-accent/20"
            >
              <Plus size={16} />
              Novo Profissional
            </button>
          )}
        </div>
      </div>

      {/* Categories View */}
      {activeSubTab === "categories" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 bg-vitta-surface border border-vitta-border rounded-2xl flex items-center justify-between shadow-sm hover:border-vitta-accent/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-vitta-accent/10 flex items-center justify-center text-vitta-accent font-bold">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-vitta-text-primary">{cat.name}</h4>
                  <p className="text-[11px] text-vitta-text-muted">{cat.slug}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(cat.id, "category", cat.name)}
                className="p-2 text-vitta-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                title="Excluir Categoria"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Professionals & Pending View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProfessionals.map((prof) => (
            <div
              key={prof.id}
              className="p-5 bg-vitta-surface border border-vitta-border rounded-2xl flex flex-col justify-between shadow-sm hover:border-vitta-accent/40 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-vitta-surface-2 border border-vitta-border overflow-hidden shrink-0 flex items-center justify-center font-bold text-vitta-text-muted">
                    {prof.imageUrl ? (
                      <img
                        src={prof.imageUrl}
                        alt={prof.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Users size={22} className="text-vitta-accent" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-vitta-text-primary line-clamp-1">{prof.name}</h4>
                      {prof.isVerified !== false && (
                        <span title="Verificado ViTTA">
                          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className="inline-block px-2.5 py-0.5 bg-vitta-accent/10 text-vitta-accent rounded-full text-[10px] font-bold">
                      {prof.specialty || "Médico"}
                    </span>
                    {prof.registrationNumber && (
                      <p className="text-[10px] text-vitta-text-muted mt-0.5">CRM/Reg: {prof.registrationNumber}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(prof)}
                    className="p-1.5 text-vitta-text-muted hover:text-vitta-accent hover:bg-vitta-surface-2 rounded-lg transition-all"
                    title="Editar Todos os Campos (Admin Master)"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(prof.id, "professional", prof.name)}
                    className="p-1.5 text-vitta-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-vitta-surface-2 p-3 rounded-xl border border-vitta-border">
                <div>
                  <span className="text-vitta-text-muted block text-[10px]">Valor Consulta:</span>
                  <span className="font-bold text-vitta-text-primary">{prof.price || "R$ 150,00"}</span>
                </div>
                <div>
                  <span className="text-vitta-text-muted block text-[10px]">Desconto Convênio:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{prof.vittaHealthDiscount || "20% OFF"}</span>
                </div>
                <div>
                  <span className="text-vitta-text-muted block text-[10px]">Cidade:</span>
                  <span className="font-medium text-vitta-text-primary line-clamp-1">{prof.city || "Não informada"}</span>
                </div>
                <div>
                  <span className="text-vitta-text-muted block text-[10px]">Taxa ViTTA (Split/Fatura):</span>
                  <span className="font-black text-vitta-accent bg-vitta-accent/10 px-1.5 py-0.5 rounded">
                    {prof.feeRate !== undefined ? prof.feeRate : 15}%
                  </span>
                </div>
              </div>

              {/* KYC Actions for Pending */}
              {activeSubTab === "pending" || prof.kycStatus === "pending" ? (
                <div className="flex items-center gap-2 pt-2 border-t border-vitta-border">
                  <button
                    onClick={() => handleApproveKYC(prof, true)}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle size={14} />
                    Aprovar KYC
                  </button>
                  <button
                    onClick={() => handleApproveKYC(prof, false)}
                    className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <XCircle size={14} />
                    Rejeitar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2 border-t border-vitta-border">
                  {onOpenAgenda && (
                    <button
                      onClick={() => onOpenAgenda(prof)}
                      className="flex-1 py-2 bg-vitta-surface-2 hover:bg-vitta-accent hover:text-white text-vitta-text-primary border border-vitta-border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Calendar size={14} />
                      Configurar Agenda
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEdit(prof)}
                    className="px-3 py-2 bg-vitta-accent/10 hover:bg-vitta-accent text-vitta-accent hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Editar Detalhes e Taxa"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Complete Edit / Create Modal for Admin Master */}
      <AnimatePresence>
        {(isCreating || editingItem) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-vitta-surface w-full max-w-3xl rounded-3xl shadow-2xl border border-vitta-border overflow-hidden max-h-[92vh] flex flex-col my-auto"
            >
              {/* Header */}
              <div className="p-5 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-vitta-accent/10 text-vitta-accent flex items-center justify-center font-bold">
                    {isCreating === "category" || editingItem?.type === "category" ? (
                      <Tag size={20} />
                    ) : (
                      <Crown size={20} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-vitta-text-primary">
                        {editingItem
                          ? editingItem.type === "category"
                            ? "Editar Especialidade"
                            : `Editar Profissional: ${editingItem.name || ""}`
                          : isCreating === "category"
                          ? "Nova Especialidade Médica"
                          : "Novo Profissional de Saúde"}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-vitta-accent/15 text-vitta-accent border border-vitta-accent/20">
                        Admin Master
                      </span>
                    </div>
                    <p className="text-xs text-vitta-text-muted">
                      Acesso total para gestão cadastral, Taxa ViTTA e modelo de faturamento por consulta.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsCreating(null);
                    setEditingItem(null);
                  }}
                  className="p-2 hover:bg-vitta-surface rounded-xl text-vitta-text-muted hover:text-vitta-text-primary transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Body */}
              <form
                onSubmit={editingItem ? handleSaveEdit : handleCreate}
                className="p-6 space-y-6 overflow-y-auto"
              >
                {isCreating === "category" || editingItem?.type === "category" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-vitta-text-secondary flex items-center gap-1.5">
                        <Tag size={14} className="text-vitta-accent" />
                        Nome da Especialidade
                      </label>
                      <input
                        type="text"
                        required
                        value={editingItem ? editingItem.name : newItem.name}
                        onChange={(e) =>
                          editingItem
                            ? setEditingItem({ ...editingItem, name: e.target.value })
                            : setNewItem({ ...newItem, name: e.target.value })
                        }
                        placeholder="Ex: Cardiologia, Dermatologia, Nutrição..."
                        className="w-full px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* SEÇÃO 1: Identificação & Perfil Geral */}
                    <div className="bg-vitta-surface-2/60 border border-vitta-border rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-vitta-border">
                        <Users size={16} className="text-vitta-accent" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-vitta-text-primary">
                          1. Identificação & Contato do Profissional
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Nome Completo *
                          </label>
                          <input
                            type="text"
                            required
                            value={editingItem ? editingItem.name : newItem.name}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, name: e.target.value })
                                : setNewItem({ ...newItem, name: e.target.value })
                            }
                            placeholder="Dr(a). Nome Sobrenome"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            CPF ou CNPJ
                          </label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.cpf || editingItem.cnpj || "" : newItem.cpf}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, cpf: e.target.value })
                                : setNewItem({ ...newItem, cpf: e.target.value })
                            }
                            placeholder="000.000.000-00"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary flex items-center gap-1">
                            <Mail size={12} className="text-vitta-accent" />
                            E-mail de Acesso / Contato *
                          </label>
                          <input
                            type="email"
                            required
                            value={editingItem ? editingItem.email || "" : newItem.email}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, email: e.target.value })
                                : setNewItem({ ...newItem, email: e.target.value })
                            }
                            placeholder="medico@vitta.com"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary flex items-center gap-1">
                            <Phone size={12} className="text-vitta-accent" />
                            WhatsApp / Telefone *
                          </label>
                          <input
                            type="text"
                            required
                            value={editingItem ? editingItem.whatsapp || editingItem.phone || "" : newItem.whatsapp}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, whatsapp: e.target.value, phone: e.target.value })
                                : setNewItem({ ...newItem, whatsapp: e.target.value, phone: e.target.value })
                            }
                            placeholder="(11) 99999-9999"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary flex items-center justify-between">
                          <span>URL da Foto de Perfil</span>
                          {(editingItem?.imageUrl || newItem.imageUrl) && (
                            <span className="text-[10px] text-emerald-500 font-bold">✓ Imagem carregada</span>
                          )}
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-vitta-surface border border-vitta-border overflow-hidden shrink-0 flex items-center justify-center">
                            {(editingItem ? editingItem.imageUrl : newItem.imageUrl) ? (
                              <img
                                src={editingItem ? editingItem.imageUrl : newItem.imageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Users size={16} className="text-vitta-text-muted" />
                            )}
                          </div>
                          <input
                            type="url"
                            value={editingItem ? editingItem.imageUrl || "" : newItem.imageUrl}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, imageUrl: e.target.value })
                                : setNewItem({ ...newItem, imageUrl: e.target.value })
                            }
                            placeholder="https://exemplo.com/foto-perfil.jpg"
                            className="flex-1 px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">
                          Mini Biografia / Resumo Profissional
                        </label>
                        <textarea
                          rows={2}
                          value={editingItem ? editingItem.bio || "" : newItem.bio}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, bio: e.target.value })
                              : setNewItem({ ...newItem, bio: e.target.value })
                          }
                          placeholder="Breve currículo, especializações acadêmicas e experiência clínica..."
                          className="w-full px-3.5 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent resize-none"
                        />
                      </div>
                    </div>

                    {/* SEÇÃO 2: Especialidade & Registro Profissional */}
                    <div className="bg-vitta-surface-2/60 border border-vitta-border rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-vitta-border">
                        <Stethoscope size={16} className="text-vitta-accent" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-vitta-text-primary">
                          2. Especialidade, CRM e Registro Profissional
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Especialidade Principal *
                          </label>
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              required
                              value={editingItem ? editingItem.specialty : newItem.specialty}
                              onChange={(e) =>
                                editingItem
                                  ? setEditingItem({ ...editingItem, specialty: e.target.value })
                                  : setNewItem({ ...newItem, specialty: e.target.value })
                              }
                              placeholder="Ex: Cardiologia, Nutrição..."
                              className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                            />
                            {categories.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {categories.slice(0, 4).map((c) => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() =>
                                      editingItem
                                        ? setEditingItem({ ...editingItem, specialty: c.name })
                                        : setNewItem({ ...newItem, specialty: c.name })
                                    }
                                    className="px-2 py-0.5 bg-vitta-surface hover:bg-vitta-accent/10 border border-vitta-border rounded-lg text-[10px] text-vitta-text-secondary hover:text-vitta-accent transition-colors"
                                  >
                                    {c.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Registro Profissional (CRM / CRO / CRP)
                          </label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.registrationNumber || "" : newItem.registrationNumber}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, registrationNumber: e.target.value })
                                : setNewItem({ ...newItem, registrationNumber: e.target.value })
                            }
                            placeholder="CRM-SP 123456"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            RQE (Qualificação Especialista)
                          </label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.rqe || "" : newItem.rqe}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, rqe: e.target.value })
                                : setNewItem({ ...newItem, rqe: e.target.value })
                            }
                            placeholder="RQE 98765"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Dias de Atendimento
                          </label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.availableDays || "" : newItem.availableDays}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, availableDays: e.target.value })
                                : setNewItem({ ...newItem, availableDays: e.target.value })
                            }
                            placeholder="Segunda a Sexta"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Horários de Atendimento
                          </label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.availableHours || "" : newItem.availableHours}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, availableHours: e.target.value })
                                : setNewItem({ ...newItem, availableHours: e.target.value })
                            }
                            placeholder="08:00 às 18:00"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Duração da Consulta (minutos)
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="180"
                            step="5"
                            value={editingItem ? editingItem.durationMinutes || 30 : newItem.durationMinutes}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, durationMinutes: Number(e.target.value) })
                                : setNewItem({ ...newItem, durationMinutes: Number(e.target.value) })
                            }
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEÇÃO 3: Modalidades & Endereço do Consultório */}
                    <div className="bg-vitta-surface-2/60 border border-vitta-border rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-vitta-border">
                        <MapPin size={16} className="text-vitta-accent" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-vitta-text-primary">
                          3. Modalidades de Atendimento & Endereço Físico
                        </h4>
                      </div>

                      {/* Toggles de Modalidade */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-vitta-surface rounded-xl border border-vitta-border">
                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-vitta-surface-2 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <Video size={16} className="text-vitta-accent" />
                            <div>
                              <p className="text-xs font-bold text-vitta-text-primary">Telemedicina (Online)</p>
                              <p className="text-[10px] text-vitta-text-muted">Consultas via Sala Virtual ViTTA</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={editingItem ? editingItem.telemedicineEnabled !== false : newItem.telemedicineEnabled}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, telemedicineEnabled: e.target.checked })
                                : setNewItem({ ...newItem, telemedicineEnabled: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-vitta-accent accent-vitta-accent"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-vitta-surface-2 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <Building size={16} className="text-emerald-500" />
                            <div>
                              <p className="text-xs font-bold text-vitta-text-primary">Atendimento Presencial</p>
                              <p className="text-[10px] text-vitta-text-muted">Consultório / Clínica física</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={editingItem ? editingItem.inPersonEnabled !== false : newItem.inPersonEnabled}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, inPersonEnabled: e.target.checked })
                                : setNewItem({ ...newItem, inPersonEnabled: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-vitta-accent accent-vitta-accent"
                          />
                        </label>
                      </div>

                      {/* Endereço */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            CEP {loadingCep && "(Buscando no ViaCEP...)"}
                          </label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.cep || "" : newItem.cep}
                            onChange={editingItem ? handleEditingCepChange : handleCepChange}
                            placeholder="00000-000"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent font-mono"
                          />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Logradouro / Rua
                          </label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.logradouro || "" : newItem.logradouro}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, logradouro: e.target.value })
                                : setNewItem({ ...newItem, logradouro: e.target.value })
                            }
                            placeholder="Av. Paulista, Rua das Flores..."
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">Número</label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.numero || "" : newItem.numero}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, numero: e.target.value })
                                : setNewItem({ ...newItem, numero: e.target.value })
                            }
                            placeholder="123"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">Complemento / Sala</label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.complemento || "" : newItem.complemento}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, complemento: e.target.value })
                                : setNewItem({ ...newItem, complemento: e.target.value })
                            }
                            placeholder="Sala 402, Bloco B"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">Bairro</label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.bairro || "" : newItem.bairro}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, bairro: e.target.value })
                                : setNewItem({ ...newItem, bairro: e.target.value })
                            }
                            placeholder="Bela Vista"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">Cidade / UF</label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.city || "" : newItem.city}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, city: e.target.value })
                                : setNewItem({ ...newItem, city: e.target.value })
                            }
                            placeholder="São Paulo - SP"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEÇÃO 4: Financeiro, Taxa ViTTA e Faturamento Individual (Destaque Admin Master) */}
                    <div className="bg-gradient-to-br from-vitta-accent/5 via-vitta-surface-2 to-emerald-500/5 border-2 border-vitta-accent/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-vitta-border">
                        <div className="flex items-center gap-2">
                          <Receipt size={18} className="text-vitta-accent" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-vitta-text-primary">
                            4. Financeiro, Taxa ViTTA & Faturamento por Consulta
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-vitta-accent bg-vitta-accent/10 px-2.5 py-0.5 rounded-full w-fit">
                          Controle Exclusivo Admin Master
                        </span>
                      </div>

                      {/* Banner Explicativo */}
                      <div className="p-3 bg-vitta-surface rounded-xl border border-vitta-accent/20 text-xs text-vitta-text-secondary flex items-start gap-2.5">
                        <Receipt size={16} className="text-vitta-accent shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong className="text-vitta-text-primary">Regra de Faturamento ViTTA:</strong> A Taxa ViTTA definida abaixo é descontada automaticamente em teleconsultas online e gera <strong>faturas com lançamentos individuais de cada consulta presencial</strong> realizada pelo profissional.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary flex items-center gap-1">
                            <DollarSign size={12} className="text-vitta-accent" />
                            Valor Particular da Consulta *
                          </label>
                          <input
                            type="text"
                            required
                            value={editingItem ? editingItem.price || "" : newItem.price}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, price: e.target.value })
                                : setNewItem({ ...newItem, price: e.target.value })
                            }
                            placeholder="R$ 150,00"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-bold text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary flex items-center gap-1">
                            <Percent size={12} className="text-emerald-500" />
                            Desconto Convênio ViTTA
                          </label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.vittaHealthDiscount || "" : newItem.vittaHealthDiscount}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, vittaHealthDiscount: e.target.value })
                                : setNewItem({ ...newItem, vittaHealthDiscount: e.target.value })
                            }
                            placeholder="20% OFF"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-vitta-accent"
                          />
                        </div>

                        {/* TAXA VITTA (%) */}
                        <div className="space-y-1.5 bg-vitta-surface p-2.5 rounded-xl border-2 border-vitta-accent shadow-sm">
                          <label className="text-xs font-black text-vitta-accent flex items-center justify-between">
                            <span>Taxa ViTTA Cobrada (%)</span>
                            <span className="text-[10px] uppercase tracking-wider text-vitta-text-muted">Split & Fatura</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              required
                              value={editingItem ? (editingItem.feeRate !== undefined ? editingItem.feeRate : 15) : newItem.feeRate}
                              onChange={(e) => {
                                const rate = Number(e.target.value);
                                if (editingItem) {
                                  setEditingItem({ ...editingItem, feeRate: rate });
                                } else {
                                  setNewItem({ ...newItem, feeRate: rate });
                                }
                              }}
                              className="w-20 px-3 py-1.5 bg-vitta-surface-2 border border-vitta-accent/40 rounded-lg text-sm font-black text-vitta-accent focus:outline-none focus:border-vitta-accent"
                            />
                            <div className="flex gap-1">
                              {[10, 15, 20, 25].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() =>
                                    editingItem
                                      ? setEditingItem({ ...editingItem, feeRate: val })
                                      : setNewItem({ ...newItem, feeRate: val })
                                  }
                                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                                    (editingItem ? editingItem.feeRate : newItem.feeRate) === val
                                      ? "bg-vitta-accent text-white"
                                      : "bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-secondary"
                                  }`}
                                >
                                  {val}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Simulação em Tempo Real dos Valores */}
                      {(() => {
                        const rawPriceStr = editingItem ? editingItem.price : newItem.price;
                        const normalVal = parseFloat(String(rawPriceStr || "150").replace(/[^0-9.,]/g, "").replace(",", ".")) || 150;
                        const discStr = (editingItem ? editingItem.vittaHealthDiscount : newItem.vittaHealthDiscount) || "20% OFF";
                        const discPct = parseInt(discStr.replace(/\D/g, "")) || 20;
                        const discAmount = (normalVal * discPct) / 100;
                        const finalVittaPrice = Math.max(normalVal - discAmount, 0);
                        const ratePct = editingItem ? (editingItem.feeRate !== undefined ? editingItem.feeRate : 15) : (newItem.feeRate || 15);
                        const feeCharged = (finalVittaPrice * ratePct) / 100;
                        const netReceived = finalVittaPrice - feeCharged;

                        return (
                          <div className="bg-vitta-surface p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                              Demonstrativo de Valores & Desconto ViTTA:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div className="bg-vitta-surface-2 p-2 rounded-lg border border-vitta-border">
                                <span className="text-[10px] text-vitta-text-muted block">Valor Normal (Particular)</span>
                                <span className="font-bold text-vitta-text-primary">
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(normalVal)}
                                </span>
                              </div>
                              <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">Com Desconto ViTTA ({discPct}%)</span>
                                <span className="font-black text-emerald-600 dark:text-emerald-400">
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(finalVittaPrice)}
                                </span>
                              </div>
                              <div className="bg-vitta-surface-2 p-2 rounded-lg border border-vitta-border">
                                <span className="text-[10px] text-vitta-text-muted block">Taxa ViTTA ({ratePct}%)</span>
                                <span className="font-bold text-vitta-accent">
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(feeCharged)}
                                </span>
                              </div>
                              <div className="bg-vitta-surface-2 p-2 rounded-lg border border-vitta-border">
                                <span className="text-[10px] text-vitta-text-muted block">Líquido Profissional</span>
                                <span className="font-bold text-vitta-text-primary">
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(netReceived)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Configuração de Faturamento e Lançamentos Individuais */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="space-y-1.5 sm:col-span-1">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Modelo de Cobrança ViTTA
                          </label>
                          <select
                            value={editingItem ? editingItem.billingModel || "per_consultation" : newItem.billingModel}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, billingModel: e.target.value })
                                : setNewItem({ ...newItem, billingModel: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          >
                            <option value="per_consultation">Lançamento individual por consulta</option>
                            <option value="biweekly">Lote Quinzenal</option>
                            <option value="monthly">Lote Mensal</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-1">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Tipo de Chave PIX (Repasse)
                          </label>
                          <select
                            value={editingItem ? editingItem.pixKeyType || "cpf" : newItem.pixKeyType}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, pixKeyType: e.target.value })
                                : setNewItem({ ...newItem, pixKeyType: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          >
                            <option value="cpf">CPF</option>
                            <option value="cnpj">CNPJ</option>
                            <option value="email">E-mail</option>
                            <option value="phone">Telefone / Celular</option>
                            <option value="random">Chave Aleatória (EVP)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-1">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Chave PIX
                          </label>
                          <input
                            type="text"
                            value={editingItem ? editingItem.pixKey || "" : newItem.pixKey}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, pixKey: e.target.value })
                                : setNewItem({ ...newItem, pixKey: e.target.value })
                            }
                            placeholder="Chave para repasse financeiro"
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SEÇÃO 5: Status, KYC & Permissões Master */}
                    <div className="bg-vitta-surface-2/60 border border-vitta-border rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-vitta-border">
                        <ShieldCheck size={16} className="text-vitta-accent" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-vitta-text-primary">
                          5. Status da Conta, KYC & Verificação
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Status da Conta
                          </label>
                          <select
                            value={editingItem ? editingItem.status || "active" : newItem.status}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, status: e.target.value })
                                : setNewItem({ ...newItem, status: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          >
                            <option value="active">🟢 Ativo (Aparece na busca de pacientes)</option>
                            <option value="pending">🟡 Pendente (Aguardando ativação)</option>
                            <option value="inactive">🔴 Inativo (Oculto na plataforma)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-vitta-text-secondary">
                            Status KYC (Validação Documental)
                          </label>
                          <select
                            value={editingItem ? editingItem.kycStatus || "approved" : newItem.kycStatus}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, kycStatus: e.target.value })
                                : setNewItem({ ...newItem, kycStatus: e.target.value })
                            }
                            className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          >
                            <option value="approved">✓ Aprovado</option>
                            <option value="pending">⏳ Em Análise</option>
                            <option value="rejected">✕ Recusado / Pendente</option>
                          </select>
                        </div>
                      </div>

                      {/* Badges de Verificado e Destaque */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-vitta-surface rounded-xl border border-vitta-border">
                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-vitta-surface-2 transition-colors">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <span className="text-xs font-bold text-vitta-text-primary">Selo de Profissional Verificado</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={editingItem ? editingItem.isVerified !== false : newItem.isVerified}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, isVerified: e.target.checked })
                                : setNewItem({ ...newItem, isVerified: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-vitta-accent accent-vitta-accent"
                          />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-vitta-surface-2 transition-colors">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-500" />
                            <span className="text-xs font-bold text-vitta-text-primary">Exibir em Destaque na Home</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={editingItem ? !!editingItem.featured : !!newItem.featured}
                            onChange={(e) =>
                              editingItem
                                ? setEditingItem({ ...editingItem, featured: e.target.checked })
                                : setNewItem({ ...newItem, featured: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-vitta-accent accent-vitta-accent"
                          />
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">
                          Observações Internas (Admin Master)
                        </label>
                        <input
                          type="text"
                          value={editingItem ? editingItem.adminNotes || "" : newItem.adminNotes}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, adminNotes: e.target.value })
                              : setNewItem({ ...newItem, adminNotes: e.target.value })
                          }
                          placeholder="Anotações internas sobre convênios, acordos ou histórico..."
                          className="w-full px-3.5 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Sticky Footer */}
                <div className="flex gap-3 pt-4 border-t border-vitta-border sticky bottom-0 bg-vitta-surface pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(null);
                      setEditingItem(null);
                    }}
                    className="flex-1 py-3 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold hover:bg-vitta-border transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 shadow-lg shadow-vitta-accent/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    {editingItem ? "Salvar Alterações (Master)" : "Cadastrar Profissional"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
