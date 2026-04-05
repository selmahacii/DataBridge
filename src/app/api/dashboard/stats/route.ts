import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [
      totalClients,
      totalSources,
      totalDataPoints,
      totalPipelines,
      activeUsers,
      totalRevenue,
      lastSync,
    ] = await Promise.all([
      db.smeClient.count(),
      db.dataSource.count(),
      db.dataPoint.count(),
      db.pipeline.count(),
      db.user.count({ where: { isActive: true } }),
      db.dataPoint.aggregate({
        _sum: { value: true },
        where: { metric: "revenue" },
      }),
      db.dataSource.findFirst({
        orderBy: { lastSync: "desc" },
        select: { lastSync: true },
      }),
    ]);

    // Conversion rate: sum(conversions) / sum(sessions) * 100
    const convAgg = await db.dataPoint.aggregate({
      _sum: { value: true },
      where: { metric: "conversions" },
    });
    const sessAgg = await db.dataPoint.aggregate({
      _sum: { value: true },
      where: { metric: "sessions" },
    });
    const totalConversions = convAgg._sum.value ?? 0;
    const totalSessions = sessAgg._sum.value ?? 1;
    const avgConversionRate = Math.round((totalConversions / totalSessions) * 10000) / 100;

    return NextResponse.json({
      totalClients,
      dataSources: totalSources,
      dataPoints: totalDataPoints,
      totalPipelines,
      activeUsers,
      totalRevenue: Math.round((totalRevenue._sum.value ?? 0) * 100) / 100,
      avgConversion: avgConversionRate,
      activePipelines: await db.pipeline.count({ where: { status: "active" } }),
      lastSync: lastSync?.lastSync ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
