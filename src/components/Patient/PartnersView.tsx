import React, { useState, useEffect } from "react";
import {
  Store,
  Search,
  MapPin,
  Phone,
  Tag,
  ExternalLink,
  MessageCircle,
  Percent,
  Navigation,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

export const PartnersView: React.FC = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubPartners = onSnapshot(collection(db, "partners"), (snapshot) => {
      setPartners(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
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

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleOpenMap = (address: string, city: string) => {
    const query = encodeURIComponent(`${address}, ${city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const handleWhatsApp = (phone: string, partnerName: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá! Sou cliente do ViTTA Convênios e gostaria de obter informações sobre os descontos e serviços no(a) ${partnerName}.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-vitta-text-primary">Rede Credenciada de Estabelecimentos</h2>
          <p className="text-xs text-vitta-text-muted mt-1">
            Encontre farmácias, clínicas, laboratórios, óticas e academias com descontos exclusivos do plano ViTTA
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
            <input
              type="text"
              placeholder="Buscar por estabelecimento, bairro, cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-vitta-accent text-white"
                  : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"
              }`}
            >
              Todos ({partners.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.name
                    ? "bg-vitta-accent text-white"
                    : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Partners List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-48 bg-vitta-surface rounded-3xl border border-vitta-border animate-pulse" />
          ))}
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="p-12 text-center bg-vitta-surface rounded-3xl border border-vitta-border">
          <Store size={40} className="mx-auto text-vitta-text-muted opacity-40 mb-3" />
          <h3 className="text-base font-bold text-vitta-text-primary">Nenhum estabelecimento encontrado</h3>
          <p className="text-xs text-vitta-text-muted mt-1">Tente pesquisar com outros termos ou selecione outra categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-vitta-surface border border-vitta-border hover:border-vitta-accent/40 rounded-3xl p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-md space-y-4"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-vitta-surface-2 border border-vitta-border overflow-hidden shrink-0 flex items-center justify-center font-bold text-vitta-text-muted">
                    {partner.imageUrl ? (
                      <img src={partner.imageUrl} alt={partner.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store size={24} className="text-vitta-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                      {partner.discount || "Desconto Especial"}
                    </span>
                    <h3 className="font-bold text-sm text-vitta-text-primary mt-1 truncate">{partner.name}</h3>
                    <p className="text-[11px] text-vitta-text-muted">{partner.category || "Parceiro"}</p>
                  </div>
                </div>

                <div className="bg-vitta-surface-2 p-3.5 rounded-2xl border border-vitta-border space-y-2 text-xs">
                  {partner.address && (
                    <div className="flex items-start gap-2 text-vitta-text-secondary text-[11px]">
                      <MapPin size={14} className="text-vitta-text-muted shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{partner.address} {partner.city ? `- ${partner.city}` : ""}</span>
                    </div>
                  )}
                  {partner.phone && (
                    <div className="flex items-center gap-2 text-vitta-text-secondary text-[11px]">
                      <Phone size={14} className="text-vitta-text-muted shrink-0" />
                      <span>{partner.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-vitta-border">
                {partner.address && (
                  <button
                    onClick={() => handleOpenMap(partner.address, partner.city || "")}
                    className="py-2 px-3 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Navigation size={13} className="text-vitta-accent" />
                    Como Chegar
                  </button>
                )}
                {partner.phone ? (
                  <button
                    onClick={() => handleWhatsApp(partner.phone, partner.name)}
                    className="py-2 px-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageCircle size={13} />
                    WhatsApp
                  </button>
                ) : (
                  <div className="py-2 px-3 bg-vitta-surface-2 text-vitta-text-muted rounded-xl text-xs font-bold text-center">
                    Credenciado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
