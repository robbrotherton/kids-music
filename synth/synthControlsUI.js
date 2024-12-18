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
        onChange: (value) => synthEngine.setVolume(value)
    });
    synthEngine.setVolume(0.5); // Initialize

    const filterKnob = new Knob({
        min: 80, max: 12000, value: 12000,
        label: 'Filter',
        onChange: (value) => synthEngine.setCutoffFrequency(value)
    });
    synthEngine.setCutoffFrequency(12000); // Initialize

    const resonanceKnob = new Knob({
        min: 0, max: 20, value: 1,
        label: 'Resonance',
        onChange: (value) => synthEngine.setFilterQ(value)
    });
    synthEngine.setFilterQ(1); // Initialize

    const distortionKnob = new Knob({
        min: 0, max: 1, value: 0,
        label: 'Distortion',
        onChange: (value) => synthEngine.setDistortionAmount(value)
    });
    synthEngine.setDistortionAmount(0); // Initialize

    // Add Effect Knobs
    const tremoloRateKnob = new Knob({
        min: 0.1, max: 10, value: 4,
        label: 'Trem Rate',
        onChange: (value) => synthEngine.setTremoloRate(value)
    });

    const tremoloDepthKnob = new Knob({
        min: 0, max: 1, value: 0,
        label: 'Trem Depth',
        onChange: (value) => synthEngine.setTremoloDepth(value)
    });

    const vibratoRateKnob = new Knob({
        min: 0.1, max: 10, value: 5,
        label: 'Vib Rate',
        onChange: (value) => synthEngine.setVibratoRate(value)
    });
    synthEngine.setVibratoRate(5);
    synthEngine.setVibratoDepth(0);

    const vibratoDepthKnob = new Knob({
        min: 0, max: 0.5, value: 0,
        label: 'Vib Depth',
        onChange: (value) => synthEngine.setVibratoDepth(value)
    });

    const delayTimeKnob = new Knob({
        min: 0.05, max: 1.0, value: 0.25,
        label: 'Delay Time',
        onChange: (value) => synthEngine.setDelayTime(value)
    });

    const delayFeedbackKnob = new Knob({
        min: 0, max: 0.9, value: 0.2,
        label: 'Feedback',
        onChange: (value) => synthEngine.setDelayFeedback(value)
    });

    const delayMixKnob = new Knob({
        min: 0, max: 1, value: 0,
        label: 'Delay Mix',
        onChange: (value) => synthEngine.setDelayWet(value)
    });

    const reverbSizeKnob = new Knob({
        min: 0.1, max: 10, value: 2.5,
        label: 'Verb Size',
        onChange: (value) => synthEngine.setReverbDecay(value)
    });

    const reverbMixKnob = new Knob({
        min: 0, max: 1, value: 0,
        label: 'Verb Mix',
        onChange: (value) => synthEngine.setReverbWet(value)
    });

    const wahRateKnob = new Knob({
        min: 0.1, max: 10, value: 4,
        label: 'Wah Rate',
        onChange: (value) => synthEngine.setWahRate(value)
    });

    const wahDepthKnob = new Knob({
        min: 0, max: 1, value: 0,
        label: 'Wah Depth',
        onChange: (value) => synthEngine.setWahDepth(value)
    });

    // Add ADSR Knobs with Tone.js defaults
    const attackKnob = new Knob({
        min: 0.001, max: 2.0, value: 0.005,  // Default 0.005
        label: 'Attack',
        onChange: (value) => synthEngine.setAttack(value)
    });
    synthEngine.setAttack(0.005);

    const decayKnob = new Knob({
        min: 0.001, max: 2.0, value: 0.1,    // Default 0.1
        label: 'Decay',
        onChange: (value) => synthEngine.setDecay(value)
    });
    synthEngine.setDecay(0.1);

    const sustainKnob = new Knob({
        min: 0, max: 1.0, value: 0.9,        // Default 0.9
        label: 'Sustain',
        onChange: (value) => synthEngine.setSustain(value)
    });
    synthEngine.setSustain(0.9);

    const releaseKnob = new Knob({
        min: 0.001, max: 4.0, value: 1.0,    // Default 1.0
        label: 'Release',
        onChange: (value) => synthEngine.setRelease(value)
    });
    synthEngine.setRelease(1.0);

    // Add Filter Envelope Knobs with Tone.js defaults
    const filterAttackKnob = new Knob({
        min: 0.001, max: 2.0, value: 0.06,   // Default 0.06
        label: 'F.Attack',
        onChange: (value) => synthEngine.setFilterAttack(value)
    });
    synthEngine.setFilterAttack(0.06);

    const filterDecayKnob = new Knob({
        min: 0.001, max: 2.0, value: 0.2,    // Default 0.2
        label: 'F.Decay',
        onChange: (value) => synthEngine.setFilterDecay(value)
    });
    synthEngine.setFilterDecay(0.2);

    const filterSustainKnob = new Knob({
        min: 0, max: 1.0, value: 0.5,        // Default 0.5
        label: 'F.Sustain',
        onChange: (value) => synthEngine.setFilterSustain(value)
    });
    synthEngine.setFilterSustain(0.5);

    const filterReleaseKnob = new Knob({
        min: 0.001, max: 4.0, value: 2.0,    // Default 2.0
        label: 'F.Release',
        onChange: (value) => synthEngine.setFilterRelease(value)
    });
    synthEngine.setFilterRelease(2.0);

    // Add glide knob
    const glideKnob = new Knob({
        min: 0, max: 0.5, value: 0,
        label: 'Glide',
        onChange: (value) => synthEngine.setPortamento(value)
    });

    // const distortionKnob = new Knob({
    //   min: 0, max: 1, value: 0,
    //   label: 'Distortion',
    //   onChange: (value) => synthEngine.setDistortionAmount(value)
    // });
    // synthEngine.setDistortionAmount(0); // Initialize

    // Create separate containers for different control groups
    const mainControls = document.createElement('div');
    mainControls.className = 'control-group main-controls';
    mainControls.setAttribute('data-label', 'Core Controls');

    const modulationControls = document.createElement('div');
    modulationControls.className = 'control-group modulation-controls';
    modulationControls.setAttribute('data-label', 'Modulation');

    const timeEffectsControls = document.createElement('div');
    timeEffectsControls.className = 'control-group time-effects-controls';
    timeEffectsControls.setAttribute('data-label', 'Time Effects');

    // Replace chord toggle with chord size knob
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



    performanceControls.appendChild(glideKnob.container);

    // Core synth controls section
    waveSelectContainer.className = 'wave-selector';
    mainControls.appendChild(waveSelectContainer);
    mainControls.appendChild(performanceControls);

    // Create sub-group for core knobs
    const coreKnobsGroup = document.createElement('div');
    coreKnobsGroup.className = 'core-knobs-group';
    [volumeKnob, distortionKnob, filterKnob, resonanceKnob].forEach(knob =>
        coreKnobsGroup.appendChild(knob.container));

    mainControls.appendChild(coreKnobsGroup);

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
    [filterAttackKnob, filterDecayKnob, filterSustainKnob, filterReleaseKnob].forEach(knob =>
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
    // mainControls.appendChild(glideKnob.container);
    mainControls.appendChild(performanceControls);
    // mainControls.appendChild(chordToggleLabel);

    // Modulation controls section
    [
        vibratoRateKnob,
        vibratoDepthKnob,
        tremoloRateKnob,
        tremoloDepthKnob,
        wahRateKnob,
        wahDepthKnob
    ].forEach(knob => modulationControls.appendChild(knob.container));

    // Time-based effects section
    [
        delayTimeKnob,
        delayFeedbackKnob,
        delayMixKnob,
        reverbSizeKnob,
        reverbMixKnob
    ].forEach(knob => timeEffectsControls.appendChild(knob.container));

    // Create effects row container
    const effectsRow = document.createElement('div');
    effectsRow.className = 'effects-row';
    effectsRow.appendChild(modulationControls);
    effectsRow.appendChild(timeEffectsControls);

    // Add all control groups to main container
    container.appendChild(mainControls);
    container.appendChild(effectsRow);

}