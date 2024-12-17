import { buildChordIndices } from './chordLogic.js';
import { Knob } from '../utils.js';

/**
 * synthUI: builds DOM elements (keys, wave/volume controls),
 * uses a provided synthEngine to produce sound, integrates w/ looper if provided.
 */
export function createSynthUI(container, synthEngine, looperRef) {
  const noteData = [
    { note: 'C', freq: 'C4' },
    { note: 'D', freq: 'D4' },
    { note: 'E', freq: 'E4' },
    { note: 'F', freq: 'F4' },
    { note: 'G', freq: 'G4' },
    { note: 'A', freq: 'A4' },
    { note: 'B', freq: 'B4' },
  ];

  let activeKey = null;
  let activeNoteIndex = null;
  let startStep = null;

  const stopCurrentNote = () => {
    if (activeNoteIndex !== null) {
      const chordIndices = buildChordIndices(activeNoteIndex, synthEngine.chordMode ? 'triad' : 'single');
      chordIndices.forEach(idx => synthEngine.noteOff(noteData[idx].freq));
      if (activeKey) {
        activeKey.classList.remove('active');
      }
    }
  };

  const startNote = (keyEl, noteIndex) => {
    // Record the end of the previous note if we're sliding
    if (looperRef?.isLooping && activeNoteIndex !== null) {
      const endStep = looperRef.currentStep;
      const chordIndices = buildChordIndices(activeNoteIndex, synthEngine.chordMode ? 'triad' : 'single');
      looperRef.addNoteRecord(startStep, endStep,
        (time) => {
          chordIndices.forEach(idx => synthEngine.noteOn(noteData[idx].freq, time));
        },
        (time) => {
          chordIndices.forEach(idx => synthEngine.noteOff(noteData[idx].freq, time));
        }
      );
    }

    stopCurrentNote();
    activeKey = keyEl;
    activeNoteIndex = noteIndex;
    const chordIndices = buildChordIndices(noteIndex, synthEngine.chordMode ? 'triad' : 'single');
    chordIndices.forEach(idx => synthEngine.noteOn(noteData[idx].freq));
    keyEl.classList.add('active');

    // Start recording the new note
    if (looperRef?.isLooping) {
      startStep = looperRef.currentStep;
    }
  };

  noteData.forEach((n, i) => {
    const keyEl = document.createElement('div');
    keyEl.classList.add('synth-key');
    keyEl.textContent = n.note;

    keyEl.addEventListener('pointerdown', async e => {
      e.preventDefault();
      keyEl.setPointerCapture(e.pointerId);
      
      // Ensure Tone.js is started before any sound
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      startNote(keyEl, i);
      if (looperRef?.isLooping) {
        startStep = looperRef.currentStep;
      }
    });

    keyEl.addEventListener('pointerup', e => {
      e.preventDefault();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      
      // Record the final note release
      if (looperRef?.isLooping && activeNoteIndex !== null && startStep !== null) {
        const endStep = looperRef.currentStep;
        const chordIndices = buildChordIndices(activeNoteIndex, synthEngine.chordMode ? 'triad' : 'single');
        looperRef.addNoteRecord(startStep, endStep,
          (time) => {
            chordIndices.forEach(idx => synthEngine.noteOn(noteData[idx].freq, time));
          },
          (time) => {
            chordIndices.forEach(idx => synthEngine.noteOff(noteData[idx].freq, time));
          }
        );
      }
      
      stopCurrentNote();
      activeKey = null;
      activeNoteIndex = null;
      startStep = null;
    });

    keyEl.addEventListener('pointercancel', e => {
      e.preventDefault();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      stopCurrentNote();
      activeKey = null;
      activeNoteIndex = null;
      startStep = null;
    });

    keyEl.addEventListener('pointermove', e => {
      e.preventDefault();
      if (e.buttons > 0 && e.currentTarget.hasPointerCapture(e.pointerId)) {
        const targetKey = document.elementFromPoint(e.clientX, e.clientY);
        if (targetKey?.classList.contains('synth-key') && targetKey !== activeKey) {
          startNote(targetKey, Array.from(container.children).indexOf(targetKey));
        }
      }
    });

    container.appendChild(keyEl);
  });

  // waveform select
  const waveforms = ['sine', 'square', 'sawtooth', 'triangle'];
  const waveSelectContainer = document.createElement('div');
  waveforms.forEach(w => {
    const label = document.createElement('label');
    label.classList.add('waveform-label');

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'waveform';
    input.value = w;
    if (w === 'sine') {
      input.checked = true; // set sine wave as default
      synthEngine.setWaveform(w); // ensure synthEngine is set to sine wave
    }
    input.addEventListener('change', e => synthEngine.setWaveform(e.target.value));

    const icon = document.createElement('img');
    icon.src = `./assets/icons/${w}-wave.svg`;
    icon.alt = w;
    icon.classList.add('waveform-icon');

    label.appendChild(input);
    label.appendChild(icon);
    waveSelectContainer.appendChild(label);
  });
  container.appendChild(waveSelectContainer);

  // Replace the old controls with new knob-based controls
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'controls-container';

  // Basic controls
  const volumeKnob = new Knob({
    min: 0, max: 1, value: 0.5,
    label: 'Volume',
    onChange: (value) => synthEngine.setVolume(value)
  });

  const filterKnob = new Knob({
    min: 80, max: 12000, value: 12000,
    label: 'Filter',
    onChange: (value) => synthEngine.setCutoffFrequency(value)
  });

  const resonanceKnob = new Knob({
    min: 0, max: 20, value: 1,
    label: 'Resonance',
    onChange: (value) => synthEngine.setFilterQ(value)
  });

  // Add Effect Knobs
  const tremoloRateKnob = new Knob({
    min: 0.1, max: 10, value: 4,
    label: 'Trem Rate',
    onChange: (value) => synthEngine.setTremoloRate(value)
  });

  const tremoloDepthKnob = new Knob({
    min: 0, max: 1, value: 0,
    label: 'Trem Depth',
    onChange: (value) => synthEngine.setTremoloDepth(value)
  });

  const vibratoRateKnob = new Knob({
    min: 0.1, max: 10, value: 5,
    label: 'Vib Rate',
    onChange: (value) => synthEngine.setVibratoRate(value)
  });

  const vibratoDepthKnob = new Knob({
    min: 0, max: 0.5, value: 0,
    label: 'Vib Depth',
    onChange: (value) => synthEngine.setVibratoDepth(value)
  });

  const delayTimeKnob = new Knob({
    min: 0.05, max: 1.0, value: 0.25,
    label: 'Delay Time',
    onChange: (value) => synthEngine.setDelayTime(value)
  });

  const delayFeedbackKnob = new Knob({
    min: 0, max: 0.9, value: 0.2,
    label: 'Feedback',
    onChange: (value) => synthEngine.setDelayFeedback(value)
  });

  const delayMixKnob = new Knob({
    min: 0, max: 1, value: 0,
    label: 'Delay Mix',
    onChange: (value) => synthEngine.setDelayWet(value)
  });

  const reverbSizeKnob = new Knob({
    min: 0.1, max: 10, value: 2.5,
    label: 'Verb Size',
    onChange: (value) => synthEngine.setReverbDecay(value)
  });

  const reverbMixKnob = new Knob({
    min: 0, max: 1, value: 0,
    label: 'Verb Mix',
    onChange: (value) => synthEngine.setReverbWet(value)
  });

  const wahRateKnob = new Knob({
    min: 0.1, max: 10, value: 4,
    label: 'Wah Rate',
    onChange: (value) => synthEngine.setWahRate(value)
  });

  const wahDepthKnob = new Knob({
    min: 0, max: 1, value: 0,
    label: 'Wah Depth',
    onChange: (value) => synthEngine.setWahDepth(value)
  });

  const distortionKnob = new Knob({
    min: 0, max: 1, value: 0,
    label: 'Distortion',
    onChange: (value) => synthEngine.setDistortionAmount(value)
  });

  // Create separate containers for different control groups
  const mainControls = document.createElement('div');
  mainControls.className = 'control-group main-controls';
  mainControls.setAttribute('data-label', 'Main Controls');
  
  const modulationControls = document.createElement('div');
  modulationControls.className = 'control-group modulation-controls';
  modulationControls.setAttribute('data-label', 'Modulation');
  
  const timeEffectsControls = document.createElement('div');
  timeEffectsControls.className = 'control-group time-effects-controls';
  timeEffectsControls.setAttribute('data-label', 'Time Effects');
  
  const characterControls = document.createElement('div');
  characterControls.className = 'control-group character-controls';
  characterControls.setAttribute('data-label', 'Character');

  // Create toggle controls FIRST
  const chordToggleLabel = document.createElement('label');
  chordToggleLabel.textContent = ' chord mode ';
  const chordToggle = document.createElement('input');
  chordToggle.type = 'checkbox';
  chordToggle.checked = synthEngine.chordMode;
  chordToggle.addEventListener('change', () => {
    synthEngine.chordMode = chordToggle.checked;
  });
  chordToggleLabel.appendChild(chordToggle);

  const portamentoLabel = document.createElement('label');
  portamentoLabel.textContent = ' glide ';
  const portamentoToggle = document.createElement('input');
  portamentoToggle.type = 'checkbox';
  portamentoToggle.checked = false;
  portamentoToggle.addEventListener('change', () => {
    synthEngine.setPortamento(portamentoToggle.checked ? 0.1 : 0);
  });
  portamentoLabel.appendChild(portamentoToggle);

  // Performance controls
  const performanceControls = document.createElement('div');
  performanceControls.className = 'performance-controls';
  performanceControls.appendChild(chordToggleLabel);
  performanceControls.appendChild(portamentoLabel);

  // Core synth controls section
  waveSelectContainer.className = 'wave-selector';
  mainControls.appendChild(waveSelectContainer);
  mainControls.appendChild(performanceControls);
  [volumeKnob, filterKnob, resonanceKnob].forEach(knob => 
    mainControls.appendChild(knob.container));

  // Modulation controls section
  [
    vibratoRateKnob,
    vibratoDepthKnob,
    tremoloRateKnob,
    tremoloDepthKnob,
    wahRateKnob,
    wahDepthKnob
  ].forEach(knob => modulationControls.appendChild(knob.container));
  
  // Time-based effects section
  [
    delayTimeKnob,
    delayFeedbackKnob,
    delayMixKnob,
    reverbSizeKnob,
    reverbMixKnob
  ].forEach(knob => timeEffectsControls.appendChild(knob.container));
  
  // Character effects section
  [distortionKnob].forEach(knob => 
    characterControls.appendChild(knob.container));

  // Add all control groups to main container
  controlsContainer.appendChild(mainControls);
  controlsContainer.appendChild(modulationControls);
  controlsContainer.appendChild(timeEffectsControls);
  controlsContainer.appendChild(characterControls);

  container.appendChild(controlsContainer);
}
