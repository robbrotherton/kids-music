import { initDrums } from './drums.js';
import { initSynth } from './synth/initSynth.js';
import { Looper } from './looper.js';
import { setLooperRef } from './globalState.js';

const drumViewBtn = document.getElementById('drum-view-btn');
const synthViewBtn = document.getElementById('synth-view-btn');
const drumView = document.getElementById('drum-view');
const synthView = document.getElementById('synth-view');
const loopToggleBtn = document.getElementById('loop-toggle-btn');
const statusSpan = document.getElementById('status');
const stepIndicatorContainer = document.getElementById('step-indicator');
const bpmInput = document.getElementById('bpm-input');

// 1) create drums
initDrums(drumView);

// 2) define BPM + looper
let bpm = parseInt(bpmInput.value, 10);
const beatsPerMeasure = 4;
let beatDuration = 60000 / bpm; // ms per beat

// 3) create looper without synth reference
let looper = new Looper(stepIndicatorContainer, beatsPerMeasure, beatDuration);

// 4) create synth (with looperRef)
const synth = initSynth(synthView, looper);

// 5) set the synth reference in the looper
looper.synthRef = synth;
setLooperRef(looper);

// 6) if the synth *really* needs the looperRef, call a setter:
if (synth.setLooperRef) {
  synth.setLooperRef(looper);
}

// toggle drum / synth views
drumViewBtn.addEventListener('click', () => {
  drumView.classList.add('active');
  synthView.classList.remove('active');
});
synthViewBtn.addEventListener('click', () => {
  synthView.classList.add('active');
  drumView.classList.remove('active');
});

// loop start/stop
loopToggleBtn.addEventListener('click', () => {
  if (!looper.isLooping) {
    looper.start();
    statusSpan.textContent = 'looping...';
    loopToggleBtn.textContent = 'stop loop';
  } else {
    looper.stop();
    statusSpan.textContent = 'not looping';
    loopToggleBtn.textContent = 'start loop';
    looper.clearAllEvents();
  }
});

// dynamically update BPM
bpmInput.addEventListener('change', (e) => {
  bpm = parseInt(e.target.value, 10);
  beatDuration = 60000 / bpm;

  const wasLooping = looper.isLooping;
  looper.stop();

  // remove old step indicator dots
  stepIndicatorContainer.innerHTML = '';

  // create new looper w/ new BPM
  looper = new Looper(stepIndicatorContainer, beatsPerMeasure, beatDuration, synth);
  setLooperRef(looper);

  if (synth.setLooperRef) {
    synth.setLooperRef(looper);
  }

  if (wasLooping) {
    looper.start();
    statusSpan.textContent = 'looping...';
    loopToggleBtn.textContent = 'stop loop';
  }
});
