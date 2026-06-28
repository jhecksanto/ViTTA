import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Briefcase,
  PlusCircle,
  Trash2,
  Search,
  Plus,
  UserPlus,
  Phone,
  MapPin,
  Tag,
  AlertCircle,
  Edit2,
  Eye,
  EyeOff
} from "lucide-react";
import { db } from "../../firebase";
import { fetchAddressByCep } from "../../lib/utils";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { useToast } from "../../contexts/ToastContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  type?: string;
}

interface LiberalProfessional {
  id: string;
  name: string;
  category: string;
  phone: string;
  city: string;
  description: string;
  imageUrl: string;
  createdAt: any;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  state?: string;
  active?: boolean;
}

export const AdminLiberalConfigView = () => {
  const { addToast } = useToast();

  // Lists state
  const [categories, setCategories] = useState<Category[]>([]);
  const [professionals, setProfessionals] = useState<LiberalProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchCategoryQuery, setSearchCategoryQuery] = useState("");
  const [searchProfQuery, setSearchProfQuery] = useState("");

  // Creation states - Category
  const [newCatName, setNewCatName] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Creation states - Professional
  const [newProfName, setNewProfName] = useState("");
  const [newProfCategory, setNewProfCategory] = useState("");
  const [newProfPhone, setNewProfPhone] = useState("");
  const [newProfCep, setNewProfCep] = useState("");
  const [newProfStreet, setNewProfStreet] = useState("");
  const [newProfNumber, setNewProfNumber] = useState("");
  const [newProfNeighborhood, setNewProfNeighborhood] = useState("");
  const [newProfCity, setNewProfCity] = useState("");
  const [newProfState, setNewProfState] = useState("");
  const [newProfDesc, setNewProfDesc] = useState("");
  const [newProfImage, setNewProfImage] = useState("");
  const [isSubmittingProf, setIsSubmittingProf] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [editingProf, setEditingProf] = useState<LiberalProfessional | null>(null);

  const handleEditClick = (prof: LiberalProfessional) => {
    setEditingProf(prof);
    setNewProfName(prof.name);
    setNewProfCategory(prof.category);
    setNewProfPhone(prof.phone || "");
    setNewProfCep(prof.cep || "");
    setNewProfStreet(prof.street || "");
    setNewProfNumber(prof.number || "");
    setNewProfNeighborhood(prof.neighborhood || "");
    setNewProfCity(prof.city || "");
    setNewProfState(prof.state || "");
    setNewProfDesc(prof.description || "");
    setNewProfImage(prof.imageUrl || "");
    setShowAddProf(true);
  };

  const handleCancelProf = () => {
    setEditingProf(null);
    setNewProfName("");
    setNewProfCategory("");
    setNewProfPhone("");
    setNewProfCep("");
    setNewProfStreet("");
    setNewProfNumber("");
    setNewProfNeighborhood("");
    setNewProfCity("");
    setNewProfState("");
    setNewProfDesc("");
    setNewProfImage("");
    setShowAddProf(false);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean | undefined) => {
    try {
      const newStatus = currentStatus === false ? true : false;
      await updateDoc(doc(db, "liberal_professionals", id), {
        active: newStatus
      });
      addToast(`Profissional ${newStatus ? "ativado" : "desativado"} com sucesso!`, "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao alterar status do profissional.", "error");
    }
  };

  const handleProfCepChange = async (cepVal: string) => {
    setNewProfCep(cepVal);
    const cleaned = cepVal.replace(/\D/g, "");
    if (cleaned.length === 8) {
      setIsSearchingCep(true);
      const addr = await fetchAddressByCep(cleaned);
      setIsSearchingCep(false);
      if (addr) {
        setNewProfStreet(addr.street || "");
        setNewProfNeighborhood(addr.neighborhood || "");
        setNewProfCity(addr.city || "");
        setNewProfState(addr.state || "");
      }
    }
  };

  // Toggle Forms
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddProf, setShowAddProf] = useState(false);

  useEffect(() => {
    // 1. Sync Liberal Categories
    const categoriesQuery = query(
      collection(db, "categories"),
      where("type", "==", "liberal")
    );
    const unsubCats = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        setCategories(list);
      },
      (error) => {
        console.error("Error fetching liberal categories:", error);
      }
    );

    // 2. Sync Liberal Professionals
    const profsQuery = query(
      collection(db, "liberal_professionals"),
      orderBy("createdAt", "desc")
    );
    const unsubProfs = onSnapshot(
      profsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        })) as LiberalProfessional[];
        setProfessionals(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching liberal professionals:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubCats();
      unsubProfs();
    };
  }, []);

  // Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      addToast("O nome da categoria é obrigatório.", "error");
      return;
    }
    setIsSubmittingCat(true);
    try {
      const slug = newCatName.trim().toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");

      await addDoc(collection(db, "categories"), {
        name: newCatName.trim(),
        slug,
        type: "liberal",
        createdAt: Timestamp.now()
      });

      addToast("Categoria de Profissional Liberal criada com sucesso!", "success");
      setNewCatName("");
      setShowAddCat(false);
    } catch (err) {
      console.error(err);
      addToast("Erro ao criar categoria.", "error");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleAddProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfName.trim() || !newProfCategory) {
      addToast("Nome e Categoria são obrigatórios.", "error");
      return;
    }
    setIsSubmittingProf(true);
    try {
      const data = {
        name: newProfName.trim(),
        category: newProfCategory,
        phone: newProfPhone.trim(),
        cep: newProfCep.trim(),
        street: newProfStreet.trim(),
        number: newProfNumber.trim(),
        neighborhood: newProfNeighborhood.trim(),
        city: newProfCity.trim(),
        state: newProfState.trim(),
        description: newProfDesc.trim(),
        imageUrl: newProfImage.trim() || "https://images.unsplash.com/photo-1521791136364-72861c690450?w=400&auto=format&fit=crop&q=60"
      };

      if (editingProf) {
        await updateDoc(doc(db, "liberal_professionals", editingProf.id), data);
        addToast("Profissional Liberal atualizado com sucesso!", "success");
      } else {
        await addDoc(collection(db, "liberal_professionals"), {
          ...data,
          active: true,
          createdAt: Timestamp.now()
        });
        addToast("Profissional Liberal inserido com sucesso!", "success");
      }

      handleCancelProf();
    } catch (err) {
      console.error(err);
      addToast(editingProf ? "Erro ao atualizar profissional." : "Erro ao adicionar profissional.", "error");
    } finally {
      setIsSubmittingProf(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente excluir a categoria "${name}"? Os profissionais nesta categoria continuarão cadastrados, mas perderão a referência de filtro.`)) return;
    try {
      await deleteDoc(doc(db, "categories", id));
      addToast("Categoria excluída com sucesso.", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao excluir categoria.", "error");
    }
  };

  const handleDeleteProfessional = async (id: string, name: string) => {
    if (!window.confirm(`Deseja realmente remover o profissional "${name}" do sistema?`)) return;
    try {
      await deleteDoc(doc(db, "liberal_professionals", id));
      addToast("Profissional removido com sucesso.", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao remover profissional.", "error");
    }
  };

  // Filter computations
  const filteredCats = categories.filter((cat) =>
    (cat.name || "").toLowerCase().includes(searchCategoryQuery.toLowerCase())
  );

  const filteredProfs = professionals.filter((prof) =>
    (prof.name || "").toLowerCase().includes(searchProfQuery.toLowerCase()) ||
    (prof.category || "").toLowerCase().includes(searchProfQuery.toLowerCase()) ||
    (prof.city || "").toLowerCase().includes(searchProfQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Overview stats info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-vitta-surface-2 p-6 rounded-2xl border border-vitta-border flex items-center gap-4">
          <div className="p-3 bg-vitta-accent/10 text-vitta-accent rounded-xl">
            <Briefcase size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-vitta-text-muted">Categorias Ativas</span>
            <p className="text-2xl font-black text-vitta-text-primary">{categories.length}</p>
          </div>
        </div>

        <div className="bg-vitta-surface-2 p-6 rounded-2xl border border-vitta-border flex items-center gap-4">
          <div className="p-3 bg-vitta-green/10 text-vitta-green rounded-xl">
            <UserPlus size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-vitta-text-muted">Profissionais Cadastrados</span>
            <p className="text-2xl font-black text-vitta-text-primary">{professionals.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Manage Categories */}
        <div className="lg:col-span-1 bg-vitta-surface p-6 rounded-3xl border border-vitta-border space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-vitta-text-primary">Categorias</h3>
            <button
              onClick={() => setShowAddCat(!showAddCat)}
              className="p-1.5 bg-vitta-accent/10 text-vitta-accent hover:bg-vitta-accent/20 rounded-lg transition-colors cursor-pointer"
            >
              <Plus size={16} />
            </button>
          </div>

          {showAddCat && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={handleAddCategory}
              className="p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border space-y-3"
            >
              <h4 className="text-xs font-bold text-vitta-text-primary">Nova Categoria</h4>
              <input
                type="text"
                placeholder="Ex: Cabeleireiro, Uber, Motoboy..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-vitta-text-secondary hover:bg-vitta-surface transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCat}
                  className="px-3 py-1.5 bg-vitta-accent text-white rounded-lg text-[10px] font-bold hover:bg-vitta-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingCat ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </motion.form>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={14} />
            <input
              type="text"
              placeholder="Buscar categoria..."
              value={searchCategoryQuery}
              onChange={(e) => setSearchCategoryQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs outline-none text-vitta-text-primary font-bold"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {filteredCats.length > 0 ? (
              filteredCats.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-vitta-surface-2 hover:bg-vitta-surface rounded-xl border border-vitta-border/60 transition-colors">
                  <span className="text-xs font-bold text-vitta-text-primary">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-vitta-text-muted text-center py-4">Nenhuma categoria cadastrada.</p>
            )}
          </div>
        </div>

        {/* Right column: Manage Professionals */}
        <div className="lg:col-span-2 bg-vitta-surface p-6 rounded-3xl border border-vitta-border space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-vitta-text-primary">Profissionais Liberais</h3>
            <button
              onClick={() => {
                if (showAddProf && editingProf) {
                  handleCancelProf();
                  setShowAddProf(true);
                } else if (showAddProf) {
                  handleCancelProf();
                } else {
                  setShowAddProf(true);
                }
              }}
              className="px-3 py-1.5 bg-vitta-accent text-white hover:bg-vitta-accent/90 rounded-xl text-xs font-bold shadow-md shadow-vitta-accent/15 flex items-center gap-1 cursor-pointer"
            >
              <UserPlus size={14} /> Adicionar Profissional
            </button>
          </div>

          {showAddProf && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              onSubmit={handleAddProfessional}
              className="p-5 bg-vitta-surface-2 rounded-2xl border border-vitta-border space-y-4 text-xs"
            >
              <h4 className="text-sm font-bold text-vitta-text-primary text-xs">
                {editingProf ? "Editar Profissional Liberal" : "Novo Profissional Liberal"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-vitta-text-secondary">Nome Completo / Serviço</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos de Souza - Motoboy"
                    value={newProfName}
                    onChange={(e) => setNewProfName(e.target.value)}
                    className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-vitta-text-secondary">Categoria</label>
                  <select
                    required
                    value={newProfCategory}
                    onChange={(e) => setNewProfCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  >
                    <option value="">Selecione a categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-vitta-text-secondary">Telefone / Whatsapp</label>
                  <input
                    type="text"
                    placeholder="Ex: 28999999999"
                    value={newProfPhone}
                    onChange={(e) => setNewProfPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-vitta-text-secondary flex items-center gap-1">
                    CEP {isSearchingCep && <span className="text-[10px] text-vitta-accent animate-pulse">(Buscando...)</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 29300-000"
                    value={newProfCep}
                    onChange={(e) => handleProfCepChange(e.target.value)}
                    className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="font-bold text-vitta-text-secondary">Rua / Logradouro</label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Francisco Lacerda de Aguiar"
                    value={newProfStreet}
                    onChange={(e) => setNewProfStreet(e.target.value)}
                    className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-vitta-text-secondary">Número</label>
                  <input
                    type="text"
                    placeholder="Ex: 123"
                    value={newProfNumber}
                    onChange={(e) => setNewProfNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-vitta-text-secondary">Bairro</label>
                  <input
                    type="text"
                    placeholder="Ex: Gilberto Machado"
                    value={newProfNeighborhood}
                    onChange={(e) => setNewProfNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-vitta-text-secondary">Cidade de Atuação</label>
                  <input
                    type="text"
                    placeholder="Ex: Cachoeiro de Itapemirim"
                    value={newProfCity}
                    onChange={(e) => setNewProfCity(e.target.value)}
                    className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-vitta-text-secondary">Estado (UF)</label>
                  <input
                    type="text"
                    placeholder="Ex: ES"
                    value={newProfState}
                    onChange={(e) => setNewProfState(e.target.value)}
                    className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-vitta-text-secondary">Link da Foto (Opcional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newProfImage}
                  onChange={(e) => setNewProfImage(e.target.value)}
                  className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-vitta-text-secondary">Descrição dos Serviços</label>
                <textarea
                  placeholder="Descreva as promoções, horários de atendimento ou facilidades oferecidas para associados ViTTA..."
                  value={newProfDesc}
                  onChange={(e) => setNewProfDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl focus:ring-1 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelProf}
                  className="px-4 py-2 border border-vitta-border rounded-xl text-xs font-bold text-vitta-text-secondary hover:bg-vitta-surface transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProf}
                  className="px-4 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingProf ? "Salvando..." : editingProf ? "Salvar Alterações" : "Confirmar Profissional"}
                </button>
              </div>
            </motion.form>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={16} />
            <input
              type="text"
              placeholder="Filtre profissionais por nome, categoria ou cidade..."
              value={searchProfQuery}
              onChange={(e) => setSearchProfQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs outline-none text-vitta-text-primary focus:ring-1 focus:ring-vitta-accent/10 transition-all font-bold"
            />
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
            {loading ? (
              <p className="text-xs text-vitta-text-muted text-center py-4">Carregando profissionais...</p>
            ) : filteredProfs.length > 0 ? (
              filteredProfs.map((prof) => {
                const isActive = prof.active !== false;
                return (
                  <div key={prof.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={prof.imageUrl || "https://picsum.photos/seed/liberal/100/100"}
                        alt={prof.name}
                        className="w-10 h-10 rounded-xl object-cover border border-vitta-border"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-vitta-text-primary">{prof.name}</span>
                          <span className="text-[10px] font-black uppercase text-vitta-accent bg-vitta-accent/10 px-2 py-0.5 rounded-md">
                            {prof.category}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isActive ? "text-vitta-green bg-vitta-green-bg" : "text-gray-400 bg-gray-100"}`}>
                            {isActive ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-vitta-text-secondary mt-1 flex-wrap">
                          <span className="flex items-center gap-1"><Phone size={10} /> {prof.phone || "Sem whatsapp"}</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> 
                            {prof.street ? `${prof.street}${prof.number ? `, ${prof.number}` : ""}${prof.neighborhood ? ` - ${prof.neighborhood}` : ""}, ` : ""}
                            {prof.city || "Online"}{prof.state ? ` - ${prof.state}` : ""}{prof.cep ? ` (${prof.cep})` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleToggleActive(prof.id, prof.active)}
                        title={isActive ? "Desativar" : "Ativar"}
                        className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                          isActive
                            ? "bg-amber-50 text-amber-500 hover:bg-amber-100 border-amber-200"
                            : "bg-vitta-green-bg text-vitta-green hover:opacity-90 border-vitta-green/20"
                        }`}
                      >
                        {isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => handleEditClick(prof)}
                        title="Editar"
                        className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer border border-blue-200"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProfessional(prof.id, prof.name)}
                        title="Excluir"
                        className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors cursor-pointer border border-red-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-vitta-text-muted text-center py-4">Nenhum profissional cadastrado com esses termos.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
