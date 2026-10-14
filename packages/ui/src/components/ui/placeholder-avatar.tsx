"use client";

import { useId } from "react";
import { cn } from "../../lib/utils";
import { useDarkMode } from "../../hooks/use-dark-mode";

/** cyrb53 string hash */
function hash(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// Muted hues that sit well next to the terracotta accent: [hue, saturation]
const PALETTE: [number, number][] = [
  [15, 55],  // terracotta
  [32, 52],  // amber sand
  [45, 46],  // ochre
  [95, 30],  // sage
  [150, 28], // moss
  [180, 34], // teal
  [210, 36], // slate blue
  [250, 26], // dusk
  [300, 22], // plum
  [345, 40], // rose
];

const f = (n: number) => +n.toFixed(2);

interface PlaceholderAvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

/** "@ orbit" placeholder: seeded gradient disc, bold @, orbiting satellite dot. */
export function PlaceholderAvatar({ seed, size = 20, className }: PlaceholderAvatarProps) {
  const id = useId();
  const isDark = useDarkMode().isDark;
  const h = hash(seed);
  const [hue, sat] = PALETTE[h % PALETTE.length];
  const j = (k: number, n: number) => Math.floor(h / k) % n; // seeded jitter
  const light = 60 + j(16, 9) - (isDark ? 10 : 0);
  const hue2 = (hue + 10 + j(97, 20)) % 360;
  const a = (j(1031, 360) * Math.PI) / 180;
  const cx = f(0.3 + j(7919, 40) / 100);
  const cy = f(0.25 + j(104729, 30) / 100);
  const ink = isDark ? "#e8e6dc" : "#faf9f5";

  return (
    <svg
      data-slot="placeholder-avatar"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id={id} cx={cx} cy={cy} r=".9">
          <stop offset="0" stopColor={`hsl(${hue} ${sat}% ${light}%)`} />
          <stop offset="1" stopColor={`hsl(${hue2} ${sat + 6}% ${light - 16}%)`} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${id})`} />
      <g fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round">
        <circle cx="32" cy="32" r="7" />
        <path d="M39 26 V36 a4 4 0 0 0 8 0 V32 A15 15 0 1 0 38 45.6" />
      </g>
      <circle cx={f(32 + Math.cos(a) * 21)} cy={f(32 + Math.sin(a) * 21)} r="3.5" fill={ink} opacity=".9" />
    </svg>
  );
}
