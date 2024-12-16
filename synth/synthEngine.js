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
      min: 1,        // Start with no effect (full volume)
      max: 1,        // Start with no effect (full volume)
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
    // Scale depth from 0-1 range to proper gain values
    if (depth === 0) {
      // No tremolo - fixed gain at 1
      this.tremoloLFO.min = 1;
      this.tremoloLFO.max = 1;
      this.tremoloGain.gain.value = 1;
    } else {
      // Map depth to gain range
      // At full depth (1.0): min=0 (silence) to max=1 (full volume)
      // At partial depth: min=1-depth to max=1
      this.tremoloLFO.min = Math.max(0, 1 - depth);
      this.tremoloLFO.max = 1;
      this.tremoloGain.gain.value = this.tremoloLFO.min;  // Start at minimum
    }
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