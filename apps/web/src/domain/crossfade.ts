export interface EqualPowerGains {
  readonly outgoingGain: number;
  readonly incomingGain: number;
}

export interface AudioChannel {
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  stop(): void;
  play(): Promise<void> | void;
}

export interface CrossfadeOptions {
  readonly baseVolume?: number;
  readonly durationMs?: number;
}

export const DEFAULT_CROSSFADE_DURATION_MS = 1500;
export const DEFAULT_SOUNDTRACK_VOLUME = 0.46;


/**
 * Calculates equal-power crossfade gains for a given progress in [0, 1].
 * Uses cosine/sine curves: g_out = cos(p * pi/2), g_in = sin(p * pi/2).
 * Preserves perceived acoustic energy: g_out^2 + g_in^2 = 1.
 */
export function calculateEqualPowerGains(
  progress: number,
  maxVolume = 1.0
): EqualPowerGains {
  const clamped = Math.max(0, Math.min(1, progress));
  const angle = clamped * (Math.PI / 2);
  const outgoingGain = maxVolume * Math.cos(angle);
  const incomingGain = maxVolume * Math.sin(angle);

  return { outgoingGain, incomingGain };
}

export class CrossfadeController {
  private activeChannel: AudioChannel;
  private incomingChannel: AudioChannel | undefined;
  private isCrossfadingState = false;
  private elapsedMs = 0;
  private durationMs: number;
  private readonly baseVolume: number;
  private muted = false;

  constructor(initialChannel: AudioChannel, options?: CrossfadeOptions) {
    this.activeChannel = initialChannel;
    this.baseVolume = options?.baseVolume ?? DEFAULT_SOUNDTRACK_VOLUME;
    this.durationMs = options?.durationMs ?? DEFAULT_CROSSFADE_DURATION_MS;

  }

  isCrossfading(): boolean {
    return this.isCrossfadingState;
  }

  getActiveChannel(): AudioChannel {
    return this.activeChannel;
  }

  getIncomingChannel(): AudioChannel | undefined {
    return this.incomingChannel;
  }

  startCrossfade(incoming: AudioChannel, durationMs?: number): void {
    if (this.isCrossfadingState && this.incomingChannel) {
      this.activeChannel.stop();
      this.activeChannel = this.incomingChannel;
    }

    this.incomingChannel = incoming;
    this.isCrossfadingState = true;
    this.elapsedMs = 0;
    if (durationMs !== undefined) {
      this.durationMs = durationMs;
    }

    incoming.setMuted(this.muted);
    incoming.setVolume(0);
    const playResult = incoming.play();
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch(() => {});
    }

    this.applyGains(0);
  }

  update(deltaMs: number): boolean {
    if (!this.isCrossfadingState || !this.incomingChannel) return false;

    this.elapsedMs += deltaMs;
    const progress = Math.min(1, this.elapsedMs / this.durationMs);
    this.applyGains(progress);

    if (progress >= 1) {
      this.activeChannel.stop();
      this.activeChannel = this.incomingChannel;
      this.incomingChannel = undefined;
      this.isCrossfadingState = false;
      return true;
    }

    return false;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.activeChannel.setMuted(muted);
    if (this.incomingChannel) {
      this.incomingChannel.setMuted(muted);
    }
    const progress = this.isCrossfadingState ? Math.min(1, this.elapsedMs / this.durationMs) : 1;
    this.applyGains(this.isCrossfadingState ? progress : 1);
  }

  isMuted(): boolean {
    return this.muted;
  }

  private applyGains(progress: number): void {
    if (this.muted) {
      this.activeChannel.setVolume(0);
      if (this.incomingChannel) {
        this.incomingChannel.setVolume(0);
      }
      return;
    }

    if (!this.isCrossfadingState) {
      this.activeChannel.setVolume(this.baseVolume);
      return;
    }

    const { outgoingGain, incomingGain } = calculateEqualPowerGains(progress, this.baseVolume);
    this.activeChannel.setVolume(outgoingGain);
    if (this.incomingChannel) {
      this.incomingChannel.setVolume(incomingGain);
    }
  }
}

