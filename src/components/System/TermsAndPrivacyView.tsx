import React, { useState } from "react";
import {
  FileText,
  ShieldCheck,
  Printer,
  Download,
  Lock,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

export const TermsAndPrivacyView: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "lgpd">("terms");
  const [lgpdRequested, setLgpdRequested] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleLgpdRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setLgpdRequested(true);
    addToast("Solicitação de dados LGPD registrada com sucesso. Entraremos em contato em até 72h úteis.", "success");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-vitta-accent/10 text-vitta-accent flex items-center justify-center font-bold">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-vitta-text-primary">Termos, Privacidade & LGPD</h2>
            <p className="text-xs text-vitta-text-muted">Conheça nossos compromissos de segurança e proteção de dados</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Printer size={14} />
            Imprimir Termos
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-vitta-border pb-2">
        <button
          onClick={() => setActiveTab("terms")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "terms"
              ? "bg-vitta-accent text-white"
              : "bg-vitta-surface text-vitta-text-secondary hover:bg-vitta-surface-2"
          }`}
        >
          Termos de Uso
        </button>
        <button
          onClick={() => setActiveTab("privacy")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "privacy"
              ? "bg-vitta-accent text-white"
              : "bg-vitta-surface text-vitta-text-secondary hover:bg-vitta-surface-2"
          }`}
        >
          Política de Privacidade
        </button>
        <button
          onClick={() => setActiveTab("lgpd")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "lgpd"
              ? "bg-vitta-accent text-white"
              : "bg-vitta-surface text-vitta-text-secondary hover:bg-vitta-surface-2"
          }`}
        >
          Canal do Titular LGPD
        </button>
      </div>

      <div className="bg-vitta-surface p-8 rounded-3xl border border-vitta-border shadow-sm prose prose-sm dark:prose-invert max-w-none text-xs text-vitta-text-secondary leading-relaxed space-y-4">
        {activeTab === "terms" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-vitta-text-primary">1. Aceitação dos Termos</h3>
            <p>
              Ao utilizar a plataforma ViTTA Convênios, você concorda expressamente com os presentes Termos de Uso e com todas as diretrizes operacionais estabelecidas para agendamento de consultas, utilização de cupons e movimentação de ViTTA Coins.
            </p>

            <h3 className="text-sm font-bold text-vitta-text-primary">2. Serviços e Agendamentos</h3>
            <p>
              O ViTTA Convênios atua como facilitador de agendamentos entre pacientes e profissionais de saúde autônomos ou clínicas credenciadas. A prestação dos serviços médicos é de responsabilidade técnica exclusiva dos respectivos profissionais de saúde registrados em seus conselhos de classe.
            </p>

            <h3 className="text-sm font-bold text-vitta-text-primary">3. Carteira Digital e Transações</h3>
            <p>
              O saldo depositado na Carteira ViTTA é destinado prioritariamente ao pagamento de consultas e procedimentos na rede conveniada. Cancelamentos efetuados com até 24 horas de antecedência concedem estorno integral em créditos na plataforma.
            </p>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-vitta-text-primary">1. Coleta e Uso de Dados</h3>
            <p>
              Coletamos apenas as informações estritamente necessárias para a prestação de serviços de saúde, incluindo nome completo, CPF, dados de contato e prontuários médicos gerados em consultas.
            </p>

            <h3 className="text-sm font-bold text-vitta-text-primary">2. Criptografia e Segurança</h3>
            <p>
              Todos os dados sensíveis e registros clínicos são protegidos com criptografia de ponta a ponta em repouso e em trânsito, seguindo os mais rigorosos padrões da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </p>
          </div>
        )}

        {activeTab === "lgpd" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-vitta-text-primary">Exercício de Direitos do Titular (LGPD)</h3>
            <p>
              Você tem direito de solicitar a confirmação da existência de tratamento, o acesso aos dados, a correção de dados incompletos ou a eliminação dos seus dados pessoais armazenados.
            </p>

            {lgpdRequested ? (
              <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-3">
                <CheckCircle size={20} />
                <span className="font-bold text-xs">Sua solicitação foi registrada no sistema do DPO/Encarregado de Dados.</span>
              </div>
            ) : (
              <form onSubmit={handleLgpdRequest} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-vitta-text-secondary">Tipo de Solicitação:</label>
                  <select className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary">
                    <option value="export">Exportar cópia dos meus dados cadastrais e exames</option>
                    <option value="anonymize">Anonimização ou exclusão de dados pessoais</option>
                    <option value="correction">Correção de informações cadastrais</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 transition-all shadow-md shadow-vitta-accent/20"
                >
                  Enviar Solicitação ao DPO
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
