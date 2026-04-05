import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// TODO: add pagination + filtering. currently returns all clients which
// will be slow once we have more than a few hundred.

export async function GET() {
  try {
    const clients = await db.smeClient.findMany({
      include: {
        agency: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(clients);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await db.smeClient.create({
      data: {
        name: body.name,
        slug: body.slug,
        industry: body.industry,
        website: body.website || "",
        email: body.email || "",
        phone: body.phone || "",
        status: body.status || "active",
        agencyId: body.agencyId,
      },
      include: {
        agency: {
          select: { name: true },
        },
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
