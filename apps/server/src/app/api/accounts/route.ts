import { NextRequest, NextResponse } from "next/server";
import { tryApi, apiError, formatZodError } from "@/lib/api-utils";
import { getAllAccounts, getFilteredAccounts, createAccountWithEmail } from "@/lib/queries";
import { createAccountSchema } from "@/lib/validators";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  return tryApi(async () => {
    const url = new URL(request.url);
    const labelIds = url.searchParams.get("labelIds");
    const ids = labelIds ? labelIds.split(",").map(Number).filter(Boolean) : [];

    const accounts = ids.length > 0 ? getFilteredAccounts(ids) : getAllAccounts();
    return NextResponse.json(accounts);
  });
}

export async function POST(request: NextRequest) {
  return tryApi(async () => {
    const body = await request.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { email, labelNames } = parsed.data;

    // Check duplicate email
    const existing = db.select().from(addresses).where(eq(addresses.email, email)).get();
    if (existing) {
      return apiError("该邮箱地址已存在", 409);
    }

    createAccountWithEmail(email, labelNames);
    const accounts = getAllAccounts();
    return NextResponse.json(accounts, { status: 201 });
  });
}
