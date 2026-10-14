/** Favicon source chain with per-domain localStorage cache. */

const CACHE_PREFIX = "howmanyat-favicon-";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const NONE = -1;

export interface FaviconSource {
  url: string;
  /** Both services answer misses with a placeholder image (HTTP 404, but still decodable). */
  isDefault: (w: number, h: number) => boolean;
}

// Google returns a 16x16 globe; DuckDuckGo a 48x48 grey icon.
const googleDefault = (w: number) => w <= 16;
const ddgDefault = (w: number, h: number) => w <= 1 || (w === 48 && h === 48);

export function faviconSources(domain: string): FaviconSource[] {
  return [domain, `mail.${domain}`].flatMap((d) => {
    const e = encodeURIComponent(d);
    return [
      { url: `https://www.google.com/s2/favicons?domain=${e}&sz=64`, isDefault: googleDefault },
      { url: `https://icons.duckduckgo.com/ip3/${e}.ico`, isDefault: ddgDefault },
    ];
  });
}

/** Returns cached source index, NONE (-1) if known missing, or null if unknown. */
export function readFaviconCache(domain: string): number | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + domain);
    if (!raw) return null;
    const { i, t } = JSON.parse(raw) as { i: number; t: number };
    if (Date.now() - t > CACHE_TTL) return null;
    return i;
  } catch {
    return null;
  }
}

export function writeFaviconCache(domain: string, index: number) {
  try {
    localStorage.setItem(CACHE_PREFIX + domain, JSON.stringify({ i: index, t: Date.now() }));
  } catch {}
}

export const FAVICON_NONE = NONE;
