export class Knob {
  constructor(params) {
    this.min = params.min ?? 0;
    this.max = params.max ?? 1;
    this.value = params.value ?? this.min;
    this.onChange = params.onChange;
    this.label = params.label;
    this.step = params.step ?? 0.01;
    this.integer = params.integer ?? false;

    // ...rest of constructor...
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
    // Update value display with proper formatting
    this.valueEl.textContent = this.integer ? 
      Math.floor(this.value).toString() : 
      this.value.toFixed(2);
  }

  // ...rest of class...
}
