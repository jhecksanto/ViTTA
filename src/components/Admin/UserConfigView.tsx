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
} from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import { logAdminAction } from "../../lib/audit";

export const UserConfigView: React.FC = () => {
  const { addToast } = useToast();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<any | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsersList(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
      await logAdminAction("UPDATE_USER_ROLE", `Alterou perfil de usuário ${userId} para ${newRole}`);
      addToast("Nível de acesso atualizado.", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao atualizar perfil.", "error");
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        walletBalance: parseFloat(editingUser.walletBalance) || 0,
        role: editingUser.role || "patient",
        name: editingUser.name || "",
        updatedAt: new Date().toISOString(),
      });
      await logAdminAction("ADJUST_USER", `Ajustou dados/saldo de ${editingUser.name || editingUser.email}`);
      addToast("Dados do usuário salvos com sucesso.", "success");
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      addToast("Erro ao salvar dados.", "error");
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Deseja remover o registro de "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      await logAdminAction("DELETE_USER", `Excluiu usuário ${userId}`);
      addToast("Usuário removido.", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao remover.", "error");
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.cpf || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-vitta-surface p-4 rounded-2xl border border-vitta-border">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === "all"
                ? "bg-vitta-accent text-white"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Todos ({usersList.length})
          </button>
          <button
            onClick={() => setRoleFilter("patient")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === "patient"
                ? "bg-vitta-accent text-white"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Pacientes ({usersList.filter((u) => u.role === "patient" || !u.role).length})
          </button>
          <button
            onClick={() => setRoleFilter("professional")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === "professional"
                ? "bg-vitta-accent text-white"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Profissionais ({usersList.filter((u) => u.role === "professional").length})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              roleFilter === "admin"
                ? "bg-vitta-accent text-white"
                : "text-vitta-text-secondary hover:bg-vitta-surface-2"
            }`}
          >
            Administradores ({usersList.filter((u) => u.role === "admin").length})
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent w-64"
          />
        </div>
      </div>

      <div className="bg-vitta-surface rounded-3xl border border-vitta-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-vitta-text-primary">
            <thead className="bg-vitta-surface-2 text-vitta-text-muted uppercase text-[10px] tracking-wider font-bold border-b border-vitta-border">
              <tr>
                <th className="p-4">Usuário</th>
                <th className="p-4">Perfil (Role)</th>
                <th className="p-4">Saldo Carteira</th>
                <th className="p-4">Status Plano</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-vitta-surface-2/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-vitta-text-primary">{u.name || "Sem nome"}</div>
                    <div className="text-[11px] text-vitta-text-muted">{u.email}</div>
                    {u.cpf && <div className="text-[10px] text-vitta-text-muted">CPF: {u.cpf}</div>}
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role || "patient"}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      className="px-2.5 py-1 bg-vitta-surface-2 border border-vitta-border rounded-lg text-xs font-bold text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                    >
                      <option value="patient">Paciente</option>
                      <option value="professional">Profissional</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {(u.walletBalance || 0).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.subscriptionStatus === "active"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {u.subscriptionStatus === "active" ? "Plano Ativo" : "Básico"}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="p-1.5 text-vitta-text-muted hover:text-vitta-accent hover:bg-vitta-surface-2 rounded-lg transition-all"
                      title="Editar Saldo/Dados"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                      className="p-1.5 text-vitta-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      title="Excluir Usuário"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-vitta-surface w-full max-w-md rounded-3xl shadow-2xl border border-vitta-border p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-vitta-border pb-3">
              <h3 className="font-bold text-sm text-vitta-text-primary">Editar Usuário</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 text-vitta-text-muted">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-vitta-text-secondary">Nome</label>
                <input
                  type="text"
                  value={editingUser.name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-vitta-text-secondary">Saldo ViTTA Coins (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingUser.walletBalance || 0}
                  onChange={(e) => setEditingUser({ ...editingUser, walletBalance: e.target.value })}
                  className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
