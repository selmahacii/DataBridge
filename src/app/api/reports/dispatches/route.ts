import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    const dispatches = await (db as any).scheduledDispatch.findMany({
      where: clientId && clientId !== "all" ? { clientId } : {},
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(dispatches.map((d: any) => {
      let targets = [];
      try {
        targets = d.targets ? JSON.parse(d.targets) : [];
      } catch (e) {
        console.error("JSON Parse Error for Dispatch Targets:", d.targets);
        targets = [];
      }
      return {
        ...d,
        targets,
        clientName: d.client?.name || "Unknown Client",
      };
    }));
  } catch (error: any) {
    console.error("Critical Dispatch API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, clientId, cron, targets, icon, active } = body;

    const dispatch = await (db as any).scheduledDispatch.create({
      data: {
        title,
        description: description || "",
        clientId,
        cron,
        targets: JSON.stringify(targets),
        icon: icon || "Server",
        active: active ?? true,
      },
    });

    return NextResponse.json(dispatch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
