import { buildChordIndices } from './chordLogic.js';
import { getQuantizedStep } from '../utils.js'; // or wherever you store your quantize func

/**
 * synthUI: builds DOM elements (keys, wave/volume controls),
 * uses a provided synthEngine to produce sound, integrates w/ looper if provided.
 */
export function createSynthUI(container, synthEngine, looperRef) {
  const noteData = [
    { note: 'C', freq: 261.63 },
    { note: 'D', freq: 293.66 },
    { note: 'E', freq: 329.63 },
    { note: 'F', freq: 349.23 },
    { note: 'G', freq: 392.0 },
    { note: 'A', freq: 440.0 },
    { note: 'B', freq: 493.88 },
  ];

  noteData.forEach((n, i) => {
    const keyEl = document.createElement('div');
    keyEl.classList.add('synth-key');
    keyEl.textContent = n.note;

    let playingOscIds = [];
    let startStep = null;

    keyEl.addEventListener('pointerdown', e => {
      e.preventDefault();

      // build chord or single note array
      const chordIndices = buildChordIndices(
        i,
        synthEngine.chordMode ? 'triad' : 'single'
      );
      playingOscIds = chordIndices.map(idx => synthEngine.noteOn(noteData[idx].freq));
      keyEl.classList.add('active');

      // if looper is active, record the "start step"
      if (looperRef?.isLooping) {
        // this quantizes your press to nearest step
        startStep = getQuantizedStep(4, 4, looperRef.beatDuration); 
      }
    });

    keyEl.addEventListener('pointerup', e => {
      e.preventDefault();
      const chordIds = [...playingOscIds];
      chordIds.forEach(id => synthEngine.noteOff(id));
      keyEl.classList.remove('active');
      playingOscIds = [];

      if (looperRef?.isLooping && startStep !== null) {
        // quantize release
        const endStep = getQuantizedStep(4, 4, looperRef.beatDuration);

        // define the replay logic
        let replayOscIds = null;
        const playOnFn = () => {
          // rebuild chord
          const chordIndices = buildChordIndices(
            i,
            synthEngine.chordMode ? 'triad' : 'single'
          );
          replayOscIds = chordIndices.map(idx => synthEngine.noteOn(noteData[idx].freq));
        };
        const playOffFn = () => {
          if (replayOscIds) {
            replayOscIds.forEach(id => synthEngine.noteOff(id));
            replayOscIds = null;
          }
        };

        looperRef.addNoteRecord(startStep, endStep, playOnFn, playOffFn);
      }
      startStep = null;
    });

    container.appendChild(keyEl);
  });

  // waveform select
  const waveSelect = document.createElement('select');
  ['sine', 'square', 'sawtooth', 'triangle'].forEach(w => {
    const opt = document.createElement('option');
    opt.value = w;
    opt.textContent = w;
    waveSelect.appendChild(opt);
  });
  waveSelect.addEventListener('change', e => synthEngine.setWaveform(e.target.value));
  container.appendChild(waveSelect);

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
  chordToggle.checked = true;
  chordToggle.addEventListener('change', () => {
    synthEngine.chordMode = chordToggle.checked;
  });
  chordToggleLabel.appendChild(chordToggle);
  container.appendChild(chordToggleLabel);
}
