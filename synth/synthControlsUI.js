import { Knob } from "../utils.js";

export function createSynthControlsUI(synthEngine, container) {
    // Define the complete UI structure
    const uiStructure = {
        mainControls: {
            label: 'Core Controls',
            className: 'control-group main-controls',
            subgroups: {
                waveAndPerformance: {
                    className: 'wave-performance-group',
                    sections: {
                        waveSelector: {
                            className: 'wave-selector',
                            type: 'waveform',
                            options: ['sine', 'square', 'sawtooth', 'triangle']
                        },
                        core: {
                            className: 'core-knobs-group',
                            knobs: [
                                {
                                    label: 'Volume',
                                    min: 0, max: 1, value: 0.5,
                                    effect: 'volume', param: 'level',
                                    initialize: true
                                },
                                {
                                    label: 'Filter',
                                    min: 80, max: 12000, value: 12000,
                                    effect: 'filter', param: 'frequency',
                                    initialize: true
                                },
                                {
                                    label: 'Resonance',
                                    min: 0, max: 20, value: 1,
                                    effect: 'filter', param: 'Q',
                                    initialize: true
                                },
                                {
                                    label: 'Distortion',
                                    min: 0, max: 1, value: 0,
                                    special: 'distortion'
                                }
                            ]
                        }
                    }
                },
                performance: {
                    className: 'performance-controls',
                    knobs: [
                        {
                            label: 'Chord Size',
                            min: 1, max: 7, value: 1, step: 1, integer: true,
                            onChange: (v) => synthEngine.setChordSize(Math.floor(v))
                        },
                        {
                            label: 'Glide',
                            min: 0, max: 0.5, value: 0,
                            effect: 'portamento', param: 'time',
                            initialize: true
                        }
                    ]
                },
                envelopes: {
                    className: 'envelopes-container',
                    sections: {
                        amplitude: {
                            className: 'envelope-group',
                            label: 'Amplitude ADSR',
                            knobs: [
                                { label: 'Attack', min: 0.001, max: 2.0, value: 0.005, effect: 'envelope', param: 'attack' },
                                { label: 'Decay', min: 0.001, max: 2.0, value: 0.1, effect: 'envelope', param: 'decay' },
                                { label: 'Sustain', min: 0, max: 1.0, value: 0.9, effect: 'envelope', param: 'sustain' },
                                { label: 'Release', min: 0.001, max: 4.0, value: 1.0, effect: 'envelope', param: 'release' }
                            ]
                        },
                        filter: {
                            className: 'filter-envelope-group',
                            label: 'Filter ADSR',
                            knobs: [
                                { label: 'F.Attack', min: 0.001, max: 2.0, value: 0.06, effect: 'filterEnvelope', param: 'attack' },
                                { label: 'F.Decay', min: 0.001, max: 2.0, value: 0.2, effect: 'filterEnvelope', param: 'decay' },
                                { label: 'F.Sustain', min: 0, max: 1.0, value: 0.5, effect: 'filterEnvelope', param: 'sustain' },
                                { label: 'F.Release', min: 0.001, max: 4.0, value: 2.0, effect: 'filterEnvelope', param: 'release' }
                            ]
                        }
                    }
                }
            }
        },
        effectsRow: {
            className: 'effects-row',
            sections: {
                modulation: {
                    className: 'control-group modulation-controls',
                    label: 'Modulation',
                    knobs: [
                        { label: 'Trem Rate', min: 0.1, max: 10, value: 4, effect: 'tremolo', param: 'rate' },
                        { label: 'Trem Depth', min: 0, max: 1, value: 0, effect: 'tremolo', param: 'depth' },
                        { label: 'Vib Rate', min: 0.1, max: 10, value: 5, effect: 'vibrato', param: 'rate' },
                        { label: 'Vib Depth', min: 0, max: 0.5, value: 0, effect: 'vibrato', param: 'depth' },
                        { label: 'Wah Rate', min: 0.1, max: 10, value: 4, effect: 'wah', param: 'rate' },
                        { label: 'Wah Depth', min: 0, max: 1, value: 0, effect: 'wah', param: 'depth' }
                    ]
                },
                timeEffects: {
                    className: 'control-group time-effects-controls',
                    label: 'Time Effects',
                    knobs: [
                        { label: 'Delay Time', min: 0.05, max: 1.0, value: 0.25, effect: 'delay', param: 'time' },
                        { label: 'Feedback', min: 0, max: 0.9, value: 0.2, effect: 'delay', param: 'feedback' },
                        { label: 'Delay Mix', min: 0, max: 1, value: 0, effect: 'delay', param: 'mix' },
                        { label: 'Verb Size', min: 0.1, max: 10, value: 2.5, effect: 'reverb', param: 'size' },
                        { label: 'Verb Mix', min: 0, max: 1, value: 0, effect: 'reverb', param: 'mix' }
                    ]
                }
            }
        }
    };

    // Helper function to create knob from config
    function createKnob(config) {
        const knob = new Knob({
            ...config,
            onChange: config.onChange || (config.special ? 
                (value) => synthEngine.setDistortionAmount(value) :
                (value) => {
                    console.log(`Setting ${config.effect}.${config.param} to ${value}`); // Debug logging
                    synthEngine.setParameter(config.effect, config.param, value);
                })
        });
        
        // Initialize the parameter if needed
        if (config.initialize) {
            synthEngine.setParameter(config.effect, config.param, config.value);
        }
        
        return knob;
    }

    // Helper function to create container
    function createContainer(config, label) {
        const container = document.createElement('div');
        container.className = config.className || '';
        if (label || config.label) {
            container.setAttribute('data-label', label || config.label);
        }
        return container;
    }

    // Helper function to create wave selector
    function createWaveSelector(config) {
        const container = createContainer(config);
        config.options.forEach(w => {
            const label = document.createElement('label');
            label.classList.add('waveform-label');
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'waveform';
            input.value = w;
            if (w === 'sine') {
                input.checked = true;
                synthEngine.setWaveform(w);
            }
            input.addEventListener('change', e => synthEngine.setWaveform(e.target.value));

            const icon = document.createElement('img');
            icon.src = `./assets/icons/${w}-wave.svg`;
            icon.alt = w;
            icon.classList.add('waveform-icon');

            label.appendChild(input);
            label.appendChild(icon);
            container.appendChild(label);
        });
        return container;
    }

    // Helper function to build UI recursively
    function buildUI(structure) {
        const container = createContainer(structure);

        if (structure.type === 'waveform') {
            return createWaveSelector(structure);
        }

        if (structure.knobs) {
            const knobs = structure.knobs.map(createKnob);
            knobs.forEach(knob => container.appendChild(knob.container));
        }

        if (structure.sections) {
            Object.entries(structure.sections).forEach(([key, config]) => {
                container.appendChild(buildUI(config));
            });
        }

        if (structure.subgroups) {
            Object.entries(structure.subgroups).forEach(([key, config]) => {
                container.appendChild(buildUI(config));
            });
        }

        return container;
    }

    // Build the entire UI
    Object.values(uiStructure).forEach(section => {
        container.appendChild(buildUI(section));
    });
}