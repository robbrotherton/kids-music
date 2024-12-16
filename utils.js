import { looperRef } from './globalState.js';

export function getQuantizedStep(beats=4, subStepsPerBeat=4) {
  if (!looperRef) return 0; // fallback if no looper

  const beatMs = looperRef.beatDuration; // or read from looperRef
  const measureDuration = beats * beatMs;
  const stepDuration = measureDuration / (beats * subStepsPerBeat);

  const now = performance.now();
  const measureStart = looperRef.currentMeasureStartTime || now; 
  const msSinceStart = (now - measureStart) % measureDuration;

  const stepFloat = msSinceStart / stepDuration;
  const step = Math.round(stepFloat);
  console.log(Math.min(step, beats * subStepsPerBeat - 1));
  return Math.min(step, beats * subStepsPerBeat - 1);
}
