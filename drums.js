import { looperRef } from './globalState.js';

function getFractionalBeat() {
  // 4 beats, 500ms each => 2000ms measure
  // figure out fractional beat from performance.now()
  const now = performance.now();
  const msThisMeasure = now % 2000; 
  const fracBeat = msThisMeasure / 500;
  return fracBeat;
}

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
      // play instantly
      drumSounds[sound].currentTime = 0;
      drumSounds[sound].play();
      padEl.classList.add('active');
      setTimeout(() => padEl.classList.remove('active'), 200);

      if (looperRef?.isLooping) {
        // record a note that starts & ends almost immediately
        // so it re-triggers each loop
        const startBeat = getFractionalBeat();
        const endBeat = startBeat + 0.05; // just 1/20th of a beat for a quick drum

        const playOnFn = () => {
          drumSounds[sound].currentTime = 0;
          drumSounds[sound].play();
        };
        // single-shot drum has no real "off" event, but let's define an empty func
        const playOffFn = () => {};

        looperRef.addNoteRecord(startBeat, endBeat, playOnFn, playOffFn);
      }
    });

    container.appendChild(padEl);
  });
}
