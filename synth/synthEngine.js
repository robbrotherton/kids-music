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


    // create a biquad lowpass filter
    this.filterNode = this.audioCtx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(20000, this.audioCtx.currentTime); // default cutoff

    // we’ll connect the filter to the destination 
    // each oscillator's gain node will connect into this filter 
    // so the signal chain is: oscillator -> gain -> filterNode -> audioCtx.destination
    this.filterNode.connect(this.audioCtx.destination);

  }

  setWaveform(wave) {
    this.waveform = wave;
  }

  setVolume(vol) {
    this.volume = vol;
  }


  setCutoffFrequency(freq) {
    // clamp freq if needed
    freq = Math.max(20, Math.min(freq, 20000));
    this.filterNode.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
  }

  setCutoffAndVolume(freq, vol) {
    this.setCutoffFrequency(freq);
    this.setVolume(vol);
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
    gain.connect(this.filterNode); // connect to filterNode instead of audioCtx.destination

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
