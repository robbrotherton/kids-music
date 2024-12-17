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
    // Create a master output gain for normalization
    this.outputGain = new Tone.Gain(0.8).toDestination();
    this.compressor = new Tone.Compressor({
      threshold: -20,    // start compressing at -20dB
      ratio: 4,         // 4:1 compression ratio
      attack: 0.003,    // fast attack to catch transients
      release: 0.25,    // moderate release
      knee: 5           // moderate softening of compression curve
    });

    this.filter.disconnect();
    this.filter.connect(this.compressor);
    this.compressor.connect(this.outputGain);

    // Create a gain node for amplitude modulation with no effect
    this.tremoloGain = new Tone.Gain(1);
    this.tremoloLFO = new Tone.LFO({
      frequency: 4,
      min: 1,        // Start with no effect (full volume)
      max: 1,        // Start with no effect (full volume)
      type: 'sine'
    });

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

    // Wait only for reverb to generate its impulse response
    await this.reverb.generate();

    this.tremoloLFO.connect(this.tremoloGain.gain);
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

    // Make sure all effects start clean
    this.resetEffects();
    
    return this;
  }

  resetEffects() {
    // Reset all effects to clean state
    this.delay.wet.value = 0;
    this.reverb.wet.value = 0;
    this.vibrato.wet.value = 0;
    this.tremoloGain.gain.value = 1;
    this.tremoloLFO.min = 1;
    this.tremoloLFO.max = 1;
  }

  cleanup() {
    // Proper cleanup of audio nodes
    this.tremoloLFO.stop();
    this.synth.disconnect();
    this.tremoloGain.disconnect();
    this.delay.disconnect();
    this.reverb.disconnect();
    this.filter.disconnect();
    this.compressor.disconnect();
    this.outputGain.disconnect();
  }

  setWaveform(wave) {
    this.synth.set({ oscillator: { type: wave } });
  }

  setVolume(vol) {
    const dbValue = Tone.gainToDb(vol);
    this.synth.volume.linearRampToValueAtTime(dbValue, Tone.now() + 0.1);
  }

  setCutoffFrequency(freq) {
    this.filter.frequency.linearRampToValueAtTime(freq, Tone.now() + 0.1);
  }

  setCutoffAndVolume(freq, vol) {
    this.setCutoffFrequency(freq);
    this.setVolume(vol);
  }

  setTremoloRate(rate) {
    this.tremoloLFO.frequency.linearRampToValueAtTime(rate, Tone.now() + 0.1);
  }

  setTremoloDepth(depth) {
    const now = Tone.now();
    if (depth === 0) {
      this.tremoloLFO.min = 1;
      this.tremoloLFO.max = 1;
      this.tremoloGain.gain.linearRampToValueAtTime(1, now + 0.1);
    } else {
      const min = Math.max(0, 1 - depth);
      this.tremoloLFO.min = min;
      this.tremoloLFO.max = 1;
      this.tremoloGain.gain.linearRampToValueAtTime(min, now + 0.1);
    }
  }

  setVibratoRate(rate) {
    this.vibrato.frequency.linearRampToValueAtTime(rate, Tone.now() + 0.1);
  }

  setVibratoDepth(depth) {
    const now = Tone.now();
    this.vibrato.depth.linearRampToValueAtTime(depth, now + 0.1);
    this.vibrato.wet.linearRampToValueAtTime(depth === 0 ? 0 : 1, now + 0.1);
  }

  setDelayTime(time) {
    this.delay.delayTime.linearRampToValueAtTime(time, Tone.now() + 0.1);
  }

  setDelayFeedback(fb) {
    this.delay.feedback.linearRampToValueAtTime(fb, Tone.now() + 0.1);
  }

  setDelayWet(wet) {
    this.delay.wet.linearRampToValueAtTime(wet, Tone.now() + 0.1);
  }

  setReverbDecay(decay) {
    // Can't ramp reverb decay, but we can ramp its wet value during changes
    const currentWet = this.reverb.wet.value;
    const now = Tone.now();
    this.reverb.wet.linearRampToValueAtTime(0, now + 0.1);
    setTimeout(() => {
      this.reverb.decay = decay;
      this.reverb.wet.linearRampToValueAtTime(currentWet, now + 0.2);
    }, 100);
  }

  setReverbWet(wet) {
    this.reverb.wet.linearRampToValueAtTime(wet, Tone.now() + 0.1);
  }

  setLooperRef(looperRef) {
    this.looperRef = looperRef;
  }

  stopAllOscillators() {
    this.synth.releaseAll();
    // Optional: reset effects when stopping all sound
    this.resetEffects();
  }

  noteOn(freq) {
    this.synth.triggerAttack(freq);
  }

  noteOff(freq) {
    this.synth.triggerRelease(freq);
  }
}