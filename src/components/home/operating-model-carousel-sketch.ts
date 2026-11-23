import P5 from 'p5/core';
import accessibility from 'p5/accessibility';
import { modelDotRadius, modelDotRings } from './operating-model-diagram/model-dots';

P5.registerAddon(accessibility);

export const carouselOutlineWidth = 1;
const ringRadiusRatio = .59;
const closedLogoScale = .76;
const ringLabels = ['Build', 'Learn'];
const ringLabelGap = 8;
const ringLabelSize = 14;

type PlateDrawing = {
  path: Path2D;
  x: number;
  opacity: number;
  outline: number;
  artwork: number;
  radius?: number;
  zoom: number;
};

type CarouselDrawing = {
  diameter: number;
  opening: number;
  plates: (PlateDrawing | undefined)[];
};

const modelDots = [{ x: 0, y: 0, radius: 0 }, ...modelDotRings.flatMap(({ radius, count, stagger }) =>
  Array.from({ length: count }, (_, index) => {
    const angle = 2 * Math.PI * (index + stagger) / count;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, radius };
  }),
)];

function drawModelWave(ctx: CanvasRenderingContext2D, plateRadius: number, seconds: number | null) {
  // Match the original outward ripple's 2.7-second sweep and short pause.
  const front = seconds === null ? Infinity : -.125 + .725 * Math.min(1, (seconds % 3) / 2.7);
  const scale = 2 * plateRadius;
  ctx.beginPath();
  for (const dot of modelDots) {
    const pulse = Math.exp(-(((dot.radius - front) / .053) ** 2));
    const radius = modelDotRadius * (1 + 1.5 * pulse) * scale;
    const x = .5 + dot.x * scale;
    const y = .5 + dot.y * scale;
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
  }
  ctx.fill();
}

function drawLogoRing(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, seconds: number, opacity: number, labelWidths: number[]) {
  const halfTurn = Math.PI;
  const step = halfTurn / Math.max(1, Math.round(halfTurn * radius / 14));
  const spacing = step * radius;
  const rotation = (seconds * 20 / radius) % (2 * halfTurn);
  const halves = [rotation, rotation + halfTurn];
  ctx.save();
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.globalAlpha = .5 * opacity;
  ctx.setLineDash([spacing * .55, spacing * .45]);
  for (const start of halves) {
    // Leave one dash slot in each half for an arrow moving with the ring.
    ctx.beginPath();
    ctx.arc(x, y, radius, start + step, start + halfTurn);
    ctx.stroke();
  }

  ctx.fillStyle = ctx.strokeStyle;
  ctx.globalAlpha = .86 * opacity;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const [index, start] of halves.entries()) {
    const tip = start + step * .64;
    ctx.save();
    ctx.globalAlpha = .72 * opacity;
    ctx.translate(x + Math.cos(tip) * radius, y + Math.sin(tip) * radius);
    ctx.rotate(tip + halfTurn / 2);
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(0, 0);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const labelAngle = tip - 4 / radius;
    const nx = Math.cos(labelAngle);
    const ny = Math.sin(labelAngle);
    const labelRadius = radius + ringLabelGap + (Math.abs(nx) * labelWidths[index] + Math.abs(ny) * ringLabelSize) / 2;
    ctx.fillText(ringLabels[index], x + nx * labelRadius, y + ny * labelRadius);
  }
  ctx.restore();
}

