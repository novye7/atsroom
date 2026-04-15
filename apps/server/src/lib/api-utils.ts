import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function formatZodError(error: ZodError): string {
  return error.issues.map((e) => e.message).join(", ");
}

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function tryApi(fn: () => Promise<NextResponse> | NextResponse): Promise<NextResponse> {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.catch((e: unknown) => {
        const message = e instanceof Error ? e.message : "Unknown error";
        if (message.includes("UNIQUE constraint")) return apiError("该邮箱地址已存在", 409);
        console.error("API error:", e);
        return apiError(message, 500);
      });
    }
    return Promise.resolve(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("UNIQUE constraint")) return Promise.resolve(apiError("该邮箱地址已存在", 409));
    console.error("API error:", e);
    return Promise.resolve(apiError(message, 500));
  }
}
