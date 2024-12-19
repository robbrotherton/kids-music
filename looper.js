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
    this.isRecording = false;
    this.isPaused = false;

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
      // Only show step indicator if we're recording or playing
      if (this.isLooping || this.isRecording) {
        this.updateStepHighlight(step);
      }
      
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
    this.isPaused = false;
    this.currentMeasureStartTime = Tone.Transport.seconds;
    Tone.Transport.start();
  }

  stop() {
    this.isLooping = false;
    this.isPaused = true;
    this.isRecording = false;  // Add this line to stop recording
    this.currentStep = 0;
    Tone.Transport.stop();  // Changed from pause() to stop()
    Tone.Transport.position = 0;  // Reset transport position
    
    // Always clear the step indicator when stopping
    this.updateStepHighlight(-1);
    
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
    // Show step indicator regardless of pause state
    this.stepDots.forEach((dot, index) => {
      if (currentStep === -1) {
        dot.classList.remove('current');  // Hide all indicators
      } else {
        dot.classList.toggle('current', index === currentStep);
      }
    });
  }

  clearAllEvents() {
    this.noteRecords = [];
    this.currentStep = 0;
    Tone.Transport.position = 0;  // Reset transport position
    // Always clear the step indicator when clearing events
    this.updateStepHighlight(-1);
  }

  setRecording(state) {
    this.isRecording = state;
  }

  addNoteRecord(startStep, endStep, playOnFn, playOffFn) {
    // Only add notes if we're recording
    if (!this.isRecording) return;
    
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
