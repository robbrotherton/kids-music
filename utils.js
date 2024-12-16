export function getQuantizedStep(beats = 4, subStepsPerBeat = 4, beatMs = 500) {
    // one measure = beats * beatMs, e.g. 4 beats * 500ms = 2000ms
    const measureDuration = beats * beatMs;
    const stepDuration = measureDuration / (beats * subStepsPerBeat); // e.g. 125ms
    const now = performance.now();
    const msInMeasure = now % measureDuration;
    const stepFloat = msInMeasure / stepDuration;
    const step = Math.round(stepFloat);
    // clamp
    console.log(Math.min(step, beats * subStepsPerBeat - 1));
    return Math.min(step, beats * subStepsPerBeat - 1);
  }
  