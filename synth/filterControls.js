/**
 * filterControls.js
 * provides a cutoff frequency slider for the synth
 */

export function createFilterControls(container, synthEngine) {
    // label + slider for cutoff
    const cutoffLabel = document.createElement('label');
    cutoffLabel.textContent = ' cutoff freq ';
    const cutoffSlider = document.createElement('input');
    cutoffSlider.type = 'range';
    cutoffSlider.min = 0;
    cutoffSlider.max = 100;
    cutoffSlider.value = 100;  // default
    cutoffSlider.step = 1;       // or maybe 100 for a coarser step
  
    cutoffSlider.addEventListener('input', e => {
      const linearValue = parseFloat(e.target.value);
      const minFreq = 20;
      const maxFreq = 20000;
      const logValue = minFreq * Math.pow(maxFreq / minFreq, linearValue / 100);
      const volume = 1 - (linearValue / 100); // Invert volume in conjunction with cutoff
      synthEngine.setCutoffAndVolume(logValue, volume);
    });
  
    cutoffLabel.appendChild(cutoffSlider);
    container.appendChild(cutoffLabel);
}
