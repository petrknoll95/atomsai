import P5 from 'p5/core';
import accessibility from 'p5/accessibility';

P5.registerAddon(accessibility);

type PlateDrawing = {
  path: Path2D;
  x: number;
  opacity: number;
  outline: number;
  artwork: number;
  zoom: number;
};

type CarouselDrawing = {
  diameter: number;
  plates: (PlateDrawing | undefined)[];
};

export function mountCarouselSketch(host: HTMLElement, slides: HTMLElement[]) {
  const viewport = host.parentElement!;
  const colors = getComputedStyle(viewport);
  const ink = colors.getPropertyValue('--diagram-ink').trim();
  const fill = colors.getPropertyValue('--diagram-fill').trim();
  const iris = colors.getPropertyValue('--palette-iris').trim();
  const images = new Map<string, HTMLImageElement>();
  const artworks = slides.map(slide => {
    const key = slide.dataset.modelPlate!;
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
  const resize = new ResizeObserver(schedule);
  const sketch = new P5(p => {
    p.setup = () => {
      if (disposed) { void p.remove(); return; }
      p.pixelDensity(Math.min(devicePixelRatio || 1, 2));
      const canvas = p.createCanvas(host.clientWidth, host.clientHeight).elt as HTMLCanvasElement;
      canvas.dataset.modelSketch = 'true';
      p.noLoop();
      ready = true;
      resize.observe(host);
      schedule();
    };

    p.draw = () => {
      if (!artworkReady || !frame || disposed) return;
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      const { diameter, plates } = frame;
      const y = (p.height - diameter) / 2;
      ctx.clearRect(0, 0, p.width, p.height);
      ctx.strokeStyle = ink;
      ctx.fillStyle = fill;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3 / diameter;

      // Paint outlines first, then cover their inner halves with the combined fill.
      // Where slits overlap, only the outside contour survives.
      for (const plate of plates) {
        if (!plate) continue;
        ctx.save();
        ctx.translate(plate.x, y);
        ctx.scale(diameter, diameter);
        ctx.globalAlpha = plate.outline * plate.opacity;
        ctx.stroke(plate.path);
        ctx.restore();
      }
      plates.forEach((plate, index) => {
        if (!plate) return;
        ctx.save();
        ctx.translate(plate.x, y);
        ctx.scale(diameter, diameter);
        ctx.globalAlpha = plate.opacity;
        ctx.fill(plate.path);
        const art = artworks[index];
        if (art?.naturalWidth && plate.artwork > 0) {
          const inset = (1 - plate.zoom) / 2;
          ctx.clip(plate.path);
          ctx.globalAlpha *= plate.artwork;
          ctx.drawImage(art, inset, inset, plate.zoom, plate.zoom);
        }
        ctx.restore();
      });
      viewport.dataset.modelCanvas = 'true';
    };
  }, host);

  Promise.allSettled([...images.values()].map(image => image.decode())).then(() => {
    artworkReady = true;
    schedule();
  });

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
      frame = drawing;
      schedule();
    },
    redraw: schedule,
    destroy() {
      disposed = true;
      cancelAnimationFrame(pending);
      resize.disconnect();
      delete viewport.dataset.modelCanvas;
      void sketch.remove();
    },
  };
}

export type { PlateDrawing };
