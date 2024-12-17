export class Looper {
  constructor(stepIndicatorContainer, beats = 4, beatDuration = 500, synthRef = null) {
    this.beats = beats;
    this.subStepsPerBeat = 4; // 16 steps total
    this.stepsPerMeasure = this.beats * this.subStepsPerBeat;
    this.beatDuration = beatDuration; // ms per beat, from BPM
    this.stepDuration = this.beatDuration / this.subStepsPerBeat;
    this.measureDuration = this.beats * this.beatDuration;

    this.synthRef = synthRef;
    this.isLooping = false;

    this.noteRecords = [];
    this.stepDots = [];
    this.currentStep = 0; // Initialize currentStep

    // build the 16-step indicator
    for (let i = 0; i < this.stepsPerMeasure; i++) {
      const dotEl = document.createElement('div');
      dotEl.classList.add('dot');
      if (i % 4 === 0) {
        dotEl.classList.add('main-beat');
      }
      this.stepDots.push(dotEl);
      stepIndicatorContainer.appendChild(dotEl);
    }
    this.updateStepHighlight(-1);

    // Tone.js Transport setup - simplified
    Tone.Transport.timeSignature = beats;
    Tone.Transport.bpm.value = 60000 / this.beatDuration;
    
    // Single unified sequencer
    this.sequence = new Tone.Sequence((time, step) => {
      this.currentStep = step;
      this.updateStepHighlight(step);
      
      // Process notes for this step
      this.noteRecords.forEach(record => {
        const stepInMeasure = record.startStep % this.stepsPerMeasure;
        if (stepInMeasure === step) {
          record.playOnFn(time);
        }
        if ((record.endStep % this.stepsPerMeasure) === step) {
          record.playOffFn(time);
        }
      });
    }, [...Array(this.stepsPerMeasure).keys()], "16n").start(0);
  }

  start() {
    if (this.isLooping) return;
    this.isLooping = true;
    this.currentMeasureStartTime = Tone.Transport.seconds;
    Tone.Transport.start();
  }

  stop() {
    this.isLooping = false;
    Tone.Transport.stop();
    console.log('Looper stopped');
    this.updateStepHighlight(-1); // Clear step indicator

    // Make sure to release all notes and reset synth state
    if (this.synthRef) {
      this.noteRecords.forEach(record => {
        record.playOffFn && record.playOffFn();
      });
      if (typeof this.synthRef.stopAllOscillators === 'function') {
        this.synthRef.stopAllOscillators();
      }
    }
  }

  updateStepHighlight(currentStep) {
    this.stepDots.forEach((dot, index) => {
      dot.classList.toggle('current', index === currentStep);
    });
  }

  clearAllEvents() {
    this.noteRecords = [];
  }

  addNoteRecord(startStep, endStep, playOnFn, playOffFn) {
    if (startStep >= this.stepsPerMeasure * 2) startStep = this.stepsPerMeasure * 2 - 1;
    if (endStep >= this.stepsPerMeasure * 2) endStep = this.stepsPerMeasure * 2 - 1;
    if (endStep < startStep) endStep = startStep;
    
    this.noteRecords.push({ startStep, endStep, playOnFn, playOffFn });
  }

  setBeatDuration(newBeatDuration) {
    this.beatDuration = newBeatDuration;
    this.stepDuration = this.beatDuration / this.subStepsPerBeat;
    this.measureDuration = this.beats * this.beatDuration;
    Tone.Transport.bpm.value = 60000 / this.beatDuration;
    console.log(`Beat duration set to ${this.beatDuration} ms, BPM: ${Tone.Transport.bpm.value}`);
  }
}
