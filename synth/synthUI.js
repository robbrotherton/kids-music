import { buildChordIndices } from './chordLogic.js';
import { createFilterControls } from './filterControls.js';

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

  // volume slider
  const volSlider = document.createElement('input');
  volSlider.type = 'range';
  volSlider.min = 0;
  volSlider.max = 1;
  volSlider.step = 0.1;
  volSlider.value = 0.5;
  volSlider.addEventListener('input', e => synthEngine.setVolume(parseFloat(e.target.value)));
  container.appendChild(volSlider);

  // chord mode toggle
  const chordToggleLabel = document.createElement('label');
  chordToggleLabel.textContent = ' chord mode ';
  const chordToggle = document.createElement('input');
  chordToggle.type = 'checkbox';
  chordToggle.checked = synthEngine.chordMode; // initialize based on synthEngine state
  chordToggle.addEventListener('change', () => {
    synthEngine.chordMode = chordToggle.checked;
    console.log('Chord mode toggled:', synthEngine.chordMode); // Debugging log
  });
  chordToggleLabel.appendChild(chordToggle);
  container.appendChild(chordToggleLabel);

  // portamento toggle
  const portamentoLabel = document.createElement('label');
  portamentoLabel.textContent = ' glide ';
  const portamentoToggle = document.createElement('input');
  portamentoToggle.type = 'checkbox';
  portamentoToggle.checked = false;
  portamentoToggle.addEventListener('change', () => {
    synthEngine.setPortamento(portamentoToggle.checked ? 0.1 : 0);
  });
  portamentoLabel.appendChild(portamentoToggle);
  container.appendChild(portamentoLabel);

  // create and append filter controls
  createFilterControls(container, synthEngine);
}
