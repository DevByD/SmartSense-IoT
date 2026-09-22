import { chance } from '../utils/random.js';

export class SoundSensor {
  constructor(options = {}) {
    this.current = false;
    this.triggerProbability = options.probability || 0.05; // 5% chance in normal mode
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

    // Acoustic trigger is typically a brief spike
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

export default SoundSensor;
