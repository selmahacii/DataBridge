import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const agencies = await db.agency.findMany({
      include: {
        _count: {
          select: {
            clients: true,
            users: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(agencies);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agency = await db.agency.create({
      data: {
        name: body.name,
        slug: body.slug,
        email: body.email,
        phone: body.phone || "",
        address: body.address || "",
        logo: body.logo || "",
        plan: body.plan || "professional",
        maxClients: body.maxClients || 10,
      },
      include: {
        _count: {
          select: {
            clients: true,
            users: true,
          },
        },
      },
    });
    return NextResponse.json(agency, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
