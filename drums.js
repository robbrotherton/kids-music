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
      // play immediately
      drumSounds[sound].currentTime = 0;
      drumSounds[sound].play();

      // if the looper is running, record a playback event for the current beat
      if (looperRef && looperRef.isLooping) {
        looperRef.recordEvent(() => {
          drumSounds[sound].currentTime = 0;
          drumSounds[sound].play();
        });
      }

      padEl.classList.add('active');
      setTimeout(() => padEl.classList.remove('active'), 200);
    });
    container.appendChild(padEl);
  });
}
