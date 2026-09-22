import config from '../config.js';
import { randomWalk, clamp } from '../utils/random.js';

export class TemperatureSensor {
  constructor(options = {}) {
    this.current = options.baseTemperature || config.baseTemperature;
    this.min = options.minTemperature || config.minTemperature;
    this.max = options.maxTemperature || config.maxTemperature;
    this.step = options.maxStep || 0.3; // max ±0.3°C drift per tick
    this.spikeMode = false;
    this.spikeTarget = 33.8;
  }

  setSpikeMode(active, target = 33.8) {
    this.spikeMode = active;
    this.spikeTarget = target;
  }

  next() {
    if (this.spikeMode) {
      // Gradually trend toward spikeTarget
      if (this.current < this.spikeTarget) {
        this.current = Number((this.current + (0.3 + Math.random() * 0.3)).toFixed(1));
      } else {
        this.current = randomWalk(this.current, 0.2, 32.5, 35.0, 1);
      }
    } else {
      // Natural ambient room drift
      this.current = randomWalk(this.current, this.step, this.min, this.max, 1);
      // Gentle pull toward base if drifting too close to extreme edges
      if (this.current > 33.0) this.current = Number((this.current - 0.2).toFixed(1));
      if (this.current < 21.0) this.current = Number((this.current + 0.2).toFixed(1));
    }
    return this.current;
  }

  getValue() {
    return this.current;
  }

  reset() {
    this.current = config.baseTemperature;
    this.spikeMode = false;
  }
}

export default TemperatureSensor;