export function mountCarouselSketch(host: HTMLElement, slides: HTMLElement[], reducedMotion: boolean) {
  const viewport = host.parentElement!;
  const colors = getComputedStyle(viewport);
  const ink = colors.getPropertyValue('--diagram-ink').trim();
  const fill = colors.getPropertyValue('--diagram-fill').trim();
  const iris = colors.getPropertyValue('--palette-iris').trim();
  const labelFont = `${colors.getPropertyValue('--font-weight-medium').trim()} ${ringLabelSize}px ${colors.fontFamily}`;
  const modelSlides = slides.map(slide => slide.dataset.modelPlate === 'models');
  const images = new Map<string, HTMLImageElement>();
  const artworks = slides.map(slide => {
    const key = slide.dataset.modelPlate!;
    if (key === 'models') return undefined;
    const artwork = slide.querySelector('[data-model-plate-art]')!;
    if (!artwork.firstElementChild?.firstElementChild) return undefined;
    if (!images.has(key)) {
      const image = new Image();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="960" viewBox="0 0 320 320" color="${ink}" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="--palette-iris:${iris}">${artwork.outerHTML}</svg>`;
      image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      images.set(key, image);
    }
    return images.get(key);
  });

  let frame: CarouselDrawing | undefined;
  let artworkReady = false;
  let ready = false;
  let disposed = false;
  let pending = 0;
  const waveStart = performance.now();
  let ringStart = 0;
  let visible = false;
  const resize = new ResizeObserver(schedule);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    animateArtwork();
  });
  const sketch = new P5(p => {
    p.setup = () => {
      if (disposed) { void p.remove(); return; }
      p.pixelDensity(Math.min(devicePixelRatio || 1, 2));
      const canvas = p.createCanvas(host.clientWidth, host.clientHeight).elt as HTMLCanvasElement;
      canvas.dataset.modelSketch = 'true';
      p.noLoop();
      ready = true;
      resize.observe(host);
      if (!reducedMotion) {
        intersection.observe(host);
        document.addEventListener('visibilitychange', animateArtwork);
      }
      schedule();
    };

    p.draw = () => {
      if (!artworkReady || !frame || disposed) return;
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      const { opening, plates } = frame;
      ctx.font = labelFont;
      const labelWidths = ringLabels.map(label => ctx.measureText(label).width);
      const labelWidth = Math.max(...labelWidths);
      // Reserve space for the upright labels as they pass the sides and ends.
      const padding = 6 + ringLabelGap;
      const room = Math.max(1, 2 * Math.min(
        p.width / 2 - padding - labelWidth - ringLabelSize / 4,
        p.height / 2 - padding - ringLabelSize - labelWidth / 4,
      ));
      const fit = Math.min(1, room / (2 * ringRadiusRatio * frame.diameter));
      const closing = Math.max(0, 1 - opening * 4);
      const scale = 1 + (fit * closedLogoScale - 1) * closing * closing * (3 - 2 * closing);
      const diameter = frame.diameter * scale;
      const xInset = p.width * (1 - scale) / 2;
      const y = (p.height - diameter) / 2;
      ctx.clearRect(0, 0, p.width, p.height);
      ctx.strokeStyle = ink;
      ctx.fillStyle = fill;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2 * carouselOutlineWidth / diameter;

      // Paint outlines first, then cover their inner halves with the combined fill.
      // Where slits overlap, only the outside contour survives.
      for (const plate of plates) {
        if (!plate) continue;
        ctx.save();
        ctx.translate(plate.x * scale + xInset, y);
        ctx.scale(diameter, diameter);
        ctx.globalAlpha = plate.outline * plate.opacity;
        ctx.stroke(plate.path);
        ctx.restore();
      }
      plates.forEach((plate, index) => {
        if (!plate) return;
        ctx.save();
        ctx.translate(plate.x * scale + xInset, y);
        ctx.scale(diameter, diameter);
        ctx.globalAlpha = plate.opacity;
        ctx.fill(plate.path);
        const art = artworks[index];
        const model = modelSlides[index];
        if (plate.artwork > 0 && (model || art?.naturalWidth)) {
          ctx.clip(plate.path);
          ctx.globalAlpha *= plate.artwork;
          if (model) {
            ctx.fillStyle = ink;
            const seconds = reducedMotion ? null : (performance.now() - waveStart) / 1000;
            drawModelWave(ctx, plate.radius ?? .5, seconds);
          } else if (art) {
            const inset = (1 - plate.zoom) / 2;
            ctx.drawImage(art, inset, inset, plate.zoom, plate.zoom);
          }
        }
        ctx.restore();
      });
      if (opening === 0) {
        const seconds = reducedMotion ? 0 : (performance.now() - ringStart) / 1000;
        const opacity = reducedMotion ? 1 : Math.min(1, seconds * 5);
        const radius = frame.diameter * fit * ringRadiusRatio;
        drawLogoRing(ctx, p.width / 2, p.height / 2, radius, seconds, opacity, labelWidths);
      }
      if (!viewport.hasAttribute('data-model-canvas')) viewport.dataset.modelCanvas = 'true';
      animateArtwork();
    };
  }, host);

  Promise.allSettled([...images.values()].map(image => image.decode())).then(() => {
    artworkReady = true;
    schedule();
  });
  void document.fonts.load(labelFont).then(schedule, schedule);

  function animateArtwork() {
    if (reducedMotion || !visible || document.hidden || !frame) return;
    if (frame.opening === 0 || frame.plates.some((plate, index) => modelSlides[index] && plate && plate.artwork > 0)) schedule();
  }

  function schedule() {
    if (!ready || !artworkReady || disposed || pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      const { clientWidth: width, clientHeight: height } = host;
      if (width !== sketch.width || height !== sketch.height) sketch.resizeCanvas(width, height, true);
      void sketch.redraw();
    });
  }

  return {
    render(drawing: CarouselDrawing) {
      if (drawing.opening === 0 && frame?.opening !== 0) ringStart = performance.now();
      frame = drawing;
      schedule();
    },
    redraw: schedule,
    destroy() {
      disposed = true;
      cancelAnimationFrame(pending);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', animateArtwork);
      delete viewport.dataset.modelCanvas;
      void sketch.remove();
    },
  };
}

export type { PlateDrawing };
