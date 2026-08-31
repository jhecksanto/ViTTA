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
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import { logAdminAction } from "../../lib/audit";
import { fetchAddressByCep } from "../../lib/utils";

interface ProfessionalsManagementViewProps {
  onOpenAgenda?: (prof: any) => void;
}

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

  const [newItem, setNewItem] = useState({
    name: "",
    specialty: "Médico",
    vittaHealthDiscount: "",
    registrationNumber: "",
    availableDays: "Segunda a Sexta",
    price: "",
    city: "",
    imageUrl: "",
    whatsapp: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    localidade: "",
    uf: "",
    feeRate: 15,
    telemedicineEnabled: true,
    inPersonEnabled: true,
  });

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
            logradouro: addr.street || "",
            bairro: addr.neighborhood || "",
            localidade: addr.city || "",
            uf: addr.state || "",
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreating === "professional") {
        await addDoc(collection(db, "professionals"), {
          ...newItem,
          createdAt: new Date().toISOString(),
          status: "active",
        });
        await logAdminAction("CREATE_PROFESSIONAL", `Criou profissional ${newItem.name}`);
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
      setNewItem({
        name: "",
        specialty: "Médico",
        vittaHealthDiscount: "",
        registrationNumber: "",
        availableDays: "Segunda a Sexta",
        price: "",
        city: "",
        imageUrl: "",
        whatsapp: "",
        email: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        localidade: "",
        uf: "",
        feeRate: 15,
        telemedicineEnabled: true,
        inPersonEnabled: true,
      });
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
      await updateDoc(doc(db, coll, editingItem.id), {
        ...editingItem,
        updatedAt: new Date().toISOString(),
      });
      await logAdminAction("EDIT_ITEM", `Editou ${coll}: ${editingItem.name}`);
      addToast("Item atualizado com sucesso!", "success");
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
      p.city?.toLowerCase().includes(searchQuery.toLowerCase());
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
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent w-48 lg:w-64"
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
              onClick={() => setIsCreating("professional")}
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
                    <h4 className="font-bold text-sm text-vitta-text-primary line-clamp-1">{prof.name}</h4>
                    <span className="inline-block px-2.5 py-0.5 bg-vitta-accent/10 text-vitta-accent rounded-full text-[10px] font-bold">
                      {prof.specialty || "Médico"}
                    </span>
                    {prof.registrationNumber && (
                      <p className="text-[10px] text-vitta-text-muted mt-0.5">CRM: {prof.registrationNumber}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingItem({ ...prof, type: "professional" })}
                    className="p-1.5 text-vitta-text-muted hover:text-vitta-accent hover:bg-vitta-surface-2 rounded-lg transition-all"
                    title="Editar"
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
                  <span className="text-vitta-text-muted block text-[10px]">Taxa ViTTA:</span>
                  <span className="font-medium text-vitta-text-primary">{prof.feeRate || 15}%</span>
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
                onOpenAgenda && (
                  <button
                    onClick={() => onOpenAgenda(prof)}
                    className="w-full py-2 bg-vitta-surface-2 hover:bg-vitta-accent hover:text-white text-vitta-text-primary border border-vitta-border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar size={14} />
                    Configurar Agenda
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {(isCreating || editingItem) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-xl rounded-2xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
                <h3 className="text-lg font-bold text-vitta-text-primary">
                  {editingItem ? "Editar Item" : isCreating === "category" ? "Nova Especialidade" : "Novo Profissional"}
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(null);
                    setEditingItem(null);
                  }}
                  className="p-1.5 hover:bg-vitta-surface rounded-xl text-vitta-text-muted hover:text-vitta-text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={editingItem ? handleSaveEdit : handleCreate}
                className="p-6 space-y-4 overflow-y-auto"
              >
                {isCreating === "category" || editingItem?.type === "category" ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-vitta-text-secondary">Nome da Especialidade</label>
                    <input
                      type="text"
                      required
                      value={editingItem ? editingItem.name : newItem.name}
                      onChange={(e) =>
                        editingItem
                          ? setEditingItem({ ...editingItem, name: e.target.value })
                          : setNewItem({ ...newItem, name: e.target.value })
                      }
                      placeholder="Ex: Cardiologia"
                      className="w-full px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">Nome Completo</label>
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
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">Especialidade</label>
                        <input
                          type="text"
                          required
                          value={editingItem ? editingItem.specialty : newItem.specialty}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, specialty: e.target.value })
                              : setNewItem({ ...newItem, specialty: e.target.value })
                          }
                          placeholder="Ex: Cardiologia"
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">CRM / Registro</label>
                        <input
                          type="text"
                          value={editingItem ? editingItem.registrationNumber : newItem.registrationNumber}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, registrationNumber: e.target.value })
                              : setNewItem({ ...newItem, registrationNumber: e.target.value })
                          }
                          placeholder="CRM-SP 123456"
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">Valor Particular</label>
                        <input
                          type="text"
                          value={editingItem ? editingItem.price : newItem.price}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, price: e.target.value })
                              : setNewItem({ ...newItem, price: e.target.value })
                          }
                          placeholder="R$ 150,00"
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">Desconto Convênio</label>
                        <input
                          type="text"
                          value={editingItem ? editingItem.vittaHealthDiscount : newItem.vittaHealthDiscount}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, vittaHealthDiscount: e.target.value })
                              : setNewItem({ ...newItem, vittaHealthDiscount: e.target.value })
                          }
                          placeholder="20% OFF"
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">E-mail</label>
                        <input
                          type="email"
                          value={editingItem ? editingItem.email : newItem.email}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, email: e.target.value })
                              : setNewItem({ ...newItem, email: e.target.value })
                          }
                          placeholder="medico@vitta.com"
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">WhatsApp</label>
                        <input
                          type="text"
                          value={editingItem ? editingItem.whatsapp : newItem.whatsapp}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, whatsapp: e.target.value })
                              : setNewItem({ ...newItem, whatsapp: e.target.value })
                          }
                          placeholder="(11) 99999-9999"
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">CEP {loadingCep && "(Buscando...)"}</label>
                        <input
                          type="text"
                          value={editingItem ? editingItem.cep : newItem.cep}
                          onChange={editingItem ? (e) => setEditingItem({ ...editingItem, cep: e.target.value }) : handleCepChange}
                          placeholder="00000-000"
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-bold text-vitta-text-secondary">Cidade / Estado</label>
                        <input
                          type="text"
                          value={editingItem ? editingItem.city : newItem.city}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, city: e.target.value })
                              : setNewItem({ ...newItem, city: e.target.value })
                          }
                          placeholder="São Paulo - SP"
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-vitta-border">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(null);
                      setEditingItem(null);
                    }}
                    className="flex-1 py-2.5 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold hover:bg-vitta-border transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-all"
                  >
                    {editingItem ? "Salvar Alterações" : "Cadastrar"}
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
