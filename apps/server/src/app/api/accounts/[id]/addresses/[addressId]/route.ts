import { NextRequest, NextResponse } from "next/server";
import { tryApi, formatZodError } from "@/lib/api-utils";
import { updateAddress, deleteAddress, updateAddressLabels } from "@/lib/queries";
import { updateAddressSchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  return tryApi(async () => {
    const { id: idStr, addressId: addrIdStr } = await params;
    const accountId = Number(idStr);
    const addressId = Number(addrIdStr);
    if (!Number.isInteger(accountId) || accountId <= 0 || !Number.isInteger(addressId) || addressId <= 0) {
      return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateAddressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    if (parsed.data.email) {
      updateAddress(addressId, parsed.data.email);
    }

    updateAddressLabels(addressId, {
      addLabelNames: parsed.data.addLabelNames,
      removeLabelIds: parsed.data.removeLabelIds,
    });

    return NextResponse.json({ success: true });
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  return tryApi(async () => {
    const { addressId: addrIdStr } = await params;
    const addressId = Number(addrIdStr);
    if (!Number.isInteger(addressId) || addressId <= 0) {
      return NextResponse.json({ error: "无效的地址 ID" }, { status: 400 });
    }
    deleteAddress(addressId);
    return NextResponse.json({ success: true });
  });
}
