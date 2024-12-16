let oscIdCounter = 0;

/**
 * SynthEngine is responsible for raw Web Audio nodes, oscillator mgmt, etc.
 */
export class SynthEngine {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.waveform = 'sine';
    this.volume = 0.5;
    // chordMode is optional, can keep or move to chordLogic
    this.chordMode = true;

    this.activeOscillators = {}; // { oscId: { osc, gain } }
    this.looperRef = null;
  }

  setWaveform(wave) {
    this.waveform = wave;
  }

  setVolume(vol) {
    this.volume = vol;
  }

  setLooperRef(looperRef) {
    this.looperRef = looperRef;
  }

  stopAllOscillators() {
    Object.keys(this.activeOscillators).forEach(id => {
      this.noteOff(id);
    });
  }

  noteOn(freq) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = this.waveform;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();

    const id = 'osc_' + (oscIdCounter++);
    this.activeOscillators[id] = { osc, gain };
    return id;
  }

  noteOff(oscId) {
    const obj = this.activeOscillators[oscId];
    if (!obj) return;
    const { osc, gain } = obj;
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.2);
    osc.stop(this.audioCtx.currentTime + 0.21);
    delete this.activeOscillators[oscId];
  }
}
