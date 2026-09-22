import { chance } from '../utils/random.js';

export class TouchSensor {
  constructor(options = {}) {
    this.current = false;
    this.triggerProbability = options.probability || 0.02; // 2% chance in normal mode
    this.forceMode = false;
  }

  setForceMode(active) {
    this.forceMode = active;
    if (active) this.current = true;
  }

  next() {
    if (this.forceMode) {
      this.current = true;
      return true;
    }

    // Touch SOS trigger is rare during standard ambient operations
    this.current = chance(this.triggerProbability);
    return this.current;
  }

  getValue() {
    return this.current;
  }

  reset() {
    this.current = false;
    this.forceMode = false;
  }
}

export default TouchSensor;
