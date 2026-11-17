export const title = 'Autonomy is a dial with defined stops';
export const reference = 'modular';
const low = -35 * Math.PI / 180, high = 125 * Math.PI / 180, setting = 45 * Math.PI / 180;

export default function (api) {
  const { scene, tube, ring, box, stroke, circlePoints, transformScene, around, X, Y, Z } = api;
  const s = scene();
  s.hiddenLines = 'omit';
  box(s, [0, -10, 0], [160, 20, 150]);
  // A real central shaft joins the control case to the raised rotary knob.
  tube(s, [0, 8, 0], 7, 3, 14, X, Z);
  ring(s, [0, 8, 0], 3, X, Z, { surface: true });
  ring(s, [0, -6, 0], 3, X, Z, { surface: true });
  // Complete cylindrical knob with a closed top and bottom.
  tube(s, [0, 46, 0], 43, 36, 38, X, Z);
  ring(s, [0, 46, 0], 36, X, Z, { surface: true });
  ring(s, [0, 8, 0], 36, X, Z, { surface: true });
  const top = [0, 46, 0];
  s.highlights.push({ points: circlePoints(top, 43, X, Z), normal: Y, kind: 'radial', gradient: [top, [43, 46, 0], [0, 46, 43]] });
  // A recessed-looking radial indicator on the top follows the actual stop arm below.
  const polar = (radius, y, angle) => [radius * Math.cos(angle), y, radius * Math.sin(angle)];
  stroke(s, [polar(10, 46.1, setting), polar(35, 46.1, setting)], { normals: [Y] });
  const addRadialBox = (centerRadius, y, angle, length, height, width) => {
    const part = scene();
    box(part, [centerRadius, y, 0], [length, height, width]);
    const pose = p => around(p, Y, -angle);
    transformScene(part, pose, pose);
    for (const key of ['cylinders', 'arrows', 'lines', 'faces', 'highlights', 'contours', 'dots']) s[key].push(...part[key]);
    for (const [key, value] of Object.entries(part.primitiveCounts)) s.primitiveCounts[key] = (s.primitiveCounts[key] ?? 0) + value;
  };
  // Raised stop arm is rigidly attached to the knob and sweeps above the case.
  addRadialBox(52, 11, setting, 28, 6, 8); // radius 38..66: 5 units overlap the knob.
  // Two fixed physical stops straddle the allowed 160-degree travel sector.
  for (const angle of [low, high]) addRadialBox(64, 8, angle, 8, 16, 10);
  // The engraved travel arc shares the same axis and ends beneath the stop blocks.
  stroke(s, Array.from({ length: 97 }, (_, i) => polar(64, .12, low + (high - low) * i / 96)), { normals: [Y] });
  return s;
}

export function verify(s, { sub }, assert) {
  assert.equal(s.hiddenLines, 'omit');
  assert.equal(s.cylinders.length, 2, 'One connecting shaft and one knob');
  const [shaft, knob] = s.cylinders;
  assert.equal(shaft.r, 7); assert.equal(knob.r, 43);
  assert.deepEqual(shaft.top, [0, 8, 0]); assert.deepEqual(knob.top, [0, 46, 0]);
  assert.deepEqual(shaft.axis, [0, -14, 0]); assert.deepEqual(knob.axis, [0, -38, 0]);
  assert.equal(knob.top[1] + knob.axis[1], shaft.top[1], 'Knob bottom meets shaft top');
  assert(shaft.top[1] + shaft.axis[1] < 0, 'Shaft is anchored into the control base');
  assert.equal(s.primitiveCounts.box, 4, 'Base, one stop arm and two end stops');
  assert.equal(s.highlights.length, 1);
  assert.deepEqual(s.highlights[0].normal, [0, 1, 0], 'Top highlight is hidden from underneath');
  assert(s.highlights[0].points.every(p => p[1] === 46));
  assert(low < setting && setting < high, 'Indicator is inside the allowed travel sector');
  assert(52 - 28 / 2 < knob.r, 'Stop arm physically overlaps the knob body');
  assert(52 + 28 / 2 > 64 - 8 / 2, 'Arm reaches the end-stop radius');
  assert(11 - 6 / 2 > 0 && 11 + 6 / 2 < 16, 'Arm clears base but intersects stop height');
  assert(64 + 8 / 2 < 75, 'All travel hardware stays inside the control base');
  const indicator = s.lines.find(l => l.points.length === 2 && l.points.every(p => Math.abs(p[1] - 46.1) < 1e-8));
  assert(indicator);
  assert(Math.abs(Math.atan2(indicator.points[1][2], indicator.points[1][0]) - setting) < 1e-9);
  const arc = s.lines.find(l => l.points.length === 97);
  assert(arc && arc.points.every(p => Math.abs(Math.hypot(p[0], p[2]) - 64) < 1e-8));
  assert(Math.abs(Math.hypot(...sub(arc.points[0], [64 * Math.cos(low), .12, 64 * Math.sin(low)]))) < 1e-8);
}
