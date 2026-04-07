import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, clientId, cron, targets, active } = body;

    const dispatch = await (db as any).scheduledDispatch.update({
      where: { id: params.id },
      data: {
        title,
        clientId,
        cron,
        targets: targets ? JSON.stringify(targets) : undefined,
        active,
      },
    });

    return NextResponse.json(dispatch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await (db as any).scheduledDispatch.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
