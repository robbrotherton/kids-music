import { buildChord } from './chordLogic.js';

export class SynthEngine {
  constructor() {
    this.voicePool = new Map(); // Replace Array with Map for voice management
    this.activeVoices = new Map();
    this.maxVoices = 32; // Safety limit
    this.chordSize = 1;
    this.voiceConfig = {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.9,
        release: 1
      },
      filterEnvelope: {
        attack: 0.06,
        decay: 0.2,
        sustain: 0.5,
        release: 2,
        baseFrequency: 200,
        octaves: 7,
        exponent: 2
      },
      filter: {
        Q: 6,
        rolloff: -24,
        type: 'lowpass'
      },
      volume: -6,
      portamento: 0,
      portamentoType: 'linear'
    };

    // Update filter settings for more dramatic sweep
    this.filter = new Tone.Filter({
      type: "lowpass",
      frequency: 20000,
      Q: 8,
      rolloff: -24
    }).toDestination();
    
    this.chordSize = 1; // Replace chordMode with chordSize
    this.looperRef = null;
    this.activeVoices = new Map(); // Track which voice is playing which note

    // Define effect parameter configurations
    this.effectConfigs = {
      tremolo: {
        rate: { param: 'frequency', target: 'tremolo' },
        depth: { 
          param: 'depth', 
          target: 'tremolo',
          wetControl: true 
        }
      },
      vibrato: {
        rate: { param: 'frequency', target: 'vibrato' },
        depth: { 
          param: 'depth', 
          target: 'vibrato',
          wetControl: true,
          scale: 2 // Double the depth
        }
      },
      delay: {
        time: { param: 'delayTime', target: 'delay' },
        feedback: { param: 'feedback', target: 'delay' },
        mix: { param: 'wet', target: 'delay' }
      },
      reverb: {
        size: { 
          param: 'decay', 
          target: 'reverb',
          special: 'reverbDecay' // Special handling required
        },
        mix: { param: 'wet', target: 'reverb' }
      },
      wah: {
        rate: { 
          param: 'frequency', 
          target: 'wahLFO' 
        },
        depth: { 
          param: 'depth', 
          target: 'wahFilter',
          special: 'wahDepth' // Special handling required
        }
      },
      filter: {
        frequency: { param: 'frequency', target: 'filter' },
        Q: { param: 'Q', target: 'filter' }
      },
      envelope: {
        attack: { param: 'attack', target: 'envelope', voiceParam: true },
        decay: { param: 'decay', target: 'envelope', voiceParam: true },
        sustain: { param: 'sustain', target: 'envelope', voiceParam: true },
        release: { param: 'release', target: 'envelope', voiceParam: true }
      },
      filterEnvelope: {
        attack: { param: 'attack', target: 'filterEnvelope', voiceParam: true },
        decay: { param: 'decay', target: 'filterEnvelope', voiceParam: true },
        sustain: { param: 'sustain', target: 'filterEnvelope', voiceParam: true },
        release: { param: 'release', target: 'filterEnvelope', voiceParam: true }
      },
      portamento: {
        time: { param: 'portamento', target: 'voices', voiceParam: true }
      },
      volume: {
        level: { param: 'volume', target: 'voices', voiceParam: true }
      },
      arpeggiator: {
        rate: { param: 'arpRate', target: 'arp' },
        type: { param: 'arpType', target: 'arp' },
        octaves: { param: 'arpOctaves', target: 'arp' }
      }
    };

    this.arpPattern = null;
    this.arpEnabled = false;
    this.arpRate = "8n";
    this.arpType = "up";
    this.arpOctaves = 1;
    this.arpeggiated = false; // Flag to prevent recursive noteOn calls
    this.transportWasStarted = false; // Track if we started the transport
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

    // No need to chain anything here - voices will be connected when created
    // in getOrCreateVoice method

    // Make sure all effects start clean
    this.resetEffects();
    
