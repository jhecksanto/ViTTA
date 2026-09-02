import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Video, 
  User, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Stethoscope, 
  MapPin, 
  ChevronRight, 
  AlertTriangle,
  RotateCcw,
  Search,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  Timestamp, 
  increment 
} from 'firebase/firestore';
import { updateDoc, addDoc } from '../../lib/firestore-wrappers';
import { db } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';
import { formatDateForDisplay } from '../../utils/date';
import { ReviewModal } from '../ReviewModal';

interface MyAppointmentsViewProps {
  user: any;
  userData?: any;
  setActiveTelemedicineApt?: (apt: any) => void;
  setActiveTab?: (tab: string) => void;
}

export const MyAppointmentsView: React.FC<MyAppointmentsViewProps> = ({
  user,
  userData,
  setActiveTelemedicineApt,
  setActiveTab
}) => {
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cancel appointment modal state
  const [cancellingApt, setCancellingApt] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Review appointment modal state (Issue 01)
  const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<any | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const apts = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        // Sort by date desc or createdAt desc safely client-side
        apts.sort((a: any, b: any) => {
          const dateA = a.date ? new Date(`${a.date}T${a.time || '00:00'}`).getTime() : 0;
          const dateB = b.date ? new Date(`${b.date}T${b.time || '00:00'}`).getTime() : 0;
          return dateB - dateA;
        });

        setAppointments(apts);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar consultas:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const filteredAppointments = appointments.filter((apt) => {
    const statusMatch = 
      filter === 'all' ? true :
      filter === 'upcoming' ? (apt.status === 'upcoming' || apt.status === 'in_progress' || apt.status === 'scheduled') :
      filter === 'completed' ? apt.status === 'completed' :
      filter === 'cancelled' ? apt.status === 'cancelled' : true;

    const searchMatch = !searchQuery || 
      (apt.professionalName && apt.professionalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (apt.specialty && apt.specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (apt.location && apt.location.toLowerCase().includes(searchQuery.toLowerCase()));

    return statusMatch && searchMatch;
  });

  const countUpcoming = appointments.filter(a => a.status === 'upcoming' || a.status === 'in_progress' || a.status === 'scheduled').length;
  const countCompleted = appointments.filter(a => a.status === 'completed').length;
  const countCancelled = appointments.filter(a => a.status === 'cancelled').length;

  const handleConfirmCancel = async () => {
    if (!cancellingApt || isSubmittingCancel) return;
    setIsSubmittingCancel(true);

    try {
      const now = Timestamp.now();
      const aptId = cancellingApt.id;
      const priceNumeric = cancellingApt.priceNumeric || (cancellingApt.price ? parseFloat(cancellingApt.price) : 0);
      const isPaid = cancellingApt.paymentStatus === 'paid' || cancellingApt.paid === true;

      // 1. Atualizar o agendamento para cancelado
      await updateDoc(doc(db, 'appointments', aptId), {
        status: 'cancelled',
        cancelledBy: 'patient',
        cancelReason: cancelReason || 'Cancelado pelo paciente via painel',
        cancelledAt: now,
        telemedicineStatus: 'closed',
        updatedAt: now
      });

      // 2. Estorno financeiro automático para a carteira digital do paciente
      if (priceNumeric > 0 && isPaid) {
        // Creditar carteira do paciente
        await updateDoc(doc(db, 'users', user.uid), {
          walletBalance: increment(priceNumeric)
        });

        // Registrar comprovante da transação de estorno
        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          type: 'refund',
          amount: priceNumeric,
          title: `Estorno - Consulta ${cancellingApt.professionalName || 'Médico'}`,
          description: `Reembolso integral referente ao cancelamento de consulta agendada para ${formatDateForDisplay(cancellingApt.date)} às ${cancellingApt.time || '00:00'}.`,
          category: 'Reembolso',
          date: new Date().toISOString(),
          appointmentId: aptId,
          professionalName: cancellingApt.professionalName,
          status: 'completed',
          createdAt: now
        });
      }

      // 3. Notificar o profissional de saúde
      const profTargetId = cancellingApt.professionalUserId || cancellingApt.professionalId;
      if (profTargetId) {
        await addDoc(collection(db, 'notifications'), {
          userId: profTargetId,
          title: 'Consulta Cancelada pelo Paciente',
          message: `O paciente ${userData?.name || user?.displayName || 'Paciente'} cancelou o agendamento de ${formatDateForDisplay(cancellingApt.date)} às ${cancellingApt.time || ''}. Motivo informado: "${cancelReason || 'Nenhum motivo detalhado'}"`,
          type: 'appointment',
          appointmentId: aptId,
          read: false,
          createdAt: now
        });
      }

      addToast(
        priceNumeric > 0 && isPaid
          ? `Consulta desmarcada com sucesso! O valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(priceNumeric)} foi estornado para sua Carteira ViTTA.`
          : 'Consulta cancelada com sucesso.',
        'success'
      );

      setCancellingApt(null);
      setCancelReason('');
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err);
      addToast('Erro ao processar o cancelamento da consulta. Tente novamente.', 'error');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-vitta-text-primary tracking-tight">
            Minhas Consultas & Agendamentos
          </h1>
          <p className="text-xs text-vitta-text-secondary mt-0.5">
            Gerencie seus horários, acesse salas de telemedicina e consulte seu histórico médico.
          </p>
        </div>

        {setActiveTab && (
          <button
            onClick={() => setActiveTab('professionals')}
            className="px-4 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-black hover:bg-vitta-accent/90 transition-all shadow-md shadow-vitta-accent/20 flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Calendar size={16} />
            Agendar Nova Consulta
          </button>
        )}
      </div>

      {/* Counters & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'upcoming'
                ? 'bg-vitta-accent text-white shadow-sm shadow-vitta-accent/20'
                : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'
            }`}
          >
            <Clock size={14} />
            Próximas & Agendadas
            <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-black ${
              filter === 'upcoming' ? 'bg-white/20 text-white' : 'bg-vitta-surface-2 text-vitta-text-muted'
            }`}>
              {countUpcoming}
            </span>
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'completed'
                ? 'bg-vitta-accent text-white shadow-sm shadow-vitta-accent/20'
                : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'
            }`}
          >
            <CheckCircle2 size={14} />
            Concluídas
            <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-black ${
              filter === 'completed' ? 'bg-white/20 text-white' : 'bg-vitta-surface-2 text-vitta-text-muted'
            }`}>
              {countCompleted}
            </span>
          </button>

          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'cancelled'
                ? 'bg-vitta-accent text-white shadow-sm shadow-vitta-accent/20'
                : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'
            }`}
          >
            <X size={14} />
            Canceladas
            <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-black ${
              filter === 'cancelled' ? 'bg-white/20 text-white' : 'bg-vitta-surface-2 text-vitta-text-muted'
            }`}>
              {countCancelled}
            </span>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'all'
                ? 'bg-vitta-accent text-white shadow-sm shadow-vitta-accent/20'
                : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'
            }`}
          >
            Todas
            <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-black ${
              filter === 'all' ? 'bg-white/20 text-white' : 'bg-vitta-surface-2 text-vitta-text-muted'
            }`}>
              {appointments.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
          <input
            type="text"
            placeholder="Buscar por médico ou especialidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:border-vitta-accent transition-colors"
          />
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="bg-vitta-surface border border-vitta-border rounded-2xl p-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-vitta-text-muted font-bold">Carregando seus agendamentos...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-vitta-surface border border-dashed border-vitta-border rounded-2xl p-12 text-center space-y-3">
          <Calendar className="mx-auto text-vitta-text-muted/60" size={40} />
          <h3 className="text-sm font-bold text-vitta-text-primary">Nenhuma consulta encontrada</h3>
          <p className="text-xs text-vitta-text-muted max-w-sm mx-auto">
            {filter === 'upcoming' 
              ? 'Você não possui consultas agendadas no momento. Que tal encontrar um especialista?'
              : 'Nenhum agendamento corresponde ao filtro selecionado.'}
          </p>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('professionals')}
              className="mt-2 px-4 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Stethoscope size={14} /> Encontrar Médicos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((apt) => {
            const isUpcoming = apt.status === 'upcoming' || apt.status === 'in_progress' || apt.status === 'scheduled';
            const isCompleted = apt.status === 'completed';
            const isCancelled = apt.status === 'cancelled';
            const isTelemedicine = apt.type === 'telemedicine' || apt.isTelemedicine || apt.roomType === 'telemedicine';
            const price = apt.priceNumeric || (apt.price ? parseFloat(apt.price) : 0);

            return (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-vitta-surface border border-vitta-border rounded-2xl p-5 space-y-4 hover:border-vitta-accent/40 transition-all shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-vitta-surface-2 border border-vitta-border flex items-center justify-center font-black text-sm text-vitta-accent shrink-0 overflow-hidden">
                        {apt.imageUrl ? (
                          <img src={apt.imageUrl} alt={apt.professionalName} className="w-full h-full object-cover" />
                        ) : (
                          (apt.professionalName || 'Dr')[0].toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-vitta-text-primary truncate">
                          {apt.professionalName || 'Profissional de Saúde'}
                        </h4>
                        <p className="text-xs text-vitta-accent font-semibold truncate">
                          {apt.specialty || 'Clínica Geral'}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      isUpcoming ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                      isCompleted ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {isUpcoming ? 'Agendada' : isCompleted ? 'Concluída' : 'Cancelada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-vitta-surface-2/60 p-3 rounded-xl border border-vitta-border/60">
                    <div className="flex items-center gap-2 text-vitta-text-secondary">
                      <Calendar size={14} className="text-vitta-accent shrink-0" />
                      <span className="font-medium truncate">{formatDateForDisplay(apt.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-vitta-text-secondary">
                      <Clock size={14} className="text-vitta-accent shrink-0" />
                      <span className="font-medium truncate">{apt.time || 'Horário a definir'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-vitta-text-secondary col-span-2">
                      {isTelemedicine ? (
                        <>
                          <Video size={14} className="text-vitta-green shrink-0" />
                          <span className="font-bold text-vitta-green truncate">Telemedicina Online (Vídeo HD)</span>
                        </>
                      ) : (
                        <>
                          <MapPin size={14} className="text-vitta-text-muted shrink-0" />
                          <span className="font-medium truncate">{apt.location || 'Atendimento Presencial'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Cancel reason note if cancelled */}
                  {isCancelled && apt.cancelReason && (
                    <div className="p-2.5 bg-rose-500/5 border border-rose-500/15 rounded-xl text-[11px] text-rose-600 dark:text-rose-400 space-y-0.5">
                      <span className="font-bold block">Motivo do cancelamento:</span>
                      <p className="italic">{apt.cancelReason}</p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-vitta-border flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-[10px] text-vitta-text-muted block">Valor:</span>
                    <span className="font-bold text-vitta-text-primary">
                      {price > 0 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
                        : 'Incluso no Plano'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Action: Telemedicine Room Button */}
                    {isUpcoming && isTelemedicine && setActiveTelemedicineApt && (
                      <button
                        onClick={() => setActiveTelemedicineApt(apt)}
                        className="px-3.5 py-2 bg-vitta-green text-white rounded-xl text-xs font-bold hover:bg-vitta-green/90 transition-all shadow-sm shadow-vitta-green/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Video size={14} />
                        Entrar na Sala
                      </button>
                    )}

                    {/* Action: Cancel Button */}
                    {isUpcoming && (
                      <button
                        onClick={() => setCancellingApt(apt)}
                        className="px-3 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-rose-500/20 cursor-pointer"
                        title="Cancelar consulta e estornar valor pago"
                      >
                        Cancelar
                      </button>
                    )}

                    {/* Action: Review Button for Completed Appointments (Issue 01) */}
                    {isCompleted && (
                      apt.isReviewed ? (
                        <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                          <Star size={13} fill="currentColor" />
                          <span>Avaliado {apt.rating ? `(${apt.rating}★)` : ''}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedAppointmentForReview(apt)}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Star size={14} fill="currentColor" />
                          Avaliar Atendimento
                        </button>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Cancellation & Refund Modal (Issue 01) */}
      <AnimatePresence>
        {cancellingApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface max-w-md w-full rounded-2xl border border-vitta-border shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-vitta-text-primary">
                      Cancelar Agendamento?
                    </h3>
                    <p className="text-xs text-vitta-text-muted">
                      Confirme os detalhes do cancelamento abaixo
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCancellingApt(null)}
                  disabled={isSubmittingCancel}
                  className="p-1 text-vitta-text-muted hover:text-vitta-text-primary rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Info Box with Refund Note */}
              <div className="p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-vitta-text-muted">Médico:</span>
                  <span className="font-bold text-vitta-text-primary">{cancellingApt.professionalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vitta-text-muted">Data e Horário:</span>
                  <span className="font-bold text-vitta-text-primary">
                    {formatDateForDisplay(cancellingApt.date)} às {cancellingApt.time || '00:00'}
                  </span>
                </div>
                
                {/* Estorno info */}
                {(cancellingApt.priceNumeric > 0 || cancellingApt.price) && (
                  <div className="pt-2 border-t border-vitta-border/60 flex items-center justify-between text-vitta-green font-bold">
                    <span className="flex items-center gap-1">
                      <RotateCcw size={14} /> Estorno Automático na Carteira:
                    </span>
                    <span>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        cancellingApt.priceNumeric || parseFloat(cancellingApt.price)
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Reason text area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-vitta-text-primary block">
                  Motivo do cancelamento (opcional):
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Imprevisto de trabalho, reagendarei em outro horário..."
                  rows={3}
                  className="w-full p-3 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:border-vitta-accent transition-colors resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingApt(null)}
                  disabled={isSubmittingCancel}
                  className="flex-1 py-2.5 bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Manter Consulta
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isSubmittingCancel}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCancel ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar Cancelamento'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal (Issue 01) */}
      {selectedAppointmentForReview && (
        <ReviewModal
          isOpen={!!selectedAppointmentForReview}
          onClose={() => setSelectedAppointmentForReview(null)}
          userId={user?.uid || ''}
          userName={userData?.name || user?.displayName || 'Paciente'}
          professionalId={selectedAppointmentForReview.professionalId || selectedAppointmentForReview.professionalUserId || ''}
          professionalName={selectedAppointmentForReview.professionalName || 'Profissional de Saúde'}
          appointmentId={selectedAppointmentForReview.id}
          onSuccess={() => {
            setAppointments((prev) =>
              prev.map((a) =>
                a.id === selectedAppointmentForReview.id ? { ...a, isReviewed: true } : a
              )
            );
            setSelectedAppointmentForReview(null);
          }}
        />
      )}
    </div>
  );
};
