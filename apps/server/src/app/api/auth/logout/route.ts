import { NextResponse } from "next/server";
import { tryApi } from "@/lib/api-utils";

export async function POST() {
  return tryApi(() => {
    const response = NextResponse.json({ success: true });
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  });
}
