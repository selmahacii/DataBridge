import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const agencyId = searchParams.get('agencyId')

    if (!orgId && !agencyId) {
      return NextResponse.json(
        { error: 'orgId or agencyId is required' },
        { status: 400 }
      )
    }

    // If agencyId is provided, return ALL dashboards for all clients of that agency
    if (agencyId) {
      const dashboards = await db.dashboard.findMany({
        where: { agencyId },
        include: {
          org: {
            select: { id: true, name: true },
          },
          agency: {
            select: { id: true, name: true },
          },
          widgets: {
            include: {
              pipeline: {
                select: { id: true, name: true },
              },
            },
            orderBy: [{ positionY: 'asc' }, { positionX: 'asc' }],
          },
          _count: {
            select: { widgets: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(dashboards)
    }

    // Otherwise filter by orgId (existing behavior)
    const dashboards = await db.dashboard.findMany({
      where: { orgId: orgId! },
      include: {
        org: {
          select: { id: true, name: true },
        },
        agency: {
          select: { id: true, name: true },
        },
        widgets: {
          include: {
            pipeline: {
              select: { id: true, name: true },
            },
          },
          orderBy: [{ positionY: 'asc' }, { positionX: 'asc' }],
        },
        _count: {
          select: { widgets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(dashboards)
  } catch (error) {
    console.error('Failed to fetch dashboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboards' },
      { status: 500 }
    )
  }
}
