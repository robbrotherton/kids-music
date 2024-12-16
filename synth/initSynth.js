import { SynthEngine } from './synthEngine.js';
import { createSynthUI } from './synthUI.js';

/**
 * initSynth is the single entry function that
 * 1) creates a new SynthEngine
 * 2) calls createSynthUI to build the dom controls
 * 3) returns the synthEngine for the rest of your app
 */
export function initSynth(container, looperRef) {
  const engine = new SynthEngine();
  createSynthUI(container, engine, looperRef);
  if (looperRef) {
    engine.setLooperRef(looperRef);
  }
  return engine;
}
