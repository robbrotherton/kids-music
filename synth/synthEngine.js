export class SynthEngine {
  constructor() {
    // Create multiple MonoSynths for polyphony
    this.voices = Array(3).fill().map(() => new Tone.MonoSynth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.005,  // Default
        decay: 0.1,     // Default
        sustain: 0.9,   // Default
        release: 1      // Default
      },
      filterEnvelope: {
        attack: 0.06,   // Default
        decay: 0.2,     // Default
        sustain: 0.5,   // Default
        release: 2,     // Default
        baseFrequency: 200,    // Start from a lower frequency
        octaves: 7,            // Sweep through more octaves
        exponent: 2            // More dramatic exponential sweep
      },
      filter: {
        Q: 6,                  // More resonance
        rolloff: -24,          // Steeper filter slope
        type: 'lowpass'
      },
      volume: -6
    }));

    // Update filter settings for more dramatic sweep
    this.filter = new Tone.Filter({
      type: "lowpass",
      frequency: 20000,
      Q: 8,
      rolloff: -24
    }).toDestination();
    
    // Connect all voices to the filter
    this.voices.forEach(voice => voice.connect(this.filter));

    this.chordMode = true;
    this.looperRef = null;
    this.activeVoices = new Map(); // Track which voice is playing which note
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

    // Replace our custom tremolo with Tone.js Tremolo
    this.tremolo = new Tone.Tremolo({
      frequency: 4,
      depth: 0,
      spread: 0,
      type: 'sine',
      wet: 0
    }).start();

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

    // Reorder the chain to ensure tremolo is affecting amplitude properly
    this.voices.forEach(voice => voice.disconnect());
    this.voices.forEach(voice => voice.chain(
      this.tremolo,      // Use new tremolo effect
      this.vibrato,
      this.wahFilter,
      this.distortion,
      this.distortionCompensation,
      this.delay,
      this.reverb,
      this.filter
    ));

    // Make sure all effects start clean
    this.resetEffects();
    
    return this;
  }

  resetEffects() {
    // Reset all effects to clean state
    this.delay.wet.value = 0;
    this.reverb.wet.value = 0;
    this.vibrato.wet.value = 0;
    this.tremolo.wet.value = 0;
    this.tremolo.depth.value = 0;
    this.wahLFO.min = 800;
    this.wahLFO.max = 800;
    this.distortion.wet.value = 0;
    this.distortion.distortion = 0;
  }

  cleanup() {
    this.voices.forEach(voice => voice.disconnect());
    this.tremolo.dispose();
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
    this.voices.forEach(voice => 
      voice.set({ oscillator: { type: wave } })
    );
  }

  setVolume(vol) {
    const dbValue = Tone.gainToDb(vol);
    this.voices.forEach(voice => 
      voice.volume.linearRampToValueAtTime(dbValue, Tone.now() + 0.1)
    );
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
    this.tremolo.frequency.value = rate;
  }

  setTremoloDepth(depth) {
    this.tremolo.depth.value = depth;
    this.tremolo.wet.value = depth === 0 ? 0 : 1;
  }

  setVibratoRate(rate) {
    this.vibrato.frequency.linearRampToValueAtTime(rate, Tone.now() + 0.1);
  }

  setVibratoDepth(depth) {
    const now = Tone.now();
    // Double the depth for more dramatic effect
    this.vibrato.depth.linearRampToValueAtTime(depth * 2, now + 0.1);
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
    this.voices.forEach(voice => voice.triggerRelease());
    this.activeVoices.clear();
  }

  noteOn(freq, time = undefined) {
    // Find first available voice
    const voice = this.voices.find(v => !this.activeVoices.has(v));
    if (voice) {
      voice.triggerAttack(freq, time);
      this.activeVoices.set(voice, freq);
    }
  }

  noteOff(freq, time = undefined) {
    // Find and release the voice playing this frequency
    for (const [voice, voiceFreq] of this.activeVoices) {
      if (voiceFreq === freq) {
        voice.triggerRelease(time);
        this.activeVoices.delete(voice);
        break;
      }
    }
  }

  setWahRate(rate) {
    this.wahLFO.frequency.linearRampToValueAtTime(rate, Tone.now() + 0.1);
  }

  setWahDepth(depth) {
    const now = Tone.now();
    if (depth === 0) {
      this.wahLFO.min = 800;
      this.wahLFO.max = 800;
    } else {
      // Much wider frequency range for more dramatic wah
      const minFreq = 200;
      const maxFreq = minFreq + (5000 * depth);  // max 5200Hz at full depth
      this.wahLFO.min = minFreq;
      this.wahLFO.max = maxFreq;
      
      // More resonance for more pronounced wah
      this.wahFilter.Q.value = 5 + (depth * 15); // Q ranges from 5 to 20
    }
  }

  setAttack(time) {
    this.voices.forEach(voice => 
      voice.set({ envelope: { attack: time } })
    );
  }

  setDecay(time) {
    this.voices.forEach(voice => 
      voice.set({ envelope: { decay: time } })
    );
  }

  setSustain(level) {
    this.voices.forEach(voice => 
      voice.set({ envelope: { sustain: level } })
    );
  }

  setRelease(time) {
    this.voices.forEach(voice => 
      voice.set({ envelope: { release: time } })
    );
  }

  setFilterAttack(time) {
    this.voices.forEach(voice => 
      voice.set({ filterEnvelope: { attack: time } })
    );
  }

  setFilterDecay(time) {
    this.voices.forEach(voice => 
      voice.set({ filterEnvelope: { decay: time } })
    );
  }

  setFilterSustain(level) {
    this.voices.forEach(voice => 
      voice.set({ filterEnvelope: { sustain: level } })
    );
  }

  setFilterRelease(time) {
    this.voices.forEach(voice => 
      voice.set({ filterEnvelope: { release: time } })
    );
  }

  setDistortionAmount(amount) {
    const now = Tone.now();
    this.distortion.distortion = amount * 2; // Double the distortion effect
    this.distortion.wet.linearRampToValueAtTime(amount === 0 ? 0 : 1, now + 0.1);
    
    const compensationDb = -6 * amount;  // Less compensation for more dramatic effect
    const compensationGain = Tone.dbToGain(compensationDb);
    this.distortionCompensation.gain.linearRampToValueAtTime(compensationGain, now + 0.1);
  }

  setPortamento(time) {
    this.voices.forEach(voice => 
      voice.set({ portamento: time })
    );
  }

  setFilterFrequency(freq) {
    this.filter.frequency.setValueAtTime(freq, Tone.now());
  }
  
  setFilterQ(q) {
    this.filter.Q.setValueAtTime(q, Tone.now());
  }
}