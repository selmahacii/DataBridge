'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Users,
  Database,
  Workflow,
  HardDrive,
  Activity,
  CheckCircle2,
  Clock,
  Server,
  Cpu,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { ChartWidget } from '@/components/shared/chart-widget'
import { cn } from '@/lib/utils'


interface PlatformStats {
  agencies: number
  clients: number
  users: number
  dataSources: number
  pipelines: number
  activePipelines: number
  dashboards: number
  widgets: number
  reports: number
  templates: number
  processedDataRows: number
  totalStorageBytes: number
  totalStorageGb: number
}

interface ActivityItem {
  id: string
  message: string
  client: string
  time: string
  type: 'success' | 'error' | 'info' | 'warning'
}


const mockActivities: ActivityItem[] = [
  { id: 'a1', message: 'Pipeline "Daily Sales" terminé avec succès', client: 'Bloom & Petal Florists', time: 'Il y a 5 min', type: 'success' },
  { id: 'a2', message: 'Nouvelle source de données connectée', client: 'TechFlow Solutions', time: 'Il y a 12 min', type: 'info' },
  { id: 'a3', message: 'Pipeline "Revenue Aggregation" échoué', client: 'Metro Bistro Group', time: 'Il y a 25 min', type: 'error' },
  { id: 'a4', message: 'Tableau de bord "Q1 Planning" créé', client: 'TechFlow Solutions', time: 'Il y a 1h', type: 'info' },
  { id: 'a5', message: 'Pipeline "Delivery Analytics" terminé', client: 'QuickShip Logistics', time: 'Il y a 1h30', type: 'success' },
  { id: 'a6', message: 'Client suspendu pour raison de paiement', client: 'Artisan Furniture Co.', time: 'Il y a 2h', type: 'warning' },
  { id: 'a7', message: 'Template "Sales Performance" déployé', client: 'FreshMart Grocers', time: 'Il y a 3h', type: 'info' },
  { id: 'a8', message: 'Pipeline "Churn Prediction" terminé', client: 'TechFlow Solutions', time: 'Il y a 4h', type: 'success' },
  { id: 'a9', message: 'Nouveau client NovaTech ajouté (essai)', client: 'NovaTech Innovations', time: 'Il y a 6h', type: 'info' },
  { id: 'a10', message: 'Pipeline "Member Analytics" terminé', client: 'Peak Fitness Studios', time: 'Il y a 8h', type: 'success' },
]

const clientGrowthData = [
  { month: 'Août', clients: 5, agencies: 1 },
  { month: 'Septembre', clients: 8, agencies: 1 },
  { month: 'Octobre', clients: 12, agencies: 2 },
  { month: 'Novembre', clients: 18, agencies: 2 },
  { month: 'Décembre', clients: 24, agencies: 2 },
  { month: 'Janvier', clients: 30, agencies: 2 },
]

const revenueByPlanData = [
  { name: 'Enterprise', value: 45, fill: '#0d9488' },
  { name: 'Pro', value: 35, fill: '#10b981' },
  { name: 'Starter', value: 20, fill: '#6ee7b7' },
]

const pipelineExecutionData = [
  { day: 'Lun', succès: 42, échoué: 3 },
  { day: 'Mar', succès: 38, échoué: 5 },
  { day: 'Mer', succès: 45, échoué: 2 },
  { day: 'Jeu', succès: 40, échoué: 4 },
  { day: 'Ven', succès: 44, échoué: 1 },
  { day: 'Sam', succès: 28, échoué: 2 },
  { day: 'Dim', succès: 15, échoué: 1 },
]

const storageByAgencyData = [
  { name: 'DataViz Pro', value: 4.2 },
  { name: 'InsightHub', value: 3.1 },
]

const tealColorScheme = [
  '#0d9488',
  '#10b981',
  '#14b8a6',
  '#34d399',
  '#5eead4',
  '#99f6e4',
  '#0f766e',
  '#047857',
]

const mixedColorScheme = [
  '#0d9488',
  '#f43f5e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
]


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}


