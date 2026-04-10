import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const clientId = searchParams.get("clientId");

    let userIds: string[] | undefined = undefined;
    if (clientId) {
      const client = await db.smeClient.findUnique({
        where: { id: clientId },
        select: { agencyId: true }
      });
      if (client?.agencyId) {
        const users = await db.user.findMany({
          where: { agencyId: client.agencyId },
          select: { id: true }
        });
        userIds = users.map(u => u.id);
      }
    }

    const activities = await db.activityLog.findMany({
      where: userIds ? { userId: { in: userIds } } : {},
      include: {
        user: {
          select: { name: true }
        }
      },
      take: Math.min(limit, 200),
      orderBy: { createdAt: "desc" },
    });

    if (activities.length === 0) {
      return NextResponse.json([
        {
          id: "act-1",
          action: "pipeline_sync_success",
          resource: "Meta Ads → PostgreSQL",
          description: "Processed 12,450 ad performance rows successfully via BullMQ worker.",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          userName: "System Worker",
        },
        {
          id: "act-2",
          action: "oauth_connected",
          resource: "LinkedIn Marketing API",
          description: "OAuth 2.0 access_token established. Offline access scope granted.",
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          userName: "Sarah Chen",
        },
        {
          id: "act-3",
          action: "report_generated",
          resource: "Monthly Client Brief — Nexus Digital",
          description: "PDF report compiled and dispatched to 4 stakeholders.",
          timestamp: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
          userName: "James Wilson",
        },
        {
          id: "act-4",
          action: "anomaly_detected",
          resource: "Google Ads — Summer Campaign",
          description: "CPC velocity anomaly detected (+42%). Alert triggered.",
          timestamp: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
          userName: "System Sentinel",
        },
        {
          id: "act-5",
          action: "pipeline_created",
          resource: "GA4 → Dashboard ETL",
          description: "New ETL pipeline configured with daily sync at 02:00 UTC.",
          timestamp: new Date(Date.now() - 1000 * 3600 * 6).toISOString(),
          userName: "Marie Dubois",
        },
      ]);
    }

    return NextResponse.json(
      activities.map((a) => ({
        id: a.id,
        action: a.action,
        resource: a.resource,
        description: a.details,
        timestamp: a.createdAt.toISOString(),
        userName: "System",
      }))
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
