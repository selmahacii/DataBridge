import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Handles data grouping for various time periods (month, week, day)

function parseDate(val: string | null): Date | undefined {
  if (!val) return undefined;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function getDateKey(date: Date, groupBy: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  if (groupBy === "month") return `${y}-${m}`;
  if (groupBy === "week") {
    const jan1 = new Date(y, 0, 1);
    const dayOfYear = Math.ceil((date.getTime() - jan1.getTime()) / 86400000);
    const week = Math.ceil((dayOfYear + jan1.getDay()) / 7);
    return `${y}-${String(week).padStart(2, "0")}`;
  }
  return `${y}-${m}-${d}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric") || "sessions";
    const sourceId = searchParams.get("sourceId");
    const startDate = parseDate(searchParams.get("startDate"));
    const endDate = parseDate(searchParams.get("endDate"));
    const groupBy = searchParams.get("groupBy") || "day";

    const metrics = metric.split(",").map((m) => m.trim());

    const where: Prisma.DataPointWhereInput = { metric: { in: metrics } };
    if (sourceId) where.sourceId = sourceId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as any).gte = startDate;
      if (endDate)
        (where.date as any).lte = new Date(
          endDate.getTime() + 86400000 - 1
        );
    }

    const dataPoints = await db.dataPoint.findMany({
      where,
      select: { date: true, metric: true, value: true },
      orderBy: { date: "asc" },
    });

    if (metrics.length === 1) {
      const metricName = metrics[0];
      const grouped = new Map<string, number>();
      for (const dp of dataPoints) {
        const key = getDateKey(new Date(dp.date), groupBy);
        grouped.set(key, (grouped.get(key) || 0) + dp.value);
      }
      const result = Array.from(grouped.entries()).map(([date, value]) => ({
        date,
        [metricName]: Math.round(value * 100) / 100,
      }));
      return NextResponse.json({ data: result });
    }

    const results: Record<string, any[]> = {};
    for (const m of metrics) {
      const grouped = new Map<string, number>();
      for (const dp of dataPoints.filter((dp) => dp.metric === m)) {
        const key = getDateKey(new Date(dp.date), groupBy);
        grouped.set(key, (grouped.get(key) || 0) + dp.value);
      }
      results[m] = Array.from(grouped.entries()).map(([date, value]) => ({
        date,
        [m]: Math.round(value * 100) / 100,
      }));
    }

    return NextResponse.json({ data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
