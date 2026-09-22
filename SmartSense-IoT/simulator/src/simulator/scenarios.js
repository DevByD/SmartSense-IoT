/**
 * Simulation Scenario Definitions and Controller
 */

export const SCENARIO_TYPES = {
  NORMAL: 'NORMAL',
  MOTION: 'MOTION',
  HIGH_TEMPERATURE: 'HIGH_TEMPERATURE',
  CLOSE_OBJECT: 'CLOSE_OBJECT',
  SOUND: 'SOUND',
  SOS: 'SOS',
};

export class ScenarioController {
  constructor(sensors) {
    this.sensors = sensors;
    this.currentScenario = SCENARIO_TYPES.NORMAL;
    this.scenarioTicks = 0;
  }

  setScenario(type) {
    this.currentScenario = type.toUpperCase();
    this.scenarioTicks = 0;

    // Reset sensor overrides
    this.sensors.temperature.setSpikeMode(false);
    this.sensors.ultrasonic.setCloseObjectMode(false);
    this.sensors.motion.setForceMode(false);
    this.sensors.sound.setForceMode(false);
    this.sensors.touch.setForceMode(false);

    switch (this.currentScenario) {
      case SCENARIO_TYPES.HIGH_TEMPERATURE:
      case 'TEMPERATURE':
      case 'TEMP':
        this.currentScenario = SCENARIO_TYPES.HIGH_TEMPERATURE;
        this.sensors.temperature.setSpikeMode(true, 34.2);
        break;

      case SCENARIO_TYPES.CLOSE_OBJECT:
      case 'OBJECT':
      case 'DISTANCE':
      case 'PROXIMITY':
        this.currentScenario = SCENARIO_TYPES.CLOSE_OBJECT;
        this.sensors.ultrasonic.setCloseObjectMode(true, 8.5);
        break;

      case SCENARIO_TYPES.MOTION:
        this.sensors.motion.setForceMode(true);
        break;

      case SCENARIO_TYPES.SOUND:
        this.sensors.sound.setForceMode(true);
        break;

      case SCENARIO_TYPES.SOS:
      case 'TOUCH':
        this.currentScenario = SCENARIO_TYPES.SOS;
        this.sensors.touch.setForceMode(true);
        break;

      case SCENARIO_TYPES.NORMAL:
      default:
        this.currentScenario = SCENARIO_TYPES.NORMAL;
        break;
    }
  }

  getScenario() {
    return this.currentScenario;
  }
}

export default {
  SCENARIO_TYPES,
  ScenarioController,
};
