export type SoundName = "star" | "bump" | "stumble" | "near-miss" | "rest" | "button" | "celebrate" | "chime";

export const PENTATONIC_SCALE = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.50, // C6
  1174.66, // D6
  1318.51, // E6
  1567.98, // G6
  1760.00, // A6
] as const;

interface SoundProfile {
  frequencies: readonly number[];
  type: OscillatorType;
  initialDelay: number;
  stepDelay: number;
  volume: number;
  duration: number;
}

const SOUND_PROFILES: Record<SoundName, SoundProfile> = {
  star: {
    frequencies: [659, 784, 988],
    type: "triangle",
    initialDelay: 0.1,
    stepDelay: 0.1,
    volume: 0.11,
    duration: 0.24,
  },
  bump: {
    frequencies: [220, 185],
    type: "sine",
    initialDelay: 0.1,
    stepDelay: 0.1,
    volume: 0.11,
    duration: 0.24,
  },
  stumble: {
    frequencies: [246, 220, 185],
    type: "sine",
    initialDelay: 0.08,
    stepDelay: 0.09,
    volume: 0.12,
    duration: 0.22,
  },
  "near-miss": {
    frequencies: [1047, 1318, 1568, 2093],
    type: "triangle",
    initialDelay: 0.03,
    stepDelay: 0.05,
    volume: 0.07,
    duration: 0.18,
  },
  rest: {
    frequencies: [523, 440, 392],
    type: "triangle",
    initialDelay: 0.1,
    stepDelay: 0.1,
    volume: 0.11,
    duration: 0.24,
  },
  button: {
    frequencies: [523, 659],
    type: "triangle",
    initialDelay: 0.1,
    stepDelay: 0.1,
    volume: 0.11,
    duration: 0.24,
  },
  celebrate: {
    frequencies: [523, 659, 784, 1047],
    type: "triangle",
    initialDelay: 0.1,
    stepDelay: 0.1,
    volume: 0.11,
    duration: 0.24,
  },
  chime: {
    frequencies: [587, 880, 1175, 1760],
    type: "sine",
    initialDelay: 0.02,
    stepDelay: 0.06,
    volume: 0.13,
    duration: 0.42,
  },
};

export class GameAudio {
  private context: AudioContext | undefined;
  private master: GainNode | undefined;
  private musicTimer: number | undefined;
  private soundtrack: HTMLAudioElement | undefined;
  private musicStep = 0;
  private enabled = true;

  async start(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.enabled ? 0.22 : 0;
      this.master.connect(this.context.destination);
    }
    await this.context.resume();
    if (!this.soundtrack) {
      this.soundtrack = new Audio("/assets/audio/birthday-flight.mp3");
      this.soundtrack.loop = true;
      this.soundtrack.preload = "auto";
      this.soundtrack.volume = .46;
    }
    this.soundtrack.muted = !this.enabled;
    try {
      await this.soundtrack.play();
    } catch {
      this.startMusic();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(enabled ? 0.22 : 0, this.context.currentTime, 0.04);
    }
    if (this.soundtrack) this.soundtrack.muted = !enabled;
  }

  isEnabled(): boolean { return this.enabled; }

  play(name: SoundName): void {
    if (!this.context || !this.master || !this.enabled) return;
    const profile = SOUND_PROFILES[name];
    if (!profile) return;
    profile.frequencies.forEach((frequency, index) =>
      this.tone(
        frequency,
        profile.initialDelay + index * profile.stepDelay,
        profile.type,
        profile.volume,
        profile.duration
      )
    );
  }

  playSparkle(step: number): void {
    if (!this.context || !this.master || !this.enabled) return;
    const noteIndex = Math.max(0, step) % PENTATONIC_SCALE.length;
    const frequency = PENTATONIC_SCALE[noteIndex] ?? 523.25;
    this.tone(frequency, 0, "sine", 0.13, 0.38);
    this.tone(frequency * 2, 0.012, "triangle", 0.05, 0.26);
  }

  private startMusic(): void {
    if (this.musicTimer !== undefined) return;
    const melody = [523, 659, 784, 659, 587, 698, 880, 698, 659, 784, 988, 784, 587, 659, 784, 523];
    this.musicTimer = window.setInterval(() => {
      if (this.enabled) {
        const frequency = melody[this.musicStep % melody.length] ?? 523;
        this.tone(frequency, 0, "sine", .035, .38);
        if (this.musicStep % 4 === 0) this.tone(frequency / 2, 0, "triangle", .022, .72);
        this.musicStep += 1;
      }
    }, 420);
  }

  private tone(frequency: number, delay: number, type: OscillatorType, volume: number, duration = .24): void {
    if (!this.context || !this.master) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }
}
