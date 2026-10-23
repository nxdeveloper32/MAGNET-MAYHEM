// Procedural Web Audio API synthesizer for Magnet Mayhem

class MagnetAudioEngine {
  private ctx: AudioContext | null = null;
  private pullOsc: OscillatorNode | null = null;
  private pullGain: GainNode | null = null;
  private enabled = true;
  private masterVolume = 0.75;
  private lastClankTime = 0;

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          return null;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public configure(enabled: boolean, volume: number): void {
    this.enabled = enabled;
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (!enabled) {
      this.stopPullHum();
    }
  }

  public startPullHum(clusterCount = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const targetFreq = 95 + Math.min(8, clusterCount) * 14;
    if (!this.pullOsc || !this.pullGain) {
      try {
        this.pullOsc = ctx.createOscillator();
        this.pullGain = ctx.createGain();
        this.pullOsc.type = 'sawtooth';
        this.pullOsc.frequency.setValueAtTime(targetFreq, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(340, ctx.currentTime);

        this.pullGain.gain.setValueAtTime(0.001, ctx.currentTime);
        this.pullGain.gain.exponentialRampToValueAtTime(0.08 * this.masterVolume, ctx.currentTime + 0.08);

        this.pullOsc.connect(filter);
        filter.connect(this.pullGain);
        this.pullGain.connect(ctx.destination);
        this.pullOsc.start();
      } catch {
        this.pullOsc = null;
        this.pullGain = null;
      }
    } else {
      this.pullOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.06);
    }
  }

  public stopPullHum(): void {
    if (this.pullOsc && this.pullGain && this.ctx) {
      try {
        this.pullGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.03);
        this.pullOsc.stop(this.ctx.currentTime + 0.06);
      } catch {
        // ignore
      }
    }
    this.pullOsc = null;
    this.pullGain = null;
  }

  public playPushPulse(blastedCount = 1): void {
    this.stopPullHum();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const startFreq = 190 + Math.min(6, blastedCount) * 20;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.24);

    gain.gain.setValueAtTime(0.28 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.27);
  }

  public playMetalClank(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastClankTime < 0.055) return;
    this.lastClankTime = now;

    const pitchVar = 0.92 + Math.random() * 0.16;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520 * pitchVar, now);
    osc.frequency.exponentialRampToValueAtTime(180 * pitchVar, now + 0.075);

    gain.gain.setValueAtTime(0.11 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  public playTargetShatter(combo = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const baseNote = 330 * Math.pow(1.06, Math.min(12, combo));

    [1, 1.25, 1.5].forEach((mult, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseNote * mult, now + idx * 0.035);
      gain.gain.setValueAtTime(0.18 * this.masterVolume, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.23);
    });
  }

  public playGlassBreak(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1180, 1480].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.02);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.16);
      gain.gain.setValueAtTime(0.15 * this.masterVolume, now + i * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.02);
      osc.stop(now + 0.19);
    });
  }

  public playCrystalPickup(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.16 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playPlayerHurt(): void {
    this.stopPullHum();
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(55, now + 0.3);
    gain.gain.setValueAtTime(0.28 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.33);
  }

  public playOutcomeSting(victory: boolean): void {
    this.stopPullHum();
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = victory ? [440, 554.37, 659.25, 880] : [330, 293.66, 246.94, 185];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = victory ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.2 * this.masterVolume, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.34);
    });
  }
}

export const soundFX = new MagnetAudioEngine();
