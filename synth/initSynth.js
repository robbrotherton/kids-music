import { SynthEngine } from './synthEngine.js';
import { createSynthUI } from './synthUI.js';

/**
 * initSynth is the single entry function that
 * 1) creates a new SynthEngine
 * 2) calls createSynthUI to build the dom controls
 * 3) returns the synthEngine for the rest of your app
 */
export async function initSynth(container, looperRef) {
  const engine = await new SynthEngine().initialize();
  createSynthUI(container, engine, looperRef);
  if (looperRef) {
    engine.setLooperRef(looperRef);
    looperRef.synthRef = engine;  // Add this line to ensure bidirectional reference
  }

  // Initialize Tone.js context on user interaction
  container.addEventListener('click', async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
      console.log('Tone.js context started');
    }
  });

  return engine;
}
