import React, { useState } from "react";
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Clock,
  ChevronDown,
  Search,
  ExternalLink,
  ShieldCheck,
  FileText,
  LifeBuoy,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const SupportView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Como funciona o agendamento de consultas pelo ViTTA Convênios?",
      a: "Você pode buscar médicos e especialistas credenciados na aba 'Médicos / Profissionais', selecionar o profissional desejado, escolher a data/horário e confirmar utilizando seus ViTTA Coins ou saldo na carteira.",
    },
    {
      q: "Como utilizar meus descontos nas farmácias e estabelecimentos parceiros?",
      a: "Basta acessar a aba 'Parceiros' ou 'Benefícios / Vouchers', selecionar a oferta desejada e apresentar o QR Code ou código promocional diretamente no caixa ou recepção do parceiro credenciado.",
    },
    {
      q: "Como recarregar meu saldo ou adquirir mais ViTTA Coins?",
      a: "Na sua Carteira Digital (acessível pelo menu lateral em 'Minha Carteira' ou 'Dashboard'), clique em 'Recarregar Saldo' para gerar a chave Pix ou pagar via cartão de crédito.",
    },
    {
      q: "Como funcionam as consultas por Telemedicina?",
      a: "Ao agendar uma consulta online, um link seguro de sala de telemedicina é gerado automaticamente. No horário marcado, acesse seus agendamentos no painel do paciente e clique em 'Entrar na Sala Virtual'.",
    },
    {
      q: "Como anexar meus exames e laudos médicos na plataforma?",
      a: "Acesse a aba 'Exames e Laudos', clique em 'Adicionar Exame', faça o upload do arquivo (PDF ou imagem) e vincule à sua linha de cuidados.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWhatsAppSupport = () => {
    const phone = "5511999999999";
    const msg = encodeURIComponent("Olá! Preciso de suporte com a plataforma ViTTA Convênios.");
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-vitta-surface p-8 rounded-3xl border border-vitta-border shadow-sm text-center max-w-3xl mx-auto space-y-4">
        <div className="w-14 h-14 bg-vitta-accent/10 text-vitta-accent rounded-2xl flex items-center justify-center mx-auto">
          <LifeBuoy size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-vitta-text-primary">Como podemos ajudar você hoje?</h2>
          <p className="text-xs text-vitta-text-muted mt-1">
            Encontre respostas rápidas para dúvidas frequentes ou entre em contato com nossa equipe de atendimento
          </p>
        </div>

        <div className="relative max-w-lg mx-auto">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
          <input
            type="text"
            placeholder="Pesquise por dúvidas (ex: agendamento, reembolso, farmácia)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary focus:outline-none focus:border-vitta-accent"
          />
        </div>
      </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <h3 className="font-bold text-sm text-vitta-text-primary">WhatsApp Atendimento</h3>
            <p className="text-xs text-vitta-text-muted">Converse diretamente com nosso suporte humanizado em tempo real.</p>
          </div>
          <button
            onClick={handleWhatsAppSupport}
            className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle size={14} />
            Iniciar Conversa no WhatsApp
          </button>
        </div>

        <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Mail size={20} />
            </div>
            <h3 className="font-bold text-sm text-vitta-text-primary">Suporte por E-mail</h3>
            <p className="text-xs text-vitta-text-muted">Envie dúvidas, comprovantes ou solicitações administrativas.</p>
          </div>
          <a
            href="mailto:suporte@vittaconvenios.com.br"
            className="w-full py-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-center"
          >
            <Mail size={14} />
            suporte@vittaconvenios.com.br
          </a>
        </div>

        <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h3 className="font-bold text-sm text-vitta-text-primary">Horário de Operação</h3>
            <p className="text-xs text-vitta-text-muted">Atendimento padrão de Segunda a Sexta: 08h às 19h. Sábados: 08h às 13h.</p>
          </div>
          <div className="py-2.5 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold text-center">
            Plantão de Emergências 24h
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm space-y-4">
        <h3 className="text-base font-bold text-vitta-text-primary">Perguntas Frequentes (FAQ)</h3>
        <div className="space-y-3">
          {filteredFaqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-vitta-border rounded-2xl overflow-hidden bg-vitta-surface-2/50"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-vitta-surface-2 transition-colors"
              >
                <span className="font-bold text-xs text-vitta-text-primary">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-vitta-text-muted shrink-0 transition-transform ${
                    openFaq === idx ? "rotate-180 text-vitta-accent" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 text-xs text-vitta-text-secondary border-t border-vitta-border/50">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
