import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pipeline = await db.pipeline.findUnique({
      where: { id },
      include: {
        client: {
          select: { name: true },
        },
        steps: {
          orderBy: { order: "asc" },
        },
      },
    });
    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(pipeline);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { steps, ...pipelineData } = body;

    if (steps) {
      await db.pipelineStep.deleteMany({ where: { pipelineId: id } });
    }

    const pipeline = await db.pipeline.update({
      where: { id },
      data: {
        ...(pipelineData.name !== undefined && { name: pipelineData.name }),
        ...(pipelineData.description !== undefined && {
          description: pipelineData.description,
        }),
        ...(pipelineData.status !== undefined && {
          status: pipelineData.status,
        }),
        ...(pipelineData.frequency !== undefined && {
          frequency: pipelineData.frequency,
        }),
        ...(pipelineData.clientId !== undefined && {
          clientId: pipelineData.clientId,
        }),
        ...(steps && {
          steps: {
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
          },
        }),
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
    return NextResponse.json(pipeline);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.pipelineStep.deleteMany({ where: { pipelineId: id } });
    await db.pipeline.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
