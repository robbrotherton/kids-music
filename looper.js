export class Looper {
    constructor(beatIndicator, beats = 4, beatDuration = 500, synthRef = null) {
      this.beatIndicator = beatIndicator;
      this.beats = beats;          // 4
      this.subStepsPerBeat = 4;    // for 16th-note resolution
      this.stepsPerMeasure = this.beats * this.subStepsPerBeat; // 16 steps total
      this.beatDuration = beatDuration; // ms for a single beat
      this.stepDuration = beatDuration / this.subStepsPerBeat;  // ms per step
      this.measureDuration = this.beats * this.beatDuration;  // total ms per measure
  
      this.synthRef = synthRef;
  
      this.isLooping = false;
      this.loopTimer = null;
      this.scheduledTimeouts = [];
  
      // each record: { startStep, endStep, playOnFn, playOffFn }
      this.noteRecords = [];
    }
  
    start() {
      if (this.isLooping) return;
      this.isLooping = true;
      this.scheduleNextLoop();
    }
  
    stop() {
      this.isLooping = false;
      clearTimeout(this.loopTimer);
      this.scheduledTimeouts.forEach(handle => clearTimeout(handle));
      this.scheduledTimeouts = [];
  
      if (this.synthRef?.stopAllOscillators) {
        this.synthRef.stopAllOscillators();
      }
    }
  
    scheduleNextLoop() {
      if (!this.isLooping) return;
  
      // schedule note-on/off for each record
      this.noteRecords.forEach(record => {
        const onDelay = record.startStep * this.stepDuration;
        const offDelay = record.endStep * this.stepDuration;
  
        const onHandle = setTimeout(() => {
          if (!this.isLooping) return;
          record.playOnFn && record.playOnFn();
        }, onDelay);
        this.scheduledTimeouts.push(onHandle);
  
        const offHandle = setTimeout(() => {
          if (!this.isLooping) return;
          record.playOffFn && record.playOffFn();
        }, offDelay);
        this.scheduledTimeouts.push(offHandle);
      });
  
      // beat indicator (just updates every beat, not step)
      let beatCounter = 0;
      const beatInterval = setInterval(() => {
        if (!this.isLooping) {
          clearInterval(beatInterval);
          return;
        }
        beatCounter = (beatCounter + 1) % this.beats;
        this.beatIndicator.textContent = `beat: ${beatCounter + 1}/${this.beats}`;
      }, this.beatDuration);
  
      // loop timer
      this.loopTimer = setTimeout(() => {
        clearInterval(beatInterval);
        this.scheduledTimeouts = [];
        this.scheduleNextLoop(); 
      }, this.measureDuration);
    }
  
    clearAllEvents() {
      this.noteRecords = [];
    }
  
    addNoteRecord(startStep, endStep, playOnFn, playOffFn) {
      // clamp to [0..stepsPerMeasure]
      if (startStep < 0) startStep = 0;
      if (endStep < 0) endStep = 0;
      if (startStep >= this.stepsPerMeasure) startStep = this.stepsPerMeasure - 1;
      if (endStep >= this.stepsPerMeasure) endStep = this.stepsPerMeasure - 1;
  
      // if endStep < startStep, you can decide to interpret that differently, 
      // or treat them as a short one-step event
      if (endStep < startStep) endStep = startStep;
  
      this.noteRecords.push({ startStep, endStep, playOnFn, playOffFn });
    }
  }
  