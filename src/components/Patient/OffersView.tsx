import React, { useState, useEffect } from "react";
import {
  Tag,
  Ticket,
  Search,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Clock,
  ExternalLink,
  Store,
  X,
  Percent,
  Lock,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";

interface OffersViewProps {
  user?: any;
}

export const OffersView: React.FC<OffersViewProps> = ({ user }) => {
  const { addToast } = useToast();
  const [offers, setOffers] = useState<any[]>([]);
  const [vouchersEnabled, setVouchersEnabled] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Sync global voucher toggle from system_configs/vouchers (Issue 02)
    const configRef = doc(db, "system_configs", "vouchers");
    const unsubConfig = onSnapshot(
      configRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setVouchersEnabled(data.vouchersEnabled !== undefined ? data.vouchersEnabled : true);
        } else {
          setVouchersEnabled(true);
        }
      },
      (err) => {
        console.warn("Could not read system_configs/vouchers, defaulting to enabled", err);
        setVouchersEnabled(true);
      }
    );

    // 2. Sync vouchers from vouchers_catalog and vouchers (Issue 02)
    let catalogList: any[] = [];
    let vouchersList: any[] = [];

    const updateCombinedOffers = () => {
      const map = new Map<string, any>();
      // Catalog items first
      catalogList.forEach((item) => {
        const discountText = item.discount || (
          item.benefitValue && item.price && item.benefitValue > item.price
            ? `${Math.round(((item.benefitValue - item.price) / item.benefitValue) * 100)}% OFF`
            : item.benefitValue ? `R$ ${item.benefitValue} em consumo` : "Oferta Especial"
        );
        map.set(item.id, {
          ...item,
          partnerName: item.partnerName || item.partner || "Parceiro ViTTA",
          discount: discountText,
          code: item.code || `VITTA-${item.id.slice(0, 6).toUpperCase()}`,
        });
      });

      // Secondary/Legacy vouchers items
      vouchersList.forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, {
            ...item,
            partnerName: item.partnerName || item.partner || "Parceiro ViTTA",
            discount: item.discount || "Oferta Especial",
            code: item.code || "VITTAPASS",
          });
        }
      });

      const all = Array.from(map.values()).filter((v: any) => v.status === "active" || !v.status);
      setOffers(all);
      setLoading(false);
    };

    const unsubCatalog = onSnapshot(
      collection(db, "vouchers_catalog"),
      (snapshot) => {
        catalogList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        updateCombinedOffers();
      },
      (error) => {
        console.error("Error fetching vouchers_catalog:", error);
        setLoading(false);
      }
    );

    const unsubVouchers = onSnapshot(
      collection(db, "vouchers"),
      (snapshot) => {
        vouchersList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        updateCombinedOffers();
      },
      (error) => {
        console.error("Error fetching vouchers:", error);
        setLoading(false);
      }
    );

    return () => {
      unsubConfig();
      unsubCatalog();
      unsubVouchers();
    };
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    addToast("Cupom copiado para a área de transferência!", "success");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredOffers = offers.filter((o) => {
    return (
      o.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.partnerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-vitta-text-primary">Clube de Benefícios & Vouchers Exclusivos</h2>
          <p className="text-xs text-vitta-text-muted mt-1">
            Apresente o QR Code ou utilize o código do cupom nos estabelecimentos credenciados para garantir descontos
          </p>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
          <input
            type="text"
            placeholder="Buscar por parceiro, serviço, desconto ou código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
          />
        </div>
      </div>

      {/* Offers List */}
      {!vouchersEnabled ? (
        <div className="p-12 text-center bg-vitta-surface rounded-3xl border border-vitta-border shadow-sm space-y-3">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <Lock size={28} />
          </div>
          <h3 className="text-base font-bold text-vitta-text-primary">
            Serviço de Vouchers Temporariamente Indisponível
          </h3>
          <p className="text-xs text-vitta-text-muted max-w-md mx-auto leading-relaxed">
            O Clube de Vouchers está temporariamente em manutenção para atualização de benefícios. Volte em breve!
          </p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-52 bg-vitta-surface rounded-3xl border border-vitta-border animate-pulse" />
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="p-12 text-center bg-vitta-surface rounded-3xl border border-vitta-border">
          <Ticket size={40} className="mx-auto text-vitta-text-muted opacity-40 mb-3" />
          <h3 className="text-base font-bold text-vitta-text-primary">Nenhum cupom ativo no momento</h3>
          <p className="text-xs text-vitta-text-muted mt-1">Novas ofertas e parcerias são adicionadas semanalmente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-vitta-surface border border-vitta-border hover:border-vitta-accent/40 rounded-3xl p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-md space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-full">
                      {offer.discount || "Oferta Especial"}
                    </span>
                    <h3 className="font-bold text-sm text-vitta-text-primary mt-2">{offer.title}</h3>
                    <p className="text-[11px] text-vitta-text-muted flex items-center gap-1.5 mt-0.5">
                      <Store size={13} />
                      {offer.partnerName || "Parceiro ViTTA"}
                    </p>
                  </div>
                </div>

                {offer.description && (
                  <p className="text-xs text-vitta-text-secondary line-clamp-2">{offer.description}</p>
                )}

                <div className="bg-vitta-surface-2 p-3 rounded-2xl border border-dashed border-vitta-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-vitta-text-muted block uppercase font-bold">Código do Cupom:</span>
                    <span className="font-mono font-bold text-xs text-vitta-text-primary tracking-wider">
                      {offer.code || "VITTAPASS"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(offer.code || "VITTAPASS", offer.id)}
                    className="p-2 bg-vitta-surface hover:bg-vitta-border rounded-xl text-vitta-text-secondary transition-all"
                    title="Copiar código"
                  >
                    {copiedId === offer.id ? (
                      <Check size={16} className="text-emerald-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-vitta-border">
                <button
                  onClick={() => setSelectedOffer(offer)}
                  className="w-full py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-all flex items-center justify-center gap-2"
                >
                  <QrCode size={16} />
                  Apresentar Voucher (QR Code)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Presentation Modal */}
      <AnimatePresence>
        {selectedOffer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-sm rounded-3xl shadow-2xl border border-vitta-border overflow-hidden text-center p-6 space-y-5"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-vitta-text-muted">
                  Voucher ViTTA Convênios
                </span>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className="p-1 text-vitta-text-muted hover:text-vitta-text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">
                  {selectedOffer.discount || "Desconto Especial"}
                </span>
                <h3 className="font-bold text-base text-vitta-text-primary mt-2">{selectedOffer.title}</h3>
                <p className="text-xs text-vitta-text-muted">{selectedOffer.partnerName}</p>
              </div>

              {/* QR Code mock visualization with live code */}
              <div className="bg-white p-4 rounded-2xl mx-auto w-48 h-48 border border-neutral-200 flex flex-col items-center justify-center shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    `VITTA-VOUCHER:${selectedOffer.code || "PROMO"}:${user?.uid || "GUEST"}`
                  )}`}
                  alt="QR Code do Cupom"
                  className="w-40 h-40 object-contain"
                />
              </div>

              <div className="bg-vitta-surface-2 p-3 rounded-2xl border border-vitta-border">
                <span className="text-[10px] text-vitta-text-muted block">Código de Validação:</span>
                <span className="font-mono font-bold text-sm text-vitta-text-primary tracking-widest">
                  {selectedOffer.code || "VITTAPASS"}
                </span>
              </div>

              <p className="text-[11px] text-vitta-text-muted">
                Apresente esta tela na recepção ou caixa do estabelecimento parceiro no momento do pagamento.
              </p>

              <button
                onClick={() => setSelectedOffer(null)}
                className="w-full py-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold transition-all"
              >
                Fechar Voucher
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
