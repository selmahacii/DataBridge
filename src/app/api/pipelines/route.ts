import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const pipelines = await db.pipeline.findMany({
      where: clientId ? { clientId } : {},
      include: {
        client: {
          select: { name: true },
        },
        steps: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = pipelines.map((p) => ({
      ...p,
      stepCount: p.steps.length,
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
    const { steps, ...pipelineData } = body;

    const pipeline = await db.pipeline.create({
      data: {
        name: pipelineData.name,
        description: pipelineData.description || "",
        status: pipelineData.status || "active",
        frequency: pipelineData.frequency || "daily",
        clientId: pipelineData.clientId,
        steps: steps
          ? {
              create: steps.map(
                (step: {
                  name: string;
                  type: string;
                  order: number;
                  config?: string;
                  status?: string;
                }) => ({
                  name: step.name,
                  type: step.type,
                  order: step.order,
                  config: step.config || "{}",
                  status: step.status || "active",
                })
              ),
            }
          : undefined,
      },
      include: {
        client: {
          select: { name: true },
        },
        steps: {
          orderBy: { order: "asc" },
        },
      },
    });
    return NextResponse.json(pipeline, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
