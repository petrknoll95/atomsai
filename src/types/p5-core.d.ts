declare module 'p5/core' {
  export { default } from 'p5';
}
declare module 'p5/accessibility' {
  const addon: Parameters<typeof import('p5').default.registerAddon>[0];
  export default addon;
}
