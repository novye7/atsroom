import { NextRequest, NextResponse } from "next/server";
import { tryApi } from "@/lib/api-utils";
import { deleteAccount } from "@/lib/queries";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return tryApi(async () => {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "无效的账户 ID" }, { status: 400 });
    }
    deleteAccount(id);
    return NextResponse.json({ success: true });
  });
}
