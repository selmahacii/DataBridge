import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

// GET /api/stats/agency/charts?agencyId=X
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('agencyId')

    if (!agencyId) {
      return NextResponse.json(
        { error: 'agencyId is required' },
        { status: 400 }
      )
    }

    const clientStatusGroups = await db.smeClient.groupBy({
      by: ['status'],
      where: { agencyId },
      _count: { id: true },
    })

    const statusLabels: Record<string, string> = {
      active: 'Actifs',
      trial: 'Essai',
      suspended: 'Suspendus',
      churned: 'Perdus',
    }

    const clientStatusDistribution = clientStatusGroups.map((g) => ({
      name: statusLabels[g.status] ?? g.status,
      value: g._count.id,
    }))

    const recentData = await db.processedData.findMany({
      where: {
        pipeline: { agencyId },
        rowDate: { not: null },
      },
      include: {
        pipeline: {
          select: {
            org: { select: { name: true } },
          },
        },
      },
      orderBy: { rowDate: 'asc' },
      take: 10000,
    })

    const clientTotals = new Map<string, number>()
    for (const row of recentData) {
      const clientName = row.pipeline.org?.name ?? 'Unknown'
      clientTotals.set(clientName, (clientTotals.get(clientName) ?? 0) + 1)
    }
    const topClients = [...clientTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name)

    const clientDayCounts = new Map<string, Map<string, number>>()
    const allDates = new Set<string>()
    for (const row of recentData) {
      const clientName = row.pipeline.org?.name ?? 'Unknown'
      const day = row.rowDate!
      allDates.add(day)
      if (!clientDayCounts.has(day)) {
        clientDayCounts.set(day, new Map())
      }
      const dayMap = clientDayCounts.get(day)!
      dayMap.set(clientName, (dayMap.get(clientName) ?? 0) + 1)
    }

    const sortedDates = [...allDates].sort()
    const last30Dates = sortedDates.slice(-30)

    const pipelineRunsLast30Days = last30Dates.map((date) => {
      const label = format(parseISO(date), 'MMM dd', { locale: fr })
      const counts: Record<string, number> = {}
      const dayData = clientDayCounts.get(date)
      for (const client of topClients) {
        counts[client] = dayData?.get(client) ?? 0
      }
      return { date: label, ...counts }
    })

    const activeClients = await db.smeClient.findMany({
      where: { agencyId, status: 'active' },
      select: {
        id: true,
        name: true,
        storageUsedBytes: true,
      },
    })

    const colorPalette = [
      '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
      '#06B6D4', '#84CC16', '#F97316', '#6366F1',
    ]

    const revenueByClient = activeClients.map((client, index) => {
      const mrr = Math.round(client.storageUsedBytes * 0.002)
      return {
        name: client.name,
        value: mrr,
        fill: colorPalette[index % colorPalette.length],
      }
    })

    const trialCount = await db.smeClient.count({
      where: { agencyId, status: 'trial' },
    })
    if (trialCount > 0) {
      revenueByClient.push({
        name: 'Essais',
        value: 0,
        fill: '#94A3B8',
      })
    }

    const mrrTotal = revenueByClient.reduce((sum, c) => sum + c.value, 0)

    const totalRowsProcessed = await db.processedData.count({
      where: {
        pipeline: { agencyId },
      },
    })

    const pipelineStats = await db.pipeline.aggregate({
      where: { agencyId },
      _sum: {
        totalRuns: true,
        failedRuns: true,
      },
    })

    const totalRuns = pipelineStats._sum.totalRuns ?? 0
    const failedRuns = pipelineStats._sum.failedRuns ?? 0
    const pipelineSuccessRate = totalRuns > 0
      ? Math.round(((totalRuns - failedRuns) / totalRuns) * 100)
      : 100

    return NextResponse.json({
      clientStatusDistribution,
      pipelineRunsLast30Days,
      revenueByClient,
      mrrTotal,
      totalRowsProcessed,
      pipelineSuccessRate,
    })
  } catch (error) {
    console.error('Failed to fetch agency chart data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agency chart data' },
      { status: 500 }
    )
  }
}
