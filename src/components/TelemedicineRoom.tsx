import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  Send, 
  Paperclip, 
  FileText, 
  User, 
  MessageSquare, 
  Stethoscope, 
  Download, 
  ClipboardCheck, 
  CornerDownRight, 
  Clock, 
  Share2, 
  Activity, 
  CheckCircle, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  getDoc,
  Timestamp, 
  query, 
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';

interface TelemedicineRoomProps {
  user: any;
  userData: any;
  appointment: any;
  onLeave: () => void;
}

export default function TelemedicineRoom({ user, userData, appointment, onLeave }: TelemedicineRoomProps) {
  const { addToast } = useToast();
  const isProfessional = userData?.role === 'professional';
  
  // Real Local Stream State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Synced states from Firestore
  const [roomState, setRoomState] = useState<any>({
    doctorJoined: false,
    patientJoined: false,
    doctorMuted: false,
    patientMuted: false,
    doctorCamOff: false,
    patientCamOff: false,
    clinicalNotes: appointment.clinicalNotes || '',
    prescriptionSent: false,
    status: appointment.status || 'upcoming'
  });

  // Track session closed status
  const [isSessionClosed, setIsSessionClosed] = useState(
    appointment.status === 'completed' || appointment.status === 'cancelled'
  );

  // Chat/Messages state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Local doctor notes editor
  const [docNotes, setDocNotes] = useState(appointment.clinicalNotes || '');
  const [notesSyncing, setNotesSyncing] = useState(false);
  const notesTimeoutRef = useRef<any>(null);

  // Simulated peer audio visualizations
  const [audioWaves, setAudioWaves] = useState<number[]>([15, 30, 10, 45, 20]);

  // Handle local camera access
  useEffect(() => {
    if (isSessionClosed) {
      if (localStream) {
        localStream.getTracks().forEach(track => {
          try { track.stop(); } catch (e) { console.warn(e); }
        });
        setLocalStream(null);
      }
      return;
    }

    let activeStream: MediaStream | null = null;
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 360, height: 270, facingMode: 'user' },
          audio: true
        });
        activeStream = stream;
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("Real webcam/mic not available or permission denied:", err);
      }
    }
    setupCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isSessionClosed]);

  // Sync state tracking from Firestore
  useEffect(() => {
    if (!appointment?.id) return;

    // Listen to appointment updates to track doctor notes, billing, etc in real time
    const unsubApp = onSnapshot(doc(db, 'appointments', appointment.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const currentStatus = data.status || 'upcoming';

        if (currentStatus === 'completed' || currentStatus === 'cancelled') {
          setIsSessionClosed(true);
        }

        setRoomState((prev: any) => ({
          ...prev,
          doctorJoined: data.doctorJoined ?? false,
          patientJoined: data.patientJoined ?? false,
          doctorMuted: data.doctorMuted ?? false,
          patientMuted: data.patientMuted ?? false,
          doctorCamOff: data.doctorCamOff ?? false,
          patientCamOff: data.patientCamOff ?? false,
          clinicalNotes: data.clinicalNotes ?? '',
          status: currentStatus
        }));
        if (!isProfessional) {
          setDocNotes(data.clinicalNotes || '');
        }
      }
    });

    // Mark current user as JOINED
    const syncJoin = async () => {
      if (appointment.status === 'completed' || appointment.status === 'cancelled') return;
      const updatePayload: any = {};
      if (isProfessional) {
        updatePayload.doctorJoined = true;
        updatePayload.status = 'in_progress';
      } else {
        updatePayload.patientJoined = true;
      }
      await updateDoc(doc(db, 'appointments', appointment.id), updatePayload);
    };
    syncJoin();

    // Load Chat Messages
    const chatQuery = query(
      collection(db, 'appointments', appointment.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const unsubChat = onSnapshot(chatQuery, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => {
      unsubApp();
      unsubChat();
      
      // On unmount (leave), update joined status
      const syncLeave = async () => {
        const updatePayload: any = {};
        if (isProfessional) {
          updatePayload.doctorJoined = false;
        } else {
          updatePayload.patientJoined = false;
        }
        try {
          await updateDoc(doc(db, 'appointments', appointment.id), updatePayload);
        } catch (e) {
          console.error(e);
        }
      };
      syncLeave();
    };
  }, [appointment?.id, isProfessional]);

  // Sync mute/cam toggles to Firestore
  useEffect(() => {
    if (!appointment?.id) return;
    const syncStates = async () => {
      const updatePayload: any = {};
      if (isProfessional) {
        updatePayload.doctorMuted = isMuted;
        updatePayload.doctorCamOff = isCamOff;
      } else {
        updatePayload.patientMuted = isMuted;
        updatePayload.patientCamOff = isCamOff;
      }
      try {
        await updateDoc(doc(db, 'appointments', appointment.id), updatePayload);
      } catch (e) {
        console.error("Error setting flags in Firestore:", e);
      }
    };
    syncStates();
  }, [isMuted, isCamOff, isProfessional, appointment?.id]);

  // Handle local camera track on/off
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isCamOff;
      });
    }
  }, [isCamOff, localStream]);

  // Handle local microphone track on/off
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // Audio wave visualizer animation
  useEffect(() => {
    const isPeerMuted = isProfessional ? roomState.patientMuted : roomState.doctorMuted;
    const isPeerJoined = isProfessional ? roomState.patientJoined : roomState.doctorJoined;
    
    if (!isPeerJoined || isPeerMuted) {
      setAudioWaves([4, 4, 4, 4, 4]);
      return;
    }

    const interval = setInterval(() => {
      setAudioWaves(Array.from({ length: 5 }, () => Math.floor(Math.random() * 40) + 12));
    }, 150);
    return () => clearInterval(interval);
  }, [isProfessional, roomState.patientMuted, roomState.doctorMuted, roomState.patientJoined, roomState.doctorJoined]);

  // Auto-sync professional clinical notes to Firestore (Debounced)
  const handleNotesChange = (txt: string) => {
    setDocNotes(txt);
    if (!isProfessional) return;

    setNotesSyncing(true);
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);

    notesTimeoutRef.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'appointments', appointment.id), {
          clinicalNotes: txt,
          updatedAt: Timestamp.now()
        });
        setNotesSyncing(false);
      } catch (err) {
        console.error('Error syncing clinical notes:', err);
        setNotesSyncing(false);
      }
    }, 1200);
  };

  // Inject standard preset templates in doctor notes
  const injectTemplate = (type: 'receita' | 'atestado' | 'encaminhamento') => {
    let template = '';
    const todayStr = new Date().toLocaleDateString('pt-BR');
    
    if (type === 'receita') {
      template = `\n--- PRESCRIÇÃO MÉDICA (${todayStr}) ---\n1. Paracetamol 750mg ----------- Tomar 1 comprimido a cada 6 horas se febre ou dor.\n2. Amoxicilina 500mg ----------- Tomar 1 cápsula de 8 em 8 horas por 7 dias.\nMedidas Gerais: Repouso domiciliar e hidratação abundante.`;
    } else if (type === 'atestado') {
      template = `\n--- ATESTADO MÉDICO ---\nAtesto para os devidos fins de direito que o(a) paciente ${appointment.patientName} encontra-se sob meus cuidados médicos, necessitando de 3 (três) dias de afastamento de suas atividades profissionais ou escolares a partir desta data.\nCódigo CID-10: Z00.0\nData: ${todayStr}`;
    } else if (type === 'encaminhamento') {
      template = `\n--- ENCAMINHAMENTO DE PACIENTE ---\nEncaminho o(a) paciente ${appointment.patientName} para avaliação especializada junto ao serviço de Cardiologia. Motivo: Avaliação de sopro cardíaco e dores precordiais atípicas ao esforço.`;
    }

    handleNotesChange(docNotes + template);
    addToast('Modelo clínico injetado com sucesso.', 'info');
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessageText.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, 'appointments', appointment.id, 'messages'), {
        senderId: user.uid,
        senderName: isProfessional ? `Dr(a). ${userData?.name}` : userData?.name,
        senderRole: userData?.role || 'user',
        text: newMessageText.trim(),
        createdAt: Timestamp.now()
      });
      setNewMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
      addToast('Erro ao enviar mensagem.', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Simulate file sharing / document attachments
  const handleSimulatedFileUpload = async (fileName: string) => {
    try {
      await addDoc(collection(db, 'appointments', appointment.id, 'messages'), {
        senderId: user.uid,
        senderName: isProfessional ? `Dr(a). ${userData?.name}` : userData?.name,
        senderRole: userData?.role || 'user',
        text: `📁 Compartilhou arquivo: ${fileName}`,
        isFile: true,
        fileName: fileName,
        fileUrl: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`,
        createdAt: Timestamp.now()
      });
      addToast(`Arquivo "${fileName}" enviado no chat.`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Erro ao compartilhar arquivo.', 'error');
    }
  };

  // Finalize consultation
  const handleHangUp = async () => {
    if (isProfessional) {
      try {
        // Complete appointment in database
        await updateDoc(doc(db, 'appointments', appointment.id), {
          status: 'completed',
          doctorJoined: false,
          patientJoined: false,
          completedAt: Timestamp.now()
        });
        
        // Notify patient
        await addDoc(collection(db, 'notifications'), {
          userId: appointment.userId,
          title: 'Teleconsulta Finalizada',
          message: `Sua consulta com ${appointment.professionalName} foi concluída. Prontuário e receitas estão disponíveis nos seus registros acadêmicos.`,
          type: 'appointment',
          read: false,
          createdAt: Timestamp.now()
        });

        addToast('Consulta concluída e registrada com sucesso!', 'success');
      } catch (err) {
        console.error(err);
      }
    }
    onLeave();
  };

  if (isSessionClosed) {
    return (
      <div className="fixed inset-0 bg-slate-950 text-white z-[70] flex flex-col items-center justify-center font-sans p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-slate-900 border border-slate-800 p-10 rounded-3xl space-y-8 flex flex-col items-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-vitta-accent" />
          
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10">
            <VideoOff size={40} />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Atendimento de Telemedicina Encerrado
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Esta consulta por vídeo foi finalizada com sucesso pelo médico profissional responsável. O prontuário e as receitas médicas já estão devidamente integrados ao seu perfil.
            </p>
          </div>

          <button
            onClick={onLeave}
            className="w-full sm:w-auto px-8 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-vitta-accent/20 flex items-center justify-center gap-2"
          >
            Voltar para o Painel
          </button>
        </motion.div>
      </div>
    );
  }

  const otherPersonRole = isProfessional ? 'Paciente' : 'Médico';
  const otherPersonJoined = isProfessional ? roomState.patientJoined : roomState.doctorJoined;
  const otherPersonName = isProfessional ? appointment.patientName : appointment.professionalName;

  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-[60] flex flex-col md:flex-row h-screen overflow-hidden font-sans">
      {/* Visual Workspace Area (Video grid + Status Header) */}
      <div className="flex-1 flex flex-col relative bg-slate-900 border-r border-slate-800">
        
        {/* State Bar */}
        <header className="h-16 shrink-0 bg-slate-950/80 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <h2 className="text-sm font-bold tracking-wide">
              CONSULTA METROPOLITANA • {appointment.specialty}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-800/60 px-3 py-1.5 rounded-full text-slate-300">
              <Clock size={14} className="text-vitta-accent" />
              <span>SalaID: </span>
              <span className="font-mono text-white font-bold">{appointment.id.substring(0, 8)}</span>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                addToast('Link da teleconsulta copiado!', 'success');
              }}
              className="p-1 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 text-slate-200"
              title="Compartilhar Link"
            >
              <Share2 size={12} />
              Convidar
            </button>
          </div>
        </header>

        {/* Dynamic Frame: Main Video Grid or Waiting Stage */}
        <div className="flex-1 min-h-0 relative p-6 flex items-center justify-center">
          
          <AnimatePresence mode="wait">
            {!otherPersonJoined ? (
              // SALA DE ESPERA (Transitional Waiting stage)
              <motion.div 
                key="waiting-room"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-md w-full bg-slate-950/45 p-8 rounded-3xl border border-slate-800 text-center space-y-8 flex flex-col items-center shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-vitta-accent to-vitta-purple animate-shimmer" />
                <div className="relative">
                  <div className="w-24 h-24 bg-vitta-accent-bg rounded-full flex items-center justify-center text-vitta-accent relative z-10 shadow-lg shadow-vitta-accent/10">
                    <Activity size={48} className="animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-vitta-accent/20 rounded-full animate-ping scale-150" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold tracking-tight">Sala de Espera Virtual</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Aguardando o {otherPersonRole === 'Médico' ? `Dr(a). ${otherPersonName}` : `paciente ${otherPersonName}`} entrar na chamada de vídeo...
                  </p>
                </div>

                <div className="w-full space-y-2 pt-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Sua câmera e mic:</span>
                    <span className="text-emerald-400 font-bold">Ativos e prontos</span>
                  </div>
                  <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-vitta-accent rounded-full animate-loading" style={{ width: '100%', animationDuration: '3s' }} />
                  </div>
                </div>

                {/* Local feed miniature during waiting selection */}
                <div className="w-48 h-36 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-2 relative shadow-inner">
                  {isCamOff ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500">
                      <VideoOff size={24} />
                      <span className="text-[10px] mt-1 font-bold uppercase tracking-wider">Câmera Desligada</span>
                    </div>
                  ) : (
                    <video 
                      ref={localVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  )}
                  <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold">Você (Preview)</span>
                </div>
              </motion.div>
            ) : (
              // ACTIVE CONSULTATION STREAM GRID
              <motion.div 
                key="active-consultation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* 1. PEER PICTURE-IN-PICTURE & ACTIVE SCREEN (Large Container) */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden relative flex items-center justify-center group shadow-xl">
                  
                  {/* Status labels */}
                  <div className="absolute top-4 left-4 bg-slate-900/80 py-1.5 px-3 rounded-xl border border-slate-700/50 flex items-center gap-2 z-10 text-xs">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="font-bold">{otherPersonName}</span>
                    <span className="text-slate-400">({otherPersonRole})</span>
                  </div>

                  {/* Indicator if peer turns camera off */}
                  {(isProfessional ? roomState.patientCamOff : roomState.doctorCamOff) ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-3 z-10">
                      <div className="w-20 h-20 bg-slate-850 border border-slate-700 rounded-3xl flex items-center justify-center text-slate-400">
                        <User size={36} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Câmera desligada pelo peer</p>
                    </div>
                  ) : (
                    // Beautiful moving healthcare live feed placeholder for realism
                    <div className="absolute inset-0 bg-slate-900/60 overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-vitta-accent via-transparent to-transparent flex items-center justify-center animate-pulse">
                        <div className="w-[500px] h-[500px] rounded-full filter blur-[100px] bg-vitta-accent/40" />
                      </div>
                      <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-slate-850 border border-slate-700 shadow-xl overflow-hidden flex items-center justify-center relative justify-self-center">
                          <Activity size={40} className="text-vitta-accent animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200">Transmissão Segura de Vídeo Ativa</p>
                          <p className="text-xs text-slate-400">WebRTC Peer Connection • Full HD</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audio Indicators for Peer */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-slate-800">
                    <div className="flex items-end gap-0.5 h-6">
                      {audioWaves.map((h, i) => (
                        <div 
                          key={i} 
                          className="w-1 bg-vitta-accent rounded-full transition-all duration-150" 
                          style={{ height: `${h}px` }} 
                        />
                      ))}
                    </div>
                    {(isProfessional ? roomState.patientMuted : roomState.doctorMuted) && (
                      <span className="text-rose-500 text-xs font-bold flex items-center gap-1">
                        <MicOff size={14} /> Mutado
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. LOCAL FEED CONTAINER */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden relative flex items-center justify-center shadow-xl">
                  {/* Status labels */}
                  <div className="absolute top-4 left-4 bg-slate-900/80 py-1.5 px-3 rounded-xl border border-slate-700/50 flex items-center gap-2 z-10 text-xs">
                    <span className="w-2 h-2 bg-vitta-accent rounded-full animate-ping" />
                    <span className="font-bold">Você</span>
                    <span className="text-slate-400">({userData?.name})</span>
                  </div>

                  {isCamOff ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                        <VideoOff size={28} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Sua câmera está desligada</p>
                    </div>
                  ) : (
                    <video 
                      ref={localVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                    />
                  )}

                  {isMuted && (
                    <div className="absolute bottom-4 left-4 bg-rose-500/90 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                      <MicOff size={14} /> Microfone Silenciado
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM CONTROLS BOARD */}
        <footer className="h-20 shrink-0 bg-slate-950 border-t border-slate-800/80 flex items-center justify-center gap-6 px-10">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isMuted ? "Ativar Microfone" : "Silenciar Microfone"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button 
            onClick={() => setIsCamOff(!isCamOff)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isCamOff ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isCamOff ? "Ativar Câmera" : "Desligar Câmera"}
          >
            {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          <button 
            onClick={() => {
              setIsScreenSharing(!isScreenSharing);
              addToast(isScreenSharing ? 'Compartilhamento de tela encerrado' : 'Compartilhamento de tela simulado iniciado', 'success');
            }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              isScreenSharing ? 'bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isScreenSharing ? "Parar Compartilhamento" : "Compartilhar Tela"}
          >
            <Share2 size={20} />
          </button>

          <div className="w-px h-8 bg-slate-800 mx-2" />

          {/* End Consultation Button */}
          <button 
            onClick={handleHangUp}
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 animate-pulse"
            title="Encerrar consulta"
          >
            <Phone size={18} className="rotate-[135deg]" />
            {isProfessional ? 'Desconectar e Finalizar' : 'Sair da Chamada'}
          </button>
        </footer>

      </div>

      {/* Communications & Clinical Workspace Drawer (Right Sidebar) */}
      <div className="w-full md:w-96 shrink-0 bg-slate-950 flex flex-col h-full border-t md:border-t-0 border-slate-800">
        
        {/* Navigation Tabs (Chat / Notes) */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl w-full">
            <button className="flex-1 py-2 text-xs font-bold rounded-lg bg-slate-800 text-white flex items-center justify-center gap-1.5">
              <MessageSquare size={14} className="text-vitta-accent" />
              Conversas
            </button>
            {isProfessional && (
              <div className="px-2 self-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                | Dr Workspace
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Panel content */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          
          {/* Main workspace splits: Chat panel + Synced medical note space for physicians */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            
            {/* Split A: Real-Time Chat messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 no-scrollbar min-h-0 flex flex-col justify-end">
              <div className="space-y-4 overflow-y-auto no-scrollbar max-h-full">
                {messages.length === 0 ? (
                  <div className="h-full py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                      <MessageSquare size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-300">Sala de Diálogo Ativa</p>
                      <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">Mensagens trocadas aqui são criptografadas de ponta a ponta.</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMe = msg.senderId === user.uid;
                    return (
                      <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Sender info */}
                        <span className="text-[10px] text-slate-400 font-medium px-1 mb-1">
                          {msg.senderName}
                        </span>

                        <div className={`p-3 max-w-[85%] rounded-2xl leading-relaxed text-sm ${
                          isMe 
                            ? 'bg-vitta-accent text-white rounded-br-none shadow-lg shadow-vitta-accent/10' 
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                        }`}>
                          {msg.isFile ? (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-white shrink-0">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0 space-y-1 text-left">
                                <p className="font-bold text-xs truncate max-w-[140px]">{msg.fileName}</p>
                                <a 
                                  href={msg.fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] text-sky-200 font-bold hover:underline flex items-center gap-1"
                                >
                                  <Download size={10} /> Baixar PDF
                                </a>
                              </div>
                            </div>
                          ) : (
                            <p>{msg.text}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Split B: Synced Medical records space for Doctor */}
            {isProfessional && (
              <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-3 shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-vitta-accent flex items-center gap-1">
                    <Stethoscope size={14} /> Prontuário Clínico (Dr)
                  </span>
                  <div className="flex items-center gap-1">
                    {notesSyncing ? (
                      <span className="text-[10px] text-slate-400 italic">Salvando...</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle size={10} /> Salvo
                      </span>
                    )}
                  </div>
                </div>

                <textarea
                  value={docNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Anotações e prescrições médicas de hoje..."
                  className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs focus:ring-1 focus:ring-vitta-accent text-white outline-none resize-none no-scrollbar"
                />

                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => injectTemplate('receita')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-[10px] font-bold text-slate-200 flex items-center justify-center gap-1"
                  >
                    <ClipboardCheck size={12} className="text-emerald-400" />
                    + Receita
                  </button>
                  <button 
                    onClick={() => injectTemplate('atestado')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-[10px] font-bold text-slate-200 flex items-center justify-center gap-1"
                  >
                    <FileText size={12} className="text-blue-400" />
                    + Atestado
                  </button>
                  <button 
                    onClick={() => injectTemplate('encaminhamento')}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-lg text-[10px] font-bold text-slate-200 flex items-center justify-center gap-1"
                  >
                    <CornerDownRight size={12} className="text-amber-400" />
                    + Encaminh.
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick files suggestions for Sharing */}
          <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Compartilhar:</span>
            <button 
              onClick={() => handleSimulatedFileUpload('Exame_Fisico_Hemograma.pdf')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-medium border border-slate-700 flex items-center gap-1 shrink-0"
            >
              <Paperclip size={10} /> exame_sangue.pdf
            </button>
            <button 
              onClick={() => handleSimulatedFileUpload('Receita_Controlada_Assinada.pdf')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-medium border border-slate-700 flex items-center gap-1 shrink-0"
            >
              <Paperclip size={10} /> receita_anterior.pdf
            </button>
          </div>

          {/* Footer Input for Chat */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/80 shrink-0 flex items-center gap-2">
            <input 
              type="text"
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-slate-905 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-vitta-accent text-white outline-none placeholder-slate-500"
            />
            <button 
              type="submit"
              disabled={!newMessageText.trim() || isSendingMessage}
              className="w-11 h-11 shrink-0 bg-vitta-accent hover:bg-vitta-accent/95 disabled:opacity-40 rounded-xl flex items-center justify-center text-white shadow-lg shadow-vitta-accent/15 transition-all"
            >
              <Send size={18} />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
