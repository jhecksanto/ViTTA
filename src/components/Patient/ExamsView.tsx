import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AlertCircle,
  UploadCloud,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { addDoc } from '../../lib/firestore-wrappers';
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

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadLab, setUploadLab] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Exame Laboratorial');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      addToast('O arquivo selecionado excede o limite máximo permitido de 15MB.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadFile(null);
      return;
    }

    setUploadFile(file);
    if (!uploadName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setUploadName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleUploadExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      addToast('Por favor, selecione um arquivo de laudo ou exame.', 'warning');
      return;
    }
    if (uploadFile.size > 15 * 1024 * 1024) {
      addToast('O arquivo selecionado excede o limite máximo permitido de 15MB.', 'error');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);
      let downloadUrl = '';

      // Try uploading to Firebase Storage with uploadBytesResumable to track real percentage
      try {
        const fileRef = ref(storage, `user_exams/${user.uid}/${Date.now()}_${uploadFile.name}`);
        const uploadTask = uploadBytesResumable(fileRef, uploadFile);

        await new Promise<void>((resolve) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 85);
              setUploadProgress(Math.max(10, progress));
            },
            (error) => {
              console.warn('Storage upload error, fallback to dataUrl:', error);
              resolve();
            },
            async () => {
              try {
                downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve();
              } catch (e) {
                resolve();
              }
            }
          );
        });
      } catch (stErr) {
        console.warn('Storage upload catch, will fallback to dataUrl:', stErr);
      }

      // If storage didn't yield a URL, read as dataURL
      if (!downloadUrl) {
        setUploadProgress(60);
        downloadUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onprogress = (ev) => {
            if (ev.lengthComputable) {
              setUploadProgress(Math.round(60 + (ev.loaded / ev.total) * 35));
            }
          };
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile);
        });
      }

      setUploadProgress(95);

      await addDoc(collection(db, 'user_exams'), {
        userId: user.uid,
        name: uploadName.trim() || 'Exame Complementar',
        category: uploadCategory,
        lab: uploadLab.trim() || 'Laboratório Informado pelo Paciente',
        date: uploadDate || new Date().toISOString().split('T')[0],
        status: 'ready',
        resultNote: uploadNotes.trim() || 'Anexado pelo paciente via Central de Exames',
        resultUrl: downloadUrl,
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        createdAt: serverTimestamp()
      });

      setUploadProgress(100);
      addToast('Exame anexado com sucesso e disponível no prontuário!', 'success');

      // Reset form
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadName('');
      setUploadLab('');
      setUploadNotes('');
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Erro ao anexar exame:', err);
      addToast('Erro ao anexar exame. Tente novamente.', 'error');
    } finally {
      setIsUploading(false);
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
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-vitta-accent/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <UploadCloud size={16} />
            <span>Anexar Exame</span>
          </button>
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

        {/* Upload Exam Modal with Visual Progress & 15MB Limit */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-card border border-vitta-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-vitta-border flex items-center justify-between bg-vitta-surface">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-vitta-accent/10 text-vitta-accent">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-vitta-text-primary">Anexar Novo Exame</h3>
                    <p className="text-xs text-vitta-text-secondary">Envie laudos ou exames em PDF ou imagem (máx. 15MB)</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isUploading && setIsUploadModalOpen(false)}
                  disabled={isUploading}
                  className="p-2 text-vitta-text-muted hover:text-vitta-text-primary rounded-xl hover:bg-vitta-surface-2 transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleUploadExam} className="p-6 space-y-4">
                {/* File Drop / Select Area */}
                <div>
                  <label className="block text-xs font-bold text-vitta-text-primary mb-1.5">
                    Arquivo do Laudo / Exame *
                  </label>
                  <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
                      uploadFile
                        ? 'border-vitta-accent bg-vitta-accent/5'
                        : 'border-vitta-border hover:border-vitta-accent/50 hover:bg-vitta-surface'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploading}
                    />
                    {uploadFile ? (
                      <div className="flex items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-vitta-accent/10 text-vitta-accent flex items-center justify-center shrink-0">
                            <FileCheck2 size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-vitta-text-primary truncate">{uploadFile.name}</p>
                            <p className="text-[11px] text-vitta-text-muted">
                              {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadFile.type || 'Documento'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-vitta-accent underline shrink-0">Alterar</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <UploadCloud size={28} className="mx-auto text-vitta-accent" />
                        <p className="text-xs font-bold text-vitta-text-primary">
                          Clique ou arraste o laudo médico aqui
                        </p>
                        <p className="text-[11px] text-vitta-text-muted">
                          Suporta PDF, JPG, PNG e WebP (limite máximo de 15MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exam Name */}
                <div>
                  <label className="block text-xs font-bold text-vitta-text-primary mb-1">
                    Nome do Exame *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Ex: Hemograma Completo, Ressonância Magnética..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-vitta-surface border border-vitta-border text-xs text-vitta-text-primary focus:border-vitta-accent outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-vitta-text-primary mb-1">
                      Categoria
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-vitta-surface border border-vitta-border text-xs text-vitta-text-primary focus:border-vitta-accent outline-none"
                    >
                      <option value="Exame Laboratorial">Exame Laboratorial</option>
                      <option value="Exame de Sangue">Exame de Sangue</option>
                      <option value="Exame de Imagem">Exame de Imagem</option>
                      <option value="Cardiológico">Cardiológico</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-vitta-text-primary mb-1">
                      Data da Realização
                    </label>
                    <input
                      type="date"
                      value={uploadDate}
                      onChange={(e) => setUploadDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-vitta-surface border border-vitta-border text-xs text-vitta-text-primary focus:border-vitta-accent outline-none"
                    />
                  </div>
                </div>

                {/* Laboratory */}
                <div>
                  <label className="block text-xs font-bold text-vitta-text-primary mb-1">
                    Laboratório / Clínica
                  </label>
                  <input
                    type="text"
                    value={uploadLab}
                    onChange={(e) => setUploadLab(e.target.value)}
                    placeholder="Ex: Fleury, Dasa, Lavoisier..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-vitta-surface border border-vitta-border text-xs text-vitta-text-primary focus:border-vitta-accent outline-none"
                  />
                </div>

                {/* Notes / Clinical Observations */}
                <div>
                  <label className="block text-xs font-bold text-vitta-text-primary mb-1">
                    Observações / Indicações Clínicas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Ex: Exame de rotina anual com jejum de 12 horas."
                    className="w-full px-3.5 py-2 rounded-xl bg-vitta-surface border border-vitta-border text-xs text-vitta-text-primary focus:border-vitta-accent outline-none resize-none"
                  />
                </div>

                {/* Visual Progress Bar when Uploading */}
                {isUploading && (
                  <div className="space-y-1.5 p-3 rounded-2xl bg-vitta-surface border border-vitta-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-vitta-accent flex items-center gap-1.5">
                        <Clock size={13} className="animate-spin" /> Processando e enviando laudo...
                      </span>
                      <span className="font-black text-vitta-text-primary">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-vitta-border overflow-hidden">
                      <div
                        className="h-full bg-vitta-accent transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-vitta-border">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    disabled={isUploading}
                    className="px-4 py-2.5 rounded-xl border border-vitta-border hover:bg-vitta-surface text-vitta-text-secondary text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !uploadFile}
                    className="px-5 py-2.5 rounded-xl bg-vitta-accent hover:bg-vitta-accent/90 text-white text-xs font-bold transition-all shadow-md shadow-vitta-accent/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud size={15} />
                    <span>{isUploading ? 'Enviando...' : 'Salvar e Disponibilizar'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ExamsView;
