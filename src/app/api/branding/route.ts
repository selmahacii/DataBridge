import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const branding = await db.branding.findFirst();
    if (!branding) {
      return NextResponse.json({
        primaryColor: "#1a1a1a",
        secondaryColor: "#6366f1",
        fontFamily: "Inter",
        logo: "",
      });
    }
    return NextResponse.json(branding);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const existing = await db.branding.findFirst();

    let branding;
    if (existing) {
      branding = await db.branding.update({
        where: { id: existing.id },
        data: {
          ...(body.primaryColor !== undefined && {
            primaryColor: body.primaryColor,
          }),
          ...(body.secondaryColor !== undefined && {
            secondaryColor: body.secondaryColor,
          }),
          ...(body.fontFamily !== undefined && {
            fontFamily: body.fontFamily,
          }),
          ...(body.logo !== undefined && { logo: body.logo }),
          ...(body.agencyId !== undefined && {
            agencyId: body.agencyId || null,
          }),
          ...(body.clientId !== undefined && {
            clientId: body.clientId || null,
          }),
        },
      });
    } else {
      branding = await db.branding.create({
        data: {
          primaryColor: body.primaryColor || "#1a1a1a",
          secondaryColor: body.secondaryColor || "#6366f1",
          fontFamily: body.fontFamily || "Inter",
          logo: body.logo || "",
          agencyId: body.agencyId || null,
          clientId: body.clientId || null,
        },
      });
    }

    return NextResponse.json(branding);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
