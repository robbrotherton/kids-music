import { looperRef } from './globalState.js';

export class Synthesizer {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.waveform = 'sine';
    this.volume = 0.5;
  }

  playNote(freq, duration = 0.5) {
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
}

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

  noteData.forEach(n => {
    const keyEl = document.createElement('div');
    keyEl.classList.add('synth-key');
    keyEl.textContent = n.note;

    keyEl.addEventListener('pointerdown', () => {
      // immediate playback
      synth.playNote(n.freq);

      // record in looper if active
      if (looperRef && looperRef.isLooping) {
        looperRef.recordEvent(() => {
          synth.playNote(n.freq);
        });
      }

      keyEl.classList.add('active');
      setTimeout(() => keyEl.classList.remove('active'), 200);
    });
    container.appendChild(keyEl);
  });

  // waveform selector
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
}
