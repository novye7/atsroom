import { NextRequest, NextResponse } from "next/server";
import { tryApi, apiError, formatZodError } from "@/lib/api-utils";
import { createAddress } from "@/lib/queries";
import { createAddressSchema } from "@/lib/validators";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return tryApi(async () => {
    const { id: idStr } = await params;
    const accountId = Number(idStr);
    if (!Number.isInteger(accountId) || accountId <= 0) {
      return NextResponse.json({ error: "无效的账户 ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = createAddressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { email } = parsed.data;
    const existing = db.select().from(addresses).where(eq(addresses.email, email)).get();
    if (existing) {
      return apiError("该邮箱地址已存在", 409);
    }

    createAddress(accountId, email);
    return NextResponse.json({ success: true }, { status: 201 });
  });
}
