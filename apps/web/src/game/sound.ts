import {
  DEFAULT_SOUNDTRACK_CATALOG,
  createSoundtrackPlaylist,
  advanceSoundtrackPlaylist,
  savePlaylistState,
  type FlightSoundtrack,
  type CelebrationTheme,
  type SoundtrackCatalog,
  type SoundtrackPlaylistState,
  type StorageLike,
} from "../domain/soundtrack-rotation";
import {
  CrossfadeController,
  DEFAULT_CROSSFADE_DURATION_MS,
  DEFAULT_SOUNDTRACK_VOLUME,
  type AudioChannel,
} from "../domain/crossfade";


export type SoundName = "star" | "bump" | "stumble" | "near-miss" | "rest" | "button" | "celebrate" | "chime" | "stamp";

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
  stamp: {
    frequencies: [587, 740, 880, 1175, 1480],
    type: "triangle",
    initialDelay: 0.04,
    stepDelay: 0.07,
    volume: 0.14,
    duration: 0.36,
  },
};

class HtmlAudioChannel implements AudioChannel {
  private readonly audio: HTMLAudioElement;

  constructor(src: string, loop: boolean) {
    this.audio = new Audio(src);
    this.audio.loop = loop;
    this.audio.preload = "none";
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  setMuted(muted: boolean): void {
    this.audio.muted = muted;
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  async play(): Promise<void> {
    this.audio.preload = "auto";
    await this.audio.play();
  }
}

class NullAudioChannel implements AudioChannel {
  setVolume(_v: number): void {}
  setMuted(_m: boolean): void {}
  stop(): void {}
  async play(): Promise<void> {}
}

export interface GameAudioOptions {
  readonly catalog?: SoundtrackCatalog;
  readonly storage?: StorageLike;
  readonly crossfadeDurationMs?: number;
  readonly baseVolume?: number;
  readonly channelFactory?: (src: string, loop: boolean) => AudioChannel;
}

export class GameAudio {
  private context: AudioContext | undefined;
  private master: GainNode | undefined;
  private fallbackTimer: number | undefined;
  private fallbackStep = 0;
  private enabled = true;

  private readonly catalog: SoundtrackCatalog;
  private readonly storage: StorageLike | undefined;
  private readonly crossfadeDurationMs: number;
  private readonly baseVolume: number;
  private readonly channelFactory: (src: string, loop: boolean) => AudioChannel;

  private playlistState: SoundtrackPlaylistState;
  private currentChannel: AudioChannel;
  private celebrationChannel: AudioChannel | undefined;
  private crossfadeController: CrossfadeController;
  private crossfadeTimer: number | undefined;
  private isCelebrating = false;
  private readonly preloadedTracks = new Set<string>();

  constructor(options?: GameAudioOptions) {
    this.catalog = options?.catalog ?? DEFAULT_SOUNDTRACK_CATALOG;
    this.storage = options?.storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
    this.crossfadeDurationMs = options?.crossfadeDurationMs ?? DEFAULT_CROSSFADE_DURATION_MS;
    this.baseVolume = options?.baseVolume ?? DEFAULT_SOUNDTRACK_VOLUME;

    if (options?.channelFactory) {
      this.channelFactory = options.channelFactory;
    } else if (typeof Audio !== "undefined") {
      this.channelFactory = (src, loop) => new HtmlAudioChannel(src, loop);
    } else {
      this.channelFactory = () => new NullAudioChannel();
    }

    this.playlistState = createSoundtrackPlaylist(this.catalog, { storage: this.storage });
    this.currentChannel = this.channelFactory(this.playlistState.currentTrack.src, true);
    this.crossfadeController = new CrossfadeController(this.currentChannel, {
      baseVolume: this.baseVolume,
      durationMs: this.crossfadeDurationMs,
    });
  }

  getCatalog(): SoundtrackCatalog {
    return this.catalog;
  }

  getActiveFlightTrack(): FlightSoundtrack {
    return this.playlistState.currentTrack;
  }

  getCelebrationTheme(): CelebrationTheme {
    return this.catalog.celebrationTheme;
  }

  getPlaylistState(): SoundtrackPlaylistState {
    return this.playlistState;
  }

  isCrossfading(): boolean {
    return this.crossfadeController.isCrossfading();
  }

  isCelebrationActive(): boolean {
    return this.isCelebrating;
  }

  async start(): Promise<void> {
    if (typeof AudioContext !== "undefined" && !this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.enabled ? 0.22 : 0;
      this.master.connect(this.context.destination);
    }
    if (this.context) {
      await this.context.resume();
    }

    this.crossfadeController.setMuted(!this.enabled);
    try {
      await this.currentChannel.play();
    } catch {
      this.startFallbackSoundtrack();
    }

    this.preloadSecondaryTracks();
    if (this.storage) {
      savePlaylistState(this.playlistState, this.storage);
    }
  }

  private preloadTrack(src: string): void {
    if (typeof Audio === "undefined" || this.preloadedTracks.has(src)) return;
    this.preloadedTracks.add(src);
    const preloadAudio = new Audio(src);
    preloadAudio.preload = "auto";
  }

  preloadSecondaryTracks(): void {
    const loadLazily = (): void => {
      for (const track of this.catalog.flightTracks) {
        if (track.id !== this.playlistState.currentTrack.id) {
          this.preloadTrack(track.src);
        }
      }
      this.preloadTrack(this.catalog.celebrationTheme.src);
    };

    if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(() => loadLazily());
    } else {
      setTimeout(loadLazily, 1000);
    }
  }


  async crossfadeToCelebration(): Promise<void> {
    if (this.isCelebrating) return;
    this.isCelebrating = true;

    if (!this.celebrationChannel) {
      this.celebrationChannel = this.channelFactory(this.catalog.celebrationTheme.src, true);
    }

    if (this.fallbackTimer !== undefined) {
      window.clearInterval(this.fallbackTimer);
      this.fallbackTimer = undefined;
    }

    this.crossfadeController.startCrossfade(this.celebrationChannel, this.crossfadeDurationMs);
    this.currentChannel = this.celebrationChannel;
    this.startCrossfadeLoop();
  }

  async advanceToNextJourney(): Promise<FlightSoundtrack> {
    this.playlistState = advanceSoundtrackPlaylist(this.playlistState);
    if (this.storage) {
      savePlaylistState(this.playlistState, this.storage);
    }

    const nextTrack = this.playlistState.currentTrack;
    const nextChannel = this.channelFactory(nextTrack.src, true);

    this.crossfadeController.startCrossfade(nextChannel, this.crossfadeDurationMs);
    this.currentChannel = nextChannel;
    this.isCelebrating = false;
    this.startCrossfadeLoop();

    return nextTrack;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(enabled ? 0.22 : 0, this.context.currentTime, 0.04);
    }
    this.crossfadeController.setMuted(!enabled);
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

  private startCrossfadeLoop(): void {
    if (this.crossfadeTimer !== undefined) return;
    let lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const interval = typeof window !== "undefined" ? window.setInterval : setInterval;
    const clear = typeof window !== "undefined" ? window.clearInterval : clearInterval;

    this.crossfadeTimer = interval(() => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const delta = now - lastTime;
      lastTime = now;
      const finished = this.crossfadeController.update(delta);
      if (finished) {
        if (this.crossfadeTimer !== undefined) {
          clear(this.crossfadeTimer);
          this.crossfadeTimer = undefined;
        }
      }
    }, 30) as unknown as number;
  }

  private startFallbackSoundtrack(): void {
    if (this.fallbackTimer !== undefined) return;
    const melody = [523, 659, 784, 659, 587, 698, 880, 698, 659, 784, 988, 784, 587, 659, 784, 523];
    this.fallbackTimer = window.setInterval(() => {
      if (this.enabled) {
        const frequency = melody[this.fallbackStep % melody.length] ?? 523;
        this.tone(frequency, 0, "sine", .035, .38);
        if (this.fallbackStep % 4 === 0) this.tone(frequency / 2, 0, "triangle", .022, .72);
        this.fallbackStep += 1;
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

