import { Knob } from "../utils.js";

export function createSynthControlsUI(synthEngine, container) {
    // waveform select
    const waveforms = ['sine', 'square', 'sawtooth', 'triangle'];
    const waveSelectContainer = document.createElement('div');
    waveforms.forEach(w => {
        const label = document.createElement('label');
        label.classList.add('waveform-label');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'waveform';
        input.value = w;
        if (w === 'sine') {
            input.checked = true; // set sine wave as default
            synthEngine.setWaveform(w); // ensure synthEngine is set to sine wave
        }
        input.addEventListener('change', e => synthEngine.setWaveform(e.target.value));

        const icon = document.createElement('img');
        icon.src = `./assets/icons/${w}-wave.svg`;
        icon.alt = w;
        icon.classList.add('waveform-icon');

        label.appendChild(input);
        label.appendChild(icon);
        waveSelectContainer.appendChild(label);
    });

    container.appendChild(waveSelectContainer);

    // Basic controls with initialization
    const volumeKnob = new Knob({
        min: 0, max: 1, value: 0.5,
        label: 'Volume',
        onChange: (value) => synthEngine.setParameter('volume', 'level', value)
    });
    synthEngine.setParameter('volume', 'level', 0.5);

    const filterKnob = new Knob({
        min: 80, max: 12000, value: 12000,
        label: 'Filter',
        onChange: (value) => synthEngine.setParameter('filter', 'frequency', value)
    });
    synthEngine.setParameter('filter', 'frequency', 12000);

    const resonanceKnob = new Knob({
        min: 0, max: 20, value: 1,
        label: 'Resonance',
        onChange: (value) => synthEngine.setParameter('filter', 'Q', value)
    });
    synthEngine.setParameter('filter', 'Q', 1);

    const distortionKnob = new Knob({
        min: 0, max: 1, value: 0,
        label: 'Distortion',
        onChange: (value) => synthEngine.setDistortionAmount(value)
    });

    const glideKnob = new Knob({
        min: 0, max: 0.5, value: 0,
        label: 'Glide',
        onChange: (value) => synthEngine.setParameter('portamento', 'time', value)
    });

    const tremRateKnob = new Knob({
        min: 0.1, max: 10, value: 4,
        label: 'Trem Rate',
        onChange: (value) => synthEngine.setParameter('tremolo', 'rate', value)
    });

    const tremDepthKnob = new Knob({
        min: 0, max: 1, value: 0,
        label: 'Trem Depth',
        onChange: (value) => synthEngine.setParameter('tremolo', 'depth', value)
    });

    const vibRateKnob = new Knob({
        min: 0.1, max: 10, value: 5,
        label: 'Vib Rate',
        onChange: (value) => synthEngine.setParameter('vibrato', 'rate', value)
    });

    const vibDepthKnob = new Knob({
        min: 0, max: 0.5, value: 0,
        label: 'Vib Depth',
        onChange: (value) => synthEngine.setParameter('vibrato', 'depth', value)
    });

    const wahRateKnob = new Knob({
        min: 0.1, max: 10, value: 4,
        label: 'Wah Rate',
        onChange: (value) => synthEngine.setParameter('wah', 'rate', value)
    });

    const wahDepthKnob = new Knob({
        min: 0, max: 1, value: 0,
        label: 'Wah Depth',
        onChange: (value) => synthEngine.setParameter('wah', 'depth', value)
    });

    const delayTimeKnob = new Knob({
        min: 0.05, max: 1.0, value: 0.25,
        label: 'Delay Time',
        onChange: (value) => synthEngine.setParameter('delay', 'time', value)
    });

    const feedbackKnob = new Knob({
        min: 0, max: 0.9, value: 0.2,
        label: 'Feedback',
        onChange: (value) => synthEngine.setParameter('delay', 'feedback', value)
    });

    const delayMixKnob = new Knob({
        min: 0, max: 1, value: 0,
        label: 'Delay Mix',
        onChange: (value) => synthEngine.setParameter('delay', 'mix', value)
    });

    const verbSizeKnob = new Knob({
        min: 0.1, max: 10, value: 2.5,
        label: 'Verb Size',
        onChange: (value) => synthEngine.setParameter('reverb', 'size', value)
    });

    const verbMixKnob = new Knob({
        min: 0, max: 1, value: 0,
        label: 'Verb Mix',
        onChange: (value) => synthEngine.setParameter('reverb', 'mix', value)
    });

    const attackKnob = new Knob({
        min: 0.001, max: 2.0, value: 0.005,
        label: 'Attack',
        onChange: (value) => synthEngine.setParameter('envelope', 'attack', value)
    });

    const decayKnob = new Knob({
        min: 0.001, max: 2.0, value: 0.1,
        label: 'Decay',
        onChange: (value) => synthEngine.setParameter('envelope', 'decay', value)
    });

    const sustainKnob = new Knob({
        min: 0, max: 1.0, value: 0.9,
        label: 'Sustain',
        onChange: (value) => synthEngine.setParameter('envelope', 'sustain', value)
    });

    const releaseKnob = new Knob({
        min: 0.001, max: 4.0, value: 1.0,
        label: 'Release',
        onChange: (value) => synthEngine.setParameter('envelope', 'release', value)
    });

    const fAttackKnob = new Knob({
        min: 0.001, max: 2.0, value: 0.06,
        label: 'F.Attack',
        onChange: (value) => synthEngine.setParameter('filterEnvelope', 'attack', value)
    });

    const fDecayKnob = new Knob({
        min: 0.001, max: 2.0, value: 0.2,
        label: 'F.Decay',
        onChange: (value) => synthEngine.setParameter('filterEnvelope', 'decay', value)
    });

    const fSustainKnob = new Knob({
        min: 0, max: 1.0, value: 0.5,
        label: 'F.Sustain',
        onChange: (value) => synthEngine.setParameter('filterEnvelope', 'sustain', value)
    });

    const fReleaseKnob = new Knob({
        min: 0.001, max: 4.0, value: 2.0,
        label: 'F.Release',
        onChange: (value) => synthEngine.setParameter('filterEnvelope', 'release', value)
    });

    // Create main controls container first
    const mainControls = document.createElement('div');
    mainControls.className = 'control-group main-controls';
    mainControls.setAttribute('data-label', 'Core Controls');

    // Add before the Performance controls section
    const chordSizeKnob = new Knob({
        min: 1,
        max: 7,
        value: 1,
        step: 1,
        integer: true, // Force integer values
        label: 'Chord Size',
        onChange: (value) => {
            const size = Math.floor(value);
            synthEngine.setChordSize(size);
        }
    });

    // Performance controls
    const performanceControls = document.createElement('div');
    performanceControls.className = 'performance-controls';
    performanceControls.appendChild(chordSizeKnob.container);
    performanceControls.appendChild(glideKnob.container);

    // Core synth controls section
    waveSelectContainer.className = 'wave-selector';
    const coreKnobsGroup = document.createElement('div');
    coreKnobsGroup.className = 'core-knobs-group';
    [volumeKnob, filterKnob, resonanceKnob, distortionKnob].forEach(knob =>
        coreKnobsGroup.appendChild(knob.container));

    // Create parent envelope container
    const envelopesContainer = document.createElement('div');
    envelopesContainer.className = 'envelopes-container';

    // Create sub-group for envelope knobs
    const envelopeGroup = document.createElement('div');
    envelopeGroup.className = 'envelope-group';
    envelopeGroup.setAttribute('data-label', 'Amplitude ADSR');
    [attackKnob, decayKnob, sustainKnob, releaseKnob].forEach(knob =>
        envelopeGroup.appendChild(knob.container));

    // Create sub-group for filter envelope knobs
    const filterEnvelopeGroup = document.createElement('div');
    filterEnvelopeGroup.className = 'filter-envelope-group';
    filterEnvelopeGroup.setAttribute('data-label', 'Filter ADSR');
    [fAttackKnob, fDecayKnob, fSustainKnob, fReleaseKnob].forEach(knob =>
        filterEnvelopeGroup.appendChild(knob.container));

    // Add both envelope groups to the parent container
    envelopesContainer.appendChild(envelopeGroup);
    envelopesContainer.appendChild(filterEnvelopeGroup);

    // Create sub-group for wave and performance controls
    const waveAndPerformanceGroup = document.createElement('div');
    waveAndPerformanceGroup.className = 'wave-performance-group';

    waveSelectContainer.className = 'wave-selector';
    performanceControls.className = 'performance-controls';

    waveAndPerformanceGroup.appendChild(waveSelectContainer);

    // Core synth controls section
    waveAndPerformanceGroup.appendChild(coreKnobsGroup);

    mainControls.appendChild(waveAndPerformanceGroup);
    mainControls.appendChild(envelopesContainer);
    mainControls.appendChild(performanceControls);

    // Modulation controls section
    const modulationControls = document.createElement('div');
    modulationControls.className = 'control-group modulation-controls';
    modulationControls.setAttribute('data-label', 'Modulation');
    [tremRateKnob, tremDepthKnob, vibRateKnob, vibDepthKnob, wahRateKnob, wahDepthKnob].forEach(knob =>
        modulationControls.appendChild(knob.container));

    // Time-based effects section
    const timeEffectsControls = document.createElement('div');
    timeEffectsControls.className = 'control-group time-effects-controls';
    timeEffectsControls.setAttribute('data-label', 'Time Effects');
    [delayTimeKnob, feedbackKnob, delayMixKnob, verbSizeKnob, verbMixKnob].forEach(knob =>
        timeEffectsControls.appendChild(knob.container));

    // Create effects row container
    const effectsRow = document.createElement('div');
    effectsRow.className = 'effects-row';
    effectsRow.appendChild(modulationControls);
    effectsRow.appendChild(timeEffectsControls);

    // Add all control groups to main container
    container.appendChild(mainControls);
    container.appendChild(effectsRow);
}