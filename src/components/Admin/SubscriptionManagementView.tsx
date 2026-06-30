import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, Timestamp, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { setDoc } from '../../lib/firestore-wrappers';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  ExternalLink,
  Package,
  AlertCircle,
  WifiOff,
  Pencil,
  Crown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../../contexts/ToastContext.tsx';

interface MPPlan {
  id: string;
  reason: string;
  auto_recurring: {
    frequency: number;
    frequency_type: string;
    transaction_amount: number;
    currency_id: string;
  };
  back_url: string;
  collector_id: number;
  init_point: string;
  status: string;
  date_created: string;
  last_modified: string;
  isLocal?: boolean;
}

const SubscriptionManagementView = () => {
  const { addToast } = useToast();
  const [plans, setPlans] = useState<MPPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isMercadoPagoConnected, setIsMercadoPagoConnected] = useState(true);
  const [editingPlan, setEditingPlan] = useState<MPPlan | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [formData, setFormData] = useState({
    reason: '',
    amount: '',
    frequency: '1',
    frequencyType: 'months'
  });

  useEffect(() => {
    fetchPlans();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const fetchLocalPlans = () => {
    setIsMercadoPagoConnected(false);
    
    // Clean up previous subscription if any
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const q = query(collection(db, 'subscription_plans'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: MPPlan[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          reason: data.name || 'Sem nome',
          auto_recurring: {
            frequency: data.frequency || 1,
            frequency_type: data.frequencyType || 'months',
            transaction_amount: data.price || 0,
            currency_id: 'BRL'
          },
          back_url: '#',
          collector_id: 0,
          init_point: data.init_point || '#',
          status: data.status || 'active',
          date_created: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          last_modified: new Date().toISOString(),
          isLocal: data.isLocal !== false
        };
      });
      setPlans(list);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar planos locais:", error);
      setLoading(false);
    });

    unsubscribeRef.current = unsubscribe;
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mercado-pago/plans');
      if (response.ok) {
        const data = await response.json();
        if (data.results && Array.isArray(data.results)) {
          // If we got results successfully from Mercado Pago API
          setPlans(data.results);
          setIsMercadoPagoConnected(true);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to local Firestore database if API is offline or returns error
      fetchLocalPlans();
    } catch (error) {
      console.error('Error fetching plans:', error);
      fetchLocalPlans();
    }
  };

  const handleEditPlan = (plan: MPPlan) => {
    setEditingPlan(plan);
    setFormData({
      reason: plan.reason,
      amount: plan.auto_recurring.transaction_amount.toString(),
      frequency: plan.auto_recurring.frequency.toString(),
      frequencyType: plan.auto_recurring.frequency_type
    });
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    
    const name = formData.reason;
    const price = parseFloat(formData.amount);
    const frequency = parseInt(formData.frequency);
    const frequencyType = formData.frequencyType;

    try {
      if (editingPlan) {
        // Edit mode
        let updatedOnMP = false;

        if (!editingPlan.isLocal && isMercadoPagoConnected) {
          try {
            const response = await fetch(`/api/mercado-pago/plans/${editingPlan.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reason: name,
                auto_recurring: {
                  frequency: frequency,
                  frequency_type: frequencyType,
                  transaction_amount: price,
                  currency_id: 'BRL'
                }
              })
            });
            if (response.ok) {
              updatedOnMP = true;
            }
          } catch (mpErr) {
            console.warn("Erro ao atualizar plano no Mercado Pago:", mpErr);
          }
        }

        // Always update local Firestore
        await setDoc(doc(db, 'subscription_plans', editingPlan.id), {
          name: name,
          price: price,
          frequency: frequency,
          frequencyType: frequencyType,
          updatedAt: Timestamp.now()
        }, { merge: true });

        addToast(
          updatedOnMP 
            ? 'Plano atualizado com sucesso (Sincronizado com Mercado Pago)!' 
            : 'Plano atualizado localmente com sucesso!', 
          'success'
        );

        setIsModalOpen(false);
        setEditingPlan(null);
        setFormData({ reason: '', amount: '', frequency: '1', frequencyType: 'months' });
        fetchPlans();
      } else {
        // Create mode
        const localId = `plan_local_${Date.now()}`;
        let createdOnMP = false;
        let mpData: any = null;

        // Only attempt Mercado Pago API if we believe it's connected
        if (isMercadoPagoConnected) {
          try {
            const response = await fetch('/api/mercado-pago/plans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reason: name,
                auto_recurring: {
                  frequency: frequency,
                  frequency_type: frequencyType,
                  transaction_amount: price,
                  currency_id: 'BRL'
                }
              })
            });

            if (response.ok) {
              const data = await response.json();
              if (data.id) {
                mpData = data;
                createdOnMP = true;
              }
            }
          } catch (mpErr) {
            console.warn("Erro ao tentar registrar plano no Mercado Pago:", mpErr);
          }
        }

        if (createdOnMP && mpData) {
          // Sync MP plan to Firestore
          await setDoc(doc(db, 'subscription_plans', mpData.id), {
            mpPlanId: mpData.id,
            name: mpData.reason,
            price: mpData.auto_recurring.transaction_amount,
            frequency: mpData.auto_recurring.frequency,
            frequencyType: mpData.auto_recurring.frequency_type,
            status: 'active',
            init_point: mpData.init_point || '#',
            isLocal: false,
            createdAt: Timestamp.now()
          });
          addToast('Plano criado e sincronizado com Mercado Pago!', 'success');
        } else {
          // Create as local plan in Firestore
          await setDoc(doc(db, 'subscription_plans', localId), {
            mpPlanId: localId,
            name: name,
            price: price,
            frequency: frequency,
            frequencyType: frequencyType,
            status: 'active',
            init_point: '#',
            isLocal: true,
            createdAt: Timestamp.now()
          });
          addToast('Plano criado localmente (Será sincronizado quando a API estiver ativa)!', 'success');
        }

        setIsModalOpen(false);
        setFormData({ reason: '', amount: '', frequency: '1', frequencyType: 'months' });
        fetchPlans();
      }

    } catch (error) {
      console.error('Error saving plan:', error);
      addToast('Erro ao processar criação ou edição do plano', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleStatus = async (plan: MPPlan) => {
    const newStatus = plan.status === 'active' ? 'cancelled' : 'active';
    try {
      let updatedOnMP = false;

      // Only call Mercado Pago if it's not a local plan and API is connected
      if (!plan.isLocal && isMercadoPagoConnected) {
        try {
          const response = await fetch(`/api/mercado-pago/plans/${plan.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
          });
          if (response.ok) {
            const data = await response.json();
            if (data.id) {
              updatedOnMP = true;
            }
          }
        } catch (err) {
          console.warn("Could not update plan status on Mercado Pago:", err);
        }
      }

      // Always update Firestore
      await setDoc(doc(db, 'subscription_plans', plan.id), {
        status: newStatus,
        updatedAt: Timestamp.now()
      }, { merge: true });

      addToast(`Plano ${newStatus === 'active' ? 'ativado' : 'pausado'} com sucesso!`, 'success');
      fetchPlans();
    } catch (error) {
      console.error(error);
      addToast('Erro ao atualizar status', 'error');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm("Deseja realmente excluir este plano? Esta ação removerá o plano local.")) return;
    try {
      await deleteDoc(doc(db, 'subscription_plans', planId));
      addToast("Plano excluído com sucesso!", "success");
      fetchPlans();
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
      addToast("Erro ao excluir plano.", "error");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold dark:text-white">Gestão de Assinaturas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie planos recorrentes via Mercado Pago</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
            isMercadoPagoConnected 
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
              : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
          }`}>
            {isMercadoPagoConnected ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Mercado Pago Conectado
              </>
            ) : (
              <>
                <WifiOff size={12} />
                Modo Offline (Planos Locais)
              </>
            )}
          </div>

          <button 
            onClick={fetchPlans}
            disabled={loading}
            className="p-2.5 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Sincronizar com Mercado Pago"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              setEditingPlan(null);
              setFormData({ reason: '', amount: '', frequency: '1', frequencyType: 'months' });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus size={18} />
            Novo Plano
          </button>
        </div>
      </div>

      {/* Info Warning Alert if offline */}
      {!isMercadoPagoConnected && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/5 text-amber-800 dark:text-amber-400 rounded-2xl border border-amber-200/50 dark:border-amber-500/10">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Modo de Configuração Ativo (API Offline)</p>
            <p className="opacity-90">
              Você pode criar e gerenciar planos livremente sem o Token do Mercado Pago.
              Eles ficarão salvos localmente no banco de dados e serão sincronizados automaticamente assim que você configurar o Token nas variáveis de ambiente.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano / ID</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Origem</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Valor</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Frequência</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                   <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Package size={32} />
                   </div>
                   <p className="text-slate-500 font-medium text-sm">Nenhum plano recorrente encontrado</p>
                </td>
              </tr>
            ) : (
              plans.map(plan => (
                <tr key={plan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm dark:text-white">{plan.reason}</span>
                      <span className="text-[10px] items-center gap-1 font-mono text-slate-400 flex">
                        <Package size={10} />
                        {plan.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {plan.isLocal ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/10">
                        Local / Off
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/10">
                        Mercado Pago
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.auto_recurring.transaction_amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {plan.auto_recurring.frequency === 1 ? 'Mensal' : `${plan.auto_recurring.frequency} ${plan.auto_recurring.frequency_type === 'months' ? 'Meses' : 'Dias'}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      plan.status === 'active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}>
                      {plan.status === 'active' ? 'Ativo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEditPlan(plan)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-all cursor-pointer"
                        title="Editar Plano"
                      >
                        <Pencil size={18} />
                      </button>
                       <button 
                        onClick={() => handleToggleStatus(plan)}
                        className={`p-2 rounded-lg transition-all cursor-pointer ${plan.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        title={plan.status === 'active' ? 'Pausar Plano' : 'Ativar Plano'}
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                        title="Excluir Plano"
                      >
                        <Trash2 size={18} />
                      </button>
                      {plan.init_point && plan.init_point !== '#' && (
                        <a 
                          href={plan.init_point} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Ver Link de Pagamento"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <form onSubmit={handleSavePlan} className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold dark:text-white">
                    {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
                  </h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nome do Plano</label>
                    <input 
                      type="text" 
                      required
                      value={formData.reason}
                      onChange={e => setFormData({...formData, reason: e.target.value})}
                      placeholder="Ex: Vitta Health Premium"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Valor Mensal</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          required
                          value={formData.amount}
                          onChange={e => setFormData({...formData, amount: e.target.value})}
                          placeholder="0,00"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Frequência</label>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          required
                          value={formData.frequency}
                          onChange={e => setFormData({...formData, frequency: e.target.value})}
                          className="w-20 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white text-center"
                        />
                        <select 
                          value={formData.frequencyType}
                          onChange={e => setFormData({...formData, frequencyType: e.target.value})}
                          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white cursor-pointer"
                        >
                          <option value="months">Mês</option>
                          <option value="days">Dia</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={syncing}
                  className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {syncing ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={20} />
                      {editingPlan ? 'Confirmar e Salvar' : 'Confirmar e Criar'}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionManagementView;
