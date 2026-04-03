import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// NOTE: SQLite stores dates as integers (unix epoch ms) in DataPoint.date
// but Prisma exposes them as DateTime. The getDateKey helper handles both
// formats. This was a pain to debug.

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
    if (startDate) where.date = { ...where.date, gte: startDate };
    // endDate is inclusive, so add 23:59:59.999
    if (endDate) where.date = { ...where.date, lte: new Date(endDate.getTime() + 86400000 - 1) };

    const dataPoints = await db.dataPoint.findMany({
      where,
      select: { date: true, metric: true, value: true },
      orderBy: { date: "asc" },
    });

    if (metrics.length === 1) {
      const grouped = new Map<string, number>();
      for (const dp of dataPoints) {
        const key = getDateKey(new Date(dp.date), groupBy);
        grouped.set(key, (grouped.get(key) || 0) + dp.value);
      }
      const result = Array.from(grouped.entries()).map(([date, value]) => ({
        date,
        metric: metrics[0],
        value: Math.round(value * 100) / 100,
      }));
      return NextResponse.json(result);
    }

    const results: Record<string, { date: string; metric: string; value: number }[]> = {};
    for (const m of metrics) {
      const grouped = new Map<string, number>();
      for (const dp of dataPoints.filter((dp) => dp.metric === m)) {
        const key = getDateKey(new Date(dp.date), groupBy);
        grouped.set(key, (grouped.get(key) || 0) + dp.value);
      }
      results[m] = Array.from(grouped.entries()).map(([date, value]) => ({
        date,
        metric: m,
        value: Math.round(value * 100) / 100,
      }));
    }

    return NextResponse.json(results);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
