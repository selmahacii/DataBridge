import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const users = await db.user.findMany({
      where: { active: true },
      include: {
        agency: {
          select: { id: true, name: true },
        },
        org: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    })

    const mapped = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      agencyId: u.agencyId ?? undefined,
      orgId: u.orgId ?? undefined,
      agencyName: u.agency?.name ?? undefined,
      orgName: u.org?.name ?? undefined,
    }))

    return NextResponse.json(mapped)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
