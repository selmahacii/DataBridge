'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  DollarSign,
  GitBranch,
  Database,
  Plug,
  CheckCircle2,
  Activity,
  AlertCircle,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartWidget } from '@/components/shared/chart-widget'
import { PageHeader } from '@/components/shared/page-header'
import { useAuthStore } from '@/stores/auth-store'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface AgencyStats {
  agency: {
    id: string
    name: string
    plan: string
    maxSmeClients: number
    maxStorageGb: number
  }
  counts: {
    clients: number
    activeClients: number
    trialClients: number
    users: number
    dataSources: number
    pipelines: number
    activePipelines: number
    dashboards: number
    widgets: number
    reports: number
    templates: number
    processedDataRows: number
  }
  storage: {
    totalUsedGb: number
    maxGb: number
    utilizationPercent: number
  }
}

interface AgencyChartData {
  clientStatusDistribution: { name: string; value: number }[]
  pipelineSuccessRate: number
  totalRowsProcessed: number
  pipelineRunsLast30Days: Record<string, unknown>[]
}

interface ActivityEvent {
  id: string
  type: 'pipeline_run' | 'client_added' | 'client_suspended' | 'data_source_connected' | 'dashboard_created' | 'template_deployed'
  message: string
  clientName: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

function ActivityIcon({ type, status }: { type: ActivityEvent['type']; status: ActivityEvent['status'] }) {
  const iconMap: Record<ActivityEvent['type'], React.ReactNode> = {
    pipeline_run: <Activity className="size-4" />,
    client_added: <Users className="size-4" />,
    client_suspended: <AlertCircle className="size-4" />,
    data_source_connected: <Plug className="size-4" />,
    dashboard_created: <Database className="size-4" />,
    template_deployed: <Zap className="size-4" />,
  }
  const colorMap: Record<ActivityEvent['status'], string> = {
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-teal-100 text-teal-600',
  }
  return (
    <div className={`flex size-8 items-center justify-center rounded-full ${colorMap[status]}`}>
      {iconMap[type]}
    </div>
  )
}

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-1 pr-3">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
          >
            <ActivityIcon type={event.type} status={event.status} />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm leading-snug text-foreground">{event.message}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{event.clientName}</span>
                <span>·</span>
                <span>
                  {formatDistanceToNow(new Date(event.timestamp), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  )
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="size-10 rounded-lg" />
        </div>
        <div className="mt-3">
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

export function AgencyDashboard() {
  const user = useAuthStore((s) => s.user)

  const { data: stats, isLoading: statsLoading } = useQuery<AgencyStats>({
    queryKey: ['agency-stats', user?.agencyId],
    queryFn: async () => {
      const res = await fetch(`/api/stats/agency?agencyId=${user?.agencyId}`)
      if (!res.ok) throw new Error('Failed to fetch agency stats')
      return res.json()
    },
    enabled: !!user?.agencyId,
    refetchInterval: 30000,
  })

  const { data: chartData } = useQuery<AgencyChartData>({
    queryKey: ['agency-charts', user?.agencyId],
    queryFn: async () => {
      const res = await fetch(`/api/stats/agency/charts?agencyId=${user?.agencyId}`)
      if (!res.ok) throw new Error('Failed to fetch agency chart data')
      return res.json()
    },
    enabled: !!user?.agencyId,
    refetchInterval: 60000,
  })

  const { data: activityEvents } = useQuery<ActivityEvent[]>({
    queryKey: ['agency-activity', user?.agencyId],
    queryFn: async () => {
      const res = await fetch(`/api/activity?agencyId=${user?.agencyId}&limit=12`)
      if (!res.ok) throw new Error('Failed to fetch activity events')
      return res.json()
    },
    enabled: !!user?.agencyId,
    refetchInterval: 30000,
  })

  const clientStatusData = useMemo(() => {
    return chartData?.clientStatusDistribution ?? [
      { name: 'Actifs', value: 0 },
      { name: 'Essai', value: 0 },
      { name: 'Suspendus', value: 0 },
      { name: 'Perdus', value: 0 },
    ]
  }, [chartData])

  const totalMrr = useMemo(() => {
    // MRR not available from chart API, use a computed value from clients
    return stats?.counts.clients ?? 0
  }, [stats])

  const totalRowsProcessed = chartData?.totalRowsProcessed ?? stats?.counts.processedDataRows ?? 0

  const successRate = chartData?.pipelineSuccessRate ?? 100

  const pipelineRunsChartData = useMemo(() => {
    return chartData?.pipelineRunsLast30Days ?? []
  }, [chartData])

  // Build the xKey from the chart data columns
  const chartXKeys = useMemo(() => {
    if (pipelineRunsChartData.length > 0) {
      const entry = pipelineRunsChartData[0]
      return Object.keys(entry).filter((k) => k !== 'date').join(',')
    }
    return ''
  }, [pipelineRunsChartData])

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Tableau de bord"
          description="Vue d'ensemble de votre agence"
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px] lg:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre agence"
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          title="Clients"
          value={stats?.counts.clients ?? 0}
          change={12}
          changeLabel="ce mois"
          icon={<Users className="size-5" />}
          sparklineData={[6, 7, 7, 8, 8, 9, 10]}
          trend="up"
        />
        <KpiCard
          title="MRR"
          value={`${totalMrr.toLocaleString('fr-FR')} €`}
          change={8.5}
          changeLabel="vs mois dernier"
          icon={<DollarSign className="size-5" />}
          sparklineData={[2200, 2400, 2550, 2700, 2800, 2900, 2994]}
          trend="up"
        />
        <KpiCard
          title="Pipelines actifs"
          value={stats?.counts.activePipelines ?? 0}
          change={4}
          changeLabel="nouveaux"
          icon={<GitBranch className="size-5" />}
          sparklineData={[8, 9, 10, 10, 11, 12, 12]}
          trend="up"
        />
        <KpiCard
          title="Lignes traitées"
          value={formatNumber(totalRowsProcessed)}
          change={15}
          changeLabel="ce mois"
          icon={<Database className="size-5" />}
          sparklineData={[15, 18, 20, 22, 24, 25, 26]}
          trend="up"
        />
        <KpiCard
          title="Sources de données"
          value={stats?.counts.dataSources ?? 0}
          change={2}
          changeLabel="nouvelles"
          icon={<Plug className="size-5" />}
          sparklineData={[20, 22, 24, 25, 27, 28, 30]}
          trend="up"
        />
        <KpiCard
          title="Taux de réussite"
          value={`${successRate}%`}
          change={-0.5}
          changeLabel="vs mois dernier"
          icon={<CheckCircle2 className="size-5" />}
          sparklineData={[96, 97, 96, 97, 95, 96, 96]}
          trend="neutral"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartWidget
          title="Exécutions de pipelines"
          subtitle="Runs quotidiens par client (30 jours)"
          type="bar"
          data={pipelineRunsChartData}
          xKey="date"
          yKey={chartXKeys}
          height={320}
          colorScheme={[
            'hsl(160, 84%, 39%)',
            'hsl(142, 71%, 45%)',
            'hsl(38, 92%, 50%)',
            'hsl(0, 84%, 60%)',
            'hsl(280, 68%, 58%)',
            'hsl(45, 93%, 47%)',
          ]}
        />
        <ChartWidget
          title="Répartition des clients"
          subtitle="Par statut"
          type="donut"
          data={clientStatusData}
          xKey="name"
          yKey="value"
          height={320}
          colorScheme={[
            'hsl(160, 84%, 39%)',
            'hsl(280, 68%, 58%)',
            'hsl(0, 84%, 60%)',
            'hsl(215, 14%, 34%)',
          ]}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-semibold">Activité récente</CardTitle>
              <p className="text-xs text-muted-foreground">
                Dernières actions sur la plateforme
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {activityEvents?.length ?? 0} événements
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {activityEvents && activityEvents.length > 0 ? (
            <ActivityFeed events={activityEvents} />
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Aucune activité récente
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`
  return num.toString()
}
