/**
 * Tiny Web Audio synthesizer — no audio files to ship or load.
 * The AudioContext is created lazily on first use (after a user gesture).
 */

export type SoundName = 'correct' | 'wrong' | 'badge' | 'start' | 'rotate';

interface Note {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  slideTo?: number;
}

const PATCHES: Record<SoundName, Note[]> = {
  correct: [
    { freq: 880, start: 0, duration: 0.09, type: 'triangle', gain: 0.22 },
    { freq: 1318.5, start: 0.06, duration: 0.14, type: 'triangle', gain: 0.18 },
  ],
  wrong: [
    { freq: 220, start: 0, duration: 0.28, type: 'sawtooth', gain: 0.12, slideTo: 110 },
    { freq: 110, start: 0, duration: 0.32, type: 'square', gain: 0.05, slideTo: 70 },
  ],
  badge: [
    { freq: 523.25, start: 0, duration: 0.12, type: 'triangle', gain: 0.2 },
    { freq: 659.25, start: 0.1, duration: 0.12, type: 'triangle', gain: 0.2 },
    { freq: 783.99, start: 0.2, duration: 0.12, type: 'triangle', gain: 0.2 },
    { freq: 1046.5, start: 0.3, duration: 0.35, type: 'triangle', gain: 0.22 },
  ],
  start: [
    { freq: 392, start: 0, duration: 0.08, type: 'sine', gain: 0.2 },
    { freq: 587.33, start: 0.08, duration: 0.14, type: 'sine', gain: 0.2 },
  ],
  rotate: [{ freq: 300, start: 0, duration: 0.3, type: 'sine', gain: 0.14, slideTo: 600 }],
};

class SoundEngine {
  private ctx: AudioContext | null = null;

  private context(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  play(name: SoundName): void {
    const ctx = this.context();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const note of PATCHES[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = now + note.start;
      const t1 = t0 + note.duration;
      osc.type = note.type ?? 'sine';
      osc.frequency.setValueAtTime(note.freq, t0);
      if (note.slideTo) osc.frequency.exponentialRampToValueAtTime(note.slideTo, t1);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(note.gain ?? 0.2, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t1 + 0.02);
    }
  }
}

export const soundEngine = new SoundEngine();
