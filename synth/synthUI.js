import { buildChordIndices } from './chordLogic.js';
import { getQuantizedStep } from '../utils.js'; // or wherever you store your quantize func
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

  noteData.forEach((n, i) => {
    const keyEl = document.createElement('div');
    keyEl.classList.add('synth-key');
    keyEl.textContent = n.note;

    let startStep = null;

    keyEl.addEventListener('pointerdown', async e => {
      e.preventDefault();
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Tone.js context started');
      }
      const chordIndices = buildChordIndices(i, synthEngine.chordMode ? 'triad' : 'single');
      chordIndices.forEach(idx => synthEngine.noteOn(noteData[idx].freq));
      keyEl.classList.add('active');

      if (looperRef?.isLooping) {
        startStep = getQuantizedStep(4, 4, looperRef.beatDuration);
      }
    });

    keyEl.addEventListener('pointerup', e => {
      e.preventDefault();
      const chordIndices = buildChordIndices(i, synthEngine.chordMode ? 'triad' : 'single');
      chordIndices.forEach(idx => synthEngine.noteOff(noteData[idx].freq));
      keyEl.classList.remove('active');

      if (looperRef?.isLooping && startStep !== null) {
        const endStep = getQuantizedStep(4, 4, looperRef.beatDuration);
        looperRef.addNoteRecord(startStep, endStep, () => {
          chordIndices.forEach(idx => synthEngine.noteOn(noteData[idx].freq));
        }, () => {
          chordIndices.forEach(idx => synthEngine.noteOff(noteData[idx].freq));
        });
      }
      startStep = null;
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

  /*** FILTER CONTROLS (GLOBAL!) ***/
  const filterLabel = document.createElement('label');
  filterLabel.textContent = ' cutoff freq ';
  const cutoffSlider = document.createElement('input');
  cutoffSlider.type = 'range';
  cutoffSlider.min = 0;
  cutoffSlider.max = 100;
  cutoffSlider.value = 100; // default wide open
  cutoffSlider.step = 1;
  cutoffSlider.addEventListener('input', e => {
    const linearValue = parseFloat(e.target.value);
    const minFreq = 20;
    const maxFreq = 20000;
    const logValue = minFreq * Math.pow(maxFreq / minFreq, linearValue / 100);
    const volume = 1 - (linearValue / 100); // Invert volume in conjunction with cutoff
    synthEngine.setCutoffAndVolume(logValue, volume);
  });
  filterLabel.appendChild(cutoffSlider);
  container.appendChild(filterLabel);

  // create and append filter controls
  // createFilterControls(container, synthEngine);
}
