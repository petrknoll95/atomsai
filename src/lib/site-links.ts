/** Routes already migrated; all other marketing pages still live on atomsai.com. */
const localPages = new Set(['/applications', '/infrastructure', '/approach', '/capabilities/voice', '/industries/healthcare', '/trust', '/company/contact', '/blog']);
export function siteHref(path: string) {
  if (path.startsWith('#')) return `/${path}`;
  // Section links such as /applications#justcall belong to their local page.
  if (localPages.has(path.split('#')[0]) || !path.startsWith('/')) return path;
  return `https://atomsai.com${path}`;
}
