import { chance } from '../utils/random.js';

export class MotionSensor {
  constructor(options = {}) {
    this.current = false;
    this.holdTicks = 0;
    this.triggerProbability = options.probability || 0.08; // 8% chance in normal mode
    this.forceMode = false;
  }

  setForceMode(active) {
    this.forceMode = active;
    if (active) {
      this.current = true;
      this.holdTicks = 4; // hold for 4 cycles
    }
  }

  next() {
    if (this.forceMode) {
      this.current = true;
      return true;
    }

    if (this.holdTicks > 0) {
      this.holdTicks -= 1;
      this.current = true;
      return true;
    }

    if (chance(this.triggerProbability)) {
      this.current = true;
      this.holdTicks = Math.floor(Math.random() * 2) + 1; // hold for 1-3 ticks
    } else {
      this.current = false;
    }

    return this.current;
  }

  getValue() {
    return this.current;
  }

  reset() {
    this.current = false;
    this.holdTicks = 0;
    this.forceMode = false;
  }
}

export default MotionSensor;
