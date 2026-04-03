'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Calendar,
  RefreshCw,
  Gauge,
  Table,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartWidget } from '@/components/shared/chart-widget'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'

interface SmeDashboardViewerProps {
  dashboardId: string
  orgId: string
  onBack: () => void
}

interface WidgetItem {
  id: string
  widgetType: string
  title: string | null
  subtitle: string | null
  queryConfig: string | null
  visualConfig: string | null
  positionX: number
  positionY: number
  width: number
  height: number
  pipelineId: string | null
  pipeline: { id: string; name: string } | null
}

interface DashboardData {
  id: string
  name: string
  description: string | null
  autoRefreshSeconds: number
  widgets: WidgetItem[]
  _count: { widgets: number }
  org: { id: string; name: string }
  agency: { id: string; name: string } | null
}

interface PipelineDataResponse {
  aggregatedByDate: Array<{ date: string; rows: Array<{ rowCategory: string | null; rowMetric: string | null; rowValue: number }> }>
  flatData: Array<{ rowDate: string; rowCategory: string | null; rowMetric: string | null; rowValue: number }>
  totalRows: number
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

function WidgetSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  )
}

function KpiWidgetRenderer({
  widget,
  pipelineData,
}: {
  widget: WidgetItem
  pipelineData: PipelineDataResponse | null
}) {
  const latestValue = pipelineData?.flatData?.slice(-1)?.[0]?.rowValue ?? 0
  const previousValue = pipelineData?.flatData?.slice(-2)?.[0]?.rowValue ?? 0
  const change = previousValue > 0 ? Math.round(((latestValue - previousValue) / previousValue) * 100) : 0
  const sparkline = pipelineData?.flatData?.slice(-14).map((d) => d.rowValue) ?? []

  const isCurrency = widget.title?.toLowerCase().includes('revenu') || widget.title?.toLowerCase().includes('chiffre')

  return (
    <KpiCard
      title={widget.title ?? 'Métrique'}
      value={isCurrency ? formatCurrency(latestValue) : formatNumber(Math.round(latestValue))}
      change={change}
      changeLabel="vs période préc."
      icon={<Gauge className="size-5" />}
      sparklineData={sparkline}
    />
  )
}

