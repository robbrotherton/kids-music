import { buildChordIndices } from './chordLogic.js';
import { createSynthControlsUI } from './synthControlsUI.js';

/**
 * synthUI: builds DOM elements (keys, wave/volume controls),
 * uses a provided synthEngine to produce sound, integrates w/ looper if provided.
 */
export function createSynthUI(container, synthEngine, looperRef) {
  const noteData = [
    { note: 'C', freq: 'C' },  // Remove octave from freq
    { note: 'D', freq: 'D' },
    { note: 'E', freq: 'E' },
    { note: 'F', freq: 'F' },
    { note: 'G', freq: 'G' },
    { note: 'A', freq: 'A' },
    { note: 'B', freq: 'B' },
  ];

  let activeKey = null;
  let activeNoteIndex = null;
  let startStep = null;

  const stopCurrentNote = () => {
    if (activeNoteIndex !== null) {
      const chordIndices = buildChordIndices(activeNoteIndex, synthEngine.chordSize);
      chordIndices.forEach(({ index, octave }) => {
        const baseNote = noteData[index].freq;
        const finalNote = `${baseNote}${4 + octave}`;
        synthEngine.noteOff(finalNote);
      });
      if (activeKey) {
        activeKey.classList.remove('active');
      }
    }
  };

  const startNote = (keyEl, noteIndex) => {
    // Record the end of the previous note if we're sliding
    if (looperRef?.isLooping && activeNoteIndex !== null) {
      const endStep = looperRef.currentStep;
      const chordIndices = buildChordIndices(activeNoteIndex, synthEngine.chordSize);
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
    const chordIndices = buildChordIndices(noteIndex, synthEngine.chordSize);
    chordIndices.forEach(({ index, octave }) => {
      // Get base note without octave
      const baseNote = noteData[index].freq;
      // Use octave 4 as the base octave and add the chord's octave offset
      const finalNote = `${baseNote}${4 + octave}`;
      synthEngine.noteOn(finalNote);
    });
    keyEl.classList.add('active');

    // Start recording the new note
    if (looperRef?.isLooping) {
      startStep = looperRef.currentStep;
    }
  };

  // Create keys container
  const keysContainer = document.createElement('div');
  keysContainer.className = 'synth-keys-container';

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
          // Use keysContainer.children instead of container.children
          startNote(targetKey, Array.from(keysContainer.children).indexOf(targetKey));
        }
      }
    });

    keysContainer.appendChild(keyEl);  // Append to keysContainer instead of main container
  });

  
  // Create wrapper for entire synth
  const synthWrapper = document.createElement('div');
  synthWrapper.className = 'synth-wrapper';
  
  // Replace the old controls with new knob-based controls
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'controls-container';
  
  // Add containers to wrapper in correct order
  synthWrapper.appendChild(keysContainer);
  synthWrapper.appendChild(controlsContainer);
  
  // Add wrapper to main container
  container.appendChild(synthWrapper);

  // Pass the synthEngine to create controls
  createSynthControlsUI(synthEngine, controlsContainer);
}
