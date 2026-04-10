import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const sources = await db.dataSource.findMany({
      where: clientId ? { clientId } : {},
      include: {
        client: {
          select: { name: true },
        },
        dataPoints: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = sources.map((s) => ({
      ...s,
      dataPointCount: s.dataPoints.length,
      dataPoints: undefined,
    }));

    return NextResponse.json(enriched);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const source = await db.dataSource.create({
      data: {
        name: body.name,
        type: body.type,
        platform: body.platform || "",
        accountId: body.accountId || "",
        status: body.status || "active",
        syncFrequency: body.syncFrequency || "daily",
        clientId: body.clientId,
      },
      include: {
        client: {
          select: { name: true },
        },
      },
    });
    return NextResponse.json(source, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
