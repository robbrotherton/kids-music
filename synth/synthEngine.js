export class SynthEngine {
  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      volume: -6
    });

    this.filter = new Tone.Filter(20000, "lowpass").toDestination();
    this.synth.connect(this.filter);

    this.chordMode = true;
    this.looperRef = null;
  }

  async initialize() {
    // Create a gain node for amplitude modulation with no effect
    this.tremoloGain = new Tone.Gain(1);
    this.tremoloLFO = new Tone.LFO({
      frequency: 4,
      min: 0.5,     // Start at center
      max: 0.5,     // Start at center (no effect)
      type: 'sine'
    }).connect(this.tremoloGain.gain);

    this.vibrato = new Tone.Vibrato({
      frequency: 5,
      depth: 0,      // Start with no effect
      wet: 0         // Start bypassed
    });

    this.delay = new Tone.FeedbackDelay({
      delayTime: 0.25,
      feedback: 0.2,
      wet: 0         // Start bypassed
    });

    this.reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0         // Start bypassed
    });

    this.tremoloLFO.start();

    // Chain everything once and leave it connected
    this.synth.disconnect();
    this.synth.chain(
      this.vibrato, 
      this.tremoloGain, 
      this.delay,
      this.reverb,
      this.filter
    );

    // Make sure all effects start bypassed via wet mix
    this.delay.wet.value = 0;
    this.reverb.wet.value = 0;
    this.vibrato.wet.value = 0;
    
    return this;
  }

  setWaveform(wave) {
    this.synth.set({ oscillator: { type: wave } });
  }

  setVolume(vol) {
    this.synth.volume.value = Tone.gainToDb(vol);
  }

  setCutoffFrequency(freq) {
    this.filter.frequency.value = freq;
  }

  setCutoffAndVolume(freq, vol) {
    this.setCutoffFrequency(freq);
    this.setVolume(vol);
  }

  setTremoloRate(rate) {
    this.tremoloLFO.frequency.value = rate;
  }

  setTremoloDepth(depth) {
    // Adjust the LFO range to maintain a constant maximum volume
    const center = 0.5;
    const range = depth / 2;
    this.tremoloLFO.min = center - range;
    this.tremoloLFO.max = center + range;
    
    // Bypass tremolo when depth is 0
    this.tremoloGain.gain.value = depth === 0 ? 1 : center;
  }

  setVibratoRate(rate) {
    this.vibrato.frequency.value = rate;
  }

  setVibratoDepth(depth) {
    this.vibrato.depth.value = depth;
    // Bypass vibrato when depth is 0
    this.vibrato.wet.value = depth === 0 ? 0 : 1;
  }

  setDelayTime(time) {
    this.delay.delayTime.value = time;
  }

  setDelayFeedback(fb) {
    this.delay.feedback.value = fb;
  }

  setDelayWet(wet) {
    this.delay.wet.value = wet;
    // No more disconnect/connect, just use the wet parameter
  }

  setReverbDecay(decay) {
    this.reverb.decay = decay;
  }

  setReverbWet(wet) {
    this.reverb.wet.value = wet;
    // No more disconnect/connect, just use the wet parameter
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