/** Keep local previews at / while supporting GitHub Pages project URLs. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function withBasePath(path: string) {
  if (!basePath || !path.startsWith('/') || path.startsWith('//') || path === basePath || path.startsWith(`${basePath}/`)) return path;
  return `${basePath}${path}`;
}

/** Also handles srcsets and CSS url() values used by illustration masks. */
export function assetPath(value: string): string;
export function assetPath(value: string | undefined): string | undefined;
export function assetPath(value: string | undefined) {
  return value?.replace(/(^|[\s('"`,])\/(assets|fonts)\//g, `$1${basePath}/$2/`);
}
