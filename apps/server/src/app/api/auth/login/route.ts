import { NextRequest, NextResponse } from "next/server";
import { tryApi, formatZodError } from "@/lib/api-utils";
import { verifyPassword, createSessionToken } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  password: z.string().min(1, "请输入密码"),
});

export async function POST(request: NextRequest) {
  return tryApi(async () => {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    if (!verifyPassword(parsed.data.password)) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    const token = createSessionToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  });
}
