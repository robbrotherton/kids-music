import { NoteModel } from './noteModel.js';
import { buildChord } from './chordLogic.js';
import { createSynthControlsUI } from './synthControlsUI.js';

/**
 * synthUI: builds DOM elements (keys, wave/volume controls),
 * uses a provided synthEngine to produce sound, integrates w/ looper if provided.
 */
export function createSynthUI(container, synthEngine, looperRef) {
  const noteModel = new NoteModel();
  // Show only octave 4 in the UI
  const displayedNotes = noteModel.getOctaveNotes(4);
  
  // Get MIDI number for the key root (C4 by default)
  const keyRoot = noteModel.noteToMidi('C', 4);

  let activeKey = null;
  let activeMidiNote = null;
  let startStep = null;

  const stopCurrentNote = () => {
    if (activeMidiNote !== null) {
      const chordNotes = buildChord(activeMidiNote, synthEngine.chordSize, keyRoot);
      chordNotes.forEach(midiNote => {
        const note = noteModel.midiToNote(midiNote);
        synthEngine.noteOff(note.freq);
      });
      if (activeKey) {
        activeKey.classList.remove('active');
      }
    }
  };

  const startNote = (keyEl, midiNote) => {
    // Record the end of the previous note if we're sliding
    if (looperRef?.isLooping && activeMidiNote !== null) {
      const endStep = looperRef.currentStep;
      const chordNotes = buildChord(activeMidiNote, synthEngine.chordSize, keyRoot);
      looperRef.addNoteRecord(startStep, endStep,
        (time) => {
          chordNotes.forEach(midiNote => {
            const note = noteModel.midiToNote(midiNote);
            synthEngine.noteOn(note.freq, time);
          });
        },
        (time) => {
          chordNotes.forEach(midiNote => {
            const note = noteModel.midiToNote(midiNote);
            synthEngine.noteOff(note.freq, time);
          });
        }
      );
    }

    stopCurrentNote();
    activeKey = keyEl;
    activeMidiNote = midiNote;
    
    const chordNotes = buildChord(midiNote, synthEngine.chordSize, keyRoot);
    const noteNames = [];
    
    chordNotes.forEach(midiNote => {
      const note = noteModel.midiToNote(midiNote);
      if (note) { // Check if note exists (might be out of range)
        noteNames.push(`${note.note}${note.octave}`);
        synthEngine.noteOn(note.freq);
      }
    });
    
    console.log('Playing:', noteNames.join(', '));
    keyEl.classList.add('active');

    // Start recording the new note
    if (looperRef?.isLooping) {
      startStep = looperRef.currentStep;
    }
  };

  // Create keys container
  const keysContainer = document.createElement('div');
  keysContainer.className = 'synth-keys-container';

  // First create and position all white keys
  const whiteKeys = displayedNotes.filter(noteInfo => !noteInfo.note.includes('#'));
  whiteKeys.forEach((noteInfo) => {
    const keyEl = document.createElement('div');
    keyEl.classList.add('synth-key');
    keyEl.textContent = noteInfo.note;
    keyEl.dataset.midiNote = noteInfo.midiNote;
    keysContainer.appendChild(keyEl);
  });

  // Then create and position all black keys
  const blackKeys = displayedNotes.filter(noteInfo => noteInfo.note.includes('#'));
  blackKeys.forEach((noteInfo) => {
    const keyEl = document.createElement('div');
    keyEl.classList.add('synth-key', 'black-key');
    keyEl.textContent = noteInfo.note;
    keyEl.dataset.midiNote = noteInfo.midiNote;
    keyEl.dataset.note = noteInfo.note; // Add this for CSS positioning
    
    keysContainer.appendChild(keyEl);
  });

  // Add event listeners to all keys
  keysContainer.querySelectorAll('.synth-key').forEach(keyEl => {
    keyEl.addEventListener('pointerdown', async e => {
      e.preventDefault();
      keyEl.setPointerCapture(e.pointerId);

      // Ensure Tone.js is started before any sound
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      startNote(keyEl, parseInt(keyEl.dataset.midiNote));
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
      if (looperRef?.isLooping && activeMidiNote !== null && startStep !== null) {
        const endStep = looperRef.currentStep;
        const chordNotes = buildChord(activeMidiNote, synthEngine.chordSize, keyRoot);
        looperRef.addNoteRecord(startStep, endStep,
          (time) => {
            chordNotes.forEach(midiNote => {
              const note = noteModel.midiToNote(midiNote);
              synthEngine.noteOn(note.freq, time);
            });
          },
          (time) => {
            chordNotes.forEach(midiNote => {
              const note = noteModel.midiToNote(midiNote);
              synthEngine.noteOff(note.freq, time);
            });
          }
        );
      }

      stopCurrentNote();
      activeKey = null;
      activeMidiNote = null;
      startStep = null;
    });

    keyEl.addEventListener('pointercancel', e => {
      e.preventDefault();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      stopCurrentNote();
      activeKey = null;
      activeMidiNote = null;
      startStep = null;
    });

    keyEl.addEventListener('pointermove', e => {
      e.preventDefault();
      if (e.buttons > 0 && e.currentTarget.hasPointerCapture(e.pointerId)) {
        const targetKey = document.elementFromPoint(e.clientX, e.clientY);
        if (targetKey?.classList.contains('synth-key') && targetKey !== activeKey) {
          // Get the actual MIDI note from the dataset
          const targetMidiNote = parseInt(targetKey.dataset.midiNote);
          startNote(targetKey, targetMidiNote);
        }
      }
    });
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