function ChartWidgetRenderer({
  widget,
  pipelineData,
}: {
  widget: WidgetItem
  pipelineData: PipelineDataResponse | null
}) {
  let visualCfg: { colors?: string[]; showGrid?: boolean; showLegend?: boolean; format?: string } = {}
  try {
    if (widget.visualConfig) visualCfg = JSON.parse(widget.visualConfig)
  } catch { /* ignore parse errors */ }

  const tealColors = [
    'hsl(172, 66%, 50%)',
    'hsl(160, 84%, 39%)',
    'hsl(142, 71%, 45%)',
    'hsl(38, 92%, 50%)',
    'hsl(0, 84%, 60%)',
    'hsl(262, 83%, 58%)',
    'hsl(45, 93%, 47%)',
    'hsl(199, 89%, 48%)',
  ]

  const colorScheme = visualCfg.colors ?? tealColors

  // Build chart data from pipeline data
  const chartData = React.useMemo(() => {
    if (!pipelineData?.aggregatedByDate) return []
    const last30 = pipelineData.aggregatedByDate.slice(-30)

    return last30.map((entry) => {
      const vals: Record<string, unknown> = {
        date: entry.date
          ? new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
          : 'N/A',
      }
      entry.rows.forEach((r) => {
        const key = r.rowCategory ?? r.rowMetric ?? 'Valeur'
        vals[key] = Math.round(r.rowValue)
      })
      return vals
    })
  }, [pipelineData])

  // Pie data from flat data categories
  const pieData = React.useMemo(() => {
    if (!pipelineData?.flatData) return []
    const categoryMap: Record<string, number> = {}
    pipelineData.flatData.forEach((row) => {
      const key = row.rowCategory ?? row.rowMetric ?? 'Autre'
      categoryMap[key] = (categoryMap[key] || 0) + row.rowValue
    })
    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [pipelineData])

  const yKey = chartData.length > 0
    ? Object.keys(chartData[0]).filter((k) => k !== 'date').join(',')
    : 'Valeur'

  const mapWidgetType = (type: string) => {
    switch (type) {
      case 'line_chart': return 'line' as const
      case 'bar_chart': return 'bar' as const
      case 'area_chart': return 'area' as const
      case 'pie_chart': return 'pie' as const
      default: return 'line' as const
    }
  }

  const isPie = widget.widgetType === 'pie_chart'

  return (
    <ChartWidget
      title={widget.title ?? 'Graphique'}
      subtitle={widget.subtitle ?? widget.pipeline?.name ?? undefined}
      type={mapWidgetType(widget.widgetType)}
      data={isPie ? pieData : chartData}
      xKey="date"
      yKey={isPie ? 'value' : yKey || 'Valeur'}
      colorScheme={colorScheme}
      height={Math.max(200, widget.height * 30)}
    />
  )
}

function DataTableWidgetRenderer({
  widget,
  pipelineData,
}: {
  widget: WidgetItem
  pipelineData: PipelineDataResponse | null
}) {
  if (!pipelineData?.flatData || pipelineData.flatData.length === 0) {
    return (
      <EmptyState
        title="Aucune donnée"
        description="Ce widget n'a pas de données à afficher."
      />
    )
  }

  const rows = pipelineData.flatData.slice(-20).reverse()

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Catégorie</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Métrique</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Valeur</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/50 transition-colors">
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.rowDate ? new Date(row.rowDate).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.rowCategory ?? '—'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.rowMetric ?? '—'}
                </td>
                <td className="px-3 py-2 text-right font-mono font-medium">
                  {typeof row.rowValue === 'number' ? row.rowValue.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : row.rowValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SmeDashboardViewer({ dashboardId, orgId, onBack }: SmeDashboardViewerProps) {
  const [dateRange, setDateRange] = React.useState('30d')

  // Fetch dashboard config
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', dashboardId, orgId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboards?orgId=${orgId}`)
      if (!res.ok) throw new Error('Failed to fetch dashboard')
      const dashboards: DashboardData[] = await res.json()
      const found = dashboards.find((d) => d.id === dashboardId)
      if (!found) throw new Error('Dashboard not found')
      return found
    },
    enabled: !!dashboardId && !!orgId,
  })

  // Collect unique pipeline IDs from widgets
  const pipelineIds = React.useMemo(() => {
    if (!dashboard?.widgets) return []
    const ids = new Set<string>()
    dashboard.widgets.forEach((w) => {
      if (w.pipelineId) ids.add(w.pipelineId)
    })
    return Array.from(ids)
  }, [dashboard])

  // Fetch data for each pipeline
  const pipelineQueries = useQuery({
    queryKey: ['dashboard-pipeline-data', pipelineIds, dateRange],
    queryFn: async () => {
      const results = await Promise.allSettled(
        pipelineIds.map(async (pid) => {
          const res = await fetch(`/api/data?pipelineId=${pid}`)
          if (!res.ok) throw new Error(`Failed for pipeline ${pid}`)
          return { pipelineId: pid, data: await res.json() as PipelineDataResponse }
        })
      )
      const map: Record<string, PipelineDataResponse> = {}
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          map[r.value.pipelineId] = r.value.data
        }
      })
      return map
    },
    enabled: pipelineIds.length > 0,
    refetchInterval: dashboard?.autoRefreshSeconds ? dashboard.autoRefreshSeconds * 1000 : 300000,
  })

  const pipelineDataMap = pipelineQueries.data ?? {}

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={cardVariants}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs -ml-2" onClick={onBack}>
              <ArrowLeft className="size-3" />
              Retour
            </Button>
            {dashboardLoading ? (
              <>
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-80" />
              </>
            ) : dashboard ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight">{dashboard.name}</h1>
                {dashboard.description && (
                  <p className="text-sm text-muted-foreground">{dashboard.description}</p>
                )}
              </>
            ) : null}
          </div>

          {/* Filter controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 jours</SelectItem>
                  <SelectItem value="30d">30 jours</SelectItem>
                  <SelectItem value="90d">90 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => pipelineQueries.refetch()}
              disabled={pipelineQueries.isFetching}
            >
              <RefreshCw className={cn('size-3.5', pipelineQueries.isFetching && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </motion.div>

      {dashboard && (
        <motion.div variants={cardVariants}>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="outline" className="gap-1.5 text-[10px] bg-teal-50 text-teal-700 border-teal-200">
              <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />
              {dashboard.autoRefreshSeconds}s
            </Badge>
            <span>{dashboard._count.widgets} widgets</span>
            <span>·</span>
            <span>{pipelineIds.length} pipeline{pipelineIds.length !== 1 ? 's' : ''}</span>
          </div>
        </motion.div>
      )}

      {!dashboardLoading && !dashboard && (
        <motion.div variants={cardVariants}>
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="Dashboard introuvable"
                description="Le dashboard demandé n'existe pas ou a été supprimé."
                action={{ label: 'Retour', onClick: onBack }}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {dashboard && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
            }}
          >
            {dashboard.widgets.map((widget) => {
              const pipelineData = widget.pipelineId ? pipelineDataMap[widget.pipelineId] : null
              const colSpan = Math.min(widget.width || 6, 12)
              const isLoading = dashboardLoading || pipelineQueries.isLoading

              return (
                <motion.div
                  key={widget.id}
                  variants={cardVariants}
                  style={{ gridColumn: `span ${colSpan}` }}
                >
                  {isLoading ? (
                    <WidgetSkeleton />
                  ) : widget.widgetType === 'kpi_card' ? (
                    <KpiWidgetRenderer widget={widget} pipelineData={pipelineData} />
                  ) : widget.widgetType === 'data_table' ? (
                    <Card className="overflow-hidden">
                      <CardHeader>
                        <CardTitle className="text-base font-semibold">
                          {widget.title ?? 'Tableau de données'}
                        </CardTitle>
                        {widget.subtitle && (
                          <CardDescription>{widget.subtitle}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <DataTableWidgetRenderer widget={widget} pipelineData={pipelineData} />
                      </CardContent>
                    </Card>
                  ) : widget.widgetType === 'text_block' ? (
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{widget.title || 'Bloc de texte'}</p>
                        {widget.subtitle && (
                          <p className="text-xs text-muted-foreground mt-1">{widget.subtitle}</p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <ChartWidgetRenderer widget={widget} pipelineData={pipelineData} />
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
