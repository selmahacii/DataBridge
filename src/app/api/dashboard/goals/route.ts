import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Attempt to fetch from DB
    const goals = await db.goal.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { name: true }
        }
      }
    });

    // If no goals exist yet, return realistic mock data to populate the UI
    if (goals.length === 0) {
      return NextResponse.json([
        {
          id: "g1",
          metric: "revenue",
          targetValue: 50000,
          currentValue: 34500,
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
          status: "active",
          client: { name: "Nexus Digital" }
        },
        {
          id: "g2",
          metric: "conversions",
          targetValue: 850,
          currentValue: 620,
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
          status: "active",
          client: { name: "Nexus Digital" }
        },
        {
          id: "g3",
          metric: "sessions",
          targetValue: 120000,
          currentValue: 125000,
          startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
          status: "completed",
          client: { name: "Peak Media" }
        }
      ]);
    }

    return NextResponse.json(goals);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
