import { NextRequest, NextResponse } from "next/server";
import { tryApi, formatZodError } from "@/lib/api-utils";
import { getAllLabels, createLabel } from "@/lib/queries";
import { createLabelSchema } from "@/lib/validators";

export async function GET() {
  return tryApi(async () => {
    const labels = getAllLabels();
    return NextResponse.json(labels);
  });
}

export async function POST(request: NextRequest) {
  return tryApi(async () => {
    const body = await request.json();
    const parsed = createLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    createLabel(parsed.data.name);
    const labels = getAllLabels();
    return NextResponse.json(labels, { status: 201 });
  });
}
