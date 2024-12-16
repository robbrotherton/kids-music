import { looperRef } from './globalState.js';

export function initDrums(container) {
  const drumSounds = {
    kick: new Audio('assets/drums/808-Kicks01.wav'),
    snare: new Audio('assets/drums/808-Snare01.wav'),
    hihat: new Audio('assets/drums/808-HiHats01.wav'),
    clap: new Audio('assets/drums/808-Clap02.wav'),
  };

  const pads = ['kick', 'snare', 'hihat', 'clap'];
  pads.forEach(sound => {
    const padEl = document.createElement('div');
    padEl.classList.add('drum-pad');
    padEl.textContent = sound;

    padEl.addEventListener('pointerdown', () => {
      drumSounds[sound].currentTime = 0;
      drumSounds[sound].play();
      padEl.classList.add('active');
      setTimeout(() => padEl.classList.remove('active'), 200);

      if (looperRef?.isLooping) {
        const step = getQuantizedStep(4, 4); 
        // record an event lasting just 1 step
        const playOnFn = () => {
          drumSounds[sound].currentTime = 0;
          drumSounds[sound].play();
        };
        const playOffFn = () => {};

        looperRef.addNoteRecord(step, step + 1, playOnFn, playOffFn);
      }
    });

    container.appendChild(padEl);
  });
}

function getQuantizedStep(beats, subStepsPerBeat) {
  // each measure has beats * subStepsPerBeat steps (16)
  const measureDuration = beats * 500; // 4 beats * 500ms each = 2000ms
  const stepDuration = measureDuration / (beats * subStepsPerBeat); // 2000 / 16 = 125ms
  // find time mod measure
  const now = performance.now();
  const msInCurrentMeasure = now % measureDuration;
  // figure out which step
  const stepFloat = msInCurrentMeasure / stepDuration; // float in [0..16)
  const step = Math.round(stepFloat); // nearest step
  return step;
}