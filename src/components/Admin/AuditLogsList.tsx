import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp, startAfter, getDocs, where, Query, DocumentData } from 'firebase/firestore';
import { Clock, User, Activity, FileText, ClipboardList, X, Eye, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../../App';

interface AuditLog {
  id: string;
  timestamp: Timestamp;
  adminId: string;
  adminName: string;
  action: string;
  description: string;
  before?: any;
  after?: any;
}

const ChangeInspector = ({ before, after, onClose, action, description }: { before: any, after: any, onClose: () => void, action: string, description: string }) => {
  const getDiff = () => {
    const bObj = before || {};
    const aObj = after || {};
    const allKeys = Array.from(new Set([...Object.keys(bObj), ...Object.keys(aObj)]));
    
    return allKeys.map(key => {
      const bValue = bObj[key];
      const aValue = aObj[key];
      
      const normalize = (val: any) => {
        if (val && typeof val === 'object' && val.seconds !== undefined) return val.seconds;
        return JSON.stringify(val);
      };

      const hasChanged = normalize(bValue) !== normalize(aValue);
      
      if (!hasChanged) return null;

      return (
        <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-b border-vitta-border last:border-0 hover:bg-vitta-surface-2 transition-colors">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-vitta-danger uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-vitta-danger" />
              {key} (Original)
            </span>
            <pre className="text-xs text-vitta-danger bg-vitta-danger/5 p-3 rounded-xl overflow-x-auto font-mono">
              {bValue === undefined ? 'vazio' : JSON.stringify(bValue, null, 2)}
            </pre>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-vitta-green uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-vitta-green" />
              {key} (Novo)
            </span>
            <pre className="text-xs text-vitta-green bg-vitta-green/5 p-3 rounded-xl overflow-x-auto font-mono">
              {aValue === undefined ? 'vazio' : JSON.stringify(aValue, null, 2)}
            </pre>
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  const diffs = getDiff();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-vitta-surface w-full max-w-3xl rounded-[2rem] shadow-2xl border border-vitta-border overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-start bg-vitta-surface-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-vitta-accent-bg text-vitta-accent uppercase tracking-wider">
                {action}
              </span>
              <h3 className="text-xl font-bold text-vitta-text-primary">Inspetor de Alterações</h3>
            </div>
            <p className="text-sm text-vitta-text-secondary">{description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-vitta-border rounded-xl transition-all">
            <X size={20} className="text-vitta-text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar">
          {diffs.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-vitta-border overflow-hidden">
              {diffs}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-vitta-surface-2 rounded-full flex items-center justify-center text-vitta-text-muted opacity-30">
                <Activity size={32} />
              </div>
              <div>
                <p className="font-bold text-vitta-text-primary">Nenhuma alteração detalhada</p>
                <p className="text-sm text-vitta-text-secondary max-w-xs">Esta ação foi registrada, mas não houveram mudanças granulares de campos detectadas.</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-vitta-surface-2 border-t border-vitta-border flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-vitta-text-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-vitta-text-primary/10 hover:opacity-90 transition-all">
            Fechar Inspetor
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AuditLogsList = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [searchAdmin, setSearchAdmin] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [inspectingLog, setInspectingLog] = useState<AuditLog | null>(null);
  
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchLogs = async (direction: 'next' | 'initial' = 'initial') => {
    setLoading(true);
    try {
      let q: Query<DocumentData> = collection(db, 'audit_logs');
      
      if (filterAction !== 'all') {
        q = query(q, where('action', '==', filterAction));
      }

      // Date filtering requires a specific index or simpler logic. 
      // For now we do ordering.
      q = query(q, orderBy('timestamp', 'desc'));

      if (dateFilter.start) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(new Date(dateFilter.start))));
      }
      if (dateFilter.end) {
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999);
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(endDate)));
      }

      let paginationQuery: Query<DocumentData>;
      if (direction === 'next' && lastDoc) {
        paginationQuery = query(q, startAfter(lastDoc), limit(PAGE_SIZE));
      } else {
        paginationQuery = query(q, limit(PAGE_SIZE));
      }

      const snapshot = await getDocs(paginationQuery);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];

      setLogs(logsData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      
      if (direction === 'next') setPage(p => p + 1);
      if (direction === 'initial') setPage(1);

    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'audit_logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, dateFilter]);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-vitta-green bg-vitta-green-bg';
    if (action.includes('DELETE')) return 'text-vitta-danger bg-vitta-danger/10';
    if (action.includes('UPDATE')) return 'text-vitta-accent bg-vitta-accent-bg';
    if (action.includes('REJECT') || action.includes('CANCEL')) return 'text-vitta-danger bg-vitta-danger/10';
    return 'text-vitta-text-muted bg-vitta-surface-2';
  };

  const filteredLogsList = logs.filter(log => {
    return log.adminName.toLowerCase().includes(searchAdmin.toLowerCase());
  });

  return (
    <div className="bg-vitta-surface p-6 sm:p-8 rounded-[2.5rem] border border-vitta-border shadow-sm space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-vitta-accent-bg text-vitta-accent rounded-2xl shadow-inner">
            <ClipboardList size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-vitta-text-primary tracking-tight">Audit Trail</h3>
            <p className="text-sm text-vitta-text-muted">Rastreabilidade completa de ações administrativas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-vitta-surface-2 p-3 rounded-2xl border border-vitta-border">
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" />
            <input 
              type="text" 
              placeholder="Admin..."
              value={searchAdmin}
              onChange={(e) => setSearchAdmin(e.target.value)}
              className="pl-9 pr-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs focus:ring-2 focus:ring-vitta-accent/20 outline-none w-32 sm:w-40 text-vitta-text-primary"
            />
          </div>
          
          <select 
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary cursor-pointer hover:bg-vitta-surface-2 transition-colors"
          >
            <option value="all">Todas Ações</option>
            <option value="CREATE_USER">Criar Usuário</option>
            <option value="UPDATE_USER">Editar Usuário</option>
            <option value="DELETE_USER">Excluir Usuário</option>
            <option value="CREATE_PROFESSIONAL">Criar Profissional</option>
            <option value="UPDATE_PROFESSIONAL">Editar Profissional</option>
            <option value="CREATE_PARTNER">Criar Parceiro</option>
            <option value="UPDATE_PARTNER">Editar Parceiro</option>
            <option value="CREATE_OFFER">Criar Oferta</option>
            <option value="UPDATE_OFFER">Editar Oferta</option>
            <option value="UPDATE_APPOINTMENT_STATUS">Status Consulta</option>
            <option value="UPDATE_USER_EXAM_STATUS">Status Exame</option>
          </select>

          <div className="flex items-center gap-2 border-l border-vitta-border pl-3 ml-1">
             <Clock size={14} className="text-vitta-text-muted" />
             <input 
               type="date" 
               value={dateFilter.start}
               onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
               className="bg-transparent text-[10px] font-bold text-vitta-text-primary outline-none uppercase"
               title="Data Inicial"
             />
             <span className="text-vitta-text-muted text-[10px]">até</span>
             <input 
               type="date" 
               value={dateFilter.end}
               onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
               className="bg-transparent text-[10px] font-bold text-vitta-text-primary outline-none uppercase"
               title="Data Final"
             />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-vitta-border bg-vitta-surface-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-vitta-surface-3">
              <th className="py-4 px-6 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest border-b border-vitta-border">Data & Hora</th>
              <th className="py-4 px-6 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest border-b border-vitta-border">Responsável</th>
              <th className="py-4 px-6 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest border-b border-vitta-border">Operação</th>
              <th className="py-4 px-6 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest border-b border-vitta-border">Natureza do Log</th>
              <th className="py-4 px-6 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest border-b border-vitta-border text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vitta-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse bg-vitta-surface">
                  <td colSpan={5} className="py-6 px-6">
                    <div className="h-4 bg-vitta-surface-3 rounded-lg w-full"></div>
                  </td>
                </tr>
              ))
            ) : filteredLogsList.length === 0 ? (
              <tr className="bg-vitta-surface">
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4 text-vitta-text-muted">
                    <div className="p-6 bg-vitta-surface-3 rounded-full">
                      <Filter size={32} className="opacity-20" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-vitta-text-primary">Sem resultados</p>
                      <p className="text-xs max-w-xs mx-auto">Nenhum rastro de auditoria foi encontrado com os parâmetros informados.</p>
                    </div>
                    <button 
                      onClick={() => { setFilterAction('all'); setDateFilter({ start: '', end: '' }); setSearchAdmin(''); }}
                      className="text-xs font-bold text-vitta-accent hover:underline mt-2"
                    >
                      Limpar todos os filtros
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogsList.map((log) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={log.id} 
                  className="group bg-vitta-surface hover:bg-vitta-accent-bg/20 transition-all cursor-default"
                >
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-vitta-text-primary">
                        {log.timestamp?.toDate().toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] text-vitta-text-muted">
                        {log.timestamp?.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-vitta-surface-2 rounded-xl flex items-center justify-center border border-vitta-border group-hover:border-vitta-accent/30 transition-colors">
                        <User size={14} className="text-vitta-text-muted" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-vitta-text-primary line-clamp-1">{log.adminName}</span>
                        <span className="text-[9px] text-vitta-text-muted line-clamp-1 font-mono tracking-tighter uppercase">{log.adminId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-current bg-opacity-10 ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 min-w-[200px]">
                    <p className="text-xs text-vitta-text-secondary leading-relaxed line-clamp-2">
                      {log.description}
                    </p>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button 
                      onClick={() => setInspectingLog(log)}
                      className="p-2.5 text-vitta-text-muted hover:text-vitta-accent hover:bg-vitta-accent-bg/50 hover:shadow-sm rounded-xl transition-all inline-flex items-center gap-2 group/btn"
                    >
                      <Eye size={16} className="group-hover/btn:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold hidden xl:inline uppercase tracking-widest">Detalhes</span>
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-4">
        <p className="text-xs text-vitta-text-muted">
          Página <span className="font-bold text-vitta-text-primary">{page}</span>
          {hasMore && <span className="opacity-50 ml-1">(mais resultados disponíveis)</span>}
        </p>
        <div className="flex gap-2">
          <button 
            disabled={page === 1 || loading}
            onClick={() => fetchLogs('initial')} 
            className="p-2 border border-vitta-border rounded-xl text-vitta-text-secondary hover:bg-vitta-surface-2 disabled:opacity-30 transition-all flex items-center gap-2 text-xs font-bold"
          >
            <ChevronLeft size={16} />
            Início
          </button>
          <button 
            disabled={!hasMore || loading}
            onClick={() => fetchLogs('next')}
            className="px-4 py-2 bg-vitta-text-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-vitta-text-primary/10 hover:opacity-90 disabled:opacity-30 transition-all flex items-center gap-2"
          >
            Próxima Página
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {inspectingLog && (
          <ChangeInspector 
            before={inspectingLog.before} 
            after={inspectingLog.after} 
            action={inspectingLog.action}
            description={inspectingLog.description}
            onClose={() => setInspectingLog(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditLogsList;
