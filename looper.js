export class Looper {
    constructor(beatIndicator, beats = 4) {
      this.beatIndicator = beatIndicator;
      this.beats = beats;           // how many beats per loop
      this.isLooping = false;
      this.loopInterval = null;
      this.beatDuration = 500;      // ms per beat
      this.currentBeat = 0;
  
      // array of length = number of beats. each element is an array of "events"
      // an event is { type: 'drum'|'synth', sound: 'kick'|'snare'|frequencyNumber }
      this.recordedEvents = Array.from({ length: this.beats }, () => []);
    }
  
    start() {
      if (this.isLooping) return;
      this.isLooping = true;
      this.currentBeat = -1;
  
      this.loopInterval = setInterval(() => {
        this.currentBeat = (this.currentBeat + 1) % this.beats;
        this.updateBeatIndicator();
        // replay all events stored for this beat
        const events = this.recordedEvents[this.currentBeat];
        events.forEach(evt => {
          evt.playFn(); // we store a direct reference to the play function
        });
      }, this.beatDuration);
    }
  
    stop() {
      if (!this.isLooping) return;
      this.isLooping = false;
      clearInterval(this.loopInterval);
    }
  
    updateBeatIndicator() {
      this.beatIndicator.textContent = `beat: ${this.currentBeat + 1}/${this.beats}`;
    }
  
    // record an event in the current beat. 
    // pass in the function to call when that beat is triggered
    recordEvent(playFn) {
      if (!this.isLooping) return; // only record if loop is running
      this.recordedEvents[this.currentBeat].push({ playFn });
    }
  
    clearAllEvents() {
      this.recordedEvents = Array.from({ length: this.beats }, () => []);
    }
  }
  