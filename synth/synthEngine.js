export class SynthEngine {
  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.1
      },
      volume: -6
    });

    // Update filter settings for more dramatic sweep
    this.filter = new Tone.Filter({
      type: "lowpass",
      frequency: 20000,
      Q: 8,          // Increased resonance for that squelchy sound
      rolloff: -24   // Steeper filter slope for more dramatic effect
    }).toDestination();
    
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

    // Add distortion effect with a compensation gain
    this.distortionCompensation = new Tone.Gain(1);
    this.distortion = new Tone.Distortion({
      distortion: 0,  // start clean
      wet: 0         // start bypassed
    });

    // Wait only for reverb to generate its impulse response
    await this.reverb.generate();

    this.tremoloLFO.connect(this.tremoloGain.gain);
    this.tremoloLFO.start();

    // Update wah filter settings for more pronounced effect
    this.wahFilter = new Tone.Filter({
      type: "bandpass",
      frequency: 800,   // center starting frequency
      Q: 1             // increased resonance for more pronounced sweep
    });

    this.wahLFO = new Tone.LFO({
      frequency: 4,
      min: 800,    // higher starting frequency
      max: 800,    // start with no sweep (same as min)
      type: 'sine'
    }).connect(this.wahFilter.frequency);

    this.wahLFO.start();

    // Chain everything once and leave it connected
    this.synth.disconnect();
    this.synth.chain(
      this.vibrato,
      this.wahFilter,    // Add wah before tremolo
      this.tremoloGain, 
      this.distortion,
      this.distortionCompensation,  // Add compensation after distortion
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
    this.wahLFO.min = 800;
    this.wahLFO.max = 800;
    this.distortion.wet.value = 0;
    this.distortion.distortion = 0;
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
    this.wahLFO.stop();
    this.wahFilter.disconnect();
    this.distortion.disconnect();
    this.distortionCompensation.disconnect();
  }

  setWaveform(wave) {
    this.synth.set({ oscillator: { type: wave } });
  }

  setVolume(vol) {
    const dbValue = Tone.gainToDb(vol);
    this.synth.volume.linearRampToValueAtTime(dbValue, Tone.now() + 0.1);
  }

  setCutoffFrequency(freq) {
    // Use exponential scaling for more musical filter sweep
    const minFreq = 80;    // Lower bottom frequency
    const maxFreq = 12000; // Slightly reduced top end
    
    // Add slight smoothing to the sweep
    this.filter.frequency.exponentialRampToValueAtTime(
      Math.max(minFreq, Math.min(maxFreq, freq)), 
      Tone.now() + 0.03
    );

    // Dynamically adjust Q based on frequency
    // More resonance in the mid-range, less at extremes
    const normalizedFreq = (freq - minFreq) / (maxFreq - minFreq);
    const qValue = 4 + (8 * Math.sin(normalizedFreq * Math.PI)); // Q varies from 4 to 12
    this.filter.Q.value = qValue;
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

  noteOn(freq, time = undefined) {
    this.synth.triggerAttack(freq, time);
  }

  noteOff(freq, time = undefined) {
    this.synth.triggerRelease(freq, time);
  }

  setWahRate(rate) {
    this.wahLFO.frequency.linearRampToValueAtTime(rate, Tone.now() + 0.1);
  }

  setWahDepth(depth) {
    const now = Tone.now();
    if (depth === 0) {
      // No wah - fix filter frequency
      this.wahLFO.min = 800;
      this.wahLFO.max = 800;
    } else {
      // Map depth to frequency range for more dramatic sweep
      // At full depth: 200Hz to 3000Hz
      const minFreq = 500;
      const maxFreq = minFreq + (2500 * depth);  // max 3000Hz at full depth
      this.wahLFO.min = minFreq;
      this.wahLFO.max = maxFreq;
      
      // Optionally adjust Q based on depth for even more character
      this.wahFilter.Q.value = 2 + (depth * 8); // Q ranges from 2 to 10
    }
  }

  setAttack(time) {
    this.synth.set({
      envelope: { attack: time }
    });
  }

  setRelease(time) {
    this.synth.set({
      envelope: { release: time }
    });
  }

  setDistortionAmount(amount) {
    const now = Tone.now();
    // amount: 0-1
    this.distortion.distortion = amount;
    this.distortion.wet.linearRampToValueAtTime(amount === 0 ? 0 : 1, now + 0.1);
    
    // Compensate for volume increase
    // As distortion increases, we decrease the compensation gain
    // These values are tuned by ear - adjust if needed
    const compensationDb = -12 * amount;  // up to -12dB reduction for full distortion
    const compensationGain = Tone.dbToGain(compensationDb);
    this.distortionCompensation.gain.linearRampToValueAtTime(compensationGain, now + 0.1);
  }

  setPortamento(time) {
    this.synth.set({
      portamento: time
    });
  }
}