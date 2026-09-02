import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Star,
  Video,
  Building,
  CheckCircle,
  Filter,
  CreditCard,
  Wallet,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import { createGoogleCalendarEvent } from "../../utils/googleCalendar";

interface ProfessionalsViewProps {
  user: any;
  onBookAppointment?: (prof: any) => void;
  setActiveTab?: (tab: string) => void;
}

export const ProfessionalsView: React.FC<ProfessionalsViewProps> = ({
  user,
  setActiveTab,
}) => {
  const { addToast } = useToast();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedModality, setSelectedModality] = useState<"all" | "telemedicine" | "in_person">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Booking state
  const [selectedProf, setSelectedProf] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingModality, setBookingModality] = useState<"telemedicine" | "in_person">("telemedicine");
  const [isProcessing, setIsProcessing] = useState(false);
  const [userWalletBalance, setUserWalletBalance] = useState(0);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  useEffect(() => {
    const unsubProfs = onSnapshot(collection(db, "professionals"), (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProfessionals(all.filter((p: any) => p.status === "active" || !p.status));
      setLoading(false);
    });

    const unsubCats = onSnapshot(collection(db, "categories"), (snapshot) => {
      setCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubProfs();
      unsubCats();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserWalletBalance(docSnap.data().walletBalance || 0);
      }
    });
    return () => unsubUser();
  }, [user]);

  const filteredProfessionals = professionals.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      p.specialty?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesModality =
      selectedModality === "all" ||
      (selectedModality === "telemedicine" && (p.telemedicineEnabled !== false)) ||
      (selectedModality === "in_person" && (p.inPersonEnabled !== false));

    return matchesSearch && matchesCategory && matchesModality;
  });

  const handleOpenBooking = (prof: any) => {
    setSelectedProf(prof);
    setBookingModality(prof.telemedicineEnabled !== false ? "telemedicine" : "in_person");
    setBookingDate("");
    setBookingTime("");
    setSuccessBooking(null);
  };

  const handleConfirmBooking = async () => {
    if (!bookingDate || !bookingTime) {
      addToast("Selecione a data e horário para a consulta.", "error");
      return;
    }

    const priceNum = parseFloat(
      String(selectedProf.price || "150").replace(/[^0-9.,]/g, "").replace(",", ".")
    ) || 150;

    if (userWalletBalance < priceNum) {
      addToast(`Saldo insuficiente (R$ ${userWalletBalance.toFixed(2)}). Recarregue sua carteira.`, "error");
      return;
    }

    setIsProcessing(true);
    try {
      // Create appointment and debit wallet in batch / transaction
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists() || (userSnap.data().walletBalance || 0) < priceNum) {
          throw new Error("Saldo insuficiente");
        }

        const newBal = (userSnap.data().walletBalance || 0) - priceNum;
        transaction.update(userRef, { walletBalance: newBal });

        const aptRef = doc(collection(db, "appointments"));
        const isTele = bookingModality === "telemedicine";
        transaction.set(aptRef, {
          userId: user.uid,
          patientId: user.uid,
          patientName: user.displayName || user.email || "Paciente",
          patientEmail: user.email,
          professionalId: selectedProf.id,
          professionalUserId: selectedProf.userId || null,
          professionalName: selectedProf.name,
          professionalSpecialty: selectedProf.specialty,
          date: bookingDate,
          time: bookingTime,
          modality: bookingModality,
          isTelemedicine: isTele,
          type: isTele ? "telemedicine" : "presencial",
          telemedicineRoomId: isTele ? aptRef.id : null,
          telemedicineUrl: isTele ? `${window.location.origin}/?room=${aptRef.id}` : null,
          status: "upcoming",
          price: priceNum,
          paymentMethod: "vitta_coins",
          createdAt: new Date().toISOString(),
        });

        // Add transaction log
        const txRef = doc(collection(db, "transactions"));
        transaction.set(txRef, {
          userId: user.uid,
          type: "appointment_payment",
          amount: -priceNum,
          description: `Consulta com ${selectedProf.name} (${selectedProf.specialty})`,
          createdAt: new Date().toISOString(),
          status: "completed",
        });
      });

      const bookingInfo = {
        profName: selectedProf.name,
        specialty: selectedProf.specialty,
        date: bookingDate,
        time: bookingTime,
        modality: bookingModality,
      };

      setSuccessBooking(bookingInfo);
      addToast("Consulta agendada com sucesso com débito em ViTTA Coins!", "success");
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Erro ao realizar agendamento.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-vitta-text-primary">Especialistas e Médicos Credenciados</h2>
            <p className="text-xs text-vitta-text-muted mt-1">
              Agende consultas presenciais ou por telemedicina com valores e descontos exclusivos ViTTA
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-vitta-accent/10 border border-vitta-accent/20 rounded-2xl flex items-center gap-2">
              <Wallet size={16} className="text-vitta-accent" />
              <div className="text-left">
                <span className="text-[10px] text-vitta-text-muted block">Meu Saldo ViTTA:</span>
                <span className="text-xs font-bold text-vitta-text-primary">R$ {userWalletBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
            <input
              type="text"
              placeholder="Buscar por médico, especialidade ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedModality("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedModality === "all"
                  ? "bg-vitta-accent text-white"
                  : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"
              }`}
            >
              Todas Modalidades
            </button>
            <button
              onClick={() => setSelectedModality("telemedicine")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedModality === "telemedicine"
                  ? "bg-vitta-accent text-white"
                  : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"
              }`}
            >
              <Video size={14} />
              Telemedicina
            </button>
            <button
              onClick={() => setSelectedModality("in_person")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedModality === "in_person"
                  ? "bg-vitta-accent text-white"
                  : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"
              }`}
            >
              <Building size={14} />
              Presencial
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Professionals */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 bg-vitta-surface rounded-3xl border border-vitta-border animate-pulse" />
          ))}
        </div>
      ) : filteredProfessionals.length === 0 ? (
        <div className="p-12 text-center bg-vitta-surface rounded-3xl border border-vitta-border">
          <Stethoscope size={40} className="mx-auto text-vitta-text-muted opacity-40 mb-3" />
          <h3 className="text-base font-bold text-vitta-text-primary">Nenhum especialista encontrado</h3>
          <p className="text-xs text-vitta-text-muted mt-1">Tente ajustar seus termos de busca ou filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionals.map((prof) => (
            <div
              key={prof.id}
              className="bg-vitta-surface border border-vitta-border hover:border-vitta-accent/40 rounded-3xl p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-md space-y-4"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-vitta-surface-2 border border-vitta-border overflow-hidden shrink-0 flex items-center justify-center font-bold text-vitta-text-muted">
                    {prof.imageUrl ? (
                      <img
                        src={prof.imageUrl}
                        alt={prof.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Stethoscope size={28} className="text-vitta-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 bg-vitta-accent/10 text-vitta-accent rounded-full text-[10px] font-bold">
                        {prof.specialty || "Médico"}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-vitta-text-primary mt-1 truncate">{prof.name}</h3>
                    {prof.registrationNumber && (
                      <p className="text-[10px] text-vitta-text-muted">CRM: {prof.registrationNumber}</p>
                    )}
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-1">
                      <Star size={13} fill="currentColor" />
                      <span>{prof.rating || "4.9"}</span>
                      <span className="text-[10px] text-vitta-text-muted">({prof.reviewCount || "48"} avaliações)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-vitta-surface-2 p-3 rounded-2xl border border-vitta-border space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-vitta-text-muted text-[11px]">Valor Consulta:</span>
                    <span className="font-bold text-vitta-text-primary">{prof.price || "R$ 150,00"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-vitta-text-muted text-[11px]">Desconto ViTTA:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {prof.vittaHealthDiscount || "20% OFF"}
                    </span>
                  </div>
                  {prof.city && (
                    <div className="flex items-center gap-1.5 text-vitta-text-secondary text-[11px] pt-1 border-t border-vitta-border">
                      <MapPin size={13} className="text-vitta-text-muted shrink-0" />
                      <span className="truncate">{prof.city}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-vitta-border">
                <button
                  onClick={() => handleOpenBooking(prof)}
                  className="w-full py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar size={14} />
                  Agendar Consulta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedProf && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-lg rounded-3xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              {successBooking ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={36} />
                  </div>
                  <h3 className="text-lg font-bold text-vitta-text-primary">Consulta Confirmada!</h3>
                  <p className="text-xs text-vitta-text-muted">
                    Seu agendamento com <strong className="text-vitta-text-primary">{successBooking.profName}</strong> foi registrado com sucesso.
                  </p>
                  <div className="bg-vitta-surface-2 p-4 rounded-2xl border border-vitta-border text-xs text-left space-y-1.5">
                    <div><strong>Data:</strong> {successBooking.date} às {successBooking.time}</div>
                    <div><strong>Modalidade:</strong> {successBooking.modality === "telemedicine" ? "Telemedicina (Online)" : "Presencial"}</div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSelectedProf(null);
                        setSuccessBooking(null);
                        if (setActiveTab) setActiveTab("patient-dashboard");
                      }}
                      className="flex-1 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold"
                    >
                      Ver Meus Agendamentos
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-5 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2">
                    <div>
                      <h3 className="font-bold text-sm text-vitta-text-primary">Agendar Consulta</h3>
                      <p className="text-[11px] text-vitta-text-muted">{selectedProf.name} - {selectedProf.specialty}</p>
                    </div>
                    <button
                      onClick={() => setSelectedProf(null)}
                      className="text-vitta-text-muted hover:text-vitta-text-primary p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-vitta-text-secondary">Modalidade de Atendimento</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setBookingModality("telemedicine")}
                          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            bookingModality === "telemedicine"
                              ? "border-vitta-accent bg-vitta-accent/10 text-vitta-accent"
                              : "border-vitta-border bg-vitta-surface-2 text-vitta-text-secondary"
                          }`}
                        >
                          <Video size={16} />
                          Telemedicina
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingModality("in_person")}
                          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            bookingModality === "in_person"
                              ? "border-vitta-accent bg-vitta-accent/10 text-vitta-accent"
                              : "border-vitta-border bg-vitta-surface-2 text-vitta-text-secondary"
                          }`}
                        >
                          <Building size={16} />
                          Presencial
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">Data da Consulta</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary">Horário</label>
                        <select
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                        >
                          <option value="">Selecione...</option>
                          <option value="08:00">08:00</option>
                          <option value="09:00">09:00</option>
                          <option value="10:00">10:00</option>
                          <option value="11:00">11:00</option>
                          <option value="14:00">14:00</option>
                          <option value="15:00">15:00</option>
                          <option value="16:00">16:00</option>
                          <option value="17:00">17:00</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-vitta-surface-2 p-4 rounded-2xl border border-vitta-border space-y-2 text-xs">
                      <div className="flex justify-between items-center text-vitta-text-muted">
                        <span>Valor com desconto:</span>
                        <span className="font-bold text-vitta-text-primary">{selectedProf.price || "R$ 150,00"}</span>
                      </div>
                      <div className="flex justify-between items-center text-vitta-text-muted">
                        <span>Seu saldo em ViTTA Coins:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">R$ {userWalletBalance.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProf(null)}
                        className="flex-1 py-2.5 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold hover:bg-vitta-border transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleConfirmBooking}
                        className="flex-1 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-all flex items-center justify-center gap-2"
                      >
                        {isProcessing ? "Confirmando..." : "Confirmar e Pagar"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
