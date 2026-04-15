const DEFAULT_GLOBE_URL = "https://www.google.com/s2/favicons?domain=_unknown_.invalid&sz=64";

let globeFingerprint: number | null = null;
let initPromise: Promise<void> | null = null;

/** Compute a fast hash of image pixel data via canvas. Returns null if canvas is tainted (CORS). */
function hashImage(img: HTMLImageElement): number | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let h = 0;
    for (let i = 0; i < data.length; i += 4) {
      h = ((h << 5) - h + data[i] + data[i + 1] + data[i + 2]) | 0;
    }
    return h;
  } catch {
    return null;
  }
}

/** Preload the default globe icon and store its fingerprint. */
function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const fp = hashImage(img);
      if (fp !== null) globeFingerprint = fp;
      resolve();
    };
    img.onerror = () => resolve();
    img.src = DEFAULT_GLOBE_URL;
  });

  return initPromise;
}

/**
 * Check if a loaded <img> element is the default Google globe favicon.
 * Returns false if detection is unavailable (CORS blocked or not yet initialized).
 */
export function isGlobeFavicon(img: HTMLImageElement): boolean {
  if (globeFingerprint === null) return false;
  const fp = hashImage(img);
  return fp !== null && fp === globeFingerprint;
}

/** Call once at app startup to preload the default globe fingerprint. */
export function initFaviconDetect(): Promise<void> {
  return ensureInit();
}
