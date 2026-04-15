import { NextRequest, NextResponse } from "next/server";
import { tryApi, formatZodError } from "@/lib/api-utils";
import { reorderAccounts } from "@/lib/queries";
import { reorderSchema } from "@/lib/validators";

export async function PUT(request: NextRequest) {
  return tryApi(async () => {
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    reorderAccounts(parsed.data.orderedIds);
    return NextResponse.json({ success: true });
  });
}
