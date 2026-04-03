import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pipelineId = searchParams.get('pipelineId')

    if (!pipelineId) {
      return NextResponse.json(
        { error: 'pipelineId is required' },
        { status: 400 }
      )
    }

    const pipeline = await db.pipeline.findUnique({
      where: { id: pipelineId },
      select: { id: true, orgId: true, name: true },
    })

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      )
    }

    const processedData = await db.processedData.findMany({
      where: { pipelineId },
      orderBy: [
        { rowDate: 'asc' },
        { rowCategory: 'asc' },
        { rowMetric: 'asc' },
      ],
    })

    const aggregatedByDate = new Map<string, Array<{
      rowCategory: string | null
      rowMetric: string | null
      rowValue: number
      rowLabel: string | null
      extraData: string | null
    }>>()

    for (const row of processedData) {
      const dateKey = row.rowDate ?? 'unknown'
      if (!aggregatedByDate.has(dateKey)) {
        aggregatedByDate.set(dateKey, [])
      }
      aggregatedByDate.get(dateKey)!.push({
        rowCategory: row.rowCategory,
        rowMetric: row.rowMetric,
        rowValue: row.rowValue,
        rowLabel: row.rowLabel,
        extraData: row.extraData,
      })
    }

    const dateEntries = Array.from(aggregatedByDate.entries()).map(
      ([date, rows]) => ({
        date,
        rows,
      })
    )

    const flatData = processedData.map((row) => ({
      id: row.id,
      orgId: row.orgId,
      pipelineId: row.pipelineId,
      rowDate: row.rowDate,
      rowCategory: row.rowCategory,
      rowMetric: row.rowMetric,
      rowValue: row.rowValue,
      rowLabel: row.rowLabel,
      extraData: row.extraData ? (() => { try { return JSON.parse(row.extraData) } catch { return null } })() : null,
      createdAt: row.createdAt,
    }))

    return NextResponse.json({
      pipeline: {
        id: pipeline.id,
        orgId: pipeline.orgId,
        name: pipeline.name,
      },
      aggregatedByDate: dateEntries,
      flatData,
      totalRows: processedData.length,
    })
  } catch (error) {
    console.error('Failed to fetch processed data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch processed data' },
      { status: 500 }
    )
  }
}
