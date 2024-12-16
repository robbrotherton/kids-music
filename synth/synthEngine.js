export class SynthEngine {
  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      volume: -6
    }).toDestination();

    this.chordMode = true;
    this.looperRef = null;
  }

  setWaveform(wave) {
    this.synth.set({ oscillator: { type: wave } });
  }

  setVolume(vol) {
    this.synth.volume.value = Tone.gainToDb(vol);
  }

  setCutoffAndVolume(freq, vol) {
    this.synth.set({
      filter: { frequency: freq },
      volume: Tone.gainToDb(vol)
    });
  }

  setLooperRef(looperRef) {
    this.looperRef = looperRef;
  }

  stopAllOscillators() {
    this.synth.releaseAll();
  }

  noteOn(freq) {
    this.synth.triggerAttack(freq);
  }

  noteOff(freq) {
    this.synth.triggerRelease(freq);
  }
}
