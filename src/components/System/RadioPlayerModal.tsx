import React, { useState, useEffect, useRef } from "react";
import {
  Radio,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  X,
  Music,
  RadioTower,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { ViTTARadioEngine } from "../../lib/radioAudioEngine";

interface RadioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RadioPlayerModal: React.FC<RadioPlayerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMode, setPlayMode] = useState<"stream" | "synth">("stream");
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
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

  // Listen to live radio configuration from Firebase
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

  useEffect(() => {
    if (isOpen) {
      if (engineRef.current) {
        engineRef.current
          .play(radioConfig.url)
          .then((res) => {
            setIsPlaying(true);
            setPlayMode(res.mode);
          })
          .catch(() => setIsPlaying(false));
      }
    } else {
      if (engineRef.current) {
        engineRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-vitta-surface border border-vitta-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative"
      >
        {/* Decorative ambient header */}
        <div className="relative p-6 bg-gradient-to-br from-amber-500/20 via-vitta-accent/15 to-purple-600/20 border-b border-vitta-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Radio size={24} className={isPlaying ? "animate-pulse" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-vitta-text-primary tracking-tight">
                  Rádio ViTTA FM
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {playMode === "synth" ? "AMBIENT HQ" : "NO AR"}
                </span>
              </div>
              <p className="text-xs text-vitta-text-muted">A trilha sonora da sua saúde</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-vitta-text-muted hover:text-vitta-text-primary rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Player Body */}
        <div className="p-6 space-y-6">
          {/* Current Track / Show Info */}
          <div className="p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border space-y-2 text-center">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
              {playMode === "synth" ? "Modo Terapêutico 432Hz" : "Programa em Transmissão"}
            </span>
            <h4 className="font-bold text-sm text-vitta-text-primary">
              {radioConfig.currentShow || "Programação Musical & Dicas de Saúde"}
            </h4>
            <p className="text-xs text-vitta-text-secondary">
              {radioConfig.upNextMessage || "Fique conectado para os melhores conteúdos médicos."}
            </p>
          </div>

          {/* Dynamic Audio Visualizer Bars */}
          <div className="flex items-center justify-center gap-1.5 h-12 px-4 py-2 bg-vitta-surface-2/60 rounded-2xl border border-vitta-border/60">
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.div
                key={i}
                animate={
                  isPlaying
                    ? {
                        height: [
                          `${10 + ((i * 7) % 25)}px`,
                          `${36 - ((i * 5) % 20)}px`,
                          `${12 + ((i * 11) % 30)}px`,
                        ],
                      }
                    : { height: "6px" }
                }
                transition={
                  isPlaying
                    ? {
                        duration: 0.6 + (i % 4) * 0.15,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }
                    : {}
                }
                className={`w-1.5 rounded-full transition-all ${
                  isPlaying
                    ? "bg-gradient-to-t from-amber-500 to-vitta-accent shadow-sm shadow-amber-500/20"
                    : "bg-vitta-border"
                }`}
              />
            ))}
          </div>

          {/* Central Play / Pause Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-500 to-vitta-accent text-white flex items-center justify-center shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause size={26} /> : <Play size={26} className="ml-1" />}
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3 px-2">
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
              className="w-full accent-vitta-accent h-1.5 bg-vitta-surface-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-vitta-surface-2 border-t border-vitta-border flex justify-between items-center text-[11px] text-vitta-text-muted">
          <span className="flex items-center gap-1">
            <RadioTower size={12} className="text-amber-500" />
            Transmissão Digital ViTTA FM
          </span>
          <button
            onClick={onClose}
            className="font-bold text-vitta-text-primary hover:text-vitta-accent transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default RadioPlayerModal;
