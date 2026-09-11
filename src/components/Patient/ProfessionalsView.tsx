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
  QrCode,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PixCheckoutModal } from "./PixCheckoutModal";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  setDoc,
  updateDoc,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import { createGoogleCalendarEvent } from "../../utils/googleCalendar";

interface ProfessionalsViewProps {
  user: any;
  userData?: any;
  onBookAppointment?: (prof: any) => void;
  setActiveTab?: (tab: string) => void;
}

export const ProfessionalsView: React.FC<ProfessionalsViewProps> = ({
  user,
  userData,
  setActiveTab,
}) => {
  const { addToast } = useToast();
  const [currentUserData, setCurrentUserData] = useState<any>(userData || null);
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
  const [bookingModality, setBookingModality] = useState<"telemedicine" | "in_person">("in_person");
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState<"online" | "in_person" | "pix">("in_person");
  const [pixCheckoutData, setPixCheckoutData] = useState<{ amount: number; appointmentId?: string; purpose: 'appointment' | 'wallet_recharge' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userWalletBalance, setUserWalletBalance] = useState(0);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setCurrentUserData(snap.data());
      }
    });
    return () => unsub();
  }, [user?.uid]);

  const getPriceDetails = (prof: any) => {
    // Valor Particular (Normal) cadastrado em 'Valor Particular da Consulta *' no Admin
    const origPrice = parseFloat(
      String(prof?.price || "150").replace(/[^0-9.,]/g, "").replace(",", ".")
    ) || 150;

    // Issue 05: Desativar cálculo de desconto ViTTA caso a assinatura esteja expirada
    const currentPeriodEnd = currentUserData?.currentPeriodEnd 
      ? (currentUserData.currentPeriodEnd.toDate ? currentUserData.currentPeriodEnd.toDate() : new Date(currentUserData.currentPeriodEnd))
      : null;
    const isExpiredByDate = currentPeriodEnd && currentPeriodEnd.getTime() < Date.now();
    const isExpired = currentUserData?.subscriptionStatus === 'expired' || (isExpiredByDate && !currentUserData?.cancelAtPeriodEnd);

    const discountStr = isExpired ? "0% (Plano Expirado)" : (prof?.vittaHealthDiscount || "20% OFF");
    const discountDigits = isExpired ? 0 : (parseInt(discountStr.replace(/\D/g, "")) || 20);

    // Desconto sobre o valor particular oferecido pelo convênio ViTTA
    const savings = (origPrice * discountDigits) / 100;
    const priceNum = Math.max(origPrice - savings, 0);

    return {
      priceNum, // Valor com Desconto ViTTA
      origPrice, // Valor Normal (Particular)
      discountDigits,
      discountStr,
      savings,
      isExpired
    };
  };

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
    // Modalidade Presencial como padrão (a menos que o profissional só atenda Telemedicina)
    setBookingModality(prof.inPersonEnabled !== false ? "in_person" : "telemedicine");
    // Forma de Pagamento Presencial como padrão
    setBookingPaymentMethod("in_person");
    setBookingDate("");
    setBookingTime("");
    setSuccessBooking(null);
  };

  const handleConfirmBooking = async () => {
    if (!bookingDate || !bookingTime) {
      addToast("Selecione a data e horário para a consulta.", "error");
      return;
    }

    const { priceNum, origPrice, savings } = getPriceDetails(selectedProf);
    const isOnlinePayment = bookingPaymentMethod === "online";

    if (isOnlinePayment && userWalletBalance < priceNum) {
      addToast(
        `Saldo insuficiente (R$ ${userWalletBalance.toFixed(2).replace(".", ",")}). Recarregue sua carteira ou escolha o Pagamento Presencial.`,
        "error"
      );
      return;
    }

    setIsProcessing(true);
    try {
      const isTele = bookingModality === "telemedicine";
      const feeRate = typeof selectedProf.feeRate === "number" ? selectedProf.feeRate : 10;
      const feeAmount = (priceNum * feeRate) / 100;
      const netAmount = priceNum - feeAmount;

      if (isOnlinePayment) {
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
          transaction.set(aptRef, {
            userId: user.uid,
            patientId: user.uid,
            patientName: user.displayName || user.name || user.email || "Paciente",
            patientEmail: user.email,
            professionalId: selectedProf.id,
            professionalUserId: selectedProf.userId || selectedProf.id || null,
            professionalName: selectedProf.name,
            professionalSpecialty: selectedProf.specialty,
            date: bookingDate,
            time: bookingTime,
            modality: bookingModality,
            isTelemedicine: isTele,
            type: isTele ? "telemedicine" : "presencial",
            telemedicineRoomId: isTele ? aptRef.id : null,
            telemedicineUrl: isTele ? `${window.location.origin}/?room=${aptRef.id}` : null,
            status: "pending",
            price: priceNum,
            originalPrice: origPrice,
            discountAmount: savings,
            paymentMethod: "online",
            paymentType: "vitta_coins",
            paymentStatus: "paid",
            paid: true,
            paidAt: new Date().toISOString(),
            feeRate: feeRate,
            feeCharged: feeAmount,
            netAmount: netAmount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          // Notify professional about the pending appointment
          const profTargetUid = selectedProf.userId || selectedProf.id;
          if (profTargetUid) {
            const profNotifRef = doc(collection(db, "notifications"));
            transaction.set(profNotifRef, {
              userId: profTargetUid,
              title: "Nova Solicitação de Agendamento",
              message: `O paciente ${user.displayName || user.name || user.email || "Paciente"} solicitou uma consulta (${isTele ? "Telemedicina" : "Presencial"}) para ${bookingDate} às ${bookingTime}. Aguardando sua confirmação.`,
              type: "appointment",
              appointmentId: aptRef.id,
              read: false,
              createdAt: new Date().toISOString(),
            });
          }

          // Add patient transaction log
          const txRef = doc(collection(db, "transactions"));
          transaction.set(txRef, {
            userId: user.uid,
            appointmentId: aptRef.id,
            type: "appointment_payment",
            amount: -priceNum,
            grossAmount: priceNum,
            title: `Consulta com ${selectedProf.name}`,
            description: `Pagamento de Consulta Online (${selectedProf.specialty}) - Aguardando realização`,
            createdAt: new Date().toISOString(),
            date: new Date().toISOString(),
            status: "completed",
          });
        });
      } else if (bookingPaymentMethod === "in_person") {
        // Presencial Payment: No upfront debit from patient.
        // Consultation will only be invoiced when completed by professional.
        const aptRef = doc(collection(db, "appointments"));
        await setDoc(aptRef, {
          id: aptRef.id,
          userId: user.uid,
          patientId: user.uid,
          patientName: user.displayName || user.name || user.email || "Paciente",
          patientEmail: user.email,
          professionalId: selectedProf.id,
          professionalUserId: selectedProf.userId || selectedProf.id || null,
          professionalName: selectedProf.name,
          professionalSpecialty: selectedProf.specialty,
          date: bookingDate,
          time: bookingTime,
          modality: bookingModality,
          isTelemedicine: isTele,
          type: isTele ? "telemedicine" : "presencial",
          telemedicineRoomId: isTele ? aptRef.id : null,
          telemedicineUrl: isTele ? `${window.location.origin}/?room=${aptRef.id}` : null,
          status: "pending",
          price: priceNum,
          priceNumeric: priceNum,
          originalPrice: origPrice,
          discountAmount: savings,
          paymentMethod: "in_person",
          paymentType: "pay_at_clinic",
          paymentStatus: "pending_in_person",
          paid: false,
          invoiced: false,
          feeRate: feeRate,
          feeCharged: feeAmount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Notify professional about the pending in-person appointment
        const profTargetUid = selectedProf.userId || selectedProf.id;
        if (profTargetUid) {
          await addDoc(collection(db, "notifications"), {
            userId: profTargetUid,
            title: "Nova Solicitação de Agendamento",
            message: `O paciente ${user.displayName || user.name || user.email || "Paciente"} solicitou uma consulta presencial para ${bookingDate} às ${bookingTime}. Aguardando sua confirmação.`,
            type: "appointment",
            appointmentId: aptRef.id,
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      } else if (bookingPaymentMethod === "pix") {
        // PIX Instant Payment: Create appointment and launch PixCheckoutModal
        const aptRef = doc(collection(db, "appointments"));
        await setDoc(aptRef, {
          id: aptRef.id,
          userId: user.uid,
          patientId: user.uid,
          patientName: user.displayName || user.name || user.email || "Paciente",
          patientEmail: user.email,
          professionalId: selectedProf.id,
          professionalUserId: selectedProf.userId || selectedProf.id || null,
          professionalName: selectedProf.name,
          professionalSpecialty: selectedProf.specialty,
          date: bookingDate,
          time: bookingTime,
          modality: bookingModality,
          isTelemedicine: isTele,
          type: isTele ? "telemedicine" : "presencial",
          telemedicineRoomId: isTele ? aptRef.id : null,
          telemedicineUrl: isTele ? `${window.location.origin}/?room=${aptRef.id}` : null,
          status: "pending",
          price: priceNum,
          priceNumeric: priceNum,
          originalPrice: origPrice,
          discountAmount: savings,
          paymentMethod: "pix",
          paymentType: "pix_copia_cola",
          paymentStatus: "pending_pix",
          paid: false,
          invoiced: false,
          feeRate: feeRate,
          feeCharged: feeAmount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Open PIX Checkout Modal
        setPixCheckoutData({
          amount: priceNum,
          appointmentId: aptRef.id,
          purpose: 'appointment',
        });
      }

      const bookingInfo = {
        profName: selectedProf.name,
        specialty: selectedProf.specialty,
        date: bookingDate,
        time: bookingTime,
        modality: bookingModality,
        paymentMethod: bookingPaymentMethod,
        price: priceNum,
        origPrice: origPrice,
        savings: savings,
      };

      setSuccessBooking(bookingInfo);
      addToast(
        isOnlinePayment
          ? "Solicitação de agendamento enviada! O status permanecerá como 'Aguardando Confirmação' até o médico confirmar."
          : "Solicitação de agendamento enviada! Aguardando confirmação do profissional de saúde.",
        "success"
      );
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

                {(() => {
                  const details = getPriceDetails(prof);
                  return (
                    <div className="bg-vitta-surface-2 p-3.5 rounded-2xl border border-vitta-border space-y-2 text-xs">
                      <div className="flex justify-between items-center text-vitta-text-muted">
                        <span className="text-[11px]">Valor Normal (Particular):</span>
                        <span className="line-through text-xs font-semibold text-vitta-text-muted">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(details.origPrice)}
                        </span>
                      </div>

                      {details.isExpired ? (
                        <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-xs">
                          <div className="flex items-center justify-between font-bold text-amber-700 dark:text-amber-300">
                            <span>Valor Particular:</span>
                            <span className="font-black text-sm">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(details.priceNum)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                            <span>Assinatura expirada</span>
                            {setActiveTab && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab("plans");
                                }}
                                className="underline font-bold cursor-pointer hover:text-amber-800"
                              >
                                Reativar plano
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                            <div className="flex items-center gap-1.5">
                              <Sparkles size={13} className="text-emerald-500 shrink-0" />
                              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                Com Desconto ViTTA:
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(details.priceNum)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-1">
                            <span>Desconto ViTTA: {details.discountStr}</span>
                            <span>Economia: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(details.savings)}</span>
                          </div>
                        </>
                      )}

                      {prof.city && (
                        <div className="flex items-center gap-1.5 text-vitta-text-secondary text-[11px] pt-1.5 border-t border-vitta-border">
                          <MapPin size={13} className="text-vitta-text-muted shrink-0" />
                          <span className="truncate">{prof.city}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-lg rounded-3xl shadow-2xl border border-vitta-border overflow-hidden my-6"
            >
              {successBooking ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                    <Clock size={36} className="animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-vitta-text-primary">Agendamento Solicitado!</h3>
                  <p className="text-xs text-vitta-text-muted">
                    Sua solicitação com <strong className="text-vitta-text-primary">{successBooking.profName}</strong> foi enviada e está <span className="font-bold text-amber-600 dark:text-amber-400">aguardando confirmação do profissional</span>.
                  </p>
                  <div className="bg-vitta-surface-2 p-4 rounded-2xl border border-vitta-border text-xs text-left space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-vitta-border">
                      <span className="text-vitta-text-muted">Status Atual:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Clock size={11} /> Aguardando Confirmação
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-vitta-text-muted">Especialista:</span>
                      <strong>{successBooking.profName} ({successBooking.specialty})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-vitta-text-muted">Data e Horário:</span>
                      <strong>{successBooking.date} às {successBooking.time}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-vitta-text-muted">Modalidade:</span>
                      <strong>{successBooking.modality === "telemedicine" ? "Telemedicina (Online)" : "Presencial (No Consultório)"}</strong>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-vitta-border">
                      <span className="text-vitta-text-muted">Forma de Pagamento:</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        successBooking.paymentMethod === "online"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}>
                        {successBooking.paymentMethod === "online" ? "Pago Online (ViTTA Coins)" : "Presencial (Pagar na Clínica)"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-vitta-text-muted">Valor da Consulta:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(successBooking.price)}
                      </strong>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSelectedProf(null);
                        setSuccessBooking(null);
                        if (setActiveTab) setActiveTab("patient-dashboard");
                      }}
                      className="flex-1 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 transition-all cursor-pointer shadow-md shadow-vitta-accent/20"
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

                  <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Modalidade */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-vitta-text-secondary">1. Modalidade de Atendimento</label>
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

                    {/* Data e Horário */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-vitta-text-secondary">2. Data e Horário da Consulta</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-vitta-text-muted">Data</span>
                          <input
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full px-3.5 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-vitta-text-muted">Horário</span>
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
                    </div>

                    {/* Forma de Pagamento */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-vitta-text-secondary">3. Escolha a Forma de Pagamento</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setBookingPaymentMethod("in_person")}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            bookingPaymentMethod === "in_person"
                              ? "border-vitta-accent bg-vitta-accent/10 ring-2 ring-vitta-accent/20"
                              : "border-vitta-border bg-vitta-surface-2 hover:bg-vitta-border/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building size={16} className={bookingPaymentMethod === "in_person" ? "text-vitta-accent" : "text-vitta-text-muted"} />
                            <span className="font-bold text-xs text-vitta-text-primary">Presencial</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-vitta-accent/20 text-vitta-accent font-bold uppercase ml-auto">Padrão</span>
                          </div>
                          <p className="text-[11px] text-vitta-text-muted mt-1 leading-tight">
                            Pague no consultório ou recepção.
                          </p>
                          <div className="mt-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            Sem débito prévio
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBookingPaymentMethod("online")}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            bookingPaymentMethod === "online"
                              ? "border-vitta-accent bg-vitta-accent/10 ring-2 ring-vitta-accent/20"
                              : "border-vitta-border bg-vitta-surface-2 hover:bg-vitta-border/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard size={16} className={bookingPaymentMethod === "online" ? "text-vitta-accent" : "text-vitta-text-muted"} />
                            <span className="font-bold text-xs text-vitta-text-primary">ViTTA Coins</span>
                          </div>
                          <p className="text-[11px] text-vitta-text-muted mt-1 leading-tight">
                            Débito do saldo da carteira.
                          </p>
                          <div className="mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Saldo: R$ {userWalletBalance.toFixed(2).replace(".", ",")}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBookingPaymentMethod("pix")}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            bookingPaymentMethod === "pix"
                              ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20"
                              : "border-vitta-border bg-vitta-surface-2 hover:bg-vitta-border/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <QrCode size={16} className={bookingPaymentMethod === "pix" ? "text-emerald-600" : "text-vitta-text-muted"} />
                            <span className="font-bold text-xs text-vitta-text-primary">PIX Instantâneo</span>
                          </div>
                          <p className="text-[11px] text-vitta-text-muted mt-1 leading-tight">
                            QR Code e Copia e Cola imediato.
                          </p>
                          <div className="mt-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Liberação rápida
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Aviso de Confirmação Obrigatória do Profissional */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                      <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <strong className="block font-bold">Confirmação do Profissional Necessária</strong>
                        <span className="text-[11px] text-amber-700/90 dark:text-amber-300/90">
                          Todo agendamento (online ou presencial) é enviado para aprovação do médico e ficará com o status <strong className="underline">Aguardando Confirmação</strong> até ser aceito.
                        </span>
                      </div>
                    </div>

                    {/* Resumo de Valores e Descontos */}
                    {(() => {
                      const details = getPriceDetails(selectedProf);
                      const isOnline = bookingPaymentMethod === "online";
                      const hasEnoughBalance = userWalletBalance >= details.priceNum;

                      return (
                        <div className="bg-vitta-surface-2 p-4 rounded-2xl border border-vitta-border space-y-2 text-xs">
                          <div className="flex justify-between items-center text-vitta-text-muted">
                            <span>Valor Normal Particular:</span>
                            <span className="line-through font-medium">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(details.origPrice)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                            <div className="flex items-center gap-1.5">
                              <Sparkles size={14} className="text-emerald-500" />
                              <span className="font-bold text-emerald-800 dark:text-emerald-200">
                                Valor com Desconto ViTTA:
                              </span>
                            </div>
                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(details.priceNum)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-bold px-1">
                            <span>Desconto aplicado: {details.discountStr}</span>
                            <span>Economia: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(details.savings)}</span>
                          </div>

                          <div className="pt-2 border-t border-vitta-border text-[11px] flex justify-between items-center">
                            <span className="text-vitta-text-muted">Forma Selecionada:</span>
                            <span className="font-bold text-vitta-text-primary">
                              {bookingPaymentMethod === "online"
                                ? "Online (Débito em ViTTA Coins)"
                                : bookingPaymentMethod === "pix"
                                ? "PIX Instantâneo (QR Code / Copia e Cola)"
                                : "Presencial (Pagar na Recepção)"}
                            </span>
                          </div>

                          {isOnline && !hasEnoughBalance && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span>⚠️ Seu saldo atual (R$ {userWalletBalance.toFixed(2).replace(".", ",")}) é inferior ao valor da consulta.</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPixCheckoutData({
                                    amount: Math.ceil(details.priceNum - userWalletBalance),
                                    purpose: "wallet_recharge",
                                  });
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-all shrink-0"
                              >
                                <QrCode size={12} />
                                <span>Recarregar via PIX</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProf(null)}
                        className="flex-1 py-2.5 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold hover:bg-vitta-border transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleConfirmBooking}
                        className="flex-1 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isProcessing
                          ? "Enviando Solicitação..."
                          : (bookingPaymentMethod === "online"
                              ? "Solicitar e Pagar Online"
                              : "Solicitar Agendamento Presencial")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Checkout PIX com QR Code Dinâmico e Verificação Instantânea */}
      {pixCheckoutData && (
        <PixCheckoutModal
          isOpen={true}
          onClose={() => setPixCheckoutData(null)}
          amount={pixCheckoutData.amount}
          purpose={pixCheckoutData.purpose}
          appointmentId={pixCheckoutData.appointmentId}
          user={user}
          onSuccess={() => {
            if (pixCheckoutData.purpose === 'appointment') {
              setPixCheckoutData(null);
              setSelectedProf(null);
              setSuccessBooking({
                profName: selectedProf?.name || "Profissional",
                specialty: selectedProf?.specialty || "Especialidade",
                date: bookingDate,
                time: bookingTime,
                modality: bookingModality,
                paymentMethod: "pix",
                price: pixCheckoutData.amount,
                origPrice: pixCheckoutData.amount,
                savings: 0,
              });
            }
          }}
        />
      )}
    </div>
  );
};
