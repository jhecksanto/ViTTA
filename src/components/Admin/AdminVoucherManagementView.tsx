import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Ticket,
  Percent,
  Save,
  Trash2,
  Search,
  AlertCircle,
  Settings,
  DollarSign,
  CheckCircle2,
  Lock,
  Unlock,
  Building
} from "lucide-react";
import { db } from "../../firebase";
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import { useToast } from "../../contexts/ToastContext";

export const AdminVoucherManagementView = () => {
  const { addToast } = useToast();
  const [feeRate, setFeeRate] = useState<number>(10);
  const [vouchersEnabled, setVouchersEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  // Offers Catalog states
  const [catalogVouchers, setCatalogVouchers] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Statistics
  const [totalSalesVolume, setTotalSalesVolume] = useState<number>(0);
  const [totalPlatformFeesEarned, setTotalPlatformFeesEarned] = useState<number>(0);

  useEffect(() => {
    // 1. Sync system configs document
    const configRef = doc(db, "system_configs", "vouchers");
    const unsubConfig = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setFeeRate(data.feeRate !== undefined ? data.feeRate : 10);
        setVouchersEnabled(data.vouchersEnabled !== undefined ? data.vouchersEnabled : true);
      } else {
        // Document doesn't exist, initialize with safe defaults
        setDoc(configRef, {
          feeRate: 10,
          vouchersEnabled: true
        });
      }
    });

    // 2. Sync vouchers catalog
    const catalogQuery = query(collection(db, "vouchers_catalog"), orderBy("createdAt", "desc"));
    const unsubCatalog = onSnapshot(
      catalogQuery,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCatalogVouchers(items);
        setLoadingCatalog(false);
      },
      (error) => {
        console.error("Error fetching vouchers catalog:", error);
        setLoadingCatalog(false);
      }
    );

    // 3. Keep track of dynamic voucher stats of past sales from transactions
    const txQuery = query(collection(db, "transactions"));
    const unsubStats = onSnapshot(txQuery, (snapshot) => {
      let salesSum = 0;
      let platformFeeSum = 0;
      
      // Let's analyze completed transactions containing "Compra de Voucher" or credit logs with Platform Fee
      snapshot.docs.forEach((d) => {
        const tx = d.data();
        if (tx.status === "completed" && tx.type === "debit" && tx.description?.includes("Compra de Voucher:")) {
          salesSum += tx.amount || 0;
        }
      });
      
      // Platform fee earned on these is typically 10% (or whatever was current)
      platformFeeSum = salesSum * (feeRate / 100);
      setTotalSalesVolume(salesSum);
      setTotalPlatformFeesEarned(platformFeeSum);
    });

    return () => {
      unsubConfig();
      unsubCatalog();
      unsubStats();
    };
  }, [feeRate]);

  const handleUpdateConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (feeRate < 0 || feeRate > 100) {
        addToast("A taxa de plataforma deve ser entre 0% e 100%.", "error");
        setIsSaving(false);
        return;
      }

      await setDoc(doc(db, "system_configs", "vouchers"), {
        feeRate,
        vouchersEnabled,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      addToast("Configurações gerais de vouchers salvas!", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao gravar configurações.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCatalogVoucher = async (voucherId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente a oferta de voucher "${title}"?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, "vouchers_catalog", voucherId));
      addToast("Voucher removido das ofertas do catálogo!", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao deletar voucher.", "error");
    }
  };

  // Filter list
  const filteredVouchers = catalogVouchers.filter((v) => {
    const term = searchQuery.toLowerCase();
    return (
      v.title?.toLowerCase().includes(term) ||
      v.description?.toLowerCase().includes(term) ||
      v.partner?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-vitta-text-primary">
            Configurações e Gestão de Vouchers
          </h2>
          <p className="text-sm text-vitta-text-secondary">
            Gerencie taxas, controle acessos e audite as ofertas oferecidas pelos profissionais conveniados.
          </p>
        </div>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-vitta-surface border border-vitta-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-vitta-accent-bg text-vitta-accent flex items-center justify-center">
            <Ticket size={24} />
          </div>
          <div>
            <p className="text-xs text-vitta-text-secondary font-bold uppercase tracking-wider">Ofertados no Catálogo</p>
            <p className="text-2xl font-bold text-vitta-text-primary">{catalogVouchers.length} Vouchers</p>
          </div>
        </div>

        <div className="bg-vitta-surface border border-vitta-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-vitta-text-secondary font-bold uppercase tracking-wider">Volume de Vendas</p>
            <p className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalSalesVolume)}
            </p>
          </div>
        </div>

        <div className="bg-vitta-surface border border-vitta-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Percent size={24} />
          </div>
          <div>
            <p className="text-xs text-vitta-text-secondary font-bold uppercase tracking-wider">Receita Taxa Fee ({feeRate}%)</p>
            <p className="text-2xl font-bold text-indigo-600 animate-pulse">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPlatformFeesEarned)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Global Configuration Rules */}
        <div className="bg-vitta-surface border border-vitta-border rounded-2xl shadow-sm p-6 space-y-4 h-fit">
          <div className="flex items-center gap-2 pb-3 border-b border-vitta-border">
            <Settings size={20} className="text-vitta-accent" />
            <h3 className="font-bold text-lg text-vitta-text-primary">Ajustes Gerais do Sistema</h3>
          </div>

          <form onSubmit={handleUpdateConfigs} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-vitta-text-secondary uppercase">
                Taxa de Serviço da Plataforma (Fee Rate %)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={feeRate}
                  onChange={(e) => setFeeRate(Number(e.target.value))}
                  placeholder="Ex: 10"
                  className="w-full bg-vitta-surface-2 border border-vitta-border rounded-xl px-4 py-3 text-vitta-text-primary pr-12 focus:outline-none focus:ring-2 focus:ring-vitta-accent/20 font-bold"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-vitta-text-secondary font-bold">%</span>
              </div>
              <p className="text-[11px] text-vitta-text-secondary leading-relaxed">
                Determina o quanto a ViTTA retém na transação de compra. Ex: De um voucher de R$ 50, com taxa de 10%, a plataforma retém R$ 5.00 e repassa R$ 45.00 líquidos ao profissional parceiro em sua carteira.
              </p>
            </div>

            <div className="pt-2 border-t border-vitta-border/60">
              <label className="block text-xs font-bold text-vitta-text-secondary uppercase mb-2">
                Status Operacional
              </label>
              <div className="flex items-center justify-between p-3 bg-vitta-surface-2 rounded-xl border border-vitta-border">
                <span className="text-sm font-semibold text-vitta-text-primary">
                  {vouchersEnabled ? "Vouchers Ativos para Clientes" : "Vouchers Desativados / Manutenção"}
                </span>
                <button
                  type="button"
                  onClick={() => setVouchersEnabled(!vouchersEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${vouchersEnabled ? 'bg-vitta-accent' : 'bg-vitta-border'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${vouchersEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-vitta-accent text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-vitta-accent/95 transition-all text-sm shadow-md shadow-vitta-accent/15"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} /> Salvar Regras de Voucher
                </>
              )}
            </button>
          </form>

          <div className="bg-vitta-accent-bg/10 rounded-xl p-4 flex gap-3 border border-vitta-accent/10">
            <AlertCircle size={22} className="text-vitta-accent flex-shrink-0" />
            <div className="text-xs text-vitta-accent font-medium leading-relaxed">
              <strong>Como funciona o repasse:</strong> Quando um cliente compra um voucher, o valor pago é retirado dele e doado ao parceiro, deduzindo a taxa estipulada acima e creditando saldo real na carteira do parceiro receptora de forma instantânea.
            </div>
          </div>
        </div>

        {/* Right Side: Vouchers directory with search/audit */}
        <div className="bg-vitta-surface border border-vitta-border rounded-2xl shadow-sm p-6 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-vitta-border">
            <h3 className="font-bold text-lg text-vitta-text-primary">Vouchers Ativos no Catálogo</h3>
            
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-secondary" size={16} />
              <input
                type="text"
                placeholder="Buscar por parceiro ou oferta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-vitta-surface-2 border border-vitta-border rounded-xl pl-9 pr-4 py-2 text-xs text-vitta-text-primary focus:outline-none focus:ring-1 focus:ring-vitta-accent/30"
              />
            </div>
          </div>

          {loadingCatalog ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="py-20 text-center text-vitta-text-secondary">
              Nenhuma oferta de voucher cadastrada correspondente à sua busca.
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {filteredVouchers.map((voucher) => {
                const platformFeeVal = voucher.price * (feeRate / 100);
                const sellerRepasse = voucher.price - platformFeeVal;
                
                return (
                  <div
                    key={voucher.id}
                    className="p-4 border border-vitta-border bg-vitta-surface-2 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-vitta-accent/30 transition-all shadow-sm"
                  >
                    <div className="space-y-2 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-vitta-text-primary">
                          {voucher.title}
                        </span>
                        <span className="bg-vitta-accent-bg text-vitta-accent text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                          <Building size={10} /> {voucher.partner}
                        </span>
                      </div>
                      <p className="text-xs text-vitta-text-secondary line-clamp-2 leading-relaxed">
                        {voucher.description}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-xs font-semibold">
                        <span className="text-vitta-text-secondary">
                          Preço: <span className="text-rose-600">R$ {voucher.price.toFixed(2)}</span>
                        </span>
                        <span className="text-vitta-border">|</span>
                        <span className="text-vitta-text-secondary">
                          Saldo de Uso: <span className="text-vitta-green">R$ {voucher.benefitValue.toFixed(2)}</span>
                        </span>
                        <span className="text-vitta-border">|</span>
                        <span className="text-vitta-text-secondary font-mono">
                          Líquido Repasse: <span className="text-indigo-600">R$ {sellerRepasse.toFixed(2)}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleDeleteCatalogVoucher(voucher.id, voucher.title)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg hover:text-red-700 transition-colors border border-red-100"
                        title="Remover do Catálogo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
