import React, { useState, useEffect, useRef } from "react";
import {
  Radio,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  Music,
  RadioTower,
  Headphones,
  Heart,
  Share2,
  ListMusic,
  Clock,
  Mic2,
} from "lucide-react";
import { motion } from "motion/react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";
import { ViTTARadioEngine } from "../../lib/radioAudioEngine";

export const RadioView: React.FC = () => {
  const { addToast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<"stream" | "synth">("stream");
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [radioConfig, setRadioConfig] = useState<{
    url: string;
    currentShow: string;
    upNextMessage: string;
  }>({
    url: "https://icecast.walmradio.com:8000/jazz",
    currentShow: "ViTTA Saúde & Bem-Estar ao Vivo",
    upNextMessage: "A seguir: Dicas de Nutrição & Saúde Preventiva",
  });

  const engineRef = useRef<ViTTARadioEngine | null>(null);

  useEffect(() => {
    engineRef.current = new ViTTARadioEngine(radioConfig.url ? [radioConfig.url] : []);
    engineRef.current.onStateChange((playing, mode) => {
      setIsPlaying(playing);
      setPlayMode(mode);
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "radio"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const url = data.url || "https://icecast.walmradio.com:8000/jazz";
        setRadioConfig({
          url,
          currentShow: data.currentShow || "ViTTA Saúde & Bem-Estar ao Vivo",
          upNextMessage: data.upNextMessage || "A seguir: Dicas de Nutrição & Saúde Preventiva",
        });
        if (engineRef.current && url) {
          engineRef.current.setStreams([url]);
        }
      }
    });

    return () => unsub();
  }, []);

  const togglePlay = async () => {
    if (!engineRef.current) return;
    if (isPlaying) {
      engineRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        const res = await engineRef.current.play(radioConfig.url);
        setIsPlaying(true);
        setPlayMode(res.mode);
        if (res.mode === "synth") {
          addToast("Sintonizado no Modo Ambient Relaxante ViTTA 432Hz.", "info");
        }
      } catch (e) {
        console.warn("Playback handled gracefully:", e);
      }
    }
  };

  const toggleMute = () => {
    if (!engineRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    engineRef.current.setMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (engineRef.current) {
      engineRef.current.setVolume(newVol);
      setIsMuted(newVol === 0);
    }
  };

  const scheduleTracks = [
    { time: "08:00 - 10:00", name: "Manhã Saudável & Energética", host: "Dra. Juliana Mendes" },
    { time: "10:00 - 12:00", name: "Consultório Aberto: Dúvidas Clínicas", host: "Dr. Roberto Silva" },
    { time: "12:00 - 14:00", name: "Lounge Relax & Foco Produtivo", host: "ViTTA Music Selection" },
    { time: "14:00 - 17:00", name: "Saúde Mental & Qualidade de Vida", host: "Psicóloga Carla Rocha" },
    { time: "17:00 - 20:00", name: "Boa Noite ViTTA: Notícias Médicas & Bem-Estar", host: "Equipe ViTTA" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-rose-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl">
              <Radio size={40} className={isPlaying ? "animate-pulse text-white" : "text-white/90"} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">Rádio ViTTA FM</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white shadow-md">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  {playMode === "synth" ? "AMBIENT HQ" : "NO AR"}
                </span>
              </div>
              <p className="text-white/85 text-xs md:text-sm max-w-lg">
                Sua estação digital de música relaxante, podcasts com médicos especialistas e as principais orientações de saúde preventiva.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                addToast("Link da Rádio ViTTA copiado!", "success");
              }
            }}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-sm cursor-pointer"
          >
            <Share2 size={15} />
            Compartilhar Estação
          </button>
        </div>
      </div>

      {/* Main Player & Equalizer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Card */}
        <div className="lg:col-span-2 bg-vitta-surface border border-vitta-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-vitta-border pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                <RadioTower size={16} />
                <span>
                  {playMode === "synth"
                    ? "FREQUÊNCIA DE BEM-ESTAR 432Hz (ESTÉREO)"
                    : "TRANSMISSÃO AO VIVO (HQ STEREO)"}
                </span>
              </div>
              <span className="text-[11px] font-mono text-vitta-text-muted">
                {playMode === "synth" ? "WebAudio Hi-Fi" : "128 kbps HQ"}
              </span>
            </div>

            {/* Current Show Info */}
            <div className="my-6 text-center space-y-2">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                Programa Atual
              </span>
              <h3 className="text-xl md:text-2xl font-black text-vitta-text-primary tracking-tight">
                {radioConfig.currentShow}
              </h3>
              <p className="text-xs text-vitta-text-secondary max-w-md mx-auto">
                {radioConfig.upNextMessage}
              </p>
            </div>

            {/* Dynamic Equalizer */}
            <div className="flex items-center justify-center gap-2 h-20 px-6 py-3 bg-vitta-surface-2 rounded-2xl border border-vitta-border">
              {Array.from({ length: 24 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={
                    isPlaying
                      ? {
                          height: [
                            `${8 + ((i * 11) % 40)}px`,
                            `${58 - ((i * 7) % 35)}px`,
                            `${14 + ((i * 13) % 48)}px`,
                          ],
                        }
                      : { height: "6px" }
                  }
                  transition={
                    isPlaying
                      ? {
                          duration: 0.5 + (i % 5) * 0.12,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut",
                        }
                      : {}
                  }
                  className={`w-2 rounded-full transition-all ${
                    isPlaying
                      ? "bg-gradient-to-t from-amber-500 via-rose-500 to-vitta-accent shadow-sm"
                      : "bg-vitta-border"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="pt-4 border-t border-vitta-border flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
              </button>
              <div>
                <p className="font-bold text-sm text-vitta-text-primary">
                  {isPlaying ? "Reproduzindo Ao Vivo" : "Pausado"}
                </p>
                <p className="text-[11px] text-vitta-text-muted">
                  {isPlaying
                    ? playMode === "synth"
                      ? "Música Terapêutica ViTTA 432Hz"
                      : "Sintonizado na ViTTA FM"
                    : "Clique no play para ouvir"}
                </p>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 w-full sm:w-48 bg-vitta-surface-2 px-3.5 py-2.5 rounded-2xl border border-vitta-border">
              <button
                onClick={toggleMute}
                className="text-vitta-text-muted hover:text-vitta-text-primary transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full accent-amber-500 h-1.5 bg-vitta-surface rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Schedule & Highlights Sidebar */}
        <div className="bg-vitta-surface border border-vitta-border rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <ListMusic size={18} className="text-amber-500" />
            <h3 className="font-bold text-sm text-vitta-text-primary">Grade de Programação</h3>
          </div>

          <div className="space-y-3">
            {scheduleTracks.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-vitta-surface-2 rounded-2xl border border-vitta-border space-y-1 hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock size={11} />
                    {item.time}
                  </span>
                  {idx === 0 && isPlaying && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Agora
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-xs text-vitta-text-primary">{item.name}</h4>
                <p className="text-[11px] text-vitta-text-muted flex items-center gap-1">
                  <Mic2 size={11} />
                  {item.host}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-500/10 to-rose-500/10 rounded-2xl border border-amber-500/20 text-center space-y-1.5">
            <Sparkles size={16} className="text-amber-500 mx-auto" />
            <h5 className="font-bold text-xs text-vitta-text-primary">Tem uma sugestão de tema?</h5>
            <p className="text-[11px] text-vitta-text-muted">
              Envie sua dúvida médica ou tema para nossa equipe pelo Chat de Suporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadioView;
