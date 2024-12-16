export function getQuantizedStep(beats, subStepsPerBeat) {
    const measureDuration = beats * 500; // 4 * 500 = 2000ms
    const stepDuration = measureDuration / (beats * subStepsPerBeat); // 125ms
    const now = performance.now();
    const msInCurrentMeasure = now % measureDuration;
    const stepFloat = msInCurrentMeasure / stepDuration; 
    // snap to nearest step
    const step = Math.round(stepFloat);
    // clamp to 0..(beats*subStepsPerBeat - 1)
    return Math.min(step, beats * subStepsPerBeat - 1);
  }

export function getQuantizedStep(beats, subStepsPerBeat) {
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