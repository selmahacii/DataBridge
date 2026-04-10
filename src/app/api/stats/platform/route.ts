import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const filter = clientId ? { id: clientId } : {}
    const subFilter = clientId ? { clientId } : {}
    const dashboardFilter = clientId ? { orgId: clientId } : {}

    let agencyId = null;
    if (clientId) {
      const client = await db.smeClient.findUnique({
        where: { id: clientId },
        select: { agencyId: true }
      });
      agencyId = client?.agencyId;
    }

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
      db.smeClient.count({ where: filter }),
      db.user.count({ where: agencyId ? { agencyId } : {} }),
      db.dataSource.count({ where: subFilter }),
      db.pipeline.count({ where: subFilter }),
      db.dashboard.count({ where: dashboardFilter }),
      db.widget.count({ where: dashboardFilter }),
      (db as any).processedData.count({ where: dashboardFilter }),
      db.report.count({ where: subFilter }),
      db.agencyTemplate.count({ where: agencyId ? { agencyId } : {} }),
    ])

    const activePipelines = await db.pipeline.count({
      where: { status: 'active', ...subFilter },
    })

    const totalStorageBytes = processedDataCount * 1024 * 512; // Mock based on row count (512KB per row avg)

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
      totalStorageGb: Number((totalStorageBytes / (1024 * 1024 * 1024)).toFixed(4)),
    })
  } catch (error) {
    console.error('Failed to fetch platform stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform stats' },
      { status: 500 }
    )
  }
}