function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  const typeStyles: Record<string, string> = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-sky-500',
  }

  const typeIcons: Record<string, string> = {
    success: '●',
    error: '●',
    warning: '●',
    info: '●',
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-1 px-1">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
          >
            <span className={cn('mt-0.5 text-xs', typeStyles[activity.type])}>
              {typeIcons[activity.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{activity.message}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate">{activity.client}</span>
                <span className="text-xs text-muted-foreground/50">·</span>
                <span className="text-xs text-muted-foreground/70 whitespace-nowrap">{activity.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </ScrollArea>
  )
}

function SystemHealthCard() {
  const systems = [
    { name: 'Base de données', status: 'ok', latency: '2ms', icon: Database },
    { name: 'Redis Cache', status: 'ok', latency: '<1ms', icon: Server },
    { name: 'Workers', status: 'ok', latency: '4 actifs', icon: Cpu },
    { name: 'Stockage', status: 'ok', latency: '62% utilisé', icon: HardDrive },
  ]

  return (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="size-4 text-teal-500" />
            Santé du Système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {systems.map((sys) => (
            <div key={sys.name} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-emerald-50">
                  <sys.icon className="size-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{sys.name}</p>
                  <p className="text-xs text-muted-foreground">{sys.latency}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">Opérationnel</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}


function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="size-10 rounded-lg" />
        </div>
        <div className="mt-3">
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}


export function AdminPlatform() {
  const { data: stats, isLoading, error } = useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats/platform')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    refetchInterval: 30000,
  })

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="DataBridge Analytics"
        description="Administration de la plateforme"
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Plateforme' },
        ]}
      />

      {/* KPI Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : stats ? (
          <>
            <motion.div variants={itemVariants}>
              <KpiCard
                title="Agences"
                value={stats.agencies}
                change={12}
                changeLabel="vs mois dernier"
                icon={<Building2 className="size-5" />}
                trend="up"
                sparklineData={[1, 1, 2, 2, 2, 2]}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard
                title="Clients SME"
                value={stats.clients}
                change={25}
                changeLabel="vs mois dernier"
                icon={<Users className="size-5" />}
                trend="up"
                sparklineData={[5, 8, 12, 18, 24, 30]}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard
                title="Utilisateurs Actifs"
                value={stats.users}
                change={8}
                changeLabel="vs mois dernier"
                icon={<Zap className="size-5" />}
                trend="up"
                sparklineData={[6, 7, 8, 9, 10, 11]}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard
                title="Sources Connectées"
                value={stats.dataSources}
                change={15}
                changeLabel="vs mois dernier"
                icon={<Database className="size-5" />}
                trend="up"
                sparklineData={[12, 15, 19, 22, 25, 27]}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard
                title="Pipelines Actifs"
                value={stats.activePipelines}
                change={stats.pipelines ? Math.round((stats.activePipelines / stats.pipelines) * 100) : 0}
                changeLabel="taux d'activation"
                icon={<Workflow className="size-5" />}
                trend="up"
                sparklineData={[4, 6, 8, 10, 12, 16]}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <KpiCard
                title="Données Traitées"
                value={formatNumber(stats.processedDataRows)}
                change={32}
                changeLabel="vs mois dernier"
                icon={<HardDrive className="size-5" />}
                trend="up"
                sparklineData={[800, 1200, 1800, 2100, 2400, 2400]}
              />
            </motion.div>
          </>
        ) : (
          <div className="col-span-full">
            <p className="text-center text-sm text-red-500">Erreur de chargement des statistiques</p>
          </div>
        )}
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <ChartWidget
            title="Croissance des Clients"
            subtitle="Évolution sur 6 derniers mois"
            type="line"
            data={clientGrowthData}
            xKey="month"
            yKey="clients,agencies"
            colorScheme={tealColorScheme}
            height={280}
            loading={isLoading}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ChartWidget
            title="Revenus par Plan"
            subtitle="Distribution des agences"
            type="donut"
            data={revenueByPlanData}
            xKey="name"
            yKey="value"
            colorScheme={['#0d9488', '#10b981', '#6ee7b7']}
            height={280}
            loading={isLoading}
          />
        </motion.div>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <motion.div variants={itemVariants}>
          <ChartWidget
            title="Exécution des Pipelines"
            subtitle="Succès vs échecs par jour"
            type="bar"
            data={pipelineExecutionData}
            xKey="day"
            yKey="succès,échoué"
            colorScheme={['#0d9488', '#f43f5e']}
            height={260}
            loading={isLoading}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ChartWidget
            title="Stockage par Agence"
            subtitle="Utilisation en Go"
            type="bar"
            data={storageByAgencyData}
            xKey="name"
            yKey="value"
            colorScheme={['#0d9488']}
            height={260}
            loading={isLoading}
          />
        </motion.div>
      </motion.div>

      {/* Bottom Row: Activity + System Health */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-teal-500" />
                  Activité Récente
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {mockActivities.length} événements
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <ActivityFeed activities={mockActivities} />
            </CardContent>
          </Card>
        </motion.div>
        <SystemHealthCard />
      </motion.div>

      {/* Platform Summary Stats */}
      {stats && !isLoading && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {[
                  { label: 'Tableaux de bord', value: stats.dashboards },
                  { label: 'Widgets', value: stats.widgets },
                  { label: 'Rapports', value: stats.reports },
                  { label: 'Templates', value: stats.templates },
                  { label: 'Stockage total', value: `${stats.totalStorageGb} Go` },
                  { label: 'Taux de réussite', value: '96.2%' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-lg font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
