import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function parseDate(val: string | null): Date | undefined {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");
    const metric = searchParams.get("metric");
    const startDate = parseDate(searchParams.get("startDate"));
    const endDate = parseDate(searchParams.get("endDate"));

    const where: Record<string, unknown> = {};
    if (sourceId) where.sourceId = sourceId;
    if (metric) where.metric = metric;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = startDate;
      if (endDate) (where.date as Record<string, unknown>).lte = endDate;
    }

    const dataPoints = await db.dataPoint.findMany({
      where,
      orderBy: { date: "desc" },
      take: 100000,
      include: {
        source: {
          select: { name: true, type: true },
        },
      },
    });

    const headers = [
      "id",
      "sourceId",
      "sourceName",
      "sourceType",
      "metric",
      "value",
      "date",
      "device",
      "country",
      "campaign",
    ];

    const rows = dataPoints.map((dp) => [
      dp.id,
      dp.sourceId,
      `"${(dp.source as { name: string }).name}"`,
      `"${(dp.source as { type: string }).type}"`,
      dp.metric,
      dp.value,
      dp.date.toISOString().split("T")[0],
      dp.device,
      dp.country ? `"${dp.country}"` : "",
      dp.campaign ? `"${dp.campaign}"` : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=databridge-export.csv",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
