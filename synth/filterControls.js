/**
 * filterControls.js
 * provides a cutoff frequency slider for the synth
 */

export function createFilterControls(container, synthEngine) {
  const cutoffLabel = document.createElement('label');
  cutoffLabel.textContent = ' cutoff freq ';
  const cutoffSlider = document.createElement('input');
  cutoffSlider.type = 'range';
  cutoffSlider.min = 0;
  cutoffSlider.max = 100;
  cutoffSlider.value = 100;  // default
  cutoffSlider.step = 1;

  cutoffSlider.addEventListener('input', e => {
    const linearValue = parseFloat(e.target.value);
    const minFreq = 20;
    const maxFreq = 20000;
    const logValue = minFreq * Math.pow(maxFreq / minFreq, linearValue / 100);
    synthEngine.setCutoffFrequency(logValue);
  });

  cutoffLabel.appendChild(cutoffSlider);
  container.appendChild(cutoffLabel);

  // Tremolo Rate Control
  const tremoloRateLabel = document.createElement('label');
  tremoloRateLabel.textContent = ' tremolo rate ';
  const tremoloRateSlider = document.createElement('input');
  tremoloRateSlider.type = 'range';
  tremoloRateSlider.min = 0.1;
  tremoloRateSlider.max = 10;
  tremoloRateSlider.value = 4;  // default to 4Hz
  tremoloRateSlider.step = 0.1;

  tremoloRateSlider.addEventListener('input', e => {
    synthEngine.setTremoloRate(parseFloat(e.target.value));
  });

  tremoloRateLabel.appendChild(tremoloRateSlider);
  container.appendChild(tremoloRateLabel);

  // Tremolo Depth Control
  const tremoloDepthLabel = document.createElement('label');
  tremoloDepthLabel.textContent = ' tremolo depth ';
  const tremoloDepthSlider = document.createElement('input');
  tremoloDepthSlider.type = 'range';
  tremoloDepthSlider.min = 0;
  tremoloDepthSlider.max = 1;
  tremoloDepthSlider.value = 0;  // start with no effect
  tremoloDepthSlider.step = 0.01;

  tremoloDepthSlider.addEventListener('input', e => {
    synthEngine.setTremoloDepth(parseFloat(e.target.value));
  });

  tremoloDepthLabel.appendChild(tremoloDepthSlider);
  container.appendChild(tremoloDepthLabel);

  // Vibrato Rate Control
  const vibratoRateLabel = document.createElement('label');
  vibratoRateLabel.textContent = ' vibrato rate ';
  const vibratoRateSlider = document.createElement('input');
  vibratoRateSlider.type = 'range';
  vibratoRateSlider.min = 0.1;
  vibratoRateSlider.max = 10;
  vibratoRateSlider.value = 5;  // natural vibrato rate
  vibratoRateSlider.step = 0.1;

  vibratoRateSlider.addEventListener('input', e => {
    synthEngine.setVibratoRate(parseFloat(e.target.value));
  });

  vibratoRateLabel.appendChild(vibratoRateSlider);
  container.appendChild(vibratoRateLabel);

  // Vibrato Depth Control
  const vibratoDepthLabel = document.createElement('label');
  vibratoDepthLabel.textContent = ' vibrato depth ';
  const vibratoDepthSlider = document.createElement('input');
  vibratoDepthSlider.type = 'range';
  vibratoDepthSlider.min = 0;
  vibratoDepthSlider.max = 0.5;  // reduced max range
  vibratoDepthSlider.value = 0;  // start with no effect
  vibratoDepthSlider.step = 0.01;

  vibratoDepthSlider.addEventListener('input', e => {
    synthEngine.setVibratoDepth(parseFloat(e.target.value));
  });

  vibratoDepthLabel.appendChild(vibratoDepthSlider);
  container.appendChild(vibratoDepthLabel);

  // Delay Time Control
  const delayTimeLabel = document.createElement('label');
  delayTimeLabel.textContent = ' delay time ';
  const delayTimeSlider = document.createElement('input');
  delayTimeSlider.type = 'range';
  delayTimeSlider.min = 0.05;
  delayTimeSlider.max = 1.0;
  delayTimeSlider.value = 0.25;
  delayTimeSlider.step = 0.05;

  delayTimeSlider.addEventListener('input', e => {
    synthEngine.setDelayTime(parseFloat(e.target.value));
  });

  delayTimeLabel.appendChild(delayTimeSlider);
  container.appendChild(delayTimeLabel);

  // Delay Feedback Control
  const delayFeedbackLabel = document.createElement('label');
  delayFeedbackLabel.textContent = ' delay feedback ';
  const delayFeedbackSlider = document.createElement('input');
  delayFeedbackSlider.type = 'range';
  delayFeedbackSlider.min = 0;
  delayFeedbackSlider.max = 0.9;
  delayFeedbackSlider.value = 0.2;
  delayFeedbackSlider.step = 0.05;

  delayFeedbackSlider.addEventListener('input', e => {
    synthEngine.setDelayFeedback(parseFloat(e.target.value));
  });

  delayFeedbackLabel.appendChild(delayFeedbackSlider);
  container.appendChild(delayFeedbackLabel);

  // Delay Wet Control
  const delayWetLabel = document.createElement('label');
  delayWetLabel.textContent = ' delay mix ';
  const delayWetSlider = document.createElement('input');
  delayWetSlider.type = 'range';
  delayWetSlider.min = 0;
  delayWetSlider.max = 1;
  delayWetSlider.value = 0;  // start with no effect
  delayWetSlider.step = 0.05;

  delayWetSlider.addEventListener('input', e => {
    synthEngine.setDelayWet(parseFloat(e.target.value));
  });

  delayWetLabel.appendChild(delayWetSlider);
  container.appendChild(delayWetLabel);

  // Reverb Decay Control
  const reverbDecayLabel = document.createElement('label');
  reverbDecayLabel.textContent = ' reverb size ';
  const reverbDecaySlider = document.createElement('input');
  reverbDecaySlider.type = 'range';
  reverbDecaySlider.min = 0.1;
  reverbDecaySlider.max = 10;
  reverbDecaySlider.value = 2.5;
  reverbDecaySlider.step = 0.1;

  reverbDecaySlider.addEventListener('input', e => {
    synthEngine.setReverbDecay(parseFloat(e.target.value));
  });

  reverbDecayLabel.appendChild(reverbDecaySlider);
  container.appendChild(reverbDecayLabel);

  // Reverb Wet Control
  const reverbWetLabel = document.createElement('label');
  reverbWetLabel.textContent = ' reverb mix ';
  const reverbWetSlider = document.createElement('input');
  reverbWetSlider.type = 'range';
  reverbWetSlider.min = 0;
  reverbWetSlider.max = 1;
  reverbWetSlider.value = 0;  // start with no effect
  reverbWetSlider.step = 0.05;

  reverbWetSlider.addEventListener('input', e => {
    synthEngine.setReverbWet(parseFloat(e.target.value));
  });

  reverbWetLabel.appendChild(reverbWetSlider);
  container.appendChild(reverbWetLabel);

  // Wah Rate Control
  const wahRateLabel = document.createElement('label');
  wahRateLabel.textContent = ' wah rate ';
  const wahRateSlider = document.createElement('input');
  wahRateSlider.type = 'range';
  wahRateSlider.min = 0.1;
  wahRateSlider.max = 10;
  wahRateSlider.value = 4;
  wahRateSlider.step = 0.1;

  wahRateSlider.addEventListener('input', e => {
    synthEngine.setWahRate(parseFloat(e.target.value));
  });

  wahRateLabel.appendChild(wahRateSlider);
  container.appendChild(wahRateLabel);

  // Wah Depth Control
  const wahDepthLabel = document.createElement('label');
  wahDepthLabel.textContent = ' wah depth ';
  const wahDepthSlider = document.createElement('input');
  wahDepthSlider.type = 'range';
  wahDepthSlider.min = 0;
  wahDepthSlider.max = 1;
  wahDepthSlider.value = 0;  // start with no effect
  wahDepthSlider.step = 0.01;

  wahDepthSlider.addEventListener('input', e => {
    synthEngine.setWahDepth(parseFloat(e.target.value));
  });

  wahDepthLabel.appendChild(wahDepthSlider);
  container.appendChild(wahDepthLabel);

  // Attack Time Control
  const attackLabel = document.createElement('label');
  attackLabel.textContent = ' attack ';
  const attackSlider = document.createElement('input');
  attackSlider.type = 'range';
  attackSlider.min = 0.001;  // 1ms
  attackSlider.max = 2.0;    // 2 seconds
  attackSlider.value = 0.01; // default 10ms
  attackSlider.step = 0.001;

  attackSlider.addEventListener('input', e => {
    synthEngine.setAttack(parseFloat(e.target.value));
  });

  attackLabel.appendChild(attackSlider);
  container.appendChild(attackLabel);

  // Release Time Control
  const releaseLabel = document.createElement('label');
  releaseLabel.textContent = ' release ';
  const releaseSlider = document.createElement('input');
  releaseSlider.type = 'range';
  releaseSlider.min = 0.001;  // 1ms
  releaseSlider.max = 5.0;    // 5 seconds
  releaseSlider.value = 0.1;  // default 100ms
  releaseSlider.step = 0.001;

  releaseSlider.addEventListener('input', e => {
    synthEngine.setRelease(parseFloat(e.target.value));
  });

  releaseLabel.appendChild(releaseSlider);
  container.appendChild(releaseLabel);
}
