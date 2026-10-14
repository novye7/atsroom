"use client";

import { CircleAlert } from "lucide-react";
import { cn } from "../../lib/utils";
import { DomainFavicon } from "./domain-favicon";

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

export function EmailAvatar({ email, size = 20, className }: EmailAvatarProps) {
  if (!isValidEmail(email)) {
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

  return <DomainFavicon domain={getDomain(email)} size={size} className={className} />;
}
