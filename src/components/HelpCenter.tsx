
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  HelpCircle, 
  ChevronDown, 
  MessageSquare, 
  Mail, 
  Phone, 
  LifeBuoy,
  FileQuestion,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface FAQ {
  id?: string;
  question: string;
  answer: string;
  category: string;
}

const DEFAULT_FAQS: FAQ[] = [
  {
    question: "Como agendo uma consulta?",
    answer: "Para agendar uma consulta, vá até a aba 'Novo Agendamento' no seu dashboard, escolha um profissional pela especialidade e selecione o melhor horário disponível.",
    category: "Agendamentos"
  },
  {
    question: "Quais os benefícios do plano Premium?",
    answer: "O plano Premium oferece descontos exclusivos em exames e parceiros, suporte prioritário e telemedicina ilimitada em especialidades selecionadas.",
    category: "Plano & Assinatura"
  },
  {
    question: "Como acesso meus resultados de exames?",
    answer: "Seus exames ficam disponíveis na aba 'Meus Exames'. Assim que o resultado estiver pronto, ele aparecerá para download em formato PDF.",
    category: "Exames"
  },
  {
    question: "Posso cancelar um agendamento?",
    answer: "Sim, você pode cancelar um agendamento com até 24h de antecedência sem custos adicionais na sua área de 'Consultas'.",
    category: "Agendamentos"
  },
  {
    question: "Como funciona a carteira digital?",
    answer: "Sua carteira permite adicionar saldo via PIX ou Cartão de Crédito para pagar consultas e exames de forma rápida e segura dentro da plataforma.",
    category: "Financeiro"
  }
];

const HelpCenter = ({ isOpen, onClose, userEmail }: { isOpen: boolean, onClose: () => void, userEmail: string | null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [faqs, setFaqs] = useState<FAQ[]>(DEFAULT_FAQS);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FAQ[];
          setFaqs([...DEFAULT_FAQS, ...fetched]);
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err);
      }
    };
    fetchFaqs();
  }, []);

  const categories = ['Todos', ...Array.from(new Set(faqs.map(f => f.category)))];
  
  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         f.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || f.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-vitta-text-primary/20 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-vitta-surface w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-vitta-border flex flex-col h-[85vh]"
      >
        <div className="p-8 pb-4 flex justify-between items-center bg-vitta-surface-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-vitta-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-vitta-accent/20">
              <LifeBuoy size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-vitta-text-primary">Central de Ajuda</h2>
              <p className="text-sm text-vitta-text-secondary">Como podemos te ajudar hoje?</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm border border-transparent hover:border-vitta-border"
          >
            <X size={24} className="text-vitta-text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-4 space-y-8">
          {/* Search Header */}
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-vitta-text-muted group-focus-within:text-vitta-accent transition-colors" size={20} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquise por uma dúvida ou palavra-chave..."
              className="w-full pl-14 pr-6 py-4 bg-vitta-surface-2 border border-vitta-border rounded-2xl text-vitta-text-primary focus:ring-4 focus:ring-vitta-accent/10 focus:border-vitta-accent/50 outline-none transition-all placeholder:text-vitta-text-muted/60"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Categories */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-2 mb-4">Categorias</h3>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeCategory === cat 
                      ? 'bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20' 
                      : 'text-vitta-text-secondary hover:bg-vitta-surface-2'
                  }`}
                >
                  {cat}
                </button>
              ))}
              
              <div className="pt-8 space-y-4">
                <h3 className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-2 mb-2">Suporte Direto</h3>
                <div className="bg-vitta-surface-2 p-4 rounded-2xl space-y-3">
                  <a href="mailto:ajuda@vittahealth.online" className="flex items-center gap-3 text-xs font-bold text-vitta-text-primary hover:text-vitta-accent transition-all">
                    <Mail size={16} />
                    Email
                  </a>
                  <a href="tel:+5511999999999" className="flex items-center gap-3 text-xs font-bold text-vitta-text-primary hover:text-vitta-accent transition-all">
                    <Phone size={16} />
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-xl font-bold text-vitta-text-primary">Perguntas Frequentes</h3>
              
              <div className="space-y-3">
                {filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => (
                  <motion.div 
                    layout
                    key={index}
                    className="bg-white rounded-2xl border border-vitta-border overflow-hidden"
                  >
                    <button 
                      onClick={() => setExpandedId(expandedId === index ? null : index)}
                      className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left group"
                    >
                      <span className="font-bold text-vitta-text-primary group-hover:text-vitta-accent transition-colors">{faq.question}</span>
                      <ChevronDown 
                        size={20} 
                        className={`text-vitta-text-muted transition-transform duration-300 ${expandedId === index ? 'rotate-180' : ''}`} 
                      />
                    </button>
                    <AnimatePresence>
                      {expandedId === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-6 pb-6 text-sm text-vitta-text-secondary leading-relaxed border-t border-vitta-surface-1 pt-4">
                            {faq.answer}
                            <div className="mt-4 flex gap-2">
                              <span className="px-2 py-1 bg-vitta-surface-1 rounded-md text-[10px] font-bold text-vitta-text-muted uppercase">
                                {faq.category}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )) : (
                  <div className="py-12 text-center space-y-4 bg-vitta-surface-2 rounded-3xl border border-dashed border-vitta-border">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-vitta-text-muted shadow-sm">
                      <FileQuestion size={32} />
                    </div>
                    <div>
                      <p className="font-bold text-vitta-text-primary">Nenhuma resposta encontrada</p>
                      <p className="text-sm text-vitta-text-secondary">Tente mudar os termos da pesquisa ou categoria.</p>
                    </div>
                    <button 
                      onClick={() => { setSearchTerm(''); setActiveCategory('Todos'); }}
                      className="text-vitta-accent text-sm font-bold hover:underline"
                    >
                      Limpar filtros
                    </button>
                  </div>
                )}
              </div>

              {/* Still need help? */}
              <div className="mt-8 bg-vitta-accent/5 rounded-[2rem] p-8 border border-vitta-accent/10 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="space-y-1 text-center md:text-left">
                  <h4 className="text-lg font-bold text-vitta-text-primary">Ainda precisa de ajuda?</h4>
                  <p className="text-sm text-vitta-text-secondary">Nossa equipe de suporte está disponível 24/7 para te atender.</p>
                </div>
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-vitta-text-primary border border-vitta-border rounded-xl font-bold text-sm hover:bg-vitta-surface-2 transition-all shadow-sm">
                    <BookOpen size={18} className="text-vitta-accent" />
                    Documentação
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-vitta-accent text-white rounded-xl font-bold text-sm hover:bg-vitta-accent/90 transition-all shadow-lg shadow-vitta-accent/20">
                    <MessageSquare size={18} />
                    Falar com Atendente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-vitta-surface-1 border-t border-vitta-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-vitta-text-muted font-medium">
            <LifeBuoy size={14} />
            ViTTA Health Center v2.4
          </div>
          <p className="text-[10px] text-vitta-text-muted text-center uppercase tracking-widest font-bold">
            Sua saúde e segurança são nossas prioridades fundamentais
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default HelpCenter;
