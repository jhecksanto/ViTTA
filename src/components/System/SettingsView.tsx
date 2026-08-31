import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Lock,
  Bell,
  Sun,
  Moon,
  Save,
  CheckCircle,
  Shield,
  Key,
  Smartphone,
  Mail,
  MapPin,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, updateProfile } from "firebase/auth";
import { db, auth } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import { fetchAddressByCep } from "../../lib/utils";

interface SettingsViewProps {
  user: any;
  darkMode?: boolean;
  setDarkMode?: (dark: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  darkMode,
  setDarkMode,
}) => {
  const { addToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"profile" | "security" | "preferences">("profile");

  // Profile Form
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    phone: "",
    cpf: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    city: "",
    uf: "",
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
  });

  const [loadingCep, setLoadingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Password Modal / State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfileData((prev) => ({
          ...prev,
          displayName: data.name || data.displayName || user.displayName || "",
          phone: data.phone || "",
          cpf: data.cpf || "",
          cep: data.cep || "",
          logradouro: data.logradouro || "",
          numero: data.numero || "",
          bairro: data.bairro || "",
          city: data.city || data.localidade || "",
          uf: data.uf || "",
          emailNotifications: data.emailNotifications !== false,
          pushNotifications: data.pushNotifications !== false,
          smsNotifications: data.smsNotifications || false,
        }));
      }
    });
  }, [user]);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProfileData((prev) => ({ ...prev, cep: val }));
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length === 8) {
      setLoadingCep(true);
      try {
        const addr = await fetchAddressByCep(cleaned);
        if (addr) {
          setProfileData((prev) => ({
            ...prev,
            logradouro: addr.street || prev.logradouro,
            bairro: addr.neighborhood || prev.bairro,
            city: addr.city || prev.city,
            uf: addr.state || prev.uf,
          }));
        }
      } catch (err) {
        console.error("Erro no CEP:", err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      if (auth.currentUser && profileData.displayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: profileData.displayName });
      }
      await updateDoc(doc(db, "users", user.uid), {
        ...profileData,
        name: profileData.displayName,
        updatedAt: new Date().toISOString(),
      });
      addToast("Perfil atualizado com sucesso!", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao salvar configurações.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast("A nova senha deve ter no mínimo 6 caracteres.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("As senhas não coincidem.", "error");
      return;
    }
    if (!auth.currentUser) return;

    setUpdatingPassword(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      addToast("Senha alterada com sucesso!", "success");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Erro ao alterar senha.", "error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-vitta-accent/10 text-vitta-accent flex items-center justify-center font-bold">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-vitta-text-primary">Configurações da Conta</h2>
            <p className="text-xs text-vitta-text-muted">{user?.email || "Gerencie suas preferências pessoais"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {setDarkMode && (
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
              <span>{darkMode ? "Modo Claro" : "Modo Escuro"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2 border-b border-vitta-border pb-2">
        <button
          onClick={() => setActiveSubTab("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "profile"
              ? "bg-vitta-accent text-white"
              : "bg-vitta-surface text-vitta-text-secondary hover:bg-vitta-surface-2"
          }`}
        >
          Dados Cadastrais
        </button>
        <button
          onClick={() => setActiveSubTab("security")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "security"
              ? "bg-vitta-accent text-white"
              : "bg-vitta-surface text-vitta-text-secondary hover:bg-vitta-surface-2"
          }`}
        >
          Segurança & Senha
        </button>
        <button
          onClick={() => setActiveSubTab("preferences")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "preferences"
              ? "bg-vitta-accent text-white"
              : "bg-vitta-surface text-vitta-text-secondary hover:bg-vitta-surface-2"
          }`}
        >
          Notificações
        </button>
      </div>

      {/* Profile Tab */}
      {activeSubTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-vitta-text-primary border-b border-vitta-border pb-2">
            Informações Pessoais
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-secondary">Nome Completo</label>
              <input
                type="text"
                required
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-secondary">E-mail (Login)</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3.5 py-2 bg-vitta-surface-2/50 border border-vitta-border rounded-xl text-xs text-vitta-text-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-secondary">Telefone / Celular</label>
              <input
                type="text"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-secondary">CPF</label>
              <input
                type="text"
                value={profileData.cpf}
                onChange={(e) => setProfileData({ ...profileData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
              />
            </div>
          </div>

          <h3 className="font-bold text-sm text-vitta-text-primary border-b border-vitta-border pb-2 pt-2">
            Endereço Residencial
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-secondary">CEP {loadingCep && "(Buscando...)"}</label>
              <input
                type="text"
                value={profileData.cep}
                onChange={handleCepChange}
                placeholder="00000-000"
                className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-vitta-text-secondary">Logradouro / Rua</label>
              <input
                type="text"
                value={profileData.logradouro}
                onChange={(e) => setProfileData({ ...profileData, logradouro: e.target.value })}
                placeholder="Rua / Avenida"
                className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-secondary">Número</label>
              <input
                type="text"
                value={profileData.numero}
                onChange={(e) => setProfileData({ ...profileData, numero: e.target.value })}
                placeholder="123"
                className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-secondary">Bairro</label>
              <input
                type="text"
                value={profileData.bairro}
                onChange={(e) => setProfileData({ ...profileData, bairro: e.target.value })}
                placeholder="Bairro"
                className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-vitta-text-secondary">Cidade - UF</label>
              <input
                type="text"
                value={profileData.city ? `${profileData.city} ${profileData.uf ? `- ${profileData.uf}` : ""}` : ""}
                onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                placeholder="Cidade - UF"
                className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-vitta-border flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-all flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      )}

      {/* Security Tab */}
      {activeSubTab === "security" && (
        <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-vitta-text-primary border-b border-vitta-border pb-2">
            Segurança da Conta & Acesso
          </h3>

          <div className="p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-vitta-text-primary">Senha de Acesso</h4>
              <p className="text-[11px] text-vitta-text-muted">Recomendamos alterar sua senha periodicamente para maior segurança.</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-vitta-surface hover:bg-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-vitta-border"
            >
              <Key size={14} />
              Alterar Senha
            </button>
          </div>

          <div className="p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-vitta-text-primary">Autenticação em 2 Etapas (2FA)</h4>
              <p className="text-[11px] text-vitta-text-muted">Proteja sua conta com verificação por e-mail e SMS.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-full">
              Ativo
            </span>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeSubTab === "preferences" && (
        <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-vitta-text-primary border-b border-vitta-border pb-2">
            Canais de Notificação
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 bg-vitta-surface-2 rounded-2xl border border-vitta-border cursor-pointer">
              <div>
                <span className="font-bold text-xs text-vitta-text-primary block">Notificações por E-mail</span>
                <span className="text-[11px] text-vitta-text-muted">Receba lembretes de consultas e confirmações de pagamento.</span>
              </div>
              <input
                type="checkbox"
                checked={profileData.emailNotifications}
                onChange={(e) => setProfileData({ ...profileData, emailNotifications: e.target.checked })}
                className="w-4 h-4 text-vitta-accent rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-vitta-surface-2 rounded-2xl border border-vitta-border cursor-pointer">
              <div>
                <span className="font-bold text-xs text-vitta-text-primary block">Notificações Push / App</span>
                <span className="text-[11px] text-vitta-text-muted">Alertas instantâneos na plataforma sobre novidades e laudos.</span>
              </div>
              <input
                type="checkbox"
                checked={profileData.pushNotifications}
                onChange={(e) => setProfileData({ ...profileData, pushNotifications: e.target.checked })}
                className="w-4 h-4 text-vitta-accent rounded"
              />
            </label>
          </div>
        </div>
      )}

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-3xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              <div className="p-5 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2">
                <h3 className="font-bold text-sm text-vitta-text-primary">Alterar Senha</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="p-1 text-vitta-text-muted hover:text-vitta-text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-vitta-text-secondary">Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-vitta-text-secondary">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-vitta-border">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2.5 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold hover:bg-vitta-border transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="flex-1 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-all flex items-center justify-center gap-2"
                  >
                    {updatingPassword ? "Salvando..." : "Salvar Nova Senha"}
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
