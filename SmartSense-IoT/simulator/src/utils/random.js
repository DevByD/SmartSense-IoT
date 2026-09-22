/**
 * Numerical and probability utility helpers for realistic simulation drift
 */

export function randomFloat(min, max, decimals = 1) {
  const val = Math.random() * (max - min) + min;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function randomWalk(current, maxStep, min, max, decimals = 1) {
  const delta = (Math.random() * 2 - 1) * maxStep;
  const next = clamp(current + delta, min, max);
  const factor = Math.pow(10, decimals);
  return Math.round(next * factor) / factor;
}

export function chance(probability) {
  return Math.random() < probability;
}
