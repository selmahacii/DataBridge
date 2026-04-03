import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, clientId } = body

    if (!templateId || !clientId) {
      return NextResponse.json(
        { error: 'templateId and clientId are required' },
        { status: 400 }
      )
    }

    const template = await db.agencyTemplate.findUnique({
      where: { id: templateId },
      include: {
        agency: { select: { id: true, name: true } },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const client = await db.smeClient.findUnique({
      where: { id: clientId },
      select: { id: true, name: true },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    let templateConfig: {
      widgets?: Array<{
        widgetType: string
        title?: string
        subtitle?: string
        positionX?: number
        positionY?: number
        width?: number
        height?: number
        queryConfig?: string
        visualConfig?: string
      }>
    } = {}

    try {
      templateConfig = JSON.parse(template.config)
    } catch {
      // Config is not JSON, treat as empty
    }

    const dashboardName = `${template.name} — ${client.name}`

    const dashboard = await db.dashboard.create({
      data: {
        orgId: clientId,
        agencyId: template.agencyId,
        name: dashboardName,
        description: template.description,
        isTemplate: true,
        templateSourceId: templateId,
      },
    })

    // Create widgets from template config if available
    if (templateConfig.widgets && templateConfig.widgets.length > 0) {
      await db.widget.createMany({
        data: templateConfig.widgets.map((w, index) => ({
          dashboardId: dashboard.id,
          orgId: clientId,
          pipelineId: null,
          widgetType: w.widgetType,
          title: w.title ?? '',
          subtitle: w.subtitle ?? null,
          queryConfig: w.queryConfig ?? null,
          visualConfig: w.visualConfig ?? null,
          positionX: w.positionX ?? 0,
          positionY: w.positionY ?? index * 4,
          width: w.width ?? 6,
          height: w.height ?? 4,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      dashboardId: dashboard.id,
      dashboardName,
      templateName: template.name,
      clientName: client.name,
      widgetsCreated: templateConfig.widgets?.length ?? 0,
    })
  } catch (error) {
    console.error('Failed to deploy template:', error)
    return NextResponse.json(
      { error: 'Failed to deploy template' },
      { status: 500 }
    )
  }
}
