import config from '../config.js';
import { randomWalk } from '../utils/random.js';

export class HumiditySensor {
  constructor(options = {}) {
    this.current = options.baseHumidity || config.baseHumidity;
    this.min = options.minHumidity || config.minHumidity;
    this.max = options.maxHumidity || config.maxHumidity;
    this.step = options.maxStep || 0.4; // max ±0.4% per tick
  }

  next() {
    this.current = randomWalk(this.current, this.step, this.min, this.max, 1);
    return this.current;
  }

  getValue() {
    return this.current;
  }

  reset() {
    this.current = config.baseHumidity;
  }
}

export default HumiditySensor;
