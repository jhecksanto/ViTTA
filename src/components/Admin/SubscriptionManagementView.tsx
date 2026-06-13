import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { setDoc } from '../../lib/firestore-wrappers';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  RefreshCw, 
  ExternalLink,
  Package,
  DollarSign,
  Calendar
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
}

const SubscriptionManagementView = () => {
  const { addToast } = useToast();
  const [plans, setPlans] = useState<MPPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MPPlan | null>(null);

  const [formData, setFormData] = useState({
    reason: '',
    amount: '',
    frequency: '1',
    frequencyType: 'months'
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mercado-pago/plans');
      const data = await response.json();
      if (data.results) {
        setPlans(data.results);
      } else if (data.error) {
        if (data.error.includes('invalid jwt token') || data.error.includes('unauthorized')) {
          addToast('Token do Mercado Pago inválido. Verifique o Access Token nas Configurações.', 'error');
        } else {
          addToast(data.error, 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      addToast('Erro ao conectar com a API do Mercado Pago', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const response = await fetch('/api/mercado-pago/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: formData.reason,
          auto_recurring: {
            frequency: parseInt(formData.frequency),
            frequency_type: formData.frequencyType,
            transaction_amount: parseFloat(formData.amount),
            currency_id: 'BRL'
          }
        })
      });

      const data = await response.json();
      if (data.id) {
        addToast('Plano criado com sucesso!', 'success');
        setIsModalOpen(false);
        setFormData({ reason: '', amount: '', frequency: '1', frequencyType: 'months' });
        fetchPlans();
        
        // Sync with Firestore
        await setDoc(doc(db, 'subscription_plans', data.id), {
          mpPlanId: data.id,
          name: data.reason,
          price: data.auto_recurring.transaction_amount,
          frequency: data.auto_recurring.frequency,
          frequencyType: data.auto_recurring.frequency_type,
          status: 'active',
          createdAt: Timestamp.now()
        });
      } else {
        addToast(data.error || 'Erro ao criar plano', 'error');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      addToast('Erro ao processar criação', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleStatus = async (plan: MPPlan) => {
    const newStatus = plan.status === 'active' ? 'cancelled' : 'active';
    try {
      const response = await fetch(`/api/mercado-pago/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.id) {
        addToast(`Plano ${newStatus === 'active' ? 'ativado' : 'pausado'} com sucesso`, 'success');
        fetchPlans();
        
        // Update Firestore
        await setDoc(doc(db, 'subscription_plans', plan.id), {
          status: newStatus,
          updatedAt: Timestamp.now()
        }, { merge: true });
      }
    } catch (error) {
      addToast('Erro ao atualizar status', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8">
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
          <button 
            onClick={fetchPlans}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded-xl transition-all"
            title="Sincronizar com Mercado Pago"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus size={18} />
            Novo Plano
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano / ID</th>
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
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded mx-auto"></div></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded mx-auto"></div></td>
                  <td className="px-6 py-4 text-center"><div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto"></div></td>
                  <td className="px-6 py-4 text-right"><div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded ml-auto"></div></td>
                </tr>
              ))
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
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
                      plan.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {plan.status === 'active' ? 'Ativo' : 'Pausado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => handleToggleStatus(plan)}
                        className={`p-2 rounded-lg transition-all ${plan.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        title={plan.status === 'active' ? 'Pausar Plano' : 'Ativar Plano'}
                      >
                        <RefreshCw size={18} />
                      </button>
                      <a 
                        href={plan.init_point} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Ver Link de Pagamento"
                      >
                        <ExternalLink size={18} />
                      </a>
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
              <form onSubmit={handleCreatePlan} className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold dark:text-white">Criar Novo Plano</h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
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
                          className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
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
                  className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {syncing ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={20} />
                      Confirmar e Criar
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
