/** @param {number} seed */
export function offsetCount(seed) {
  const hash = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  return 4 + ((hash ^ (hash >>> 16)) >>> 0) % 5;
}
