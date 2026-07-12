/**
 * empire/audio-engine.js
 *
 * Elevator mechanical sound effects — motor hum, pneumatic brake hiss, and a
 * door chime — synthesized at runtime with the Web Audio API (oscillators +
 * filtered noise) rather than loaded audio files, since no licensed sound
 * assets exist in this repo. This is a separate, short-lived SFX layer from
 * empire/fallbacks/AudioFallback.js, which generates a per-floor *ambient
 * background loop* via Tone.js — that module keeps playing once a floor
 * loads; this one only fires around elevator door transitions.
 *
 * The AudioContext is created lazily on first use (not at module load) so
 * sound only ever starts inside a real user-gesture call stack (clicking a
 * floor button), per browser autoplay policy — never resumed proactively.
 */

export class ElevatorAudio {
  constructor() {
    this.ctx = null;
    this.humNode = null;
  }

  _ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  playChime() {
    const ctx = this._ensureContext();
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = now + i * 0.18;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.18, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
  }

  playBrakeHiss() {
    const ctx = this._ensureContext();
    const duration = 0.35;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2200;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  }

  startHum() {
    if (this.humNode) return;
    const ctx = this._ensureContext();

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 70;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 4;
    lfo.connect(lfoGain).connect(osc.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);

    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.positionX.value = 0;
    panner.positionY.value = 1.5;
    panner.positionZ.value = -3; // roughly where the elevator doors sit in scene.js

    osc.connect(gain).connect(panner).connect(ctx.destination);
    osc.start();
    lfo.start();

    this.humNode = { osc, lfo, gain };
  }

  stopHum() {
    if (!this.humNode) return;
    const { osc, lfo, gain } = this.humNode;
    const ctx = this.ctx;
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.stop(ctx.currentTime + 0.3);
    lfo.stop(ctx.currentTime + 0.3);
    this.humNode = null;
  }

  /** Wires hum/hiss/chime to a SkyscraperBuilding's elevator event bus. */
  connect(building) {
    building.on('elevator:doors-closing', () => {
      this.playBrakeHiss();
      this.startHum();
    });
    building.on('elevator:doors-opening', () => {
      this.stopHum();
      this.playBrakeHiss();
      this.playChime();
    });
    building.on('elevator:arrived', () => {
      this.stopHum();
    });
  }
}

export default ElevatorAudio;
