import React, { useState, useEffect } from 'react';
import { 
  Check, 
  CalendarX, 
  Plus, 
  Trash2, 
  PlusCircle, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Video, 
  Building,
  Info,
  Calendar,
  Layers,
  X
} from 'lucide-react';
import { Timestamp, collection, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { updateDoc } from '../../lib/firestore-wrappers';
import { useToast } from '../../contexts/ToastContext';
import { logAdminAction } from '../../lib/audit';
import { formatDateForDisplay } from '../../lib/utils';

interface ProfessionalAgendaSettingsViewProps {
  professional: any;
}

export const ProfessionalAgendaSettingsView: React.FC<ProfessionalAgendaSettingsViewProps> = ({
  professional
}) => {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [officeLocation, setOfficeLocation] = useState(professional?.officeLocation || '');
  const [isPresencialEnabled, setIsPresencialEnabled] = useState(
    professional?.isPresencialEnabled !== false
  );
  const [isTelemedicineEnabled, setIsTelemedicineEnabled] = useState(
    professional?.isTelemedicineEnabled !== false
  );
  const [slotDuration, setSlotDuration] = useState<number>(
    professional?.slotDuration || 30
  );

  const [schedule, setSchedule] = useState<{
    weekly: Record<string, Array<{ start: string; end: string }>>;
    blockedDates: string[];
    blockedPeriods?: Array<{ date: string; start?: string; end?: string; reason?: string }>;
  }>(
    professional?.schedule || { weekly: {}, blockedDates: [], blockedPeriods: [] }
  );

  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [conflictsFound, setConflictsFound] = useState<any[]>([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  useEffect(() => {
    if (professional) {
      setOfficeLocation(professional.officeLocation || '');
      setIsPresencialEnabled(professional.isPresencialEnabled !== false);
      setIsTelemedicineEnabled(professional.isTelemedicineEnabled !== false);
      setSlotDuration(professional.slotDuration || 30);
      setSchedule(professional.schedule || { weekly: {}, blockedDates: [], blockedPeriods: [] });
    }
  }, [professional]);

  const handleCheckAndAddBlockedDate = async () => {
    if (!newBlockedDate) {
      addToast('Selecione uma data para registrar a ausência ou bloqueio.', 'warning');
      return;
    }
    const currentBlocked = schedule.blockedDates || [];
    if (currentBlocked.includes(newBlockedDate)) {
      addToast('Esta data já se encontra na lista de bloqueios.', 'warning');
      return;
    }

    setIsCheckingConflicts(true);
    try {
      // Check if there are appointments on this date
      const q = query(
        collection(db, 'appointments'),
        where('professionalId', '==', professional.id),
        where('date', '==', newBlockedDate)
      );
      const snap = await getDocs(q);
      const activeAppointments = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((a: any) => a.status !== 'cancelled' && a.status !== 'completed');

      if (activeAppointments.length > 0) {
        setConflictsFound(activeAppointments);
        setIsConflictModalOpen(true);
      } else {
        commitBlockedDate();
      }
    } catch (err) {
      console.error('Erro ao verificar conflitos de agenda:', err);
      commitBlockedDate();
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  const commitBlockedDate = () => {
    const currentBlocked = schedule.blockedDates || [];
    const updatedBlocked = [...currentBlocked, newBlockedDate].sort();
    
    const currentPeriods = schedule.blockedPeriods || [];
    const updatedPeriods = [
      ...currentPeriods,
      { date: newBlockedDate, reason: newBlockedReason || 'Folga / Ausência Médica' }
    ];

    setSchedule({
      ...schedule,
      blockedDates: updatedBlocked,
      blockedPeriods: updatedPeriods
    });
    setNewBlockedDate('');
    setNewBlockedReason('');
    setIsConflictModalOpen(false);
    setConflictsFound([]);
    addToast(`Data ${formatDateForDisplay(newBlockedDate)} adicionada aos bloqueios. Salve as alterações para persistir.`, 'info');
  };

  const handleRemoveBlockedDate = (dateToRemove: string) => {
    const updatedBlocked = (schedule.blockedDates || []).filter((d) => d !== dateToRemove);
    const updatedPeriods = (schedule.blockedPeriods || []).filter((p) => p.date !== dateToRemove);
    setSchedule({
      ...schedule,
      blockedDates: updatedBlocked,
      blockedPeriods: updatedPeriods
    });
    addToast(`Bloqueio do dia ${formatDateForDisplay(dateToRemove)} removido.`, 'info');
  };

  const handleAddSlot = (day: string) => {
    const currentDaySchedule = schedule.weekly[day] || [];
    setSchedule({
      ...schedule,
      weekly: {
        ...schedule.weekly,
        [day]: [...currentDaySchedule, { start: '08:00', end: '12:00' }],
      },
    });
  };

  const handleRemoveSlot = (day: string, index: number) => {
    const currentDaySchedule = [...(schedule.weekly[day] || [])];
    currentDaySchedule.splice(index, 1);
    setSchedule({
      ...schedule,
      weekly: {
        ...schedule.weekly,
        [day]: currentDaySchedule,
      },
    });
  };

  const handleUpdateSlot = (
    day: string,
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const currentDaySchedule = [...(schedule.weekly[day] || [])];
    currentDaySchedule[index] = {
      ...currentDaySchedule[index],
      [field]: value,
    };
    setSchedule({
      ...schedule,
      weekly: {
        ...schedule.weekly,
        [day]: currentDaySchedule,
      },
    });
  };

  const handleSaveSettings = async () => {
    if (!isPresencialEnabled && !isTelemedicineEnabled) {
      addToast('Ative ao menos um Tipo de Atendimento (Presencial ou Telemedicina).', 'error');
      return;
    }
    if (isPresencialEnabled && !officeLocation.trim()) {
      addToast('Informe o Local de Atendimento para o atendimento Presencial.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'professionals', professional.id), {
        officeLocation: officeLocation.trim(),
        isPresencialEnabled,
        isTelemedicineEnabled,
        slotDuration,
        schedule,
        updatedAt: Timestamp.now(),
      });
      await logAdminAction(
        'UPDATE_PROFESSIONAL_AGENDA_SETTINGS',
        `Atualizou as configurações completas de agenda do profissional: ${professional.name}`
      );
      addToast('Configurações da agenda e intervalos salvas com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar configurações da agenda:', err);
      addToast('Erro ao salvar as configurações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const daysInfo = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  return (
    <div className="bg-vitta-surface border border-vitta-border rounded-3xl p-6 md:p-8 space-y-8 animate-in fade-in duration-300 shadow-sm text-vitta-text-primary">
      
      {/* Conflict Modal */}
      {isConflictModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-vitta-surface border border-vitta-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-vitta-text-primary">
                Conflito de Agendamentos Encontrado
              </h3>
            </div>
            <p className="text-xs text-vitta-text-secondary leading-relaxed">
              Existem <strong>{conflictsFound.length} consulta(s)</strong> confirmada(s) para a data {formatDateForDisplay(newBlockedDate)}:
            </p>
            <div className="max-h-40 overflow-y-auto space-y-2 bg-vitta-surface-2 p-3 rounded-2xl border border-vitta-border">
              {conflictsFound.map((apt) => (
                <div key={apt.id} className="text-xs flex justify-between items-center text-vitta-text-primary">
                  <span className="font-bold">{apt.patientName}</span>
                  <span className="font-mono text-vitta-accent">{apt.time || 'Horário agendado'}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-vitta-text-muted">
              Ao confirmar o bloqueio, lembre-se de reagendar ou entrar em contato com os pacientes afetados.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsConflictModalOpen(false);
                  setConflictsFound([]);
                }}
                className="px-4 py-2 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={commitBlockedDate}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20"
              >
                Confirmar Bloqueio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-vitta-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-vitta-text-primary flex items-center gap-2">
            ⚙️ Configurações Completas da Agenda & Duração
          </h2>
          <p className="text-xs text-vitta-text-secondary mt-1">
            Configure seu local físico, duração padrão dos atendimentos, grade semanal e períodos de ausência.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-6 py-2.5 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs whitespace-nowrap self-end md:self-auto"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check size={16} />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Duration, Modalities & Location */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card 1: Slot Duration Setting */}
          <div className="p-5 bg-vitta-surface-2 border border-vitta-border rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-vitta-text-primary uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-vitta-accent" /> Duração Padrão da Consulta
            </h3>
            <p className="text-xs text-vitta-text-secondary leading-relaxed">
              Define o intervalo de tempo de cada slot na sua grade de agendamentos.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {[15, 30, 45, 60].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSlotDuration(dur)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center border transition-all ${
                    slotDuration === dur
                      ? 'bg-vitta-accent text-white border-vitta-accent shadow-md shadow-vitta-accent/20'
                      : 'bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:text-vitta-text-primary'
                  }`}
                >
                  <span>{dur} minutos</span>
                  <span className="text-[10px] font-normal opacity-80 mt-0.5">
                    {dur === 30 ? 'Padrão Clínico' : dur === 60 ? 'Consulta Longa' : 'Rápida'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Modalities */}
          <div className="p-5 bg-vitta-surface-2 border border-vitta-border rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-vitta-text-primary uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-vitta-accent" /> Modalidades Ativas
            </h3>
            
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 p-3 bg-vitta-surface rounded-xl border border-vitta-border hover:border-vitta-accent/30 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPresencialEnabled}
                  onChange={(e) => setIsPresencialEnabled(e.target.checked)}
                  className="mt-1 rounded border-vitta-border text-vitta-accent focus:ring-vitta-accent"
                />
                <div className="text-xs">
                  <p className="font-bold text-vitta-text-primary flex items-center gap-1.5">
                    <Building size={14} /> Atendimento Presencial
                  </p>
                  <p className="text-vitta-text-muted mt-1 leading-relaxed">
                    Consultas físicas realizadas no seu consultório.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-vitta-surface rounded-xl border border-vitta-border hover:border-vitta-accent/30 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTelemedicineEnabled}
                  onChange={(e) => setIsTelemedicineEnabled(e.target.checked)}
                  className="mt-1 rounded border-vitta-border text-vitta-accent focus:ring-vitta-accent"
                />
                <div className="text-xs">
                  <p className="font-bold text-vitta-text-primary flex items-center gap-1.5">
                    <Video size={14} /> Telemedicina (Online)
                  </p>
                  <p className="text-vitta-text-muted mt-1 leading-relaxed">
                    Consultas por videoconferência direta na plataforma.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Card 3: Office Address */}
          <div className="p-5 bg-vitta-surface-2 border border-vitta-border rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-vitta-text-primary uppercase tracking-wider flex items-center gap-2">
              <MapPin size={16} className="text-vitta-accent" /> Endereço do Consultório
            </h3>
            <textarea
              value={officeLocation}
              onChange={(e) => setOfficeLocation(e.target.value)}
              placeholder="Ex: Av. Central, 1000 - Sala 402, Centro"
              rows={3}
              disabled={!isPresencialEnabled}
              className="w-full px-4 py-3 bg-vitta-surface border border-vitta-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-vitta-accent disabled:opacity-50 disabled:bg-vitta-surface-2 transition-all text-vitta-text-primary"
            />
          </div>

        </div>

        {/* Right Column: Weekly Schedule & Blocked Absences */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Weekly Shifts */}
          <div className="bg-vitta-surface-2 border border-vitta-border rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-vitta-border">
              <h3 className="text-xs font-bold text-vitta-text-primary uppercase tracking-wider flex items-center gap-2">
                <Calendar size={16} className="text-vitta-accent" /> Turnos de Atendimento Semanal
              </h3>
              <span className="text-[10px] text-vitta-text-muted font-medium">
                Grade baseada em slots de {slotDuration}min
              </span>
            </div>

            <div className="space-y-4 divide-y divide-vitta-border/30 pt-1 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
              {Object.entries(daysInfo).map(([key, label], index) => {
                const daySlots = schedule.weekly[key] || [];
                return (
                  <div
                    key={key}
                    className={`pt-4 ${index === 0 ? 'pt-0 border-none' : ''} space-y-3`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-vitta-text-primary flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-vitta-accent" />
                        {label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddSlot(key)}
                        className="text-[11px] font-bold text-vitta-accent hover:underline flex items-center gap-1 bg-vitta-accent/10 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <PlusCircle size={13} />
                        Adicionar Turno
                      </button>
                    </div>

                    <div className="space-y-2">
                      {daySlots.length > 0 ? (
                        daySlots.map((slot, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-vitta-text-muted font-bold block mb-1">
                                  Início
                                </label>
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => handleUpdateSlot(key, idx, 'start', e.target.value)}
                                  className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-lg text-xs outline-none text-vitta-text-primary"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-vitta-text-muted font-bold block mb-1">
                                  Fim
                                </label>
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => handleUpdateSlot(key, idx, 'end', e.target.value)}
                                  className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-lg text-xs outline-none text-vitta-text-primary"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(key, idx)}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors self-end mb-0.5"
                              title="Remover Turno"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-2.5 px-3 bg-vitta-surface border border-dashed border-vitta-border rounded-xl text-center text-xs text-vitta-text-muted italic">
                          Sem atendimentos agendados neste dia (Folga)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blocked Dates & Absences */}
          <div className="bg-vitta-surface-2 border border-vitta-border rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-vitta-border">
              <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider flex items-center gap-2">
                <CalendarX size={16} /> Bloqueio de Horários & Ausências
              </h3>
              {schedule.blockedDates && schedule.blockedDates.length > 0 && (
                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md text-[10px] font-bold">
                  {schedule.blockedDates.length} dia(s) bloqueado(s)
                </span>
              )}
            </div>
            
            <p className="text-xs text-vitta-text-secondary leading-relaxed">
              Bloqueie datas específicas para congressos, viagens ou férias. O sistema verifica conflitos existentes antes de travar a agenda.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-medium text-vitta-text-primary outline-none"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Motivo (ex: Congresso)"
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-medium text-vitta-text-primary outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleCheckAndAddBlockedDate}
                disabled={isCheckingConflicts}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-rose-500/20"
              >
                <Plus size={14} />
                {isCheckingConflicts ? 'Verificando...' : 'Bloquear Data'}
              </button>
            </div>

            {/* Blocked list chips */}
            <div className="space-y-2 pt-2">
              {schedule.blockedDates && schedule.blockedDates.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1 no-scrollbar">
                  {schedule.blockedDates.map((dateStr) => {
                    const period = schedule.blockedPeriods?.find(p => p.date === dateStr);
                    return (
                      <div
                        key={dateStr}
                        className="flex items-center gap-2 px-3 py-1.5 bg-vitta-surface border border-rose-500/30 rounded-xl text-xs font-bold text-vitta-text-primary shadow-sm"
                      >
                        <CalendarX size={13} className="text-rose-500 shrink-0" />
                        <span>{formatDateForDisplay(dateStr)}</span>
                        {period?.reason && (
                          <span className="text-[10px] text-vitta-text-muted font-normal">
                            ({period.reason})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedDate(dateStr)}
                          className="ml-1 p-0.5 text-vitta-text-muted hover:text-rose-500 transition-colors"
                          title="Remover Bloqueio"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-3 px-3 bg-vitta-surface border border-dashed border-vitta-border rounded-xl text-center text-xs text-vitta-text-muted italic">
                  Nenhuma data bloqueada no momento.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
export default ProfessionalAgendaSettingsView;
