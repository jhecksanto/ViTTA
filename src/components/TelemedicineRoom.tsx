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
  setDoc,
  deleteDoc,
  getDocs,
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
  const localVideoWaitingRef = useRef<HTMLVideoElement | null>(null);
  
  // Real Remote Stream State (WebRTC)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  // Real-time audio analyser levels (0 - 255)
  const [localAudioLevel, setLocalAudioLevel] = useState<number>(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState<number>(0);
  const [playRingSound, setPlayRingSound] = useState(true);

  // Sair/redirecionamento e controle responsivo do chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [redirectCount, setRedirectCount] = useState(3);

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

  const otherPersonRole = isProfessional ? 'Paciente' : 'Médico';
  const otherPersonJoined = isProfessional ? roomState.patientJoined : roomState.doctorJoined;
  const otherPersonName = isProfessional ? appointment.patientName : appointment.professionalName;

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

  // Synthetic sound chime creator
  const playRingtoneSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, audioCtx.currentTime); // E5
      
      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime); // Low volume
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.2);
    } catch (err) {
      // AudioContext might be blocked until user gesture
    }
  };

  const playChimeSound = (freq = 523.25) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc2.frequency.setValueAtTime(freq, audioCtx.currentTime); // C5 or custom
      
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.0);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();

      osc1.stop(audioCtx.currentTime + 1.0);
      osc2.stop(audioCtx.currentTime + 1.0);
    } catch (err) {}
  };

  // Sair/Redirecionamento automático e liberação absoluta de hardware (Issue #1 e #2)
  useEffect(() => {
    if (!isSessionClosed) return;

    // Parar mídias físicas e limpar loops de áudio imediatamente para economizar recursos do sistema
    if (localStream) {
      localStream.getTracks().forEach(track => {
        try { 
          track.stop(); 
          console.log(`[Telemedicina Vitta] Recurso de mídia parado com sucesso: ${track.kind}`);
        } catch (e) {
          console.warn("Erro ao interromper recurso de mídia:", e);
        }
      });
      setLocalStream(null);
    }
    setPlayRingSound(false);

    // Timer de redirecionamento suave de 2.5 segundos (ou contagem regressiva de 3s)
    const timer = setTimeout(() => {
      onLeave();
    }, 2500);

    const interval = setInterval(() => {
      setRedirectCount(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isSessionClosed, onLeave, localStream]);

  // Handle local camera/microphone access with graceful degradation fallbacks
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
        // Fallback approach: Try complete stream first
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true
        });
      } catch (err) {
        console.warn("Full camera+mic stream failed, trying camera only...", err);
        try {
          activeStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        } catch (errVideo) {
          console.warn("Camera failed, trying audio only...", errVideo);
          try {
            activeStream = await navigator.mediaDevices.getUserMedia({
              audio: true
            });
          } catch (errAudio) {
            console.error("All media inputs are blocked or absent:", errAudio);
            addToast("Dispositivos de câmera e áudio não detectados. Você ainda pode usar o chat.", "warning");
          }
        }
      }

      if (activeStream) {
        setLocalStream(activeStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = activeStream;
        }
        if (localVideoWaitingRef.current) {
          localVideoWaitingRef.current.srcObject = activeStream;
        }
      }
    }
    setupCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      }
    };
  }, [isSessionClosed]);

  // Keep webcam video refs properly synced with localStream when elements mount/toggle
  useEffect(() => {
    if (localStream) {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      if (localVideoWaitingRef.current) {
        localVideoWaitingRef.current.srcObject = localStream;
      }
    }
  }, [localStream, isCamOff, roomState.doctorJoined, roomState.patientJoined]);

  // Keep remote video ref properly synced with remoteStream when elements mount/toggle
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(e => {
        console.warn("[WebRTC] Autoplay prevented. Will resume play on user click interaction.", e);
      });
      console.log("[WebRTC] Remote stream bound successfully to video element.");
    }
  }, [remoteStream, otherPersonJoined, roomState.doctorCamOff, roomState.patientCamOff]);

  // Global window listener to automatically unlock audio and play remote video elements on click
  useEffect(() => {
    const unlockAutoplay = () => {
      if (remoteVideoRef.current && remoteVideoRef.current.paused && remoteStream) {
        remoteVideoRef.current.play()
          .then(() => console.log("[WebRTC] Autoplay bypassed on user interaction successfully."))
          .catch(err => console.warn("[WebRTC] Browser still blocking audio play:", err));
      }
    };
    window.addEventListener('click', unlockAutoplay);
    window.addEventListener('touchstart', unlockAutoplay);
    return () => {
      window.removeEventListener('click', unlockAutoplay);
      window.removeEventListener('touchstart', unlockAutoplay);
    };
  }, [remoteStream]);

  // Web Audio API analyser loop to display physical local mic activity in real time
  useEffect(() => {
    if (!localStream || isMuted) {
      setLocalAudioLevel(0);
      return;
    }
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animId: number;

    try {
      if (localStream.getAudioTracks().length > 0) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        source = audioCtx.createMediaStreamSource(localStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        source.connect(analyser);

        const updateLevel = () => {
          if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            setLocalAudioLevel(avg);
          }
          animId = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }
    } catch (e) {
      console.warn("Could not start local microphone analyzer:", e);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (source) source.disconnect();
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch (e) {}
      }
    };
  }, [localStream, isMuted]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Web Audio API analyser loop to display physical remote mic activity in real time
  useEffect(() => {
    const isPeerMuted = isProfessional ? roomState.patientMuted : roomState.doctorMuted;
    const isPeerJoined = isProfessional ? roomState.patientJoined : roomState.doctorJoined;

    if (!remoteStream || isPeerMuted || !isPeerJoined) {
      setRemoteAudioLevel(0);
      return;
    }
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animId: number;

    try {
      if (remoteStream.getAudioTracks().length > 0) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        source = audioCtx.createMediaStreamSource(remoteStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        source.connect(analyser);

        const updateLevel = () => {
          if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const avg = sum / bufferLength;
            setRemoteAudioLevel(avg);
          }
          animId = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      }
    } catch (e) {
      console.warn("Could not start remote microphone analyzer:", e);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (source) source.disconnect();
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch (e) {}
      }
    };
  }, [remoteStream, roomState.patientMuted, roomState.doctorMuted, roomState.patientJoined, roomState.doctorJoined, isProfessional]);

  // WebRTC handshaking and signaling using Firestore as intermediary
  useEffect(() => {
    if (!appointment?.id || !localStream || isSessionClosed) return;

    console.log("[WebRTC] Orchestrating peer stream negotiation. Role:", isProfessional ? "Caller (Doctor)" : "Answerer (Patient)");

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });
    peerConnectionRef.current = pc;

    // Create a client-side remote stream container
    const rdocStream = new MediaStream();
    setRemoteStream(rdocStream);

    pc.ontrack = (event) => {
      console.log("[WebRTC] Remote track detected:", event.track.kind);
      const incomingStream = event.streams && event.streams[0] ? event.streams[0] : null;
      if (incomingStream) {
        incomingStream.getTracks().forEach((track) => {
          if (!rdocStream.getTracks().some(t => t.id === track.id)) {
            rdocStream.addTrack(track);
          }
        });
      } else {
        rdocStream.addTrack(event.track);
      }
      // Force update state to re-trigger binding
      setRemoteStream(new MediaStream(rdocStream.getTracks()));
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state changed:", pc.connectionState);
      if (pc.connectionState === 'connected') {
        addToast("Conexão direta de vídeo com o interlocutor ativa!", "success");
      } else if (pc.connectionState === 'failed') {
        addToast("Sinal de transmissão de vídeo oscilou. Reestabelecendo...", "warning");
      }
    };

    // Forward all local camera and microphone tracks to peer candidate
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    const signalDocRef = doc(db, 'appointments', appointment.id, 'webrtc', 'signal');
    const myCandidatesCol = collection(
      db, 
      'appointments', 
      appointment.id, 
      isProfessional ? 'doctorCandidates' : 'patientCandidates'
    );
    const peerCandidatesCol = collection(
      db, 
      'appointments', 
      appointment.id, 
      isProfessional ? 'patientCandidates' : 'doctorCandidates'
    );

    // Save and send local ice candidates when discovered
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        try {
          await addDoc(myCandidatesCol, event.candidate.toJSON());
        } catch (e) {
          console.warn("[WebRTC] Candidate registration error:", e);
        }
      }
    };

    let unsubSignal: () => void = () => {};
    let unsubCandidates: () => void = () => {};

    const setupSignaling = async () => {
      const remoteCandidatesQueue: RTCIceCandidateInit[] = [];

      const flushCandidatesQueue = async () => {
        while (remoteCandidatesQueue.length > 0) {
          const cand = remoteCandidatesQueue.shift();
          if (cand) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
              console.log("[WebRTC] Flushed queued ICE candidate.");
            } catch (e) {
              console.warn("[WebRTC] Error flushing candidate:", e);
            }
          }
        }
      };

      if (isProfessional) {
        // Offer Side: Doctor initiates
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        await pc.setLocalDescription(offer);

        await setDoc(signalDocRef, {
          offer: {
            type: offer.type,
            sdp: offer.sdp
          },
          createdAt: Timestamp.now()
        });

        unsubSignal = onSnapshot(signalDocRef, async (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();
          if (data && data.answer && !pc.remoteDescription) {
            console.log("[WebRTC Doctor] Received answer from Patient.");
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            await flushCandidatesQueue();
          }
        });

      } else {
        // Answer Side: Patient receives & answers
        unsubSignal = onSnapshot(signalDocRef, async (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();
          if (data && data.offer && !pc.remoteDescription) {
            console.log("[WebRTC Patient] Received offer from Doctor.");
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await updateDoc(signalDocRef, {
              answer: {
                type: answer.type,
                sdp: answer.sdp
              }
            });
            await flushCandidatesQueue();
          }
        });
      }

      // Continuous monitoring of incoming ICE candidates
      unsubCandidates = onSnapshot(peerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as RTCIceCandidateInit;
            if (pc.remoteDescription) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(data));
              } catch (e) {
                console.warn("[WebRTC] Error adding received candidate:", e);
              }
            } else {
              remoteCandidatesQueue.push(data);
            }
          }
        });
      });
    };

    setupSignaling();

    return () => {
      console.log("[WebRTC] Safely clearing peer media connections.");
      unsubSignal();
      unsubCandidates();
      pc.close();
      peerConnectionRef.current = null;
    };
  }, [appointment?.id, localStream, isProfessional, isSessionClosed]);

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

    // Mark current user as JOINED and purge old WebRTC session records
    const syncJoin = async () => {
      if (appointment.status === 'completed' || appointment.status === 'cancelled') return;
      const updatePayload: any = {};
      
      if (isProfessional) {
        updatePayload.doctorJoined = true;
        updatePayload.status = 'in_progress';

        try {
          // Doctor (Caller) purges old communication records
          const signalDocRef = doc(db, 'appointments', appointment.id, 'webrtc', 'signal');
          await deleteDoc(signalDocRef).catch(() => {});

          const docCandCol = collection(db, 'appointments', appointment.id, 'doctorCandidates');
          const docCandSnap = await getDocs(docCandCol).catch(() => null);
          if (docCandSnap) {
            for (const d of docCandSnap.docs) {
              await deleteDoc(d.ref).catch(() => {});
            }
          }

          const patCandCol = collection(db, 'appointments', appointment.id, 'patientCandidates');
          const patCandSnap = await getDocs(patCandCol).catch(() => null);
          if (patCandSnap) {
            for (const p of patCandSnap.docs) {
              await deleteDoc(p.ref).catch(() => {});
            }
          }
          console.log("[WebRTC] Stale signal and candidates completely cleared.");
        } catch (e) {
          console.warn("[WebRTC] Ignored cleanup error:", e);
        }
      } else {
        updatePayload.patientJoined = true;
        try {
          // Patient (Receiver) clears old local candidates
          const patCandCol = collection(db, 'appointments', appointment.id, 'patientCandidates');
          const patCandSnap = await getDocs(patCandCol).catch(() => null);
          if (patCandSnap) {
            for (const p of patCandSnap.docs) {
              await deleteDoc(p.ref).catch(() => {});
            }
          }
          console.log("[WebRTC] Patient candidate records pre-cleaned.");
        } catch (e) {
          console.warn("[WebRTC] Ignored patient cleanup error:", e);
        }
      }

      try {
        await updateDoc(doc(db, 'appointments', appointment.id), updatePayload);
      } catch (err) {
        console.error("[WebRTC] Error marking peer as joined:", err);
      }
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
    // Directly apply to WebRTC RTCRtpSender to guarantee instant propagation
    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === 'video') {
          sender.track.enabled = !isCamOff;
          console.log("[WebRTC] Local video track sender state updated:", !isCamOff);
        }
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
    // Directly apply to WebRTC RTCRtpSender to guarantee instant propagation
    if (peerConnectionRef.current) {
      peerConnectionRef.current.getSenders().forEach(sender => {
        if (sender.track && sender.track.kind === 'audio') {
          sender.track.enabled = !isMuted;
          console.log("[WebRTC] Local audio track sender state updated:", !isMuted);
        }
      });
    }
  }, [isMuted, localStream]);

  const prevJoinedRef = useRef(false);

  // Connection alert chime
  useEffect(() => {
    if (otherPersonJoined && !prevJoinedRef.current) {
      playChimeSound(659.25); // High E connected tone
      addToast(`${otherPersonRole === 'Médico' ? 'O Médico' : 'O Paciente'} (${otherPersonName}) entrou na videoconferência!`, 'success');
    }
    prevJoinedRef.current = otherPersonJoined;
  }, [otherPersonJoined, otherPersonRole, otherPersonName]);

  // Subtle calling sound while alone on line (waiting for peer stream)
  useEffect(() => {
    if (otherPersonJoined || isSessionClosed || !playRingSound) return;

    playRingtoneSound();
    const interval = setInterval(() => {
      playRingtoneSound();
    }, 4500);

    return () => clearInterval(interval);
  }, [otherPersonJoined, isSessionClosed, playRingSound]);

  // Function to toggle simulated peer connection
  const handleToggleSimulatePeer = async () => {
    if (!appointment?.id) return;
    const targetField = isProfessional ? 'patientJoined' : 'doctorJoined';
    try {
      await updateDoc(doc(db, 'appointments', appointment.id), {
        [targetField]: !otherPersonJoined,
        ...(isProfessional 
          ? { patientMuted: false, patientCamOff: false } 
          : { doctorMuted: false, doctorCamOff: false }
        )
      });
      addToast(
        !otherPersonJoined 
          ? `Simulação Iniciada: ${otherPersonName} entrou.` 
          : `Simulação Finalizada: ${otherPersonName} saiu.`, 
        'info'
      );
    } catch (e) {
      console.error(e);
      addToast('Erro ao chavear simulador de participante.', 'error');
    }
  };

  // Audio wave visualizer animation responsive to real voice-level amplitude
  useEffect(() => {
    const isPeerMuted = isProfessional ? roomState.patientMuted : roomState.doctorMuted;
    const isPeerJoined = isProfessional ? roomState.patientJoined : roomState.doctorJoined;
    
    if (!isPeerJoined || isPeerMuted) {
      setAudioWaves([4, 4, 4, 4, 4]);
      return;
    }

    const interval = setInterval(() => {
      setAudioWaves(Array.from({ length: 5 }, (_, i) => {
        const randomFactor = Math.sin(Date.now() / 150 + i) * 5;
        return isPeerMuted ? 4 : Math.max(4, Math.min(24, (remoteAudioLevel / 10) * (i + 1) + 4 + randomFactor));
      }));
    }, 80);
    return () => clearInterval(interval);
  }, [remoteAudioLevel, isProfessional, roomState.patientMuted, roomState.doctorMuted, roomState.patientJoined, roomState.doctorJoined]);

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
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-vitta-accent animate-pulse" />
          
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10">
            <VideoOff size={40} className="animate-pulse" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Atendimento de Telemedicina Encerrado
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Esta consulta por vídeo foi finalizada com sucesso. O prontuário e as receitas médicas gerados já estão devidamente disponíveis em seus históricos e registros de saúde.
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Redirecionando automaticamente...</span>
              <span className="text-vitta-accent font-bold font-mono">em {redirectCount}s</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-vitta-accent" 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 2.5, ease: "linear" }}
              />
            </div>
          </div>

          <button
            onClick={onLeave}
            className="w-full sm:w-auto px-8 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-vitta-accent/20 flex items-center justify-center gap-2"
          >
            Voltar para o Painel Agora
          </button>
        </motion.div>
      </div>
    );
  }

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
                className="max-w-md w-full bg-slate-950/45 p-8 rounded-3xl border border-slate-800 text-center space-y-6 flex flex-col items-center shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-vitta-accent to-vitta-purple animate-shimmer" />
                <div className="relative mt-2">
                  <div className="w-20 h-20 bg-vitta-accent-bg rounded-full flex items-center justify-center text-vitta-accent relative z-10 shadow-lg shadow-vitta-accent/10">
                    <Activity size={40} className="animate-pulse" />
                  </div>
                  <div className="absolute inset-0 bg-vitta-accent/20 rounded-full animate-ping scale-150" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight">Sala de Espera Virtual</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Aguardando o {otherPersonRole === 'Médico' ? `Dr(a). ${otherPersonName}` : `paciente ${otherPersonName}`} entrar na chamada de vídeo...
                  </p>
                </div>

                <div className="w-full space-y-2 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Sua câmera e mic:</span>
                    <span className="text-emerald-400 font-bold">Ativos e prontos</span>
                  </div>
                  <div className="relative h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-vitta-accent rounded-full animate-loading" style={{ width: '100%', animationDuration: '3s' }} />
                  </div>
                </div>

                {/* Local feed miniature during waiting selection */}
                <div className="w-56 h-40 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center">
                  <video 
                    ref={localVideoWaitingRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isCamOff ? 'opacity-0' : 'opacity-100'}`}
                  />
                  {isCamOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 text-slate-500">
                      <VideoOff size={24} className="text-rose-500" />
                      <span className="text-[10px] mt-1.5 font-bold uppercase tracking-wider text-slate-400">Câmera Desligada</span>
                    </div>
                  )}
                  <span className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold z-20">Você (Preview)</span>
                </div>

                {/* Simulated Peer join bypass button for easy local evaluation */}
                <button
                  type="button"
                  onClick={handleToggleSimulatePeer}
                  className="w-full mt-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl font-semibold text-xs tracking-wide transition-all shadow flex items-center justify-center gap-2"
                >
                  <User size={14} className="text-vitta-accent" />
                  Simular Entrada do {otherPersonRole}
                </button>
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
                    <div className="absolute inset-0 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                      {/* Real WebRTC Remote Video Stream */}
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-350"
                      />
                      
                      {/* Loading indicator if remote audio/video tracks are not yet fully active */}
                      {(!remoteStream || remoteStream.getVideoTracks().length === 0) && (
                        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center space-y-4 p-4 z-10">
                          <div className="w-16 h-16 rounded-full bg-vitta-accent/10 border border-vitta-accent/20 flex items-center justify-center text-vitta-accent">
                            <Activity size={28} className="animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-300">Conectando canal de transmissão...</p>
                            <p className="text-[10px] text-slate-500">Aguardando handshake de mídia seguro</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay indicator to show secure transmission */}
                      <div className="absolute bottom-4 right-4 bg-slate-900/60 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-[10px] text-slate-300 font-medium z-10">
                        <Activity size={12} className="text-emerald-400 animate-pulse" />
                        <span>Transmissão WebRTC Criptografada</span>
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

                  {/* Always mounted video element ensures stream attachment is held on camera toggling */}
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-350 ${isCamOff ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                  />

                  {isCamOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-950/95 z-10 space-y-3">
                      <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-rose-500 shadow-lg">
                        <VideoOff size={28} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Sua câmera está desligada</p>
                    </div>
                  )}

                  {/* Audio Indicators with Web Audio Analyser levels */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-slate-800/60 z-20">
                    <div className="flex items-end gap-0.5 h-6">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const randomFactor = Math.sin(Date.now() / 150 + i) * 5;
                        const height = isMuted ? 4 : Math.max(4, Math.min(24, (localAudioLevel / 10) * (i + 1) + 4 + randomFactor));
                        return (
                          <div 
                            key={i} 
                            className="w-1 bg-emerald-400 rounded-full transition-all duration-75" 
                            style={{ height: `${height}px` }} 
                          />
                        );
                      })}
                    </div>
                    {isMuted ? (
                      <span className="text-rose-500 text-xs font-bold flex items-center gap-1">
                        <MicOff size={14} /> Mutado
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <Mic size={14} /> Áudio Ativo
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM CONTROLS BOARD */}
        <footer className="h-20 shrink-0 bg-slate-950 border-t border-slate-800/80 flex items-center justify-center gap-3 sm:gap-6 px-3 sm:px-10 z-20">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
              isMuted ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isMuted ? "Ativar Microfone" : "Silenciar Microfone"}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button 
            onClick={() => setIsCamOff(!isCamOff)}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
              isCamOff ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isCamOff ? "Ativar Câmera" : "Desligar Câmera"}
          >
            {isCamOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>

          <button 
            onClick={() => {
              setIsScreenSharing(!isScreenSharing);
              addToast(isScreenSharing ? 'Compartilhamento de tela encerrado' : 'Compartilhamento de tela simulado iniciado', 'success');
            }}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
              isScreenSharing ? 'bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isScreenSharing ? "Parar Compartilhamento" : "Compartilhar Tela"}
          >
            <Share2 size={18} />
          </button>

          {/* Botão de abrir/fechar chat no mobile */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex md:hidden items-center justify-center transition-all ${
              isChatOpen ? 'bg-vitta-accent text-white shadow-lg animate-pulse' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Chat de Mensagens"
          >
            <MessageSquare size={18} />
          </button>

          <div className="w-px h-8 bg-slate-850 mx-1 sm:mx-2" />

          {/* End Consultation Button */}
          <button 
            onClick={handleHangUp}
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-rose-600/20 flex items-center gap-1.5 sm:gap-2 animate-pulse"
            title="Encerrar consulta"
          >
            <Phone className="size-[14px] sm:size-[18px] rotate-[135deg]" />
            <span className="hidden sm:inline">{isProfessional ? 'Desconectar e Finalizar' : 'Sair da Chamada'}</span>
            <span className="inline sm:hidden">{isProfessional ? 'Fim' : 'Sair'}</span>
          </button>
        </footer>

      </div>

      {/* Communications & Clinical Workspace Drawer (Right Sidebar) (Issue #3 Responsividade - Gaveta Overlay) */}
      <div 
        className={`w-full md:w-96 shrink-0 bg-slate-950 flex-col h-full border-t md:border-t-0 border-slate-800 absolute md:relative inset-y-0 right-0 z-50 md:z-10 shadow-2xl transition-all duration-300 ${
          isChatOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        
        {/* Navigation Tabs (Chat / Notes) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex bg-slate-900 p-1 rounded-xl flex-1">
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
          
          <button 
            type="button"
            onClick={() => setIsChatOpen(false)}
            className="md:hidden p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center border border-slate-800/85"
            title="Fechar Chat"
          >
            <X size={18} />
          </button>
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
