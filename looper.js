export class Looper {
    constructor(stepIndicatorContainer, beats = 4, beatDuration = 500, synthRef = null) {
      this.beats = beats;          // typically 4
      this.subStepsPerBeat = 4;    // for 16 steps total
      this.stepsPerMeasure = this.beats * this.subStepsPerBeat; // 16
      this.beatDuration = beatDuration;
      this.stepDuration = beatDuration / this.subStepsPerBeat; // e.g. 125ms
      this.measureDuration = this.beats * this.beatDuration;   // 2000ms
  
      this.synthRef = synthRef;
      this.isLooping = false;
  
      this.loopTimer = null;
      this.scheduledTimeouts = [];
  
      this.noteRecords = [];
  
      // build 16 dots in the stepIndicatorContainer
      this.stepDots = [];
      for (let i = 0; i < this.stepsPerMeasure; i++) {
        const dotEl = document.createElement('div');
        dotEl.classList.add('dot');
        if (i % 4 === 0) {
          dotEl.classList.add('main-beat');
        }
        this.stepDots.push(dotEl);
        stepIndicatorContainer.appendChild(dotEl);
      }
      // highlight none initially
      this.updateStepHighlight(-1);
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
  
      // schedule note on/off for each record
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
  
      // highlight step dots over the measure
      let currentStep = 0;
      const stepInterval = setInterval(() => {
        if (!this.isLooping) {
          clearInterval(stepInterval);
          return;
        }
        this.updateStepHighlight(currentStep);
        currentStep = (currentStep + 1) % this.stepsPerMeasure;
      }, this.stepDuration);
  
      this.loopTimer = setTimeout(() => {
        clearInterval(stepInterval);
        this.scheduledTimeouts = [];
        this.scheduleNextLoop(); 
      }, this.measureDuration);
    }
  
    updateStepHighlight(currentStep) {
      this.stepDots.forEach((dot, index) => {
        if (index === currentStep) {
          dot.classList.add('current');
        } else {
          dot.classList.remove('current');
        }
      });
    }
  
    clearAllEvents() {
      this.noteRecords = [];
    }
  
    addNoteRecord(startStep, endStep, playOnFn, playOffFn) {
      // clamp or wrap as needed
      if (startStep >= this.stepsPerMeasure) {
        startStep = this.stepsPerMeasure - 1;
      }
      if (endStep >= this.stepsPerMeasure) {
        endStep = this.stepsPerMeasure - 1;
      }
      if (endStep < startStep) endStep = startStep;
  
      this.noteRecords.push({ startStep, endStep, playOnFn, playOffFn });
    }
  }
  