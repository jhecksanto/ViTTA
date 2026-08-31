import React, { useState, useEffect } from "react";
import {
  Store,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  Tag,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
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
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import { logAdminAction } from "../../lib/audit";
import { fetchAddressByCep } from "../../lib/utils";

export const PartnershipManager: React.FC = () => {
  const { addToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"list" | "categories">("list");
  const [partners, setPartners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreating, setIsCreating] = useState<"partner" | "category" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Farmácia",
    discount: "15% OFF",
    address: "",
    city: "",
    phone: "",
    email: "",
    whatsapp: "",
    description: "",
    website: "",
    cep: "",
    imageUrl: "",
    status: "active",
  });

  useEffect(() => {
    const unsubPartners = onSnapshot(collection(db, "partners"), (snapshot) => {
      setPartners(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubCats = onSnapshot(collection(db, "categories"), (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCategories(all.filter((c: any) => c.type === "partner" || !c.type));
    });

    return () => {
      unsubPartners();
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
            address: addr.street ? `${addr.street}, ${addr.neighborhood}` : prev.address,
            city: addr.city ? `${addr.city} - ${addr.state}` : prev.city,
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreating === "partner") {
        await addDoc(collection(db, "partners"), {
          ...newItem,
          createdAt: new Date().toISOString(),
        });
        await logAdminAction("CREATE_PARTNER", `Criou parceiro ${newItem.name}`);
        addToast("Estabelecimento cadastrado com sucesso!", "success");
      } else if (isCreating === "category") {
        await addDoc(collection(db, "categories"), {
          name: newItem.name,
          slug: newItem.name.toLowerCase().replace(/\s+/g, "-"),
          type: "partner",
          createdAt: new Date().toISOString(),
        });
        await logAdminAction("CREATE_CATEGORY", `Criou categoria de parceiro ${newItem.name}`);
        addToast("Categoria criada com sucesso!", "success");
      }
      setIsCreating(null);
      setNewItem({
        name: "",
        category: "Farmácia",
        discount: "15% OFF",
        address: "",
        city: "",
        phone: "",
        email: "",
        whatsapp: "",
        description: "",
        website: "",
        cep: "",
        imageUrl: "",
        status: "active",
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
      const coll = editingItem.type === "category" ? "categories" : "partners";
      await updateDoc(doc(db, coll, editingItem.id), {
        ...editingItem,
        updatedAt: new Date().toISOString(),
      });
      await logAdminAction("EDIT_PARTNER", `Editou ${coll}: ${editingItem.name}`);
      addToast("Item atualizado!", "success");
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      addToast("Erro ao salvar.", "error");
    }
  };

  const handleDelete = async (id: string, type: "partner" | "category", name: string) => {
    if (!window.confirm(`Deseja realmente excluir "${name}"?`)) return;
    try {
      const coll = type === "category" ? "categories" : "partners";
      await deleteDoc(doc(db, coll, id));
      await logAdminAction("DELETE_PARTNER", `Excluiu ${type}: ${name}`);
      addToast("Item removido.", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao remover.", "error");
    }
  };

  const filteredPartners = partners.filter((p) => {
    return (
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
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
            Parceiros ({partners.length})
          </button>
          <button
            onClick={() => setActiveSubTab("categories")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "categories"
                ? "bg-vitta-accent text-white shadow-md shadow-vitta-accent/20"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Categorias ({categories.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
            <input
              type="text"
              placeholder="Buscar parceiros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent w-48 lg:w-64"
            />
          </div>
          {activeSubTab === "categories" ? (
            <button
              onClick={() => setIsCreating("category")}
              className="px-4 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-all"
            >
              <Plus size={16} />
              Nova Categoria
            </button>
          ) : (
            <button
              onClick={() => setIsCreating("partner")}
              className="px-4 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-all"
            >
              <Plus size={16} />
              Novo Parceiro
            </button>
          )}
        </div>
      </div>

      {activeSubTab === "categories" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 bg-vitta-surface border border-vitta-border rounded-2xl flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-vitta-accent/10 flex items-center justify-center text-vitta-accent font-bold">
                  <Tag size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-vitta-text-primary">{cat.name}</h4>
                  <p className="text-[11px] text-vitta-text-muted">{cat.slug}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(cat.id, "category", cat.name)}
                className="p-2 text-vitta-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="p-5 bg-vitta-surface border border-vitta-border rounded-2xl flex flex-col justify-between shadow-sm space-y-4 hover:border-vitta-accent/40 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-vitta-surface-2 border border-vitta-border overflow-hidden shrink-0 flex items-center justify-center font-bold text-vitta-text-muted">
                    {partner.imageUrl ? (
                      <img src={partner.imageUrl} alt={partner.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store size={22} className="text-vitta-accent" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-vitta-text-primary line-clamp-1">{partner.name}</h4>
                    <span className="inline-block px-2 py-0.5 bg-vitta-accent/10 text-vitta-accent rounded-full text-[10px] font-bold">
                      {partner.category || "Parceiro"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingItem({ ...partner, type: "partner" })}
                    className="p-1.5 text-vitta-text-muted hover:text-vitta-accent hover:bg-vitta-surface-2 rounded-lg transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(partner.id, "partner", partner.name)}
                    className="p-1.5 text-vitta-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-[11px] bg-vitta-surface-2 p-3 rounded-xl border border-vitta-border">
                <div className="flex justify-between items-center">
                  <span className="text-vitta-text-muted">Desconto Oferecido:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{partner.discount || "15% OFF"}</span>
                </div>
                {partner.city && (
                  <div className="flex items-center gap-1.5 text-vitta-text-secondary">
                    <MapPin size={13} className="text-vitta-text-muted shrink-0" />
                    <span className="line-clamp-1">{partner.city}</span>
                  </div>
                )}
                {partner.phone && (
                  <div className="flex items-center gap-1.5 text-vitta-text-secondary">
                    <Phone size={13} className="text-vitta-text-muted shrink-0" />
                    <span>{partner.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal create / edit */}
      <AnimatePresence>
        {(isCreating || editingItem) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-lg rounded-2xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2">
                <h3 className="text-lg font-bold text-vitta-text-primary">
                  {editingItem ? "Editar Parceiro" : isCreating === "category" ? "Nova Categoria" : "Novo Parceiro"}
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(null);
                    setEditingItem(null);
                  }}
                  className="p-1.5 hover:bg-vitta-surface rounded-xl text-vitta-text-muted"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={editingItem ? handleSaveEdit : handleCreate} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-vitta-text-secondary">Nome</label>
                  <input
                    type="text"
                    required
                    value={editingItem ? editingItem.name : newItem.name}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({ ...editingItem, name: e.target.value })
                        : setNewItem({ ...newItem, name: e.target.value })
                    }
                    placeholder="Nome do estabelecimento"
                    className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                  />
                </div>

                {isCreating !== "category" && editingItem?.type !== "category" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">Categoria</label>
                        <input
                          type="text"
                          value={editingItem ? editingItem.category : newItem.category}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, category: e.target.value })
                              : setNewItem({ ...newItem, category: e.target.value })
                          }
                          placeholder="Ex: Farmácia"
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">Desconto Oferecido</label>
                        <input
                          type="text"
                          value={editingItem ? editingItem.discount : newItem.discount}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({ ...editingItem, discount: e.target.value })
                              : setNewItem({ ...newItem, discount: e.target.value })
                          }
                          placeholder="Ex: 20% OFF"
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
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
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">Cidade / UF</label>
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

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-vitta-text-secondary">WhatsApp / Telefone</label>
                      <input
                        type="text"
                        value={editingItem ? editingItem.phone : newItem.phone}
                        onChange={(e) =>
                          editingItem
                            ? setEditingItem({ ...editingItem, phone: e.target.value })
                            : setNewItem({ ...newItem, phone: e.target.value })
                        }
                        placeholder="(11) 99999-9999"
                        className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                      />
                    </div>
                  </>
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
