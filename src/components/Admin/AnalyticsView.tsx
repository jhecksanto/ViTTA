
import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  FileText,
  Filter,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Type definitions
interface UserData {
  createdAt: any;
}

interface AppointmentData {
  date: string;
  specialty?: string;
  status: string;
}

interface TransactionData {
  amount: number;
  createdAt: any;
  status: string;
}

const COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#a142f4', '#24c1e0'];

const parseFirestoreDate = (date: any) => {
  if (!date) return null;
  if (typeof date.toDate === 'function') return date.toDate();
  if (date instanceof Date) return date;
  if (typeof date === 'string') return new Date(date);
  if (date.seconds) return new Date(date.seconds * 1000);
  return null;
};

const AdminAnalytics = () => {
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [specialtyDistribution, setSpecialtyDistribution] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. User Growth
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => doc.data() as UserData);
      
      const userGrowthMap = new Map();
      users.forEach(u => {
        const dateObj = parseFirestoreDate(u.createdAt);
        if (dateObj) {
          const date = dateObj.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
          userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
        }
      });
      
      const userGrowthArray = Array.from(userGrowthMap.entries())
        .map(([name, users]) => ({ name, users }))
        .sort((a, b) => {
          // Approximation for sorting names like "abr. 29"
          return a.name.localeCompare(b.name);
        });
      
      setUserGrowth(userGrowthArray);

      // 2. Specialty Distribution
      const appointmentsSnap = await getDocs(collection(db, 'appointments'));
      const appointments = appointmentsSnap.docs.map(doc => doc.data() as AppointmentData);
      
      const specialtyMap = new Map();
      appointments.forEach(a => {
        const specialty = a.specialty || 'Geral';
        specialtyMap.set(specialty, (specialtyMap.get(specialty) || 0) + 1);
      });
      
      const specialtyArray = Array.from(specialtyMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
      
      setSpecialtyDistribution(specialtyArray);

      // 3. Revenue Data
      const transactionsSnap = await getDocs(collection(db, 'transactions'));
      const transactions = transactionsSnap.docs.map(doc => doc.data() as TransactionData);
      
      const revenueMap = new Map();
      transactions.forEach(t => {
        const dateObj = parseFirestoreDate(t.createdAt);
        if (dateObj && (t.status === 'approved' || !t.status)) {
          const date = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          revenueMap.set(date, (revenueMap.get(date) || 0) + t.amount);
        }
      });
      
      const revenueArray = Array.from(revenueMap.entries())
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setRevenueData(revenueArray);

    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], fileName: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (title: string, data: any[], headers: string[]) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    (doc as any).autoTable({
      head: [headers],
      body: data.map(row => headers.map(h => row[h])),
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 115, 232] }
    });
    
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  const handleExportTransactions = async (format: 'csv' | 'pdf') => {
    const snap = await getDocs(collection(db, 'transactions'));
    const data = snap.docs.map(doc => {
      const d = doc.data();
      const date = parseFirestoreDate(d.createdAt)?.toLocaleString('pt-BR') || 'N/A';
      return {
        ID: doc.id,
        Valor: `R$ ${d.amount.toFixed(2)}`,
        Status: d.status || 'approved',
        Data: date,
        Descricao: d.description || 'Consulta/Assinatura'
      };
    });
    
    if (format === 'csv') exportToCSV(data, 'financas_vitta');
    else exportToPDF('Relatório Financeiro ViTTA', data, ['ID', 'Valor', 'Status', 'Data', 'Descricao']);
  };

  const handleExportAuditLogs = async (format: 'csv' | 'pdf') => {
     const snap = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')));
     const data = snap.docs.map(doc => {
       const d = doc.data();
       const date = parseFirestoreDate(d.timestamp)?.toLocaleString('pt-BR') || 'N/A';
       return {
         Data: date,
         Acao: d.action,
         Admin: d.adminEmail,
         Detalhes: d.details
       };
     });
     
     if (format === 'csv') exportToCSV(data, 'auditoria_vitta');
     else exportToPDF('Logs de Auditoria ViTTA', data, ['Data', 'Acao', 'Admin', 'Detalhes']);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vitta-accent"></div>
        <p className="text-vitta-text-secondary animate-pulse">Carregando métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-vitta-surface-1 p-6 rounded-2xl border border-vitta-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-vitta-accent/10 rounded-xl text-vitta-accent">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-vitta-text-primary">Analytics & Relatórios</h2>
            <p className="text-sm text-vitta-text-secondary">Monitore o crescimento e saúde do ecossistema</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-vitta-surface-2 p-1 rounded-xl border border-vitta-border mr-2">
            {(['7d', '30d', 'all'] as const).map(r => (
              <button 
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === r ? 'bg-white text-vitta-accent shadow-sm' : 'text-vitta-text-secondary hover:text-vitta-text-primary'}`}
              >
                {r === '7d' ? '7 Dias' : r === '30d' ? '30 Dias' : 'Tudo'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-vitta-accent text-white rounded-xl hover:bg-vitta-accent/90 transition-colors text-sm font-bold shadow-lg shadow-vitta-accent/20">
                <Download size={16} />
                Exportar Financeiro
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-vitta-border hidden group-hover:block z-10 overflow-hidden">
                <button onClick={() => handleExportTransactions('csv')} className="w-full text-left px-4 py-3 text-sm hover:bg-vitta-surface-2 transition-colors flex items-center gap-2">
                  <FileText size={14} /> CSV Spreadsheet
                </button>
                <button onClick={() => handleExportTransactions('pdf')} className="w-full text-left px-4 py-3 text-sm hover:bg-vitta-surface-2 transition-colors flex items-center gap-2">
                   <Download size={14} /> PDF Document
                </button>
              </div>
            </div>
            
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-vitta-surface-2 text-vitta-text-primary border border-vitta-border rounded-xl hover:bg-vitta-surface-3 transition-colors text-sm font-bold">
                <ShieldCheck size={16} />
                Logs Auditoria
                <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-vitta-border hidden group-hover:block z-10 overflow-hidden">
                <button onClick={() => handleExportAuditLogs('csv')} className="w-full text-left px-4 py-3 text-sm hover:bg-vitta-surface-2 transition-colors flex items-center gap-2">
                  <FileText size={14} /> CSV Spreadsheet
                </button>
                <button onClick={() => handleExportAuditLogs('pdf')} className="w-full text-left px-4 py-3 text-sm hover:bg-vitta-surface-2 transition-colors flex items-center gap-2">
                   <Download size={14} /> PDF Document
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white p-6 rounded-3xl border border-vitta-border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Users className="text-vitta-accent" size={20} />
              <h3 className="font-bold text-vitta-text-primary">Crescimento de Usuários</h3>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="users" stroke="#1a73e8" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specialty Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-vitta-border shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-vitta-accent" size={20} />
            <h3 className="font-bold text-vitta-text-primary">Consultas por Especialidade</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={specialtyDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f3f4" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                   cursor={{fill: 'transparent'}}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#1a73e8" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-3xl border border-vitta-border shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="text-vitta-accent" size={20} />
            <h3 className="font-bold text-vitta-text-primary">Receita Mensal (Aprovada)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f3f4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#34a853" strokeWidth={3} dot={{ r: 4, fill: '#34a853' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
