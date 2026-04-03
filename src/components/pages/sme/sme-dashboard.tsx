'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  RefreshCw,
  TrendingUp,
  DollarSign,
  BarChart3,
  Activity,
  ArrowUpRight,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartWidget } from '@/components/shared/chart-widget'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

interface PipelineData {
  id: string
  name: string
  status: string
  _count: { processedData: number; widgets: number }
}

interface DashboardConfig {
  id: string
  name: string
  description: string | null
  _count: { widgets: number }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartSkeletonCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-[280px]">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-sm"
              style={{ height: `${20 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
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

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "à l'instant"
  if (diffMins < 60) return `il y a ${diffMins} min`
  if (diffHours < 24) return `il y a ${diffHours}h`
  if (diffDays < 7) return `il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function SmeDashboard() {
  const user = useAuthStore((s) => s.user)
  const orgId = user?.orgId ?? ''
  const orgName = user?.orgName ?? ''

  const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date())

  // Fetch dashboards (for config)
  const { data: dashboards, isLoading: dashboardsLoading, error: dashboardsError } = useQuery({
    queryKey: ['dashboards', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboards?orgId=${orgId}`)
      if (!res.ok) throw new Error('Failed to fetch dashboards')
      return res.json() as Promise<DashboardConfig[]>
    },
    refetchInterval: 300000, // 5 min auto-refresh
    enabled: !!orgId,
  })

  // Fetch pipelines (for chart data)
  const { data: pipelines, isLoading: pipelinesLoading, error: pipelinesError } = useQuery({
    queryKey: ['pipelines', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/pipelines?orgId=${orgId}`)
      if (!res.ok) throw new Error('Failed to fetch pipelines')
      return res.json() as Promise<PipelineData[]>
    },
    refetchInterval: 300000,
    enabled: !!orgId,
  })

  // Fetch data for the first active pipeline
  const activePipelineId = pipelines?.find((p) => p.status === 'active')?.id

  const { data: processedData, isLoading: dataLoading } = useQuery({
    queryKey: ['data', activePipelineId, orgId],
    queryFn: async () => {
      if (!activePipelineId) return null
      const res = await fetch(`/api/data?pipelineId=${activePipelineId}`)
      if (!res.ok) throw new Error('Failed to fetch data')
      return res.json() as Promise<{
        pipeline: { id: string; name: string }
        aggregatedByDate: Array<{ date: string; rows: Array<{ rowCategory: string | null; rowMetric: string | null; rowValue: number }> }>
        flatData: Array<{ rowDate: string; rowCategory: string | null; rowMetric: string | null; rowValue: number }>
        totalRows: number
      }>
    },
    enabled: !!activePipelineId && !!orgId,
    refetchInterval: 300000,
  })

  const lineChartData = React.useMemo(() => {
    if (!processedData?.aggregatedByDate) return []
    const last30 = processedData.aggregatedByDate.slice(-30)
    return last30.map((entry) => {
      const total = entry.rows.reduce((sum, r) => sum + r.rowValue, 0)
      return {
        date: entry.date ? new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'N/A',
        valeur: Math.round(total),
      }
    })
  }, [processedData])

  const barChartData = React.useMemo(() => {
    if (!processedData?.aggregatedByDate) return []
    const last14 = processedData.aggregatedByDate.slice(-14)
    return last14.map((entry) => {
      const vals: Record<string, number> = {
        date: entry.date ? new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'N/A',
      }
      entry.rows.forEach((r) => {
        const key = r.rowCategory ?? r.rowMetric ?? 'Autre'
        vals[key] = (vals[key] || 0) + r.rowValue
      })
      return vals
    })
  }, [processedData])

  const areaChartData = React.useMemo(() => {
    if (!processedData?.aggregatedByDate) return []
    const last30 = processedData.aggregatedByDate.slice(-30)
    let cumulative = 0
    return last30.map((entry) => {
      const total = entry.rows.reduce((sum, r) => sum + r.rowValue, 0)
      cumulative += total
      return {
        date: entry.date ? new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'N/A',
        cumul: Math.round(cumulative),
        journalier: Math.round(total),
      }
    })
  }, [processedData])

  const pieChartData = React.useMemo(() => {
    if (!processedData?.flatData) return []
    const categoryMap: Record<string, number> = {}
    processedData.flatData.forEach((row) => {
      const key = row.rowCategory ?? 'Autre'
      categoryMap[key] = (categoryMap[key] || 0) + row.rowValue
    })
    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [processedData])

  const latestValue = lineChartData.length > 0 ? lineChartData[lineChartData.length - 1]?.valeur ?? 0 : 0
  const previousValue = lineChartData.length > 1 ? lineChartData[lineChartData.length - 2]?.valeur ?? 0 : 0
  const changePercent = previousValue > 0 ? Math.round(((latestValue - previousValue) / previousValue) * 100) : 0

  const totalRows = processedData?.totalRows ?? 0
  const sparklineValues = lineChartData.map((d) => d.valeur)

  const isLoading = dashboardsLoading || pipelinesLoading || dataLoading
  const queryError = dashboardsError || pipelinesError

  if (!orgId) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Vous devez être connecté en tant qu'utilisateur PME pour accéder à cette page.</p>
      </div>
    )
  }

