import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const alerts = await db.anomalyAlert.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    if (alerts.length === 0) {
      return NextResponse.json([
        {
          id: "a1",
          metric: "costPerClick",
          severity: "high",
          message: "CPC increased by 45% in the last 24 hours on 'Summer Promo' campaign.",
          createdAt: new Date().toISOString(),
          client: { name: "Nexus Digital" }
        },
        {
          id: "a2",
          metric: "conversions",
          severity: "medium",
          message: "Conversion tracking might be broken. 0 conversions recorded today.",
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          client: { name: "Peak Media" }
        },
        {
          id: "a3",
          metric: "bounceRate",
          severity: "low",
          message: "Bounce rate is trending above historical average (68%).",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          client: { name: "Nexus Digital" }
        }
      ]);
    }

    return NextResponse.json(alerts);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
