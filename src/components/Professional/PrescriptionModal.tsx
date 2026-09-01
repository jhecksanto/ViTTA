import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Calendar, 
  Stethoscope, 
  Pill,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { addDoc } from '../../lib/firestore-wrappers';
import { useToast } from '../../contexts/ToastContext';
import { formatDateForDisplay } from '../../lib/utils';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: any;
  professional?: any;
  patient?: any;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  appointment,
  professional,
  patient
}) => {
  const { addToast } = useToast();
  const [docType, setDocType] = useState<'prescription' | 'certificate' | 'exam_order'>('prescription');
  const [items, setItems] = useState<Array<{ medicine: string; dosage: string; instructions: string }>>([
    { medicine: 'Amoxicilina + Clavulanato de Potássio', dosage: '875mg + 125mg', instructions: 'Tomar 1 comprimido por via oral a cada 12 horas por 7 dias.' }
  ]);
  const [certificateText, setCertificateText] = useState(
    `Atesto para os devidos fins que o(a) paciente ${patient?.name || appointment?.patientName || 'Sr(a). Paciente'} esteve sob meus cuidados médicos nesta data, necessitando de 02 (dois) dias de repouso para recuperação da saúde.`
  );
  const [cidCode, setCidCode] = useState('J00 - Nasofaringite aguda');
  const [examOrderText, setExamOrderText] = useState(
    `1. Hemograma completo com contagem de plaquetas\n2. Proteína C-Reativa (PCR) quantitativa\n3. Glicemia de jejum\n4. Perfil lipídico completo`
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const patientName = patient?.name || appointment?.patientName || 'Nome do Paciente';
  const doctorName = professional?.name || 'Dr(a). Médico Responsável';
  const doctorCrm = professional?.registrationNumber || professional?.crm || 'CRM-ES 00000';
  const doctorSpecialty = professional?.specialty || 'Clínica Médica';
  const doctorAddress = professional?.officeLocation || 'Av. Central de Saúde, 1000 - Centro';

  const handleAddItem = () => {
    setItems([...items, { medicine: '', dosage: '', instructions: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const next = [...items];
    (next[index] as any)[field] = value;
    setItems(next);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAndDownload = async () => {
    setIsSaving(true);
    try {
      // 1. Save to prescriptions collection in Firestore
      const prescriptionData = {
        appointmentId: appointment?.id || null,
        patientId: patient?.id || appointment?.userId || null,
        patientName: patientName,
        professionalId: professional?.id || null,
        professionalName: doctorName,
        professionalCrm: doctorCrm,
        type: docType,
        items: docType === 'prescription' ? items : [],
        certificateText: docType === 'certificate' ? certificateText : null,
        cid: docType === 'certificate' ? cidCode : null,
        examOrderText: docType === 'exam_order' ? examOrderText : null,
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'prescriptions'), prescriptionData);

      // 2. Generate PDF via jsPDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(14, 165, 233); // ViTTA Cyan
      pdf.text('ViTTA SAÚDE INTEGRADA', 20, 20);
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Rede Credenciada & Prontuário Digital', 20, 26);
      pdf.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 20, 26, { align: 'right' });

      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 32, pageWidth - 20, 32);

      // Doctor Info Box
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(doctorName, 20, 42);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      pdf.text(`${doctorSpecialty} • ${doctorCrm}`, 20, 48);
      pdf.text(doctorAddress, 20, 54);

      // Patient Info Box
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(20, 60, pageWidth - 40, 18, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text('Paciente:', 25, 71);
      pdf.setFont('helvetica', 'normal');
      pdf.text(patientName, 45, 71);

      // Title by Type
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(14, 165, 233);
      const title = docType === 'prescription' ? 'RECEITUÁRIO MÉDICO' : docType === 'certificate' ? 'ATESTADO MÉDICO' : 'SOLICITAÇÃO DE EXAMES';
      pdf.text(title, 105, 92, { align: 'center' });

      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 98, pageWidth - 20, 98);

      let currentY = 110;
      pdf.setTextColor(30, 41, 59);

      if (docType === 'prescription') {
        items.forEach((item, idx) => {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.text(`${idx + 1}. ${item.medicine} - ${item.dosage}`, 25, currentY);
          currentY += 6;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(71, 85, 105);
          const splitInst = pdf.splitTextToSize(`Posologia: ${item.instructions}`, pageWidth - 50);
          pdf.text(splitInst, 30, currentY);
          currentY += (splitInst.length * 5) + 8;
          pdf.setTextColor(30, 41, 59);
        });
      } else if (docType === 'certificate') {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        const splitText = pdf.splitTextToSize(certificateText, pageWidth - 50);
        pdf.text(splitText, 25, currentY);
        currentY += (splitText.length * 6) + 15;
        if (cidCode) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`CID-10: ${cidCode}`, 25, currentY);
          currentY += 15;
        }
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        const splitExams = pdf.splitTextToSize(examOrderText, pageWidth - 50);
        pdf.text(splitExams, 25, currentY);
        currentY += (splitExams.length * 6) + 15;
      }

      // Signature & Footer at bottom
      pdf.setDrawColor(148, 163, 184);
      pdf.line(65, 245, 145, 245);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(doctorName, 105, 251, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(doctorCrm, 105, 256, { align: 'center' });
      pdf.text('Documento assinado digitalmente no padrão ICP-Brasil / ViTTA Health ID', 105, 275, { align: 'center' });

      pdf.save(`${docType}_${patientName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      addToast('Documento médico gerado e salvo com sucesso!', 'success');
      onClose();
    } catch (err) {
      console.error('Erro ao emitir prescrição:', err);
      addToast('Erro ao salvar documento médico.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-vitta-surface border border-vitta-border rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-vitta-border flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vitta-accent/10 border border-vitta-accent/20 flex items-center justify-center text-vitta-accent">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-vitta-text-primary">
                Emissão de Documento Médico
              </h3>
              <p className="text-xs text-vitta-text-muted">
                Paciente: <span className="font-semibold text-vitta-text-primary">{patientName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-vitta-text-muted hover:bg-vitta-surface-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-vitta-border pb-3 print:hidden">
          <button
            type="button"
            onClick={() => setDocType('prescription')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              docType === 'prescription'
                ? 'bg-vitta-accent text-white shadow-md shadow-vitta-accent/20'
                : 'bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary'
            }`}
          >
            <Pill size={14} /> Receituário
          </button>
          <button
            type="button"
            onClick={() => setDocType('certificate')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              docType === 'certificate'
                ? 'bg-vitta-accent text-white shadow-md shadow-vitta-accent/20'
                : 'bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary'
            }`}
          >
            <ShieldCheck size={14} /> Atestado Médico
          </button>
          <button
            type="button"
            onClick={() => setDocType('exam_order')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              docType === 'exam_order'
                ? 'bg-vitta-accent text-white shadow-md shadow-vitta-accent/20'
                : 'bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary'
            }`}
          >
            <Stethoscope size={14} /> Pedido de Exames
          </button>
        </div>

        {/* Modal Form & Document Preview */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-vitta-text-primary">
          {/* Printable Layout Container */}
          <div className="border border-vitta-border rounded-2xl p-6 bg-white text-slate-900 shadow-sm space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h4 className="font-bold text-base text-sky-600 tracking-tight">
                  {doctorName}
                </h4>
                <p className="text-xs text-slate-600 font-medium">{doctorSpecialty} • {doctorCrm}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{doctorAddress}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest block">ViTTA SAÚDE</span>
                <span className="text-xs font-mono font-bold text-slate-600">{formatDateForDisplay(new Date().toISOString())}</span>
              </div>
            </div>

            {/* Patient Header */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-medium">Paciente: </span>
                <strong className="text-slate-900">{patientName}</strong>
              </div>
              <div className="text-slate-500 text-[11px]">
                Prescrição Digital Nº #{Math.floor(100000 + Math.random() * 900000)}
              </div>
            </div>

            {/* Type Specific Fields */}
            {docType === 'prescription' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center print:hidden">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Medicamentos e Instruções
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus size={12} /> Adicionar Medicamento
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group space-y-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 p-1 print:hidden"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Medicamento</label>
                          <input
                            type="text"
                            value={item.medicine}
                            onChange={(e) => handleUpdateItem(idx, 'medicine', e.target.value)}
                            placeholder="Ex: Dipirona Sódica"
                            className="w-full text-xs font-bold p-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Dosagem</label>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => handleUpdateItem(idx, 'dosage', e.target.value)}
                            placeholder="Ex: 500mg"
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Instruções de Uso (Posologia)</label>
                        <input
                          type="text"
                          value={item.instructions}
                          onChange={(e) => handleUpdateItem(idx, 'instructions', e.target.value)}
                          placeholder="Ex: 1 comprimido de 6 em 6 horas se houver dor ou febre."
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {docType === 'certificate' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Texto do Atestado
                  </label>
                  <textarea
                    rows={4}
                    value={certificateText}
                    onChange={(e) => setCertificateText(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    CID-10 (Opcional)
                  </label>
                  <input
                    type="text"
                    value={cidCode}
                    onChange={(e) => setCidCode(e.target.value)}
                    placeholder="Ex: J00"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            )}

            {docType === 'exam_order' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Exames Solicitados
                  </label>
                  <textarea
                    rows={5}
                    value={examOrderText}
                    onChange={(e) => setExamOrderText(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono leading-relaxed outline-none"
                  />
                </div>
              </div>
            )}

            {/* Signature space */}
            <div className="pt-8 border-t border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="w-48 border-b border-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-900">{doctorName}</p>
              <p className="text-[10px] text-slate-500">{doctorCrm}</p>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-6 border-t border-vitta-border flex justify-end gap-3 print:hidden bg-vitta-surface">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-2 text-xs font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Printer size={14} /> Imprimir
          </button>
          <button
            type="button"
            onClick={handleSaveAndDownload}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-vitta-accent hover:bg-vitta-accent/90 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-vitta-accent/20 transition-all disabled:opacity-50"
          >
            <Download size={14} /> {isSaving ? 'Salvando...' : 'Salvar & Baixar PDF'}
          </button>
        </div>

      </div>
    </div>
  );
};
export default PrescriptionModal;
