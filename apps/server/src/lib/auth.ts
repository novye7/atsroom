import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.AUTH_PASSWORD ?? "";

export function verifyPassword(password: string): boolean {
  if (!SECRET) return false;
  return password === SECRET;
}

export function createSessionToken(): string {
  const hmac = createHmac("sha256", SECRET);
  hmac.update("howmanyat-session");
  return hmac.digest("hex");
}

export function validateSessionToken(token: string): boolean {
  if (!SECRET) return false;
  const expected = createSessionToken();
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
