const maxFontSize = 112;
const coverFont = size => `400 ${size}px "Founders Grotesk"`;

/** @param {string} text */
export function loadCoverFont(text) {
  return document.fonts.load(coverFont(maxFontSize), text);
}

/** @param {CanvasRenderingContext2D} context @param {string} text */
export function drawCoverText(context, text) {
  const { width, height } = context.canvas;
  const line = text.trim().replace(/[\r\n]+/g, ' ');
  context.font = coverFont(maxFontSize);
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  const initial = context.measureText(line);
  // Leave room for the 4:3 crop and the homepage card's hover inset.
  const maxWidth = Math.min(width, height * 4 / 3) * 0.85;
  const measuredWidth = Math.max(initial.width, initial.actualBoundingBoxLeft + initial.actualBoundingBoxRight, 1);
  context.font = coverFont(maxFontSize * Math.min(1, maxWidth / measuredWidth));
  const metrics = context.measureText(line);
  const x = (width + metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2;
  const y = (height + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  context.fillStyle = '#fff';
  context.fillText(line, x, y);
}