  if (queryError) {
    return (
      <EmptyState icon={<AlertCircle className="size-8" />} title="Erreur de chargement" description={(queryError as Error).message || "Impossible de charger les données"} />
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Bienvenue, <span className="text-teal-600">{orgName}</span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Dernière actualisation : {formatRelativeTime(lastRefresh.toISOString())}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setLastRefresh(new Date())}
        >
          <RefreshCw className="size-3.5" />
          Actualiser
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Badge variant="outline" className="gap-1.5 bg-teal-50 text-teal-700 border-teal-200">
          <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />
          Actualisation automatique toutes les 5 min
        </Badge>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          ) : (
            <>
              <KpiCard
                title="Valeur totale"
                value={formatCurrency(latestValue)}
                change={changePercent}
                changeLabel="vs période préc."
                icon={<DollarSign className="size-5" />}
                sparklineData={sparklineValues}
              />
              <KpiCard
                title="Lignes de données"
                value={formatNumber(totalRows)}
                change={12}
                changeLabel="ce mois"
                icon={<BarChart3 className="size-5" />}
                sparklineData={sparklineValues.map((v) => Math.round(v / Math.max(...sparklineValues) * 100))}
              />
              <KpiCard
                title="Pipelines actifs"
                value={pipelines?.filter((p) => p.status === 'active').length ?? 0}
                change={0}
                changeLabel="stable"
                icon={<Activity className="size-5" />}
              />
              <KpiCard
                title="Dashboards"
                value={dashboards?.length ?? 0}
                change={dashboards && dashboards.length > 0 ? 25 : 0}
                changeLabel="widgets"
                icon={<TrendingUp className="size-5" />}
              />
            </>
          )}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {isLoading ? (
            <>
              <ChartSkeletonCard />
              <ChartSkeletonCard />
              <ChartSkeletonCard />
              <ChartSkeletonCard />
            </>
          ) : (
            <>
              <ChartWidget
                title="Évolution sur 30 jours"
                subtitle={processedData?.pipeline?.name ?? 'Métrique principale'}
                type="line"
                data={lineChartData}
                xKey="date"
                yKey="valeur"
                height={280}
                loading={dataLoading}
              />
              <ChartWidget
                title="Valeurs quotidiennes"
                subtitle="14 derniers jours"
                type="bar"
                data={barChartData}
                xKey="date"
                yKey={Object.keys(barChartData[0] || {}).filter((k) => k !== 'date').join(',') || 'valeur'}
                height={280}
                loading={dataLoading}
              />
              <ChartWidget
                title="Tendance cumulée"
                subtitle="Cumul journalier sur 30 jours"
                type="area"
                data={areaChartData}
                xKey="date"
                yKey="cumul"
                height={280}
                loading={dataLoading}
              />
              <ChartWidget
                title="Répartition par catégorie"
                subtitle="Distribution des données"
                type="pie"
                data={pieChartData}
                xKey="name"
                yKey="value"
                height={280}
                loading={dataLoading}
              />
            </>
          )}
        </div>
      </motion.div>

      {dashboards && dashboards.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Dashboards disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dashboards.slice(0, 6).map((dash) => (
                  <button
                    key={dash.id}
                    className={cn(
                      'group flex items-center justify-between rounded-lg border p-4 text-left transition-all',
                      'hover:border-teal-300 hover:bg-teal-50/50 hover:shadow-sm'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{dash.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dash._count.widgets} widgets
                      </p>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-teal-600 transition-opacity flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
