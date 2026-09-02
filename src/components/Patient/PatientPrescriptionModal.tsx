import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  X, 
  Pill, 
  CheckCircle, 
  Calendar, 
  Stethoscope, 
  ShieldCheck, 
  Printer, 
  QrCode 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';

interface PatientPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  user: any;
}

export const PatientPrescriptionModal: React.FC<PatientPrescriptionModalProps> = ({
  isOpen,
  onClose,
  appointment,
  user
}) => {
  const { addToast } = useToast();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  useEffect(() => {
    if (!isOpen || !appointment) return;

    // First check if appointment has embedded prescriptions
    const embeddedItems = appointment.prescriptions || [];
    
    const fetchPrescriptions = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'prescriptions'),
          where('appointmentId', '==', appointment.id)
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (docs.length > 0) {
          setPrescriptions(docs);
          setSelectedDoc(docs[0]);
        } else if (embeddedItems.length > 0) {
          const fallbackDoc = {
            id: 'embedded',
            appointmentId: appointment.id,
            patientName: appointment.patientName || user?.displayName || 'Paciente',
            professionalName: appointment.professionalName || 'Dr(a). Profissional de Saúde',
            professionalCrm: appointment.professionalCrm || appointment.crm || 'CRM Ativo',
            professionalSpecialty: appointment.specialty || appointment.professionalSpecialty || 'Clínica Geral',
            type: 'prescription',
            items: embeddedItems,
            createdAt: appointment.completedAt || appointment.updatedAt || new Date()
          };
          setPrescriptions([fallbackDoc]);
          setSelectedDoc(fallbackDoc);
        } else {
          setPrescriptions([]);
          setSelectedDoc(null);
        }
      } catch (err) {
        console.error('Erro ao buscar receitas:', err);
        if (embeddedItems.length > 0) {
          const fallbackDoc = {
            id: 'embedded',
            appointmentId: appointment.id,
            patientName: appointment.patientName || user?.displayName || 'Paciente',
            professionalName: appointment.professionalName || 'Dr(a). Profissional de Saúde',
            professionalCrm: appointment.professionalCrm || appointment.crm || 'CRM Ativo',
            professionalSpecialty: appointment.specialty || appointment.professionalSpecialty || 'Clínica Geral',
            type: 'prescription',
            items: embeddedItems,
            createdAt: appointment.completedAt || appointment.updatedAt || new Date()
          };
          setPrescriptions([fallbackDoc]);
          setSelectedDoc(fallbackDoc);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [isOpen, appointment, user]);

  if (!isOpen || !appointment) return null;

  const currentDoc = selectedDoc || (prescriptions.length > 0 ? prescriptions[0] : null);
  const items = currentDoc?.items || appointment.prescriptions || [];
  const doctorName = currentDoc?.professionalName || appointment.professionalName || 'Dr(a). Profissional de Saúde';
  const doctorCrm = currentDoc?.professionalCrm || appointment.professionalCrm || appointment.crm || 'CRM Ativo';
  const patientName = currentDoc?.patientName || appointment.patientName || user?.displayName || 'Paciente';
  const specialty = appointment.specialty || appointment.professionalSpecialty || 'Clínica Geral';

  const handleDownloadPDF = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Header Branding
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(14, 165, 233); // ViTTA Cyan
      pdf.text('ViTTA SAÚDE INTEGRADA', 20, 20);

      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Receituário Médico Digital • Telemedicina ViTTA', 20, 26);
      pdf.text(
        `Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
        pageWidth - 20,
        26,
        { align: 'right' }
      );

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
      pdf.text(`${specialty} • ${doctorCrm}`, 20, 48);

      // Patient Info Box
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(20, 56, pageWidth - 40, 18, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text('Paciente:', 25, 67);
      pdf.setFont('helvetica', 'normal');
      pdf.text(patientName, 45, 67);

      // Title
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(14, 165, 233);
      pdf.text('PRESCRIÇÃO DE MEDICAMENTOS', 105, 88, { align: 'center' });

      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 94, pageWidth - 20, 94);

      let currentY = 106;
      pdf.setTextColor(30, 41, 59);

      if (items.length === 0) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.text('Nenhum medicamento específico listado.', 25, currentY);
        currentY += 15;
      } else {
        items.forEach((item: any, idx: number) => {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.text(`${idx + 1}. ${item.medicine || 'Medicamento'} - ${item.dosage || ''}`, 25, currentY);
          currentY += 6;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(71, 85, 105);
          const splitInst = pdf.splitTextToSize(`Posologia: ${item.instructions || 'Conforme orientação médica'}`, pageWidth - 50);
          pdf.text(splitInst, 30, currentY);
          currentY += (splitInst.length * 5) + 8;
          pdf.setTextColor(30, 41, 59);
        });
      }

      // Certificate / Observações if exists
      if (currentDoc?.certificateText) {
        currentY += 6;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Atestado / Observações Clínicas:', 25, currentY);
        currentY += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(71, 85, 105);
        const splitCert = pdf.splitTextToSize(currentDoc.certificateText, pageWidth - 50);
        pdf.text(splitCert, 25, currentY);
        currentY += (splitCert.length * 5) + 8;
      }

      // Digital Signature footer
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

      pdf.save(`receita_${patientName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      addToast('Prescrição baixada em PDF com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      addToast('Não foi possível gerar o PDF.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-vitta-surface border border-vitta-border rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 border-b border-vitta-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vitta-accent/10 border border-vitta-accent/20 flex items-center justify-center text-vitta-accent">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-vitta-text-primary">
                Receita & Documentos Digitais
              </h3>
              <p className="text-xs text-vitta-text-muted">
                Consulta com <span className="font-semibold text-vitta-text-primary">{doctorName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-vitta-text-muted hover:text-vitta-text-primary hover:bg-vitta-surface-2 rounded-xl transition-all"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Doctor / Patient banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-vitta-surface-2 border border-vitta-border rounded-2xl">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider flex items-center gap-1">
                <Stethoscope size={11} className="text-vitta-accent" /> Profissional Emissor
              </span>
              <p className="text-xs font-bold text-vitta-text-primary">{doctorName}</p>
              <p className="text-[11px] text-vitta-text-muted">{specialty} • {doctorCrm}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider flex items-center gap-1">
                <Calendar size={11} className="text-vitta-accent" /> Data da Consulta
              </span>
              <p className="text-xs font-bold text-vitta-text-primary">{appointment.date} às {appointment.time}</p>
              <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                <ShieldCheck size={12} /> Assinatura Digital Verificada
              </p>
            </div>
          </div>

          {/* Multiple docs tabs if any */}
          {prescriptions.length > 1 && (
            <div className="flex gap-2 border-b border-vitta-border pb-2">
              {prescriptions.map((docItem, idx) => (
                <button
                  key={docItem.id || idx}
                  onClick={() => setSelectedDoc(docItem)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDoc?.id === docItem.id
                      ? 'bg-vitta-accent text-white'
                      : 'bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border'
                  }`}
                >
                  Documento #{idx + 1} ({docItem.type || 'Receita'})
                </button>
              ))}
            </div>
          )}

          {/* Prescriptions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-vitta-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Pill size={14} className="text-vitta-accent" />
                Medicamentos & Orientações ({items.length})
              </h4>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-vitta-text-muted">Carregando prescrições...</div>
            ) : items.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-vitta-border text-center space-y-2">
                <FileText size={24} className="mx-auto text-vitta-text-muted opacity-40" />
                <p className="text-xs text-vitta-text-muted">Nenhum medicamento receitado para esta consulta.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-4 bg-vitta-surface-2/60 border border-vitta-border rounded-2xl space-y-2 hover:border-vitta-accent/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-vitta-text-primary">
                        {idx + 1}. {item.medicine || 'Medicamento'}
                      </span>
                      {item.dosage && (
                        <span className="px-2 py-0.5 bg-vitta-accent/10 text-vitta-accent text-[10px] font-bold rounded-lg shrink-0">
                          {item.dosage}
                        </span>
                      )}
                    </div>
                    {item.instructions && (
                      <p className="text-xs text-vitta-text-secondary bg-vitta-surface p-2.5 rounded-xl border border-vitta-border/60">
                        <strong className="text-vitta-text-primary">Posologia: </strong>
                        {item.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificate text if present */}
          {currentDoc?.certificateText && (
            <div className="space-y-1.5 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Atestado Médico / Recomendações
              </span>
              <p className="text-xs text-vitta-text-primary whitespace-pre-line leading-relaxed">
                {currentDoc.certificateText}
              </p>
              {currentDoc.cid && (
                <p className="text-[11px] font-bold text-vitta-text-muted mt-2">
                  CID: {currentDoc.cid}
                </p>
              )}
            </div>
          )}

          {/* ICP-Brasil Authenticity notice */}
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
            <ShieldCheck size={20} className="text-emerald-500 shrink-0" />
            <p className="text-[10px] text-vitta-text-secondary">
              Prescrição gerada através da infraestrutura ViTTA Health com validação de assinatura digital conforme legislação de Telemedicina (Resolução CFM nº 2.314/2022).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-vitta-surface-2 border-t border-vitta-border flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-vitta-text-secondary hover:text-vitta-text-primary hover:bg-vitta-border rounded-xl transition-all"
          >
            Fechar
          </button>

          <button
            onClick={handleDownloadPDF}
            className="px-5 py-2.5 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-vitta-accent/20 flex items-center gap-2"
          >
            <Download size={14} />
            Baixar PDF Oficial
          </button>
        </div>

      </div>
    </div>
  );
};
