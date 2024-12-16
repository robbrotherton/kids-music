import { looperRef } from './globalState.js';
import { getQuantizedStep } from './utils.js';

export function initDrums(container) {

  const drumSounds = {
    kick: new Audio('assets/drums/808-Kicks01.wav'),
    snare: new Audio('assets/drums/808-Snare01.wav'),
    hihat: new Audio('assets/drums/808-HiHats01.wav'),
    clap: new Audio('assets/drums/808-Clap02.wav'),
  };

  const pads = ['kick', 'snare', 'hihat', 'clap'];
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1']; // Add more colors as needed

  pads.forEach((sound, index) => {
    const padEl = document.createElement('div');
    padEl.classList.add('drum-pad');
    padEl.textContent = sound;
    padEl.style.backgroundColor = colors[index % colors.length]; // Assign color from palette

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