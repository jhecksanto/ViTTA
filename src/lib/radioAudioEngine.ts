// Audio Engine for ViTTA FM Radio with resilient streaming & Web Audio Wellness Ambient Synthesizer
// Provides zero-error audio playback even in strict sandboxes or when remote streams are offline

export const DEFAULT_RADIO_STREAMS = [
  "https://icecast.walmradio.com:8000/jazz",
  "https://stream.zeno.fm/f3wvbbqmdg8uv",
  "https://streaming.radiosenna.com:8000/stream",
  "https://listen.181fm.com/181-classical_128k.mp3",
];

export class ViTTARadioEngine {
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isSynthPlaying: boolean = false;
  private synthInterval: any = null;
  private masterGain: GainNode | null = null;
  private streamIndex: number = 0;
  private streams: string[] = [];
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private onStateChangeCallback?: (isPlaying: boolean, mode: 'stream' | 'synth') => void;

  constructor(customStreams: string[] = []) {
    this.streams = [...customStreams.filter(Boolean), ...DEFAULT_RADIO_STREAMS];
    if (typeof window !== "undefined") {
      this.audio = new Audio();
      this.audio.crossOrigin = "anonymous";
      this.audio.preload = "none";
    }
  }

  public setStreams(customStreams: string[]) {
    this.streams = [...customStreams.filter(Boolean), ...DEFAULT_RADIO_STREAMS];
  }

  public onStateChange(cb: (isPlaying: boolean, mode: 'stream' | 'synth') => void) {
    this.onStateChangeCallback = cb;
  }

  public async play(preferCustomUrl?: string): Promise<{ mode: 'stream' | 'synth' }> {
    const streamList = preferCustomUrl ? [preferCustomUrl, ...this.streams] : this.streams;

    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }

    // Try live streams sequentially
    for (let i = 0; i < streamList.length; i++) {
      const url = streamList[i];
      if (!url) continue;

      try {
        if (!this.audio) this.audio = new Audio();
        this.audio.src = url;
        await this.audio.play();
        this.isSynthPlaying = false;
        this.stopSynth();
        if (this.onStateChangeCallback) this.onStateChangeCallback(true, 'stream');
        return { mode: 'stream' };
      } catch (err) {
        // Stream failed or blocked, try next
        console.warn(`[ViTTA Radio] Stream ${url} unavailable, trying fallback...`, err);
      }
    }

    // If external streaming failed or was blocked by browser sandbox, activate soothing Web Audio ambient engine
    this.startWellnessSynth();
    if (this.onStateChangeCallback) this.onStateChangeCallback(true, 'synth');
    return { mode: 'synth' };
  }

  public pause() {
    if (this.audio) {
      try {
        this.audio.pause();
      } catch (e) {
        // ignore
      }
    }
    this.stopSynth();
    if (this.onStateChangeCallback) this.onStateChangeCallback(false, 'stream');
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.25, this.audioCtx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.setVolume(this.volume);
  }

  // High-fidelity generative ambient wellness sound (432Hz tuned soothing chords)
  private startWellnessSynth() {
    if (this.isSynthPlaying) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume * 0.25, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      this.isSynthPlaying = true;

      // Pentatonic / healing frequencies in Hz (C Major 9 / 432Hz ambient tuning)
      const chords = [
        [261.63, 329.63, 392.0, 493.88, 587.33], // Cmaj9
        [220.0, 261.63, 329.63, 392.0, 440.0],  // Am7
        [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj7
        [196.0, 246.94, 293.66, 392.0, 440.0],  // Gsus4
      ];

      let chordIndex = 0;

      const playChord = () => {
        if (!this.isSynthPlaying || !this.audioCtx || !this.masterGain) return;
        const currentChord = chords[chordIndex % chords.length];
        chordIndex++;

        currentChord.forEach((freq, idx) => {
          if (!this.audioCtx || !this.masterGain) return;
          const osc = this.audioCtx.createOscillator();
          const noteGain = this.audioCtx.createGain();
          const panner = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;

          osc.type = idx % 2 === 0 ? "sine" : "triangle";
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

          const now = this.audioCtx.currentTime;
          const duration = 5.5 + Math.random() * 2;

          noteGain.gain.setValueAtTime(0, now);
          noteGain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + 1.8 + idx * 0.2);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          if (panner) {
            panner.pan.setValueAtTime((idx - 2) * 0.4, now);
            osc.connect(noteGain);
            noteGain.connect(panner);
            panner.connect(this.masterGain);
          } else {
            osc.connect(noteGain);
            noteGain.connect(this.masterGain);
          }

          osc.start(now + idx * 0.15);
          osc.stop(now + duration + 0.1);
        });
      };

      playChord();
      this.synthInterval = setInterval(playChord, 5000);
    } catch (e) {
      console.warn("[ViTTA Radio] Ambient synth fallback initialization:", e);
    }
  }

  private stopSynth() {
    this.isSynthPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.masterGain && this.audioCtx) {
      try {
        this.masterGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.5);
      } catch (e) {
        // ignore
      }
    }
  }

  public destroy() {
    this.pause();
    if (this.audio) {
      this.audio.src = "";
      this.audio = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {
        // ignore
      }
      this.audioCtx = null;
    }
  }
}
