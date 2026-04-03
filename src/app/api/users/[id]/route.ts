import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const user = await db.user.update({
      where: { id },
      data: {
        ...(body.email !== undefined && { email: body.email }),
        ...(body.password !== undefined && { password: body.password }),
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.agencyId !== undefined && {
          agencyId: body.agencyId || null,
        }),
      },
      include: {
        agency: {
          select: { name: true },
        },
      },
    });
    return NextResponse.json(user);
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
    await db.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
