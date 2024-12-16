export class Looper {
    constructor(beatIndicator, beats = 4, beatDuration = 500, synthRef = null) {
      this.beatIndicator = beatIndicator;
      this.beats = beats;
      this.beatDuration = beatDuration;
      this.measureDuration = beats * beatDuration;
      this.synthRef = synthRef;  // optional reference if you wanna forcibly stop all osc
  
      this.isLooping = false;
      this.currentMeasureStartTime = null;
  
      this.loopTimer = null;
      this.scheduledTimeouts = []; // store handles for setTimeout calls
  
      // each record: { startBeat, endBeat, playOnFn, playOffFn }
      this.noteRecords = [];
    }
  
    start() {
      if (this.isLooping) return;
      this.isLooping = true;
      this.scheduleNextLoop();
    }
  
    stop() {
      this.isLooping = false;
      
      // clear the main loop timer
      clearTimeout(this.loopTimer);
  
      // clear all setTimeout calls
      this.scheduledTimeouts.forEach(handle => clearTimeout(handle));
      this.scheduledTimeouts = [];
  
      // forcibly stop *any currently playing notes* if you have a handle to the synth
      if (this.synthRef) {
        this.synthRef.stopAllOscillators?.();
      }
    }
  
    scheduleNextLoop() {
      if (!this.isLooping) return;
      this.currentMeasureStartTime = performance.now();
  
      // schedule note-ons/note-offs
      this.noteRecords.forEach(record => {
        const onDelay = record.startBeat * this.beatDuration;
        const offDelay = record.endBeat * this.beatDuration;
  
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
  
      // beat indicator logic
      let beatCounter = 0;
      const beatInterval = setInterval(() => {
        if (!this.isLooping) {
          clearInterval(beatInterval);
          return;
        }
        beatCounter = (beatCounter + 1) % this.beats;
        this.beatIndicator.textContent = `beat: ${beatCounter + 1}/${this.beats}`;
      }, this.beatDuration);
  
      // schedule next measure
      this.loopTimer = setTimeout(() => {
        clearInterval(beatInterval);
        this.scheduledTimeouts = []; // reset the array bc these timeouts are done
        this.scheduleNextLoop(); 
      }, this.measureDuration);
    }
  
    clearAllEvents() {
      this.noteRecords = [];
    }
  
    addNoteRecord(startBeat, endBeat, playOnFn, playOffFn) {
      if (endBeat > this.beats) endBeat = this.beats;
      this.noteRecords.push({ startBeat, endBeat, playOnFn, playOffFn });
    }
  }
  