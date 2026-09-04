type SoundName = "star" | "bump" | "stumble" | "near-miss" | "rest" | "button" | "celebrate";

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
    const notes: Record<SoundName, readonly number[]> = {
      star: [659, 784, 988],
      bump: [220, 185],
      stumble: [246, 220, 185],
      "near-miss": [1047, 1318, 1568, 2093],
      rest: [523, 440, 392],
      button: [523, 659],
      celebrate: [523, 659, 784, 1047],
    };
    const isWobble = name === "bump" || name === "stumble";
    const isNearMiss = name === "near-miss";
    notes[name].forEach((frequency, index) =>
      this.tone(
        frequency,
        (isNearMiss ? 0.03 : 0.1) + index * (isNearMiss ? 0.05 : 0.1),
        isWobble ? "sine" : "triangle",
        isNearMiss ? 0.07 : 0.11,
        isNearMiss ? 0.18 : 0.24
      )
    );
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
