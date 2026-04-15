import { NextRequest, NextResponse } from "next/server";
import { tryApi } from "@/lib/api-utils";
import { promoteAddress } from "@/lib/queries";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  return tryApi(async () => {
    const { id: idStr, addressId: addrIdStr } = await params;
    const accountId = Number(idStr);
    const addressId = Number(addrIdStr);
    if (!Number.isInteger(accountId) || accountId <= 0 || !Number.isInteger(addressId) || addressId <= 0) {
      return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
    }
    promoteAddress(accountId, addressId);
    return NextResponse.json({ success: true });
  });
}
