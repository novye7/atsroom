import { NextRequest, NextResponse } from "next/server";
import { tryApi, formatZodError } from "@/lib/api-utils";
import { updateLabel, deleteLabel } from "@/lib/queries";
import { updateLabelSchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return tryApi(async () => {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "无效的标签 ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    updateLabel(id, parsed.data.name);
    return NextResponse.json({ success: true });
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return tryApi(async () => {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "无效的标签 ID" }, { status: 400 });
    }
    deleteLabel(id);
    return NextResponse.json({ success: true });
  });
}
