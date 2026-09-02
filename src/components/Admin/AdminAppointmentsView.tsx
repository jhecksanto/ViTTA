import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  orderBy,
  where,
  increment,
  Timestamp
} from "firebase/firestore";
import { addDoc, updateDoc, deleteDoc } from "../../lib/firestore-wrappers";
import { db } from "../../firebase";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  DollarSign,
  Video,
  MapPin,
  Check,
  X,
  FileText,
  RotateCcw,
  LayoutGrid
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { logAdminAction, recordAuditLog } from "../../lib/audit";
import { motion, AnimatePresence } from "motion/react";
import { handleFirestoreError, OperationType } from "../../App";

interface Appointment {
  id: string;
  userId: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  professionalId: string;
  professionalName: string;
  specialty?: string;
  crm?: string;
  imageUrl?: string;
  date: string;
  time: string;
  status: "pending" | "upcoming" | "completed" | "cancelled";
  modality?: "presencial" | "telemedicina" | "telemedicine" | "online";
  isTelemedicine?: boolean;
  type?: string;
  price?: number;
  paidWithCoins?: boolean;
  paymentMethod?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  rescheduledBy?: string;
  telemedicineRoomId?: string;
  telemedicineUrl?: string;
}

export const AdminAppointmentsView = () => {
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "upcoming" | "completed" | "cancelled"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newModality, setNewModality] = useState<"presencial" | "telemedicina" | "telemedicine">("presencial");
  const [isProcessingReschedule, setIsProcessingReschedule] = useState(false);

  // Cancellation Modal with Refund
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [autoRefundCoins, setAutoRefundCoins] = useState(true);
  const [isProcessingCancellation, setIsProcessingCancellation] = useState(false);

  // Confirm delete modal
  const [deletingAptId, setDeletingAptId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "appointments"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAppointments(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Appointment[]
        );
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "appointments");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return {
      total: appointments.length,
      pending: appointments.filter((a) => a.status === "pending").length,
      today: appointments.filter((a) => a.date === todayStr).length,
      upcoming: appointments.filter((a) => a.status === "upcoming").length,
      completed: appointments.filter((a) => a.status === "completed").length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length
    };
  }, [appointments]);

  // Combined Search: patient name/ID, doctor name/CRM, and appointment ID
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesStatus = filterStatus === "all" || apt.status === filterStatus;
      if (!matchesStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();

      const patient = (apt.patientName || "").toLowerCase();
      const patientId = (apt.userId || "").toLowerCase();
      const doctor = (apt.professionalName || "").toLowerCase();
      const crm = (apt.crm || "").toLowerCase();
      const id = apt.id.toLowerCase();
      const specialty = (apt.specialty || "").toLowerCase();

      return (
        patient.includes(q) ||
        patientId.includes(q) ||
        doctor.includes(q) ||
        crm.includes(q) ||
        id.includes(q) ||
        specialty.includes(q)
      );
    });
  }, [appointments, filterStatus, searchQuery]);

  // Quick Status Update
  const handleUpdateStatus = async (id: string, newStatus: Appointment["status"]) => {
    try {
      const apt = appointments.find((a) => a.id === id);
      await updateDoc(doc(db, "appointments", id), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      await logAdminAction(
        "UPDATE_APPOINTMENT_STATUS",
        `Alterou status da consulta ${id} para ${newStatus}`,
        { appointmentId: id, previousStatus: apt?.status, newStatus }
      );

      // Notify patient
      if (apt?.userId) {
        await addDoc(collection(db, "notifications"), {
          userId: apt.userId,
          title: "Status de Consulta Atualizado",
          message: `Sua consulta com ${apt.professionalName} foi atualizada para "${newStatus === 'upcoming' ? 'Agendada' : newStatus === 'completed' ? 'Concluída' : newStatus}".`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now()
        });
      }

      addToast(`Status da consulta atualizado para ${newStatus}.`, "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
      addToast("Erro ao atualizar status.", "error");
    }
  };

  // Reschedule Confirmation
  const handleConfirmReschedule = async () => {
    if (!reschedulingApt) return;
    if (!newDate || !newTime) {
      addToast("Informe a nova data e o novo horário da consulta.", "error");
      return;
    }

    setIsProcessingReschedule(true);
    const apt = reschedulingApt;
    try {
      const isTele = newModality === "telemedicine" || newModality === "telemedicina";
      await updateDoc(doc(db, "appointments", apt.id), {
        date: newDate,
        time: newTime,
        modality: isTele ? "telemedicine" : "presencial",
        isTelemedicine: isTele,
        type: isTele ? "telemedicine" : "presencial",
        telemedicineRoomId: isTele ? apt.id : null,
        telemedicineUrl: isTele ? `${window.location.origin}/?room=${apt.id}` : null,
        status: "upcoming",
        rescheduledBy: "admin",
        rescheduledAt: new Date().toISOString(),
        updatedAt: Timestamp.now()
      });

      const modLabel = isTele ? "Telemedicina" : "Presencial";

      // 1. Notify Patient
      if (apt.userId) {
        await addDoc(collection(db, "notifications"), {
          userId: apt.userId,
          title: "Consulta Reagendada pelo Admin",
          message: `Sua consulta com ${apt.professionalName} foi reagendada para ${newDate} às ${newTime} (${modLabel}).`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now()
        });
      }

      // 2. Notify Professional
      if (apt.professionalId) {
        await addDoc(collection(db, "notifications"), {
          userId: apt.professionalId,
          title: "Consulta de Paciente Reagendada",
          message: `A consulta com ${apt.patientName || 'Paciente'} foi remarcada para ${newDate} às ${newTime} (${modLabel}).`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now()
        });
      }

      // 3. Audit Log
      await logAdminAction(
        "RESCHEDULE_APPOINTMENT",
        `Reagendou consulta ${apt.id} de ${apt.date} ${apt.time} para ${newDate} ${newTime} (${modLabel})`,
        { appointmentId: apt.id, oldDate: apt.date, oldTime: apt.time, newDate, newTime, modality: newModality }
      );

      addToast("Consulta reagendada com sucesso! Paciente e profissional notificados.", "success");
      setReschedulingApt(null);
    } catch (err) {
      console.error("Erro ao reagendar consulta:", err);
      addToast("Erro ao reagendar consulta.", "error");
    } finally {
      setIsProcessingReschedule(false);
    }
  };

  // Cancellation with Automatic Refund
  const handleConfirmCancellation = async () => {
    if (!cancellingApt) return;
    if (!cancellationReason.trim()) {
      addToast("A justificativa de cancelamento é obrigatória.", "error");
      return;
    }

    setIsProcessingCancellation(true);
    const apt = cancellingApt;
    const price = apt.price || 0;
    const shouldRefund = autoRefundCoins && price > 0;

    try {
      // 1. Update appointment status
      await updateDoc(doc(db, "appointments", apt.id), {
        status: "cancelled",
        cancellationReason: cancellationReason.trim(),
        cancelledBy: "admin",
        cancelledAt: new Date().toISOString(),
        refundProcessed: shouldRefund,
        updatedAt: Timestamp.now()
      });

      // 2. Process refund in patient's wallet if applicable
      if (shouldRefund && apt.userId) {
        await updateDoc(doc(db, "users", apt.userId), {
          walletBalance: increment(price)
        });

        await addDoc(collection(db, "transactions"), {
          userId: apt.userId,
          type: "appointment_refund",
          amount: price,
          title: `Estorno de Consulta Cancelada (${apt.professionalName})`,
          category: "Estorno",
          justification: cancellationReason.trim(),
          date: new Date().toISOString()
        });
      }

      // 3. Notify Patient
      if (apt.userId) {
        await addDoc(collection(db, "notifications"), {
          userId: apt.userId,
          title: "Consulta Cancelada",
          message: `Sua consulta com ${apt.professionalName} do dia ${apt.date} foi cancelada pelo administrador. Motivo: ${cancellationReason.trim()}.${shouldRefund ? ` O valor de R$ ${price.toFixed(2)} foi estornado para seus créditos.` : ""}`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now()
        });
      }

      // 4. Notify Professional
      if (apt.professionalId) {
        await addDoc(collection(db, "notifications"), {
          userId: apt.professionalId,
          title: "Consulta Cancelada pela Administração",
          message: `A consulta com ${apt.patientName || "Paciente"} no dia ${apt.date} às ${apt.time} foi cancelada. Motivo: ${cancellationReason.trim()}`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now()
        });
      }

      // 5. Audit Log
      await recordAuditLog({
        action: "CANCEL_APPOINTMENT_REFUND",
        description: `Cancelou consulta ${apt.id} com estorno de R$ ${price.toFixed(2)}. Motivo: ${cancellationReason.trim()}`,
        before: { status: apt.status },
        after: { status: "cancelled", cancellationReason: cancellationReason.trim(), refunded: shouldRefund, refundAmount: price }
      });

      addToast(
        `Consulta cancelada com sucesso.${shouldRefund ? ` Estorno de R$ ${price.toFixed(2)} creditado.` : ""}`,
        "success"
      );
      setCancellingApt(null);
      setCancellationReason("");
    } catch (err) {
      console.error("Erro ao cancelar consulta:", err);
      addToast("Erro ao processar cancelamento.", "error");
    } finally {
      setIsProcessingCancellation(false);
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteDoc(doc(db, "appointments", id));
      await logAdminAction("DELETE_APPOINTMENT", `Excluiu permanentemente o agendamento ${id}`);
      addToast("Agendamento excluído com sucesso.", "success");
      setDeletingAptId(null);
    } catch (err) {
      addToast("Erro ao excluir agendamento.", "error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <section>
        <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">
          Gestão Global de Agendamentos
        </h1>
        <p className="text-vitta-text-secondary text-sm">
          Painel de controle com reagendamento assistido, estorno automático de créditos e busca combinada
        </p>
      </section>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Calendar, color: "text-vitta-accent", bg: "bg-vitta-accent-bg" },
          { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-vitta-amber", bg: "bg-vitta-amber-bg" },
          { label: "Para Hoje", value: stats.today, icon: LayoutGrid, color: "text-vitta-green", bg: "bg-vitta-green-bg" },
          { label: "Confirmados", value: stats.upcoming, icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" }
        ].map((stat, i) => (
          <div key={i} className="p-6 bg-vitta-surface border border-vitta-border rounded-3xl shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-2xl font-black text-vitta-text-primary">{stat.value}</span>
            </div>
            <p className="text-xs font-semibold text-vitta-text-secondary uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Combined Search Bar */}
      <div className="bg-vitta-surface p-4 rounded-3xl border border-vitta-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex gap-1.5 flex-wrap w-full md:w-auto">
          {[
            { id: "all", label: "Todos" },
            { id: "pending", label: "Pendentes" },
            { id: "upcoming", label: "Agendados" },
            { id: "completed", label: "Concluídos" },
            { id: "cancelled", label: "Cancelados" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === tab.id
                  ? "bg-vitta-accent text-white shadow-md shadow-vitta-accent/20"
                  : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Combined Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
          <input
            type="text"
            placeholder="Buscar paciente, médico, CRM ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-2xl text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20"
          />
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-vitta-surface rounded-3xl border border-vitta-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={28} className="animate-spin text-vitta-accent" />
            <p className="text-xs text-vitta-text-secondary">Carregando consultas...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-16 text-center text-vitta-text-muted">
            <Calendar size={36} className="mx-auto mb-2 opacity-20" />
            <p className="font-bold text-vitta-text-primary text-sm">Nenhum agendamento encontrado</p>
            <p className="text-xs mt-1">Tente ajustar seus termos de busca ou filtros de status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-vitta-surface-2 border-b border-vitta-border text-vitta-text-muted text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Profissional / Especialidade</th>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">Data / Horário</th>
                  <th className="px-6 py-4">Modalidade & Valor</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vitta-border">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-vitta-surface-2 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={apt.imageUrl || "https://picsum.photos/seed/prof/400/300"}
                          alt={apt.professionalName}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-vitta-border"
                        />
                        <div>
                          <p className="font-bold text-xs text-vitta-text-primary">{apt.professionalName}</p>
                          <p className="text-[10px] text-vitta-accent font-bold uppercase tracking-wider">
                            {apt.specialty || "Clínico Geral"} {apt.crm ? `• CRM ${apt.crm}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-vitta-surface-2 flex items-center justify-center text-vitta-text-muted border border-vitta-border shrink-0">
                          <User size={13} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-vitta-text-primary">{apt.patientName || "Paciente"}</p>
                          <p className="text-[10px] font-mono text-vitta-text-muted">ID: {apt.userId?.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-vitta-text-primary">{apt.date}</span>
                        <span className="text-[11px] text-vitta-text-muted font-semibold">{apt.time}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        {(() => {
                          const isTele = apt.modality === "telemedicina" || apt.modality === "telemedicine" || apt.isTelemedicine || apt.type === "telemedicine";
                          return (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-vitta-text-secondary uppercase">
                              {isTele ? <Video size={11} className="text-indigo-500" /> : <MapPin size={11} className="text-emerald-500" />}
                              {isTele ? "Telemedicina" : "Presencial"}
                            </span>
                          );
                        })()}
                        <p className="text-xs font-extrabold text-vitta-text-primary">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(apt.price || 0)}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        apt.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                          : apt.status === "upcoming"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                            : apt.status === "completed"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                      }`}>
                        {apt.status === "pending" ? "Pendente" : apt.status === "upcoming" ? "Agendada" : apt.status === "completed" ? "Concluída" : "Cancelada"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Accept pending */}
                        {apt.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, "upcoming")}
                            className="p-2 text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-colors"
                            title="Aceitar e Confirmar Agendamento"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}

                        {/* Reagendar */}
                        {(apt.status === "upcoming" || apt.status === "pending") && (
                          <button
                            onClick={() => {
                              setReschedulingApt(apt);
                              setNewDate(apt.date || "");
                              setNewTime(apt.time || "");
                              const isTele = apt.modality === "telemedicina" || apt.modality === "telemedicine" || apt.isTelemedicine || apt.type === "telemedicine";
                              setNewModality(isTele ? "telemedicine" : "presencial");
                            }}
                            className="p-2 text-vitta-accent hover:bg-vitta-accent-bg rounded-xl transition-colors"
                            title="Reagendar Consulta (Notifica Paciente e Médico)"
                          >
                            <Edit size={16} />
                          </button>
                        )}

                        {/* Complete */}
                        {apt.status === "upcoming" && (
                          <button
                            onClick={() => handleUpdateStatus(apt.id, "completed")}
                            className="p-2 text-emerald-600 hover:bg-emerald-500/10 rounded-xl transition-colors"
                            title="Marcar como Concluída"
                          >
                            <Check size={16} />
                          </button>
                        )}

                        {/* Cancel with Refund */}
                        {apt.status !== "cancelled" && apt.status !== "completed" && (
                          <button
                            onClick={() => {
                              setCancellingApt(apt);
                              setCancellationReason("");
                              setAutoRefundCoins(true);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                            title="Cancelar com Estorno e Justificativa"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}

                        {/* Delete permanently */}
                        <button
                          onClick={() => setDeletingAptId(apt.id)}
                          className="p-2 text-vitta-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                          title="Excluir Registro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Reagendamento de Consultas */}
      <AnimatePresence>
        {reschedulingApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-3xl border border-vitta-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-accent-bg/30">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-vitta-accent/10 text-vitta-accent rounded-2xl">
                    <Edit size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-vitta-text-primary">Reagendar Consulta</h3>
                    <p className="text-xs text-vitta-text-secondary">{reschedulingApt.professionalName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setReschedulingApt(null)}
                  className="p-2 text-vitta-text-muted hover:bg-vitta-surface-2 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-vitta-surface-2 rounded-2xl border border-vitta-border space-y-1">
                  <p className="font-bold text-vitta-text-primary">Paciente: {reschedulingApt.patientName || "Paciente"}</p>
                  <p className="text-vitta-text-secondary text-[11px]">
                    Horário anterior: {reschedulingApt.date} às {reschedulingApt.time}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-vitta-text-primary uppercase mb-1">
                    Nova Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-vitta-text-primary uppercase mb-1">
                    Novo Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-vitta-accent/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-vitta-text-primary uppercase mb-1">
                    Modalidade
                  </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewModality("presencial")}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          newModality === "presencial"
                            ? "bg-vitta-accent text-white shadow-md shadow-vitta-accent/20"
                            : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"
                        }`}
                      >
                        Presencial
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewModality("telemedicine")}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          newModality === "telemedicine" || newModality === "telemedicina"
                            ? "bg-vitta-accent text-white shadow-md shadow-vitta-accent/20"
                            : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"
                        }`}
                      >
                        Telemedicina
                      </button>
                    </div>
                </div>

                <p className="text-[10px] text-vitta-text-muted">
                  Notificações automáticas serão disparadas para o paciente e para o médico com os novos dados.
                </p>
              </div>

              <div className="p-4 bg-vitta-surface-2 border-t border-vitta-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReschedulingApt(null)}
                  className="px-4 py-2 text-vitta-text-secondary hover:bg-vitta-border rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isProcessingReschedule}
                  onClick={handleConfirmReschedule}
                  className="px-6 py-2 bg-vitta-accent hover:bg-vitta-accent-hover text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-vitta-accent/20 disabled:opacity-50"
                >
                  {isProcessingReschedule ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Salvar Reagendamento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Cancelamento com Estorno e Justificativa */}
      <AnimatePresence>
        {cancellingApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-3xl border border-vitta-border shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-rose-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-vitta-text-primary">Cancelamento & Estorno</h3>
                    <p className="text-xs text-vitta-text-secondary">Consulta com {cancellingApt.professionalName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCancellingApt(null)}
                  className="p-2 text-vitta-text-muted hover:bg-vitta-surface-2 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="p-3 bg-vitta-surface-2 rounded-2xl border border-vitta-border space-y-1">
                  <p className="font-bold text-vitta-text-primary">Paciente: {cancellingApt.patientName || "Paciente"}</p>
                  <p className="text-vitta-text-secondary text-[11px]">
                    Data da Consulta: {cancellingApt.date} às {cancellingApt.time}
                  </p>
                  <p className="text-xs font-bold text-emerald-600 mt-1">
                    Valor Pago: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cancellingApt.price || 0)}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-vitta-text-primary uppercase mb-1">
                    Justificativa do Cancelamento *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Ex: Imprevisto médico / Ausência justificada do paciente / Erro de agendamento"
                    className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                  <p className="text-[10px] text-rose-500 font-semibold mt-1">
                    * Campo obrigatório para conformidade e transparência.
                  </p>
                </div>

                {(cancellingApt.price || 0) > 0 && (
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-vitta-surface-2 rounded-2xl border border-vitta-border">
                    <input
                      type="checkbox"
                      checked={autoRefundCoins}
                      onChange={(e) => setAutoRefundCoins(e.target.checked)}
                      className="rounded text-vitta-accent focus:ring-vitta-accent"
                    />
                    <span className="text-xs font-bold text-vitta-text-primary">
                      Executar estorno imediato de R$ {(cancellingApt.price || 0).toFixed(2)} para os créditos do paciente
                    </span>
                  </label>
                )}
              </div>

              <div className="p-4 bg-vitta-surface-2 border-t border-vitta-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancellingApt(null)}
                  className="px-4 py-2 text-vitta-text-secondary hover:bg-vitta-border rounded-xl text-xs font-bold"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={isProcessingCancellation}
                  onClick={handleConfirmCancellation}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
                >
                  {isProcessingCancellation ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  Confirmar Cancelamento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Confirm Delete */}
      <AnimatePresence>
        {deletingAptId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-sm rounded-3xl border border-vitta-border shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
                  <Trash2 size={20} />
                </div>
                <h3 className="font-bold text-base text-vitta-text-primary">Excluir Agendamento</h3>
              </div>
              <p className="text-xs text-vitta-text-secondary">
                Tem certeza que deseja excluir permanentemente este registro de agendamento?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeletingAptId(null)}
                  className="px-4 py-2 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteAppointment(deletingAptId)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
