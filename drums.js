import { looperRef } from './globalState.js';

export function initDrums(container) {
  const drumSounds = {
    kick: new Tone.Player('assets/drums/808-Kicks01.wav').toDestination(),
    snare: new Tone.Player('assets/drums/808-Snare01.wav').toDestination(),
    hihat: new Tone.Player('assets/drums/808-HiHats01.wav').toDestination(),
    clap: new Tone.Player('assets/drums/808-Clap02.wav').toDestination()
  };

  const pads = ['kick', 'snare', 'hihat', 'clap'];
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1'];

  // Create wrapper for pads
  const padsWrapper = document.createElement('div');
  padsWrapper.classList.add('drum-pads-wrapper');
  container.appendChild(padsWrapper);

  pads.forEach((sound, index) => {
    const padEl = document.createElement('div');
    padEl.classList.add('drum-pad');
    padEl.textContent = sound;
    padEl.style.backgroundColor = colors[index % colors.length];

    padEl.addEventListener('pointerdown', async () => {
      if (Tone.context.state !== 'running') await Tone.start();
      drumSounds[sound].start();
      padEl.classList.add('active');
      setTimeout(() => padEl.classList.remove('active'), 200);

      if (looperRef?.isLooping) {
        const currentStep = looperRef.currentStep;
        const playOnFn = (time) => {
          drumSounds[sound].start(time);
        };
        const playOffFn = () => {};

        looperRef.addNoteRecord(currentStep, currentStep + 1, playOnFn, playOffFn);
      }
    });

    padsWrapper.appendChild(padEl);  // Append to wrapper instead of container
  });
}