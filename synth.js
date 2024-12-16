import { looperRef } from './globalState.js';

export class Synthesizer {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.waveform = 'sine';
    this.volume = 0.5;
    this.currentKey = 'C';       // the global key
    this.chordMode = true;
  }

  playNote(freq, duration = 0.5) {
    // spawn an oscillator, connect gain, play for duration
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = this.waveform;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  // if chord mode is on, play triad
  // otherwise single note
  playChord(rootIndex, noteData) {
    if (!this.chordMode) {
      // just play single note
      this.playNote(noteData[rootIndex].freq);
      return;
    }
    // in major scale chord logic, these chord qualities hold:
    // index:  0   1    2    3   4    5    6
    // chord:  I   ii   iii  IV  V    vi   vii°
    // intervals are different depending on major/minor/dim
    // but let's just store precomputed triads for each key

    // basic triads in the key of C for indices 0..6:
    // C(0) = C, E, G
    // D(1) = D, F, A
    // E(2) = E, G, B
    // F(3) = F, A, C
    // G(4) = G, B, D
    // A(5) = A, C, E
    // B(6) = B, D, F

    // let's do a quick approach: figure out the offsets in semitones
    // or we can map them directly from noteData if it's always 7 notes in a row
    // but simpler: just store the triad indices
    const triads = [
      [0, 2, 4], // I
      [1, 3, 5], // ii
      [2, 4, 6], // iii
      [3, 5, 0], // IV
      [4, 6, 1], // V
      [5, 0, 2], // vi
      [6, 1, 3], // vii°
    ];

    const triad = triads[rootIndex];
    triad.forEach(idx => {
      const freq = noteData[idx].freq;
      this.playNote(freq);
    });
  }
}

export function initSynth(container) {
  const synth = new Synthesizer();
  // 7 notes in a single octave (like before)
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

    keyEl.addEventListener('pointerdown', () => {
      // immediate chord
      synth.playChord(i, noteData);

      // record chord event for looper
      if (looperRef && looperRef.isLooping) {
        looperRef.recordEvent(() => {
          synth.playChord(i, noteData);
        });
      }

      keyEl.classList.add('active');
      setTimeout(() => keyEl.classList.remove('active'), 200);
    });
    container.appendChild(keyEl);
  });

  // add some controls
  // waveform select
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
}
