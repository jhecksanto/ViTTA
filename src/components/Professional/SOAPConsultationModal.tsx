import React, { useState } from 'react';
import { 
  CheckCircle, 
  X, 
  Stethoscope, 
  FileText, 
  Pill, 
  Activity, 
  DollarSign, 
  Sparkles, 
  Calendar, 
  User, 
  AlertCircle,
  Plus,
  Trash2,
  Scale,
  Heart
} from 'lucide-react';
import { Timestamp, collection, doc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { updateDoc, addDoc } from '../../lib/firestore-wrappers';
import { useToast } from '../../contexts/ToastContext';
import { BiometricHistoryPanel } from './BiometricHistoryPanel';
import { formatDateForDisplay } from '../../lib/utils';

interface SOAPConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  professional: any;
  onCompleted?: () => void;
}

export const SOAPConsultationModal: React.FC<SOAPConsultationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  professional,
  onCompleted
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'soap' | 'biometrics' | 'prescriptions'>('soap');

  // S - Subjetivo
  const [subjective, setSubjective] = useState(
    appointment?.anamnesis || 'Paciente relata queixa principal de cefaleia e mal-estar geral com início há 3 dias.'
  );

  // O - Objetivo
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [heartRate, setHeartRate] = useState('72');
  const [temperature, setTemperature] = useState('36.5');
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('1.72');
  const [objectiveNotes, setObjectiveNotes] = useState(
    'Bom estado geral, eupneico, acianótico, anictérico. Ausculta pulmonar com murmúrio vesicular presente bilateralmente sem ruídos adventícios.'
  );

  // A - Avaliação
  const [assessment, setAssessment] = useState(
    appointment?.notes || 'Cefaleia tensional / Quadro viral leve a esclarecer.'
  );
  const [cidCode, setCidCode] = useState('R51 - Cefaleia');

  // P - Plano
  const [plan, setPlan] = useState(
    'Prescrito sintomáticos, hidratação oral abundante e repouso. Retorno se persistência dos sintomas após 5 dias.'
  );

  // Prescriptions
  const [prescriptions, setPrescriptions] = useState<Array<{ medicine: string; dosage: string; instructions: string }>>(
    appointment?.prescriptions || [
      { medicine: 'Dipirona Sódica', dosage: '500mg', instructions: '1 comprimido VO a cada 6h em caso de dor ou febre.' }
    ]
  );

  const [isFinishing, setIsFinishing] = useState(false);

  if (!isOpen || !appointment) return null;

  // IMC Calculation
  const w = parseFloat(weight) || 0;
  const h = parseFloat(height) || 1;
  const imc = w > 0 && h > 0 ? (w / (h * h)).toFixed(1) : '-';

  const handleAddPrescription = () => {
    setPrescriptions([...prescriptions, { medicine: '', dosage: '', instructions: '' }]);
  };

  const handleRemovePrescription = (index: number) => {
    const next = [...prescriptions];
    next.splice(index, 1);
    setPrescriptions(next);
  };

  const handleUpdatePrescription = (index: number, field: string, value: string) => {
    const next = [...prescriptions];
    (next[index] as any)[field] = value;
    setPrescriptions(next);
  };

  const handleFinalizeConsultation = async () => {
    if (isFinishing) return;
    setIsFinishing(true);

    try {
      const now = Timestamp.now();
      const profFeeRate = professional?.feeRate !== undefined ? professional.feeRate : 10;
      const priceNumeric = appointment.priceNumeric || parseFloat(appointment.price) || 150;
      const feeAmount = (priceNumeric * profFeeRate) / 100;
      const netAmount = priceNumeric - feeAmount;
      const profUserId = professional?.userId || professional?.id;

      // 1. Save clinical evolution to patient_records
      await addDoc(collection(db, 'patient_records'), {
        appointmentId: appointment.id,
        patientId: appointment.userId || null,
        patientName: appointment.patientName,
        professionalId: professional?.id || appointment.professionalId,
        professionalName: professional?.name || appointment.professionalName,
        date: appointment.date || new Date().toISOString().split('T')[0],
        soap: {
          subjective,
          objective: {
            bloodPressure,
            heartRate,
            temperature,
            weight,
            height,
            imc,
            notes: objectiveNotes
          },
          assessment,
          cid: cidCode,
          plan
        },
        prescriptions,
        createdAt: now
      });

      // 2. If prescriptions exist, save to prescriptions collection
      if (prescriptions.length > 0) {
        await addDoc(collection(db, 'prescriptions'), {
          appointmentId: appointment.id,
          patientId: appointment.userId || null,
          patientName: appointment.patientName,
          professionalId: professional?.id || appointment.professionalId,
          professionalName: professional?.name || appointment.professionalName,
          professionalCrm: professional?.registrationNumber || professional?.crm || '',
          type: 'prescription',
          items: prescriptions,
          createdAt: now
        });
      }

      // 3. Update appointment status to completed and release split
      await updateDoc(doc(db, 'appointments', appointment.id), {
        status: 'completed',
        telemedicineStatus: 'closed',
        endedAt: now,
        splitStatus: 'released',
        completedAt: now,
        soapNotes: {
          subjective,
          assessment,
          plan,
          cid: cidCode
        },
        prescriptions: prescriptions,
        updatedAt: now
      });

      // 4. Perform Financial Split Credit for Professional
      if (profUserId) {
        // Increment wallet balance
        await updateDoc(doc(db, 'users', profUserId), {
          walletBalance: increment(netAmount)
        });

        // Log transaction appointment_split
        await addDoc(collection(db, 'transactions'), {
          userId: profUserId,
          type: 'appointment_split',
          amount: netAmount,
          title: `Repasse - Consulta ${appointment.patientName}`,
          description: `Split automático liberado. Bruto: R$ ${priceNumeric.toFixed(2)} (Taxa ViTTA: ${profFeeRate}%)`,
          category: 'Rendimento',
          date: new Date().toISOString(),
          feeRatio: profFeeRate,
          feeCharged: feeAmount,
          grossAmount: priceNumeric,
          appointmentId: appointment.id,
          patientName: appointment.patientName,
          status: 'completed'
        });
      }

      // 5. Notify patient
      if (appointment.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: appointment.userId,
          title: 'Consulta Concluída com Sucesso',
          message: `Sua consulta com ${professional?.name || appointment.professionalName} foi concluída. Prontuário, atestados e prescrições já estão disponíveis em seu perfil.`,
          type: 'appointment',
          appointmentId: appointment.id,
          read: false,
          createdAt: now
        });
      }

      addToast('Consulta finalizada! Prontuário registrado e repasse creditado na carteira.', 'success');
      onCompleted?.();
      onClose();
    } catch (err) {
      console.error('Erro ao finalizar consulta:', err);
      addToast('Erro ao salvar prontuário e finalizar atendimento.', 'error');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95">
        
        {/* Modal Top Bar */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vitta-accent/10 border border-vitta-accent/20 flex items-center justify-center text-vitta-accent">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Prontuário & Atendimento Clínico (SOAP)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  Em Atendimento
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paciente: <strong className="text-white">{appointment.patientName}</strong> • {appointment.specialty || 'Consulta Geral'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-950/60 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('soap')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'soap'
                ? 'border-vitta-accent text-vitta-accent bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={14} /> Registro SOAP
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('prescriptions')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'prescriptions'
                ? 'border-vitta-accent text-vitta-accent bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Pill size={14} /> Prescrições ({prescriptions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('biometrics')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'biometrics'
                ? 'border-vitta-accent text-vitta-accent bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity size={14} /> Histórico Biométrico & Exames
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'soap' && (
            <div className="space-y-6">
              
              {/* S - Subjetivo */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-vitta-accent uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-vitta-accent/20 flex items-center justify-center text-[10px]">S</span>
                    Subjetivo (Anamnese & Queixa Principal)
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={subjective}
                  onChange={(e) => setSubjective(e.target.value)}
                  placeholder="Relato do paciente, queixa principal, evolução da história da doença atual..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-vitta-accent transition-colors resize-none"
                />
              </div>

              {/* O - Objetivo */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-4">
                <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">O</span>
                  Objetivo (Sinais Vitais & Exame Físico)
                </label>

                {/* Vital Signs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">P.A. (mmHg)</span>
                    <input
                      type="text"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      placeholder="120/80"
                      className="w-full bg-transparent font-mono font-bold text-sm text-white outline-none mt-1"
                    />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">F.C. (bpm)</span>
                    <input
                      type="text"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="75"
                      className="w-full bg-transparent font-mono font-bold text-sm text-white outline-none mt-1"
                    />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Temp (°C)</span>
                    <input
                      type="text"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="36.5"
                      className="w-full bg-transparent font-mono font-bold text-sm text-white outline-none mt-1"
                    />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Peso (kg)</span>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="70"
                      className="w-full bg-transparent font-mono font-bold text-sm text-white outline-none mt-1"
                    />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">IMC Calculado</span>
                    <span className="font-mono font-bold text-sm text-emerald-400 block mt-1">
                      {imc} kg/m²
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Achados do Exame Físico</span>
                  <textarea
                    rows={2}
                    value={objectiveNotes}
                    onChange={(e) => setObjectiveNotes(e.target.value)}
                    placeholder="Descrição do exame físico, ausculta, palpação..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* A - Avaliação */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">A</span>
                  Avaliação (Hipótese Diagnóstica & CID-10)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <textarea
                      rows={2}
                      value={assessment}
                      onChange={(e) => setAssessment(e.target.value)}
                      placeholder="Diagnóstico clínico principal..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Código CID-10</span>
                    <input
                      type="text"
                      value={cidCode}
                      onChange={(e) => setCidCode(e.target.value)}
                      placeholder="Ex: R51"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* P - Plano */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-[10px]">P</span>
                  Plano Terapêutico & Orientações de Conduta
                </label>
                <textarea
                  rows={2}
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  placeholder="Orientações, solicitação de exames complementares, prazo de retorno..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-sky-500 transition-colors resize-none"
                />
              </div>

            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Medicamentos Receitados
                </h4>
                <button
                  type="button"
                  onClick={handleAddPrescription}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-vitta-accent rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  <Plus size={12} /> Inserir Medicamento
                </button>
              </div>

              <div className="space-y-3">
                {prescriptions.map((pres, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl relative group space-y-3">
                    <button
                      type="button"
                      onClick={() => handleRemovePrescription(idx)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Medicamento</label>
                        <input
                          type="text"
                          value={pres.medicine}
                          onChange={(e) => handleUpdatePrescription(idx, 'medicine', e.target.value)}
                          placeholder="Ex: Paracetamol"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-vitta-accent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dosagem</label>
                        <input
                          type="text"
                          value={pres.dosage}
                          onChange={(e) => handleUpdatePrescription(idx, 'dosage', e.target.value)}
                          placeholder="Ex: 750mg"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-vitta-accent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Instruções / Posologia</label>
                      <input
                        type="text"
                        value={pres.instructions}
                        onChange={(e) => handleUpdatePrescription(idx, 'instructions', e.target.value)}
                        placeholder="Ex: Tomar 1 comprimido de 8/8h se dor."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-vitta-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'biometrics' && (
            <div className="h-[450px]">
              <BiometricHistoryPanel patientId={appointment.userId} patientName={appointment.patientName} />
            </div>
          )}
        </div>

        {/* Footer Summary & Action */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <DollarSign size={14} />
              <span>Split Automático:</span>
            </div>
            <span>
              Líquido R$ {((appointment.priceNumeric || 150) * (1 - (professional?.feeRate || 10) / 100)).toFixed(2)} liberado na conclusão
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleFinalizeConsultation}
              disabled={isFinishing}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              <CheckCircle size={15} />
              {isFinishing ? 'Salvando & Creditando...' : 'Concluir Consulta & Liberar Split'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default SOAPConsultationModal;
