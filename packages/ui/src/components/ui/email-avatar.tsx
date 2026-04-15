"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { cn, stringToHsl } from "../../lib/utils";
import { isGlobeFavicon } from "../../lib/favicon-detect";

interface EmailAvatarProps {
  email: string;
  size?: number;
  className?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getDomain(email: string): string {
  const parts = email.split("@");
  return parts[parts.length - 1] || "";
}

const FAVICON_FETCH_SIZE = 64;
const domainStateCache = new Map<string, "favicon" | "letter">();

export function EmailAvatar({ email, size = 20, className }: EmailAvatarProps) {
  const domain = getDomain(email);

  const [state, setState] = useState<"loading" | "favicon" | "letter" | "invalid">(() => {
    if (!isValidEmail(email)) return "invalid";
    return domainStateCache.get(domain) ?? "loading";
  });

  if (state === "invalid") {
    return (
      <div
        data-slot="email-avatar"
        className={cn(
          "flex items-center justify-center rounded-full bg-[var(--muted-bg)] shrink-0",
          className
        )}
        style={{ width: size, height: size }}
      >
        <CircleAlert
          className="text-[var(--error)]"
          style={{ width: size * 0.6, height: size * 0.6 }}
        />
      </div>
    );
  }

  if (state === "loading" || state === "favicon") {
    return (
      <img
        key={email}
        crossOrigin="anonymous"
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${FAVICON_FETCH_SIZE}`}
        alt=""
        width={size}
        height={size}
        className={cn("rounded-full shrink-0", className)}
        style={{ width: size, height: size }}
        onLoad={(e) => {
          if (isGlobeFavicon(e.currentTarget)) {
            domainStateCache.set(domain, "letter");
            setState("letter");
          } else {
            domainStateCache.set(domain, "favicon");
            setState("favicon");
          }
        }}
        onError={() => {
          domainStateCache.set(domain, "letter");
          setState("letter");
        }}
      />
    );
  }

  // Letter fallback — colored circle with first letter of domain
  return (
    <div
      key={email}
      data-slot="email-avatar"
      className={cn(
        "flex items-center justify-center rounded-full shrink-0 text-white font-medium",
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: stringToHsl(domain),
        fontSize: size * 0.5,
      }}
    >
      {domain.charAt(0).toUpperCase()}
    </div>
  );
}
