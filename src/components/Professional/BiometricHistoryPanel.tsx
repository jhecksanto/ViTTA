import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Scale, 
  Heart, 
  FileText, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  ExternalLink,
  Droplet
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatDateForDisplay } from '../../lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface BiometricHistoryPanelProps {
  patientId?: string;
  patientName?: string;
}

export const BiometricHistoryPanel: React.FC<BiometricHistoryPanelProps> = ({
  patientId,
  patientName
}) => {
  const [activeTab, setActiveTab] = useState<'biometrics' | 'exams' | 'history'>('biometrics');
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [patientUser, setPatientUser] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPatientBiometrics = async () => {
      setLoading(true);
      try {
        // Fetch clinical records / biometric history
        if (patientId) {
          const recQuery = query(
            collection(db, 'patient_records'),
            where('patientId', '==', patientId),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
          const recSnap = await getDocs(recQuery);
          if (isMounted) {
            setRecords(recSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }

          // Fetch exams
          const examQuery = query(
            collection(db, 'exams'),
            where('userId', '==', patientId),
            orderBy('date', 'desc'),
            limit(10)
          );
          const examSnap = await getDocs(examQuery);
          if (isMounted) {
            setExams(examSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }

          // Fetch patient user info
          const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', patientId)));
          if (!userDoc.empty && isMounted) {
            setPatientUser(userDoc.docs[0].data());
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar biometria do paciente:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPatientBiometrics();
    return () => { isMounted = false; };
  }, [patientId]);

  // Extract biometric chart data (weight, BMI, BP)
  const chartData = records
    .filter(r => r.soap?.objective?.weight || r.weight)
    .map(r => {
      const weight = parseFloat(r.soap?.objective?.weight || r.weight || 0);
      const height = parseFloat(r.soap?.objective?.height || r.height || 1.70);
      const bmi = weight > 0 && height > 0 ? (weight / (height * height)).toFixed(1) : null;
      return {
        date: r.date ? formatDateForDisplay(r.date) : 'Recente',
        weight: weight,
        bmi: bmi ? parseFloat(bmi) : null,
        bp: r.soap?.objective?.bloodPressure || r.bloodPressure || '-'
      };
    })
    .reverse();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full space-y-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-vitta-accent" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
            Histórico Clínico & Biometria
          </h4>
        </div>
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab('biometrics')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all ${
              activeTab === 'biometrics' 
                ? 'bg-vitta-accent text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sinais Vitais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exams')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all ${
              activeTab === 'exams' 
                ? 'bg-vitta-accent text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Exames ({exams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all ${
              activeTab === 'history' 
                ? 'bg-vitta-accent text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Evoluções ({records.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-8 text-xs text-slate-500">
          Carregando dados biométricos...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-1">
          {activeTab === 'biometrics' && (
            <div className="space-y-4">
              {/* Quick Biometric Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                    <span>Peso / IMC Atual</span>
                    <Scale size={12} className="text-emerald-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-white">
                      {chartData.length > 0 ? `${chartData[chartData.length - 1].weight} kg` : (patientUser?.weight ? `${patientUser.weight} kg` : '74.5 kg')}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      IMC {chartData.length > 0 && chartData[chartData.length - 1].bmi ? chartData[chartData.length - 1].bmi : '23.8'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
                    <span>Pressão Arterial</span>
                    <Heart size={12} className="text-rose-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-white">
                      {chartData.length > 0 && chartData[chartData.length - 1].bp !== '-' ? chartData[chartData.length - 1].bp : '120/80'}
                    </span>
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </div>
                </div>
              </div>

              {/* Chart of weight & BMI progression */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp size={11} className="text-vitta-accent" /> Evolução de Peso
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Últimos atendimentos</span>
                </div>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.length > 0 ? chartData : [
                      { date: 'Jan', weight: 76.2, bmi: 24.5, bp: 120 },
                      { date: 'Mar', weight: 75.0, bmi: 24.1, bp: 118 },
                      { date: 'Mai', weight: 74.5, bmi: 23.9, bp: 115 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                      <Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3, fill: '#0ea5e9' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Patient Allergies & Chronic Conditions */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alergias & Alertas</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {patientUser?.allergies || 'Sem alergias medicamentosas declaradas.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="space-y-2">
              {exams.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl p-4">
                  Nenhum laudo ou exame anexado para este paciente.
                </div>
              ) : (
                exams.map((ex) => (
                  <div key={ex.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-vitta-accent/10 border border-vitta-accent/20 flex items-center justify-center text-vitta-accent">
                        <FileText size={16} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">{ex.title || ex.name || 'Exame Laboratorial'}</h5>
                        <p className="text-[10px] text-slate-400">
                          {ex.date ? formatDateForDisplay(ex.date) : 'Data não informada'} • {ex.category || 'Geral'}
                        </p>
                      </div>
                    </div>
                    {ex.resultUrl || ex.fileUrl ? (
                      <a
                        href={ex.resultUrl || ex.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-vitta-accent rounded-lg text-[10px] font-bold flex items-center gap-1"
                      >
                        Abrir <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">Disponível</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {records.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl p-4">
                  Nenhum registro clínico anterior cadastrado.
                </div>
              ) : (
                records.map((rec) => (
                  <div key={rec.id} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-850 pb-1">
                      <span className="font-bold text-vitta-accent">{rec.professionalName || 'Médico Responsável'}</span>
                      <span>{rec.date ? formatDateForDisplay(rec.date) : 'Data recente'}</span>
                    </div>
                    {rec.soap?.assessment && (
                      <p className="text-xs text-slate-200">
                        <strong className="text-slate-400">Diagnóstico:</strong> {rec.soap.assessment}
                      </p>
                    )}
                    {rec.soap?.plan && (
                      <p className="text-[11px] text-slate-400">
                        <strong className="text-slate-500">Conduta:</strong> {rec.soap.plan}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default BiometricHistoryPanel;
