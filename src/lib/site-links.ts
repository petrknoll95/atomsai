/** Routes already migrated; all other marketing pages still live on atomsai.com. */
const localPages = new Set(['/approach', '/capabilities/voice', '/industries/healthcare', '/trust', '/company/contact']);
export function siteHref(path: string) {
  if (path.startsWith('#')) return `/${path}`;
  if (localPages.has(path) || !path.startsWith('/')) return path;
  return `https://atomsai.com${path}`;
}
