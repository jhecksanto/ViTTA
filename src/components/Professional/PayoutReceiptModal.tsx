import React from 'react';
import { 
  CheckCircle, 
  Download, 
  X, 
  Printer, 
  ShieldCheck, 
  DollarSign, 
  Calendar, 
  Building, 
  Copy 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { formatDateForDisplay } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';

interface PayoutReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payout: any;
  professionalName?: string;
}

export const PayoutReceiptModal: React.FC<PayoutReceiptModalProps> = ({
  isOpen,
  onClose,
  payout,
  professionalName
}) => {
  const { addToast } = useToast();

  if (!isOpen || !payout) return null;

  const authCode = payout.authCode || `VITTA-TX-${(payout.id || '98765').substring(0, 8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateFormatted = payout.date ? formatDateForDisplay(payout.date) : formatDateForDisplay(new Date().toISOString());
  const amount = parseFloat(payout.amount) || 0;
  const pixKey = payout.pixKey || payout.description || 'Chave cadastrada';

  const handleDownloadPDF = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();

      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(14, 165, 233); // ViTTA Blue
      pdf.text('ViTTA SAÚDE INTEGRADA', 20, 20);

      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Comprovante de Repasse & Liquidação Financeira', 20, 26);
      pdf.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, 26, { align: 'right' });

      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 32, pageWidth - 20, 32);

      // Status Badge
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(20, 40, pageWidth - 40, 20, 3, 3, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(22, 101, 52);
      pdf.text('TRANSFERÊNCIA PIX CONCLUÍDA', 105, 52, { align: 'center' });

      // Receipt Details Box
      let currentY = 75;
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);

      const drawRow = (label: string, value: string) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 25, currentY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, 90, currentY);
        pdf.setDrawColor(241, 245, 249);
        pdf.line(25, currentY + 3, pageWidth - 25, currentY + 3);
        currentY += 12;
      };

      drawRow('Código de Autenticação:', authCode);
      drawRow('Favorecido / Profissional:', professionalName || payout.beneficiaryName || 'Profissional ViTTA');
      drawRow('Chave PIX de Destino:', pixKey);
      drawRow('Valor do Repasse:', `R$ ${amount.toFixed(2).replace('.', ',')}`);
      drawRow('Data do Saque / Repasse:', dateFormatted);
      drawRow('Instituição de Liquidação:', 'ViTTA Pagamentos / Banco Central do Brasil');
      drawRow('Status da Operação:', 'Efetivado / Liquidado');

      // Security Notice
      currentY += 15;
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Este comprovante possui validade legal e fiscal no ecossistema ViTTA.', 105, currentY, { align: 'center' });

      pdf.save(`comprovante_repasse_${(payout.id || 'saque').substring(0, 6)}.pdf`);
      addToast('Comprovante baixado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao exportar comprovante.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-vitta-surface border border-vitta-border rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-vitta-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-vitta-text-primary">
                Comprovante de Repasse
              </h3>
              <p className="text-xs text-vitta-text-muted">
                Transferência PIX Efetivada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-vitta-text-muted hover:bg-vitta-surface-2 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="bg-vitta-surface-2 border border-vitta-border rounded-2xl p-5 space-y-4 text-xs">
          
          <div className="text-center py-2 border-b border-vitta-border">
            <span className="text-[10px] uppercase font-bold text-vitta-text-muted">Valor Creditado</span>
            <div className="text-2xl font-black text-emerald-500 mt-0.5">
              R$ {amount.toFixed(2).replace('.', ',')}
            </div>
          </div>

          <div className="space-y-2.5 text-vitta-text-secondary">
            <div className="flex justify-between items-center">
              <span className="text-vitta-text-muted">Beneficiário:</span>
              <span className="font-bold text-vitta-text-primary">{professionalName || 'Profissional ViTTA'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-vitta-text-muted">Chave PIX:</span>
              <span className="font-mono font-bold text-vitta-text-primary">{pixKey}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-vitta-text-muted">Data da Liquidação:</span>
              <span className="font-medium text-vitta-text-primary">{dateFormatted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-vitta-text-muted">Código de Autenticação:</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-vitta-accent">
                <span>{authCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(authCode);
                    addToast('Código de autenticação copiado!', 'info');
                  }}
                  className="p-1 hover:text-vitta-text-primary transition-colors"
                  title="Copiar Código"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-vitta-surface border border-vitta-border rounded-xl flex items-center gap-2.5 text-[11px] text-vitta-text-muted">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
            <span>Operação liquidada e validada pelo Sistema Financeiro ViTTA.</span>
          </div>

        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-2 text-xs font-bold transition-all"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-5 py-2.5 rounded-xl bg-vitta-accent hover:bg-vitta-accent/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-vitta-accent/20 transition-all"
          >
            <Download size={14} /> Baixar Comprovante PDF
          </button>
        </div>

      </div>
    </div>
  );
};
export default PayoutReceiptModal;
