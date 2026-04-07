import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { Clock, User, Activity, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface AuditLog {
  id: string;
  timestamp: Timestamp;
  adminId: string;
  adminName: string;
  action: string;
  description: string;
}

const AuditLogsList = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditLog[];
      setLogs(logsData);
      setLoading(loading && false);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching audit logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
    if (action.includes('DELETE')) return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10';
    if (action.includes('UPDATE')) return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
    return 'text-slate-500 bg-slate-50 dark:bg-slate-500/10';
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl">
            <ClipboardList size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold dark:text-white">Logs de Auditoria</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Histórico de ações administrativas recentes</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-slate-50 dark:border-slate-800">
              <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Data/Hora</th>
              <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Admin</th>
              <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Ação</th>
              <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Descrição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={4} className="py-4">
                    <div className="h-10 bg-slate-50 dark:bg-slate-800 rounded-xl w-full"></div>
                  </td>
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Activity size={48} className="opacity-20" />
                    <p className="text-sm font-medium">Nenhum log encontrado</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={log.id} 
                  className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-xs font-medium dark:text-slate-300">
                        {log.timestamp?.toDate().toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <User size={12} className="text-slate-500" />
                      </div>
                      <span className="text-xs font-bold dark:text-white">{log.adminName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">{log.description}</span>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

import { ClipboardList } from 'lucide-react';
export default AuditLogsList;
