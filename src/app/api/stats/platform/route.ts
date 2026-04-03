import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      agencyCount,
      clientCount,
      userCount,
      dataSourceCount,
      pipelineCount,
      dashboardCount,
      widgetCount,
      processedDataCount,
      reportCount,
      templateCount,
    ] = await Promise.all([
      db.agency.count(),
      db.smeClient.count(),
      db.user.count(),
      db.dataSource.count(),
      db.pipeline.count(),
      db.dashboard.count(),
      db.widget.count(),
      db.processedData.count(),
      db.report.count(),
      db.agencyTemplate.count(),
    ])

    const activePipelines = await db.pipeline.count({
      where: { status: 'active' },
    })

    const storageResult = await db.smeClient.aggregate({
      _sum: { storageUsedBytes: true },
    })
    const totalStorageBytes = storageResult._sum.storageUsedBytes ?? 0

    return NextResponse.json({
      agencies: agencyCount,
      clients: clientCount,
      users: userCount,
      dataSources: dataSourceCount,
      pipelines: pipelineCount,
      activePipelines,
      dashboards: dashboardCount,
      widgets: widgetCount,
      reports: reportCount,
      templates: templateCount,
      processedDataRows: processedDataCount,
      totalStorageBytes,
      totalStorageGb: Number((totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)),
    })
  } catch (error) {
    console.error('Failed to fetch platform stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform stats' },
      { status: 500 }
    )
  }
}
