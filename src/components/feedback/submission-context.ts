export type SubmissionContext = {
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  pixelRatio: number;
  pageUrl: string;
};

export function captureSubmissionContext(): SubmissionContext {
  const ua = navigator.userAgent;
  const candidates: [string, RegExp][] = [
    ['Edge', /(?:Edg|EdgA|EdgiOS)\/([\d.]+)/],
    ['Opera', /(?:OPR|OPiOS)\/([\d.]+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
    ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
    ['Safari', /Version\/([\d.]+).*Safari/],
  ];
  let browser = 'Unknown browser';
  for (const [name, pattern] of candidates) {
    const match = ua.match(pattern);
    if (match) { browser = `${name} ${match[1]}`; break; }
  }
  return {
    browser, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
    // Query strings and fragments may contain private tokens or form values.
    pageUrl: `${location.origin}${location.pathname}`.slice(0, 2000),
  };
}

export function contextLabel(context: SubmissionContext) {
  return `${context.browser} · ${context.viewportWidth} × ${context.viewportHeight} CSS px · ${context.pixelRatio}× pixel ratio\n${context.pageUrl}`;
}
