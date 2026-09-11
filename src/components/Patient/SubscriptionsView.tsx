import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  ShieldCheck, 
  CreditCard, 
  RefreshCw, 
  X, 
  Clock, 
  Sparkles,
  Zap,
  ArrowRight,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot, collection, getDocs, Timestamp } from 'firebase/firestore';
import { updateDoc } from '../../lib/firestore-wrappers';
import { db } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';

interface SubscriptionsViewProps {
  user: any;
  userData?: any;
  setActiveTab?: (tab: string) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  user,
  userData: initialUserData,
  setActiveTab
}) => {
  const { addToast } = useToast();
  const [userData, setUserData] = useState<any>(initialUserData || null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Real-time user listener to monitor subscription status and currentPeriodEnd
  useEffect(() => {
    if (!user?.uid) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);

        // Check expiration
        const currentPeriodEnd = data.currentPeriodEnd 
          ? (data.currentPeriodEnd.toDate ? data.currentPeriodEnd.toDate() : new Date(data.currentPeriodEnd))
          : null;

        const isExpiredByDate = currentPeriodEnd && currentPeriodEnd.getTime() < Date.now();

        if (isExpiredByDate && data.subscriptionStatus === 'active') {
          // Auto-mark subscription as expired
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              subscriptionStatus: 'expired',
              planStatus: 'expired',
              updatedAt: Timestamp.now()
            });
            addToast('Sua assinatura do Plano ViTTA expirou. Renove para manter seus descontos exclusivos.', 'warning');
          } catch (e) {
            console.error('Erro ao expirar assinatura:', e);
          }
        }
      }
      setLoading(false);
    });

    return () => unsubUser();
  }, [user?.uid]);

  // Load available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const snap = await getDocs(collection(db, 'mercadopago_plans'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (list.length > 0) {
          setPlans(list);
        } else {
          // Fallback default plans
          setPlans([
            {
              id: 'plan_individual',
              reason: 'Plano ViTTA Individual',
              auto_recurring: { transaction_amount: 39.9, frequency: 1, frequency_type: 'months' },
              features: ['Até 40% OFF em Consultas', 'Acesso à Telemedicina', 'Clube de Vouchers', 'Prontuário Digital']
            },
            {
              id: 'plan_familiar',
              reason: 'Plano ViTTA Familiar',
              auto_recurring: { transaction_amount: 79.9, frequency: 1, frequency_type: 'months' },
              popular: true,
              features: ['Titular + 3 Dependentes', 'Até 50% OFF em Consultas e Exames', 'Telemedicina Integrada', 'Clube de Vouchers Exclusivos']
            },
            {
              id: 'plan_vip',
              reason: 'Plano ViTTA Premium VIP',
              auto_recurring: { transaction_amount: 119.9, frequency: 1, frequency_type: 'months' },
              features: ['Titular + 5 Dependentes', 'Desconto Máximo ViTTA Saúde', 'Prioridade em Agendamentos', 'Suporte Humanizado 24/7']
            }
          ]);
        }
      } catch (err) {
        console.error('Erro ao buscar planos:', err);
      }
    };
    fetchPlans();
  }, []);

  const subscriptionStatus = userData?.subscriptionStatus || (userData?.planStatus) || 'active';
  const isCanceledAtPeriodEnd = !!userData?.cancelAtPeriodEnd;
  const currentPeriodEnd = userData?.currentPeriodEnd 
    ? (userData.currentPeriodEnd.toDate ? userData.currentPeriodEnd.toDate() : new Date(userData.currentPeriodEnd))
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default if not set

  const formattedPeriodEnd = currentPeriodEnd.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const daysRemaining = Math.max(0, Math.ceil((currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  // Handle scheduled cancellation (cancelAtPeriodEnd: true)
  const handleScheduleCancellation = async () => {
    if (!user?.uid) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        cancelAtPeriodEnd: true,
        canceledAt: new Date().toISOString(),
        updatedAt: Timestamp.now()
      });
      addToast(
        `Cancelamento programado confirmado. Seus benefícios e descontos permanecem ativos até ${formattedPeriodEnd}.`,
        'success'
      );
      setIsCancelModalOpen(false);
    } catch (err) {
      console.error('Erro ao programar cancelamento:', err);
      addToast('Não foi possível programar o cancelamento. Tente novamente.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle reactivate plan before period end
  const handleReactivatePlan = async () => {
    if (!user?.uid) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        cancelAtPeriodEnd: false,
        subscriptionStatus: 'active',
        planStatus: 'active',
        canceledAt: null,
        updatedAt: Timestamp.now()
      });
      addToast('Assinatura reativada com renovação automática mantida!', 'success');
    } catch (err) {
      console.error('Erro ao reativar assinatura:', err);
      addToast('Erro ao reativar assinatura.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-vitta-text-primary tracking-tight flex items-center gap-2.5">
            <Crown size={26} className="text-amber-500" />
            Minha Assinatura & Planos ViTTA
          </h1>
          <p className="text-xs text-vitta-text-secondary mt-1">
            Gerencie seu ciclo de vigência, benefícios exclusivos e renovação de planos de saúde e saúde integrada.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          {subscriptionStatus === 'expired' ? (
            <div className="px-3.5 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-black flex items-center gap-2">
              <AlertTriangle size={15} />
              Assinatura Expirada
            </div>
          ) : isCanceledAtPeriodEnd ? (
            <div className="px-3.5 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-xl text-xs font-black flex items-center gap-2">
              <Clock size={15} />
              Cancelamento Programado
            </div>
          ) : (
            <div className="px-3.5 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black flex items-center gap-2">
              <CheckCircle2 size={15} />
              Plano Ativo & Renovação Automática
            </div>
          )}
        </div>
      </div>

      {/* Active Subscription Summary Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-vitta-accent/10 via-vitta-surface to-vitta-surface-2 border border-vitta-accent/20 p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vitta-accent/15 text-vitta-accent text-[11px] font-bold">
              <Sparkles size={13} />
              {userData?.planName || 'Plano ViTTA Saúde Integrada'}
            </div>

            <h2 className="text-xl md:text-2xl font-black text-vitta-text-primary">
              {subscriptionStatus === 'expired'
                ? 'Seu plano está expirado'
                : isCanceledAtPeriodEnd
                ? 'Benefícios ativos até o fim do período faturado'
                : 'Você está aproveitando todos os benefícios ViTTA'}
            </h2>

            <p className="text-xs text-vitta-text-secondary leading-relaxed max-w-2xl">
              {subscriptionStatus === 'expired'
                ? 'Os descontos em consultas e exames estão temporariamente suspensos. Escolha um plano abaixo para reativar imediatamente.'
                : isCanceledAtPeriodEnd
                ? `Sua assinatura não será renovada automaticamente no próximo ciclo. Todos os descontos e acessos permanecem válidos normalmente até ${formattedPeriodEnd} (${daysRemaining} dias restantes).`
                : `Sua próxima data de ciclo faturado é em ${formattedPeriodEnd} (${daysRemaining} dias restantes). Todos os descontos conveniados continuam liberados.`}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-vitta-surface border border-vitta-border rounded-xl">
                <span className="text-[10px] text-vitta-text-muted font-bold block">Status Atual</span>
                <span className="text-xs font-black capitalize text-vitta-text-primary">
                  {subscriptionStatus === 'expired' ? 'Expirado' : isCanceledAtPeriodEnd ? 'Cancelando em Breve' : 'Ativo'}
                </span>
              </div>
              <div className="p-3 bg-vitta-surface border border-vitta-border rounded-xl">
                <span className="text-[10px] text-vitta-text-muted font-bold block">Válido Até</span>
                <span className="text-xs font-black text-vitta-text-primary">{formattedPeriodEnd}</span>
              </div>
              <div className="p-3 bg-vitta-surface border border-vitta-border rounded-xl">
                <span className="text-[10px] text-vitta-text-muted font-bold block">Dias Restantes</span>
                <span className="text-xs font-black text-vitta-accent">{daysRemaining} dias</span>
              </div>
            </div>
          </div>

          {/* Action Button Box */}
          <div className="flex flex-col gap-3 justify-center items-stretch lg:items-end">
            {isCanceledAtPeriodEnd ? (
              <button
                onClick={handleReactivatePlan}
                disabled={isProcessing}
                className="px-6 py-3.5 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-vitta-accent/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Reativar Renovação Automática</span>
              </button>
            ) : subscriptionStatus === 'active' ? (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="px-5 py-3 bg-vitta-surface hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 text-vitta-text-secondary border border-vitta-border rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <X size={16} />
                <span>Cancelar Assinatura</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const el = document.getElementById('plans-grid');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-vitta-accent/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap size={16} />
                <span>Renovar Assinatura Agora</span>
              </button>
            )}

            {setActiveTab && (
              <button
                onClick={() => setActiveTab('professionals')}
                className="px-5 py-2.5 bg-vitta-surface border border-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold hover:bg-vitta-surface-2 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Usar Descontos em Consultas</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Available Plans Section */}
      <div id="plans-grid" className="space-y-5">
        <div>
          <h3 className="text-lg font-black text-vitta-text-primary">Planos e Benefícios ViTTA</h3>
          <p className="text-xs text-vitta-text-secondary mt-0.5">
            Compare os planos disponíveis e garanta economia contínua em saúde para você e seus familiares.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p, idx) => {
            const price = p.auto_recurring?.transaction_amount || 39.9;
            const isPopular = p.popular || idx === 1;

            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -4 }}
                className={`relative rounded-3xl p-6 flex flex-col justify-between border transition-all ${
                  isPopular
                    ? 'bg-vitta-surface border-vitta-accent shadow-lg shadow-vitta-accent/10'
                    : 'bg-vitta-surface border-vitta-border hover:border-vitta-accent/40'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 bg-vitta-accent text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm">
                    Mais Escolhido
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-vitta-text-primary">{p.reason || p.name}</h4>
                    <Crown size={20} className={isPopular ? 'text-vitta-accent' : 'text-vitta-text-muted'} />
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold text-vitta-text-muted">R$</span>
                      <span className="text-3xl font-black text-vitta-text-primary">
                        {price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-xs text-vitta-text-muted">/mês</span>
                    </div>
                    <p className="text-[11px] text-vitta-text-muted mt-0.5">Sem carência • Cancele quando quiser</p>
                  </div>

                  <div className="pt-3 border-t border-vitta-border space-y-2.5">
                    {(p.features || [
                      'Desconto exclusivo em consultas',
                      'Telemedicina com prontuário digital',
                      'Vouchers de desconto em parceiros',
                      'Acesso à rede credenciada'
                    ]).map((feat: string, fIdx: number) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-vitta-text-secondary">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-vitta-border">
                  <button
                    onClick={async () => {
                      if (!user?.uid) return;
                      setIsProcessing(true);
                      try {
                        const newPeriodEnd = new Date();
                        newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);
                        await updateDoc(doc(db, 'users', user.uid), {
                          planId: p.id,
                          planName: p.reason || p.name,
                          planPrice: price,
                          subscriptionStatus: 'active',
                          planStatus: 'active',
                          cancelAtPeriodEnd: false,
                          currentPeriodStart: new Date().toISOString(),
                          currentPeriodEnd: newPeriodEnd.toISOString(),
                          updatedAt: Timestamp.now()
                        });
                        addToast(`Plano ${p.reason || p.name} assinado com sucesso!`, 'success');
                      } catch (e) {
                        console.error('Erro ao contratar plano:', e);
                        addToast('Erro ao atualizar plano.', 'error');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPopular
                        ? 'bg-vitta-accent hover:bg-vitta-accent/90 text-white shadow-md shadow-vitta-accent/20'
                        : 'bg-vitta-surface-2 hover:bg-vitta-accent hover:text-white text-vitta-text-primary border border-vitta-border'
                    }`}
                  >
                    <span>Contratar / Atualizar Plano</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Programmed Cancellation Modal (Issue 05) */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface border border-vitta-border max-w-md w-full rounded-3xl shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Clock size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-vitta-text-primary">
                      Cancelamento Programado
                    </h3>
                    <p className="text-xs text-vitta-text-muted">
                      Você não perderá seus benefícios imediatamente
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isProcessing}
                  className="p-1 text-vitta-text-muted hover:text-vitta-text-primary rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Informative Box */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-xs space-y-2 text-vitta-text-secondary">
                <p className="font-bold text-amber-600 dark:text-amber-400">
                  Como funciona o cancelamento:
                </p>
                <p>
                  Ao confirmar o cancelamento, <strong>nenhuma nova cobrança será realizada</strong> no próximo mês.
                </p>
                <p>
                  Todos os seus descontos em consultas, exames e parceiros credenciados continuarão <strong>100% ativos e válidos até {formattedPeriodEnd}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-vitta-surface border border-vitta-border hover:bg-vitta-surface-2 text-vitta-text-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Manter Meu Plano
                </button>
                <button
                  type="button"
                  onClick={handleScheduleCancellation}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? 'Processando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default SubscriptionsView;
