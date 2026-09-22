import config from '../config.js';
import { randomWalk, clamp } from '../utils/random.js';

export class UltrasonicSensor {
  constructor(options = {}) {
    this.current = options.baseDistance || config.baseDistance;
    this.min = options.minDistance || config.minDistance;
    this.max = options.maxDistance || config.maxDistance;
    this.step = options.maxStep || 2.0; // normal room drift ±2 cm
    this.closeObjectMode = false;
    this.closeTarget = 9.5;
  }

  setCloseObjectMode(active, target = 9.5) {
    this.closeObjectMode = active;
    this.closeTarget = target;
  }

  next() {
    if (this.closeObjectMode) {
      if (this.current > this.closeTarget) {
        this.current = Number(Math.max(this.min, this.current - (8.0 + Math.random() * 5.0)).toFixed(1));
      } else {
        this.current = randomWalk(this.current, 0.8, this.min, 14.0, 1);
      }
    } else {
      this.current = randomWalk(this.current, this.step, 25.0, 120.0, 1);
    }
    // Strict non-negative clamp
    this.current = clamp(this.current, this.min, this.max);
    return this.current;
  }

  getValue() {
    return this.current;
  }

  reset() {
    this.current = config.baseDistance;
    this.closeObjectMode = false;
  }
}

export default UltrasonicSensor;
