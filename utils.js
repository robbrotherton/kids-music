export class Knob {
  constructor(params) {
    this.min = params.min ?? 0;
    this.max = params.max ?? 1;
    this.value = params.value ?? this.min;
    this.onChange = params.onChange;
    this.label = params.label;
    this.step = params.step ?? 0.01;
    this.integer = params.integer ?? false;
    this.container = document.createElement('div');
    this.container.className = 'knob-container';
    
    // Create label
    const labelEl = document.createElement('div');
    labelEl.className = 'knob-label';
    labelEl.textContent = this.label;
    
    // Create knob
    this.knobEl = document.createElement('div');
    this.knobEl.className = 'knob';
    
    // Create value display
    this.valueEl = document.createElement('div');
    this.valueEl.className = 'knob-value';
    
    this.container.appendChild(labelEl);
    this.container.appendChild(this.knobEl);
    this.container.appendChild(this.valueEl);
    
    this.setupEvents();
    this.updateRotation();
  }

  setupEvents() {
    let startY;
    let startValue;
    
    const onMove = (e) => {
      const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      const delta = startY - y;
      const range = this.max - this.min;
      // Adjust sensitivity based on step size
      const sensitivity = this.step > 0.1 ? 200 : 100;
      let newValue = startValue + (delta / sensitivity) * range;
      
      // Apply stepping if specified
      if (this.step) {
        newValue = Math.round(newValue / this.step) * this.step;
      }
      
      // Force integer values if specified
      if (this.integer) {
        newValue = Math.floor(newValue);
      }
      
      this.setValue(Math.max(this.min, Math.min(this.max, newValue)));
    };
    
    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    
    const onStart = (e) => {
      e.preventDefault();
      startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
      startValue = this.value;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onEnd);
    };

    this.knobEl.addEventListener('mousedown', onStart);
    this.knobEl.addEventListener('touchstart', onStart, { passive: false });
  }

  setValue(value) {
    let newValue = Math.min(this.max, Math.max(this.min, value));
    
    // Apply stepping if specified
    if (this.step) {
      newValue = Math.round(newValue / this.step) * this.step;
    }
    
    // Force integer values if specified
    if (this.integer) {
      newValue = Math.floor(newValue);
    }
    
    this.value = newValue;
    this.updateRotation();
    this.onChange?.(newValue);
  }

  updateRotation() {
    const percent = (this.value - this.min) / (this.max - this.min);
    const degrees = percent * 270 - 135;
    this.knobEl.style.transform = `rotate(${degrees}deg)`;
    // Format display value based on integer setting
    this.valueEl.textContent = this.integer ? 
      Math.floor(this.value).toString() : 
      this.value.toFixed(2);
  }
}
