import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      include: {
        _count: {
          select: {
            clients: true,
            users: true,
            dataSources: true,
            pipelines: true,
            dashboards: true,
            reports: true,
            templates: true,
          },
        },
      },
    })

    if (!agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      )
    }

    const activeClients = await db.smeClient.count({
      where: { agencyId, status: 'active' },
    })

    const trialClients = await db.smeClient.count({
      where: { agencyId, status: 'trial' },
    })

    const activePipelines = await db.pipeline.count({
      where: { agencyId, status: 'active' },
    })

    const widgetCount = await db.widget.count({
      where: {
        dashboard: { agencyId },
      },
    })

    const processedDataCount = await db.processedData.count({
      where: {
        pipeline: { agencyId },
      },
    })

    const storageResult = await db.smeClient.aggregate({
      where: { agencyId },
      _sum: { storageUsedBytes: true },
    })
    const totalStorageBytes = storageResult._sum.storageUsedBytes ?? 0

    return NextResponse.json({
      agency: {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        plan: agency.plan,
        status: agency.status,
        brandPrimaryColor: agency.brandPrimaryColor,
        brandSecondaryColor: agency.brandSecondaryColor,
        brandAccentColor: agency.brandAccentColor,
        brandAppName: agency.brandAppName,
        brandLogoUrl: agency.brandLogoUrl,
        brandSupportEmail: agency.brandSupportEmail,
        customDomain: agency.customDomain,
        customDomainVerified: agency.customDomainVerified,
        maxSmeClients: agency.maxSmeClients,
        maxPipelinesPerClient: agency.maxPipelinesPerClient,
        maxDataSourcesPerClient: agency.maxDataSourcesPerClient,
        maxStorageGb: agency.maxStorageGb,
        createdAt: agency.createdAt,
      },
      counts: {
        clients: agency._count.clients,
        activeClients,
        trialClients,
        users: agency._count.users,
        dataSources: agency._count.dataSources,
        pipelines: agency._count.pipelines,
        activePipelines,
        dashboards: agency._count.dashboards,
        widgets: widgetCount,
        reports: agency._count.reports,
        templates: agency._count.templates,
        processedDataRows: processedDataCount,
      },
      storage: {
        totalUsedBytes: totalStorageBytes,
        totalUsedGb: Number((totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)),
        maxGb: agency.maxStorageGb,
        utilizationPercent: Number(((totalStorageBytes / (1024 * 1024 * 1024)) / Math.max(agency.maxStorageGb, 0.001) * 100).toFixed(1)),
      },
    })
  } catch (error) {
    console.error('Failed to fetch agency stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agency stats' },
      { status: 500 }
    )
  }
}
