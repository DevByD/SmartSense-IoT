import config from '../config.js';
import TemperatureSensor from '../sensors/temperature.js';
import HumiditySensor from '../sensors/humidity.js';
import UltrasonicSensor from '../sensors/ultrasonic.js';
import MotionSensor from '../sensors/motion.js';
import SoundSensor from '../sensors/sound.js';
import TouchSensor from '../sensors/touch.js';
import { ScenarioController } from './scenarios.js';

export class TelemetryGenerator {
  constructor(customConfig = {}) {
    this.config = { ...config, ...customConfig };

    this.sensors = {
      temperature: new TemperatureSensor(this.config),
      humidity: new HumiditySensor(this.config),
      ultrasonic: new UltrasonicSensor(this.config),
      motion: new MotionSensor(this.config),
      sound: new SoundSensor(this.config),
      touch: new TouchSensor(this.config),
    };

    this.scenarios = new ScenarioController(this.sensors);
  }

  setScenario(scenarioName) {
    this.scenarios.setScenario(scenarioName);
  }

  /**
   * Generates the next telemetry snapshot conforming to the contract
   */
  generateTelemetry() {
    const temp = this.sensors.temperature.next();
    const hum = this.sensors.humidity.next();
    const dist = this.sensors.ultrasonic.next();
    const mot = this.sensors.motion.next();
    const snd = this.sensors.sound.next();
    const tch = this.sensors.touch.next();

    const payload = {
      deviceId: String(this.config.deviceId),
      room: String(this.config.room),
      temperature: Number(temp),
      humidity: Number(hum),
      distance: Number(dist),
      motion: Boolean(mot),
      sound: Boolean(snd),
      touch: Boolean(tch),
      timestamp: new Date().toISOString(),
    };

    // Strict schema and type validation
    const validation = TelemetryGenerator.validateTelemetry(payload);
    if (!validation.isValid) {
      throw new Error(`Invalid telemetry payload generated: ${validation.errors.join('; ')}`);
    }

    return payload;
  }

  /**
   * Validates a telemetry object against the project JSON contract
   */
  static validateTelemetry(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Payload must be a non-null object'] };
    }

    // 1. deviceId: string
    if (typeof data.deviceId !== 'string' || data.deviceId.trim() === '') {
      errors.push('deviceId must be a non-empty string');
    }

    // 2. room: string
    if (typeof data.room !== 'string' || data.room.trim() === '') {
      errors.push('room must be a non-empty string');
    }

    // 3. temperature: number
    if (typeof data.temperature !== 'number' || isNaN(data.temperature)) {
      errors.push('temperature must be a valid number');
    }

    // 4. humidity: number
    if (typeof data.humidity !== 'number' || isNaN(data.humidity)) {
      errors.push('humidity must be a valid number');
    }

    // 5. distance: positive number
    if (typeof data.distance !== 'number' || isNaN(data.distance) || data.distance < 0) {
      errors.push('distance must be a non-negative number');
    }

    // 6. motion: boolean
    if (typeof data.motion !== 'boolean') {
      errors.push('motion must be a boolean');
    }

    // 7. sound: boolean
    if (typeof data.sound !== 'boolean') {
      errors.push('sound must be a boolean');
    }

    // 8. touch: boolean
    if (typeof data.touch !== 'boolean') {
      errors.push('touch must be a boolean');
    }

    // 9. timestamp: valid ISO date string
    if (typeof data.timestamp !== 'string') {
      errors.push('timestamp must be an ISO string');
    } else {
      const d = new Date(data.timestamp);
      if (isNaN(d.getTime())) {
        errors.push('timestamp is not a valid date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  reset() {
    Object.values(this.sensors).forEach((s) => s.reset());
  }
}

// Standalone exportable generator instance
export const generatorInstance = new TelemetryGenerator();
export const generateTelemetry = () => generatorInstance.generateTelemetry();

export default TelemetryGenerator;
