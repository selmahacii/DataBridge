import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const source = await db.dataSource.findUnique({
      where: { id },
      include: {
        client: {
          select: { name: true },
        },
        dataPoints: {
          orderBy: { date: "desc" },
          take: 100,
        },
      },
    });
    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
    return NextResponse.json(source);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const source = await db.dataSource.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.platform !== undefined && { platform: body.platform }),
        ...(body.accountId !== undefined && { accountId: body.accountId }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.syncFrequency !== undefined && {
          syncFrequency: body.syncFrequency,
        }),
        ...(body.lastSync !== undefined && {
          lastSync: body.lastSync ? new Date(body.lastSync) : null,
        }),
        ...(body.clientId !== undefined && { clientId: body.clientId }),
      },
      include: {
        client: {
          select: { name: true },
        },
      },
    });
    return NextResponse.json(source);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.dataSource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
