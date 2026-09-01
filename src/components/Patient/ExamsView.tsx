import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  X, 
  CheckCircle, 
  Clock, 
  Filter, 
  ArrowUpDown, 
  Calendar,
  Building2,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton } from '../ui/skeleton';

interface ExamsViewProps {
  user: any;
}

export const ExamsView: React.FC<ExamsViewProps> = ({ user }) => {
  const { addToast } = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'ready' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [previewExam, setPreviewExam] = useState<any | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'user_exams'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setExams(data);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar exames:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Dynamic filter and sort
  const filteredExams = useMemo(() => {
    const list = exams.filter((exam) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'ready'
          ? exam.status === 'ready'
          : exam.status === 'pending' || exam.status === 'in_analysis';

      const queryLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !queryLower ||
        (exam.name && exam.name.toLowerCase().includes(queryLower)) ||
        (exam.lab && exam.lab.toLowerCase().includes(queryLower)) ||
        (exam.resultNote && exam.resultNote.toLowerCase().includes(queryLower)) ||
        (exam.instructions && exam.instructions.toLowerCase().includes(queryLower));

      return matchesFilter && matchesSearch;
    });

    // Sort order based on createdAt / date
    list.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.date ? new Date(a.date).getTime() : 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.date ? new Date(b.date).getTime() : 0);
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [exams, filter, searchQuery, sortOrder]);

  const countTotal = exams.length;
  const countReady = exams.filter((e) => e.status === 'ready').length;
  const countPending = exams.filter((e) => e.status === 'pending' || e.status === 'in_analysis').length;

  const handleDownload = async (url: string | undefined, examName: string) => {
    if (!url) {
      addToast('Arquivo de laudo não disponível para download no momento.', 'error');
      return;
    }

    try {
      if (url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = url;
        const mimeMatch = url.match(/^data:([^;]+);/);
        let ext = 'pdf';
        if (mimeMatch) {
          const mime = mimeMatch[1];
          if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
          else if (mime.includes('png')) ext = 'png';
          else if (mime.includes('gif')) ext = 'gif';
          else if (mime.includes('webp')) ext = 'webp';
        }
        link.download = `${examName.replace(/[/\\?%*:|"<>]/g, '-')}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Download do laudo concluído!', 'success');
        return;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Response status ' + response.status);
      const blob = await response.blob();
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      let ext = 'pdf';
      const contentType = response.headers.get('content-type');
      if (contentType) {
        if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
        else if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('gif')) ext = 'gif';
        else if (contentType.includes('webp')) ext = 'webp';
      } else {
        const cleanUrl = url.split('?')[0];
        const match = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
        if (match) ext = match[1];
      }
      
      link.download = `${examName.replace(/[/\\?%*:|"<>]/g, '-')}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      addToast('Download iniciado com sucesso.', 'success');
    } catch (error) {
      console.warn('Falha no fetch direto, fallback para abertura:', error);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `${examName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Stat Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-vitta-text-primary tracking-tight">
            Central de Exames & Laudos Digitais
          </h1>
          <p className="text-xs text-vitta-text-secondary mt-0.5">
            Acompanhe o status, consulte os resultados e baixe seus laudos médicos com segurança.
          </p>
        </div>

        {/* Real-time counters summary cards */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl flex items-center gap-2 shadow-sm">
            <FileText size={16} className="text-vitta-accent" />
            <div className="text-left">
              <span className="text-[10px] text-vitta-text-muted font-bold block">Total</span>
              <span className="text-xs font-black text-vitta-text-primary">{countTotal}</span>
            </div>
          </div>
          <div className="px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-2 shadow-sm">
            <CheckCircle size={16} className="text-emerald-500" />
            <div className="text-left">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">Prontos</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{countReady}</span>
            </div>
          </div>
          <div className="px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center gap-2 shadow-sm">
            <Clock size={16} className="text-amber-500" />
            <div className="text-left">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">Pendentes</span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400">{countPending}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-vitta-accent text-white shadow-sm shadow-vitta-accent/20'
                : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'
            }`}
          >
            Todos ({countTotal})
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'ready'
                ? 'bg-vitta-accent text-white shadow-sm shadow-vitta-accent/20'
                : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'
            }`}
          >
            <CheckCircle size={14} />
            Prontos ({countReady})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-vitta-accent text-white shadow-sm shadow-vitta-accent/20'
                : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'
            }`}
          >
            <Clock size={14} />
            Em Análise ({countPending})
          </button>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-2 bg-vitta-surface border border-vitta-border text-vitta-text-secondary hover:text-vitta-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
            title="Alternar ordenação temporal"
          >
            <ArrowUpDown size={14} />
            {sortOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigos'}
          </button>
        </div>

        {/* Text Search Field */}
        <div className="relative w-full lg:w-80">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vitta-text-muted"
            size={16}
          />
          <input
            type="text"
            placeholder="Buscar por exame, laboratório ou notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs text-vitta-text-primary outline-none focus:border-vitta-accent transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-vitta-text-muted hover:text-vitta-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table / Results Container */}
      <div className="bg-vitta-surface rounded-2xl border border-vitta-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-vitta-surface-2/80 border-b border-vitta-border">
                <th className="px-6 py-3.5 text-xs font-black text-vitta-text-muted uppercase tracking-wider">
                  Exame & Tipo
                </th>
                <th className="px-6 py-3.5 text-xs font-black text-vitta-text-muted uppercase tracking-wider">
                  Data de Coleta / Solicitação
                </th>
                <th className="px-6 py-3.5 text-xs font-black text-vitta-text-muted uppercase tracking-wider">
                  Laboratório / Unidade
                </th>
                <th className="px-6 py-3.5 text-xs font-black text-vitta-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-black text-vitta-text-muted uppercase tracking-wider text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredExams.length > 0 ? (
                filteredExams.map((exam) => {
                  const isReady = exam.status === 'ready';
                  return (
                    <tr
                      key={exam.id}
                      className="hover:bg-vitta-surface-2/60 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${
                            isReady 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            <FileText size={18} />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-vitta-text-primary block">
                              {exam.name || 'Exame Médico'}
                            </span>
                            {exam.category && (
                              <span className="text-[10px] text-vitta-text-muted">
                                {exam.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-vitta-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-vitta-text-muted" />
                          <span>
                            {exam.createdAt?.seconds
                              ? new Date(exam.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                              : exam.date
                              ? new Date(exam.date).toLocaleDateString('pt-BR')
                              : 'Recente'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-vitta-text-secondary">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-vitta-text-muted" />
                          <span className="font-medium">{exam.lab || 'Laboratório Credenciado ViTTA'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isReady
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isReady ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {isReady ? 'Laudo Pronto' : 'Em Análise'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedExam(exam)}
                            className="px-2.5 py-1.5 text-vitta-text-secondary hover:text-vitta-accent hover:bg-vitta-surface-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Ver Detalhes do Exame"
                          >
                            <Eye size={14} />
                            Detalhes
                          </button>
                          {isReady && exam.resultUrl && (
                            <>
                              <button
                                onClick={() => setPreviewExam(exam)}
                                className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-500/20"
                                title="Visualizar Laudo"
                              >
                                <FileCheck2 size={14} />
                                Laudo
                              </button>
                              <button
                                onClick={() => handleDownload(exam.resultUrl, exam.name)}
                                className="p-1.5 text-vitta-accent hover:bg-vitta-accent/10 rounded-xl transition-colors cursor-pointer"
                                title="Baixar Laudo PDF"
                              >
                                <Download size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-vitta-text-muted space-y-2"
                  >
                    <FileText className="mx-auto text-vitta-text-muted/50" size={32} />
                    <p className="text-xs font-bold text-vitta-text-primary">Nenhum exame encontrado</p>
                    <p className="text-[11px] text-vitta-text-muted">
                      {searchQuery ? 'Tente ajustar os termos da busca.' : 'Não há exames cadastrados nesta categoria.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedExam && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-vitta-surface max-w-lg w-full rounded-2xl border border-vitta-border shadow-2xl p-6 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-vitta-accent/10 text-vitta-accent flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-vitta-text-primary">
                      {selectedExam.name}
                    </h3>
                    <p className="text-xs text-vitta-text-muted">
                      {selectedExam.lab || 'Laboratório Credenciado'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExam(null)}
                  className="p-1 text-vitta-text-muted hover:text-vitta-text-primary rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs bg-vitta-surface-2 p-4 rounded-xl border border-vitta-border">
                <div className="flex justify-between">
                  <span className="text-vitta-text-muted">Status:</span>
                  <span className={`font-bold ${selectedExam.status === 'ready' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {selectedExam.status === 'ready' ? 'Pronto para Download' : 'Em Processamento Laboratorial'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vitta-text-muted">Data:</span>
                  <span className="font-bold text-vitta-text-primary">
                    {selectedExam.createdAt?.seconds
                      ? new Date(selectedExam.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                      : selectedExam.date || 'Recente'}
                  </span>
                </div>
                {selectedExam.instructions && (
                  <div>
                    <span className="text-vitta-text-muted block mb-1">Preparo / Instruções:</span>
                    <p className="p-2.5 bg-vitta-surface rounded-lg border border-vitta-border text-vitta-text-secondary">
                      {selectedExam.instructions}
                    </p>
                  </div>
                )}
                {selectedExam.resultNote && (
                  <div>
                    <span className="text-vitta-text-muted block mb-1">Parecer Clínico / Observações:</span>
                    <p className="p-2.5 bg-vitta-surface rounded-lg border border-vitta-border text-vitta-text-secondary">
                      {selectedExam.resultNote}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedExam(null)}
                  className="px-4 py-2 bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Fechar
                </button>
                {selectedExam.status === 'ready' && selectedExam.resultUrl && (
                  <button
                    onClick={() => {
                      const ex = selectedExam;
                      setSelectedExam(null);
                      handleDownload(ex.resultUrl, ex.name);
                    }}
                    className="px-4 py-2 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-vitta-accent/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Download size={14} />
                    Baixar Laudo Digital
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal for Digital Reports */}
      <AnimatePresence>
        {previewExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-4xl h-[85vh] rounded-2xl border border-vitta-border shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-vitta-border flex items-center justify-between bg-vitta-surface-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <FileCheck2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-vitta-text-primary">
                      Laudo Digital: {previewExam.name}
                    </h3>
                    <p className="text-[11px] text-vitta-text-muted">
                      {previewExam.lab || 'Laboratório ViTTA'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(previewExam.resultUrl, previewExam.name)}
                    className="px-3 py-1.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} />
                    Baixar
                  </button>
                  <button
                    onClick={() => setPreviewExam(null)}
                    className="p-1.5 text-vitta-text-muted hover:text-vitta-text-primary rounded-xl cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-900/10 p-4 flex items-center justify-center overflow-auto">
                {previewExam.resultUrl ? (
                  previewExam.resultUrl.startsWith('data:image') || previewExam.resultUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                    <img
                      src={previewExam.resultUrl}
                      alt={previewExam.name}
                      className="max-h-full max-w-full object-contain rounded-lg shadow-md"
                    />
                  ) : (
                    <iframe
                      src={previewExam.resultUrl}
                      title={previewExam.name}
                      className="w-full h-full rounded-xl border border-vitta-border bg-white"
                    />
                  )
                ) : (
                  <div className="text-center text-vitta-text-muted text-xs">
                    Não foi possível carregar a pré-visualização.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ExamsView;