    return this;
  }

  setupArpeggiator(notes) {
    if (this.arpPattern) {
      this.arpPattern.stop();
      this.arpPattern.dispose();
      this.arpPattern = null;
    }

    // Expand notes across octaves if needed
    let arpNotes = [...notes];
    for (let oct = 1; oct < this.arpOctaves; oct++) {
      arpNotes = [...arpNotes, ...notes.map(note => note + (12 * oct))];
    }

    // Simple sequence that just plays notes
    this.arpPattern = new Tone.Sequence((time, note) => {
      if (note !== null) {
        const freq = Tone.Frequency(note, "midi").toFrequency();
        const voice = this.getOrCreateVoice();
        if (voice) {
          voice.triggerAttackRelease(freq, "16n", time);
        }
      }
    }, arpNotes, this.arpRate);

    // Just start immediately
    this.arpPattern.start(0);
  }

  getPlaybackRate(rate) {
    switch(rate) {
      case '4n': return 0.25;
      case '8n': return 0.5;
      case '16n': return 1;
      case '32n': return 2;
      default: return 1;
    }
  }

  setArpEnabled(enabled) {
    this.arpEnabled = enabled;
    if (!enabled && this.arpPattern) {
      this.arpPattern.stop();
      this.arpPattern.dispose();
      this.arpPattern = null;
    }
  }

  setArpRate(rate) {
    this.arpRate = rate;
    if (this.arpPattern) {
      this.arpPattern.playbackRate = this.getPlaybackRate(rate);
    }
  }

  setArpType(type) {
    this.arpType = type;
    if (this.arpPattern) {
      this.arpPattern.pattern = type;
    }
  }

  setArpOctaves(octaves) {
    this.arpOctaves = octaves;
    // Re-setup pattern with new octave range if currently playing
    if (this.arpEnabled && this.activeVoices.size > 0) {
      const currentNotes = Array.from(this.activeVoices.values()).map(data => 
        Tone.Frequency(data.freq).toMidi()
      );
      this.setupArpeggiator(currentNotes);
      this.arpPattern.start(0);
    }
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
    // Cleanup all voices
    for (const [id, voice] of this.voicePool) {
      voice.dispose();
    }
    this.voicePool.clear();
    this.activeVoices.clear();
    
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

    if (this.arpPattern) {
      this.arpPattern.stop();
      this.arpPattern.dispose();
    }

    if (this.transportWasStarted) {
      Tone.Transport.stop();
      Tone.Transport.position = 0;
      this.transportWasStarted = false;
    }
  }

  setWaveform(wave) {
    for (const [id, voice] of this.voicePool) {
      voice.set({ oscillator: { type: wave } });
    }
  }

  setVolume(vol) {
    this.setParameter('volume', 'level', vol);
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

  // Generic parameter setter
  setParameter(effect, paramName, value, time = 0.1) {
    const config = this.effectConfigs[effect]?.[paramName];
    if (!config) return;

    const now = Tone.now();

    // Handle special cases
    if (config.special) {
      return this[config.special](value);
    }

    // Handle voice parameters
    if (config.voiceParam) {
      console.log(`Setting voice parameter ${config.param} to ${value}`); // Debug
      for (const [id, voice] of this.voicePool) {
        if (config.target === 'voices') {
          if (config.param === 'volume') {
            const dbValue = Tone.gainToDb(value);
            voice.volume.linearRampToValueAtTime(dbValue, Tone.now() + 0.1);
          } else {
            voice[config.param] = value;
          }
        } else {
          voice.set({ [config.target]: { [config.param]: value } });
        }
      }
      return;
    }

    // Get target effect
    const target = this[config.target];
    if (!target) return;

    // Apply scaling if specified
    const scaledValue = config.scale ? value * config.scale : value;

    // Handle parameters with wet control
    if (config.wetControl) {
      target[config.param].linearRampToValueAtTime(scaledValue, now + time);
      target.wet.linearRampToValueAtTime(value === 0 ? 0 : 1, now + time);
      return;
    }

    // Standard parameter setting
    if (target[config.param]?.linearRampToValueAtTime) {
      target[config.param].linearRampToValueAtTime(scaledValue, now + time);
    } else {
      target[config.param] = scaledValue;
    }
  }

  // Special case handlers remain the same
  setDistortionAmount(amount) {
    const now = Tone.now();
    // Scale distortion based on chord size
    const scaledAmount = amount / Math.sqrt(this.chordSize);  // Square root for gentler scaling
    this.distortion.distortion = scaledAmount * 2;
    this.distortion.wet.linearRampToValueAtTime(amount === 0 ? 0 : 1, now + 0.1);
    
    // Also scale compensation gain based on chord size
    const compensationDb = -6 * scaledAmount;
    const compensationGain = Tone.dbToGain(compensationDb);
    this.distortionCompensation.gain.linearRampToValueAtTime(compensationGain, now + 0.1);
  }

  reverbDecay(decay) {
    const currentWet = this.reverb.wet.value;
    const now = Tone.now();
    this.reverb.wet.linearRampToValueAtTime(0, now + 0.1);
    setTimeout(() => {
      this.reverb.decay = decay;
      this.reverb.wet.linearRampToValueAtTime(currentWet, now + 0.2);
    }, 100);
  }

  wahDepth(depth) {
    if (depth === 0) {
      this.wahLFO.min = 800;
      this.wahLFO.max = 800;
    } else {
      const minFreq = 200;
      const maxFreq = minFreq + (5000 * depth);
      this.wahLFO.min = minFreq;
      this.wahLFO.max = maxFreq;
      this.wahFilter.Q.value = 5 + (depth * 15);
    }
  }

  // Replace individual setters with generic setter calls
  setTremoloRate(rate) { this.setParameter('tremolo', 'rate', rate); }
  setTremoloDepth(depth) { this.setParameter('tremolo', 'depth', depth); }
  setVibratoRate(rate) { this.setParameter('vibrato', 'rate', rate); }
  setVibratoDepth(depth) { this.setParameter('vibrato', 'depth', depth); }
  setDelayTime(time) { this.setParameter('delay', 'time', time); }
  setDelayFeedback(fb) { this.setParameter('delay', 'feedback', fb); }
  setDelayWet(wet) { this.setParameter('delay', 'mix', wet); }
  setReverbDecay(decay) { this.setParameter('reverb', 'size', decay); }
  setReverbWet(wet) { this.setParameter('reverb', 'mix', wet); }
  setWahRate(rate) { this.setParameter('wah', 'rate', rate); }
  setWahDepth(depth) { this.setParameter('wah', 'depth', depth); }
  setFilterQ(q) { this.setParameter('filter', 'Q', q); }
  setFilterFrequency(freq) { this.setParameter('filter', 'frequency', freq); }
  
  // Envelope setters
  setAttack(time) { this.setParameter('envelope', 'attack', time); }
  setDecay(time) { this.setParameter('envelope', 'decay', time); }
  setSustain(level) { this.setParameter('envelope', 'sustain', level); }
  setRelease(time) { this.setParameter('envelope', 'release', time); }
  
  // Filter envelope setters
  setFilterAttack(time) { this.setParameter('filterEnvelope', 'attack', time); }
  setFilterDecay(time) { this.setParameter('filterEnvelope', 'decay', time); }
  setFilterSustain(level) { this.setParameter('filterEnvelope', 'sustain', level); }
  setFilterRelease(time) { this.setParameter('filterEnvelope', 'release', time); }

  // Add portamento setter
  setPortamento(time) { 
    this.setParameter('portamento', 'time', time);
    console.log('Setting portamento:', time); // Add debug logging
  }

  setLooperRef(looperRef) {
    this.looperRef = looperRef;
  }

  stopAllOscillators(time = Tone.now()) {
    for (const [id, voice] of this.voicePool) {
      voice.triggerRelease(time);
    }
    this.activeVoices.clear();
  }

  // Create a new voice or recycle an inactive one
  getOrCreateVoice() {
    // Try to find an inactive voice first
    for (const [id, voice] of this.voicePool) {
      if (!this.activeVoices.has(voice)) {
        return voice;
      }
    }

    // Create new voice if under limit
    if (this.voicePool.size < this.maxVoices) {
      const voice = new Tone.MonoSynth({
        ...this.voiceConfig,
        volume: -6 // Slightly lower volume to prevent clipping
      });

      const id = `voice_${this.voicePool.size}`;
      this.voicePool.set(id, voice);
      
      // Connect voice through the effects chain
      voice.chain(
        this.tremolo,
        this.vibrato,
        this.wahFilter,
        this.distortion,
        this.distortionCompensation,
        this.delay,
        this.reverb,
        this.filter
      );

      return voice;
    }

    // If at limit, find oldest voice
    return Array.from(this.activeVoices.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]?.[0];
  }

  noteOn(freq, time = Tone.now()) {
    if (this.arpEnabled && !this.arpeggiated) {
      const baseNote = Tone.Frequency(freq).toMidi();
      const chordNotes = buildChord(baseNote, this.chordSize, this.keyRoot || 60);
      
      // Only start transport if it's not already running
      if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
      }

      this.setupArpeggiator(chordNotes);
      return;
    }

    const voice = this.getOrCreateVoice();
    if (voice) {
      voice.triggerAttack(freq, time);
      this.activeVoices.set(voice, { 
        freq,
        timestamp: Tone.now()
      });
    }
  }

  noteOff(freq, time = Tone.now()) {
    if (this.arpEnabled) {
      if (this.arpPattern) {
        this.arpPattern.stop();
        this.arpPattern.dispose();
        this.arpPattern = null;
      }
      return;
    }

    for (const [voice, data] of this.activeVoices) {
      if (data.freq === freq) {
        voice.triggerRelease(time);
        this.activeVoices.delete(voice);
        break;
      }
    }
  }

  setChordSize(size) {
    this.chordSize = Math.max(1, Math.min(7, Math.floor(size)));
  }
}