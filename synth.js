import { looperRef } from './globalState.js';

let oscIdCounter = 0;

export class Synthesizer {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.waveform = 'sine';
    this.volume = 0.5;
    this.chordMode = true;
    this.activeOscillators = {};
  }

  noteOn(freq) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = this.waveform;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();

    const id = 'osc_' + (oscIdCounter++);
    this.activeOscillators[id] = { osc, gain };
    return id;
  }

  noteOff(oscId) {
    if (!this.activeOscillators[oscId]) return;
    const { osc, gain } = this.activeOscillators[oscId];
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.2);
    osc.stop(this.audioCtx.currentTime + 0.21);
    delete this.activeOscillators[oscId];
  }

  stopAllOscillators() {
    Object.keys(this.activeOscillators).forEach(id => {
      this.noteOff(id);
    });
  }

  playChordOn(rootIndex, noteData) {
    // if chordMode is off, single note only
    if (!this.chordMode) {
      return [this.noteOn(noteData[rootIndex].freq)];
    }
    // diatonic triads in a major scale
    const triads = [
      [0, 2, 4],
      [1, 3, 5],
      [2, 4, 6],
      [3, 5, 0],
      [4, 6, 1],
      [5, 0, 2],
      [6, 1, 3]
    ];
    const chordIndices = triads[rootIndex];
    return chordIndices.map(idx => this.noteOn(noteData[idx].freq));
  }

  playChordOff(oscIds) {
    oscIds.forEach(id => this.noteOff(id));
  }
}

/**
 * initSynth creates a new Synthesizer instance, builds the UI,
 * and returns the synth instance so we can pass it to the looper.
 */
export function initSynth(container) {
  const synth = new Synthesizer();

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

    keyEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startStep = getQuantizedStep(4, 4); // pick step 0..15

      playingOscIds = synth.playChordOn(i, noteData);
      keyEl.classList.add('active');
    });

    keyEl.addEventListener('pointerup', (e) => {
      e.preventDefault();
      const endStep = getQuantizedStep(4, 4);

      const chordIds = [...playingOscIds];
      synth.playChordOff(chordIds);

      keyEl.classList.remove('active');
      playingOscIds = [];

      if (looperRef?.isLooping && startStep !== null) {
        const wave = synth.waveform;
        const vol = synth.volume;
        const isChord = synth.chordMode;
        const chordIndex = i;

        let replayOscIds = null;
        const playOnFn = () => {
          replayOscIds = chordIndicesToOscIDs(chordIndex, isChord, wave, vol, synth);
        };
        const playOffFn = () => {
          if (replayOscIds) {
            replayOscIds.forEach(id => synth.noteOff(id));
            replayOscIds = null;
          }
        };

        looperRef.addNoteRecord(startStep, endStep, playOnFn, playOffFn);
      }
      startStep = null;
    });

    // pointercancel/pointerleave => stop note
    ['pointercancel','pointerleave'].forEach(evtName => {
      keyEl.addEventListener(evtName, () => {
        if (playingOscIds.length) {
          synth.playChordOff(playingOscIds);
          playingOscIds = [];
          keyEl.classList.remove('active');
        }
      });
    });

    container.appendChild(keyEl);
  });

  // waveform dropdown
  const waveSelect = document.createElement('select');
  ['sine', 'square', 'sawtooth', 'triangle'].forEach(w => {
    const opt = document.createElement('option');
    opt.value = w;
    opt.textContent = w;
    waveSelect.appendChild(opt);
  });
  waveSelect.addEventListener('change', e => synth.waveform = e.target.value);
  container.appendChild(waveSelect);

  // volume slider
  const volSlider = document.createElement('input');
  volSlider.type = 'range';
  volSlider.min = 0;
  volSlider.max = 1;
  volSlider.step = 0.1;
  volSlider.value = 0.5;
  volSlider.addEventListener('input', e => synth.volume = parseFloat(e.target.value));
  container.appendChild(volSlider);

  // chord mode toggle
  const chordToggleLabel = document.createElement('label');
  chordToggleLabel.textContent = ' chord mode ';
  const chordToggle = document.createElement('input');
  chordToggle.type = 'checkbox';
  chordToggle.checked = true;
  chordToggle.addEventListener('change', () => synth.chordMode = chordToggle.checked);
  chordToggleLabel.appendChild(chordToggle);
  container.appendChild(chordToggleLabel);

  return synth; // <--- return the created synth
}

// utility to get fractional beat
function getFractionalBeat() {
  // 4 beats * 500ms each => 2000ms per measure
  // how far into the measure are we?
  const now = performance.now();
  const msThisMeasure = now % 2000; 
  const fracBeat = msThisMeasure / 500; 
  return fracBeat;
}

// utility to replicate chord logic
function chordIndicesToOscIDs(rootIndex, chordMode, wave, volume, synth) {
  const triads = [
    [0,2,4],[1,3,5],[2,4,6],[3,5,0],
    [4,6,1],[5,0,2],[6,1,3]
  ];
  const noteData = [
    { freq: 261.63 },{ freq: 293.66 },{ freq: 329.63 },
    { freq: 349.23 },{ freq: 392.00 },{ freq: 440.00 },{ freq: 493.88 },
  ];

  synth.waveform = wave;
  synth.volume = volume;

  if (!chordMode) {
    return [ synth.noteOn(noteData[rootIndex].freq) ];
  }
  const chordIndices = triads[rootIndex];
  return chordIndices.map(idx => synth.noteOn(noteData[idx].freq));
}


function getQuantizedStep(beats, subStepsPerBeat) {
    const measureDuration = beats * 500; // 4 * 500 = 2000ms
    const stepDuration = measureDuration / (beats * subStepsPerBeat); // 125ms
    const now = performance.now();
    const msInCurrentMeasure = now % measureDuration;
    const stepFloat = msInCurrentMeasure / stepDuration; 
    // snap to nearest step
    const step = Math.round(stepFloat);
    // clamp to 0..(beats*subStepsPerBeat - 1)
    return Math.min(step, beats * subStepsPerBeat - 1);
  }