"use client";

import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { FAVICON_NONE, faviconSources, readFaviconCache, writeFaviconCache } from "../../lib/favicon";
import { PlaceholderAvatar } from "./placeholder-avatar";

interface DomainFaviconProps {
  domain: string;
  size?: number;
  className?: string;
}

/** Favicon with source fallback; shows the placeholder while loading or when none is found. */
export function DomainFavicon({ domain, size = 20, className }: DomainFaviconProps) {
  const sources = faviconSources(domain);
  const [index, setIndex] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setIndex(readFaviconCache(domain) ?? 0);
  }, [domain]);

  function fail() {
    if (index === null) return;
    const next = index + 1 < sources.length ? index + 1 : FAVICON_NONE;
    if (next === FAVICON_NONE) writeFaviconCache(domain, FAVICON_NONE);
    setIndex(next);
  }

  const source = index !== null && index >= 0 ? sources[index] : null;

  return (
    <span
      data-slot="domain-favicon"
      className={cn("relative inline-block shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {!loaded && <PlaceholderAvatar seed={domain} size={size} className="absolute inset-0" />}
      {source && (
        <img
          key={source.url}
          src={source.url}
          alt=""
          width={size}
          height={size}
          className={cn("absolute inset-0 rounded-full", !loaded && "invisible")}
          style={{ width: size, height: size }}
          onLoad={(e) => {
            const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
            if (source.isDefault(w, h)) return fail();
            writeFaviconCache(domain, index!);
            setLoaded(true);
          }}
          onError={fail}
        />
      )}
    </span>
  );
}
