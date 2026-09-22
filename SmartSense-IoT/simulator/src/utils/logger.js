/**
 * Terminal logger for SmartSense IoT Telemetry Simulator
 */

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
};

export function getFormattedTime(date = new Date()) {
  return date.toTimeString().split(' ')[0];
}

export function logTelemetry(data, eventNotice = null) {
  const time = getFormattedTime(new Date(data.timestamp));

  console.log(`\n${ANSI.cyan}${ANSI.bold}[${time}] SENSOR DATA${ANSI.reset}`);
  console.log(`${ANSI.dim}Device: ${data.deviceId} | Room: ${data.room}${ANSI.reset}`);
  console.log('-------------------------------------------');

  // Temperature
  const isHighTemp = data.temperature >= 32.0;
  const tempColor = isHighTemp ? ANSI.red : ANSI.cyan;
  console.log(`Temperature : ${tempColor}${ANSI.bold}${data.temperature} °C${ANSI.reset}${isHighTemp ? ' (HIGH)' : ''}`);

  // Humidity
  console.log(`Humidity    : ${ANSI.blue}${ANSI.bold}${data.humidity} %${ANSI.reset}`);

  // Distance
  const isClose = data.distance <= 15.0;
  const distColor = isClose ? ANSI.yellow : ANSI.green;
  console.log(`Distance    : ${distColor}${ANSI.bold}${data.distance} cm${ANSI.reset}${isClose ? ' (CLOSE OBJECT)' : ''}`);

  // Motion
  const motionStr = data.motion ? `${ANSI.red}${ANSI.bold}DETECTED${ANSI.reset}` : `${ANSI.dim}NO MOTION${ANSI.reset}`;
  console.log(`Motion      : ${motionStr}`);

  // Sound
  const soundStr = data.sound ? `${ANSI.yellow}${ANSI.bold}DETECTED${ANSI.reset}` : `${ANSI.dim}NORMAL${ANSI.reset}`;
  console.log(`Sound       : ${soundStr}`);

  // Touch
  const touchStr = data.touch ? `${ANSI.bgRed}${ANSI.bold} ACTIVATED (SOS) ${ANSI.reset}` : `${ANSI.dim}NORMAL${ANSI.reset}`;
  console.log(`Touch       : ${touchStr}`);

  // Event Banner if triggered
  if (eventNotice) {
    console.log(`\n${eventNotice}`);
  }
}

export function logEvent(type, message) {
  const time = getFormattedTime();
  if (type === 'SOS') {
    console.log(`\n${ANSI.bgRed}${ANSI.bold} [${time}] 🚨 SOS EVENT ${ANSI.reset} ${ANSI.red}${ANSI.bold}${message}${ANSI.reset}`);
  } else if (type === 'MOTION') {
    console.log(`\n${ANSI.yellow}${ANSI.bold} [${time}] ⚠️  MOTION EVENT ${ANSI.reset} ${message}`);
  } else if (type === 'HIGH_TEMP') {
    console.log(`\n${ANSI.red}${ANSI.bold} [${time}] 🔥 HIGH TEMPERATURE EVENT ${ANSI.reset} ${message}`);
  } else if (type === 'CLOSE_OBJECT') {
    console.log(`\n${ANSI.yellow}${ANSI.bold} [${time}] 📏 CLOSE OBJECT DETECTED ${ANSI.reset} ${message}`);
  } else if (type === 'SOUND') {
    console.log(`\n${ANSI.blue}${ANSI.bold} [${time}] 🔊 SOUND EVENT ${ANSI.reset} ${message}`);
  } else {
    console.log(`\n[${time}] ℹ️  EVENT: ${message}`);
  }
}

export default {
  logTelemetry,
  logEvent,
  getFormattedTime,
};
