import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const reports = await db.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { name: true },
        },
      },
    });

    const formattedReports = reports.map((report) => ({
      ...report,
      clientName: (report.client as any)?.name || null,
    }));

    return NextResponse.json(formattedReports);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const report = await db.report.create({
      data: {
        title: body.title,
        description: body.description || "",
        type: body.type || "performance",
        format: body.format || "pdf",
        status: body.status || "completed",
        scheduledAt: body.scheduledAt
          ? new Date(body.scheduledAt)
          : undefined,
        generatedAt: body.generatedAt
          ? new Date(body.generatedAt)
          : undefined,
        clientId: body.clientId || null,
        userId: body.userId || null,
      },
    });
    return NextResponse.json(report, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
