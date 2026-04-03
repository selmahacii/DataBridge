'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Workflow,
  Database,
  HardDrive,
  Building2,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Zap,
  BarChart3,
  Gauge,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
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


const usersByRoleData = [
  { name: 'Super Admin', value: 1, fill: '#0d9488' },
  { name: 'Agency Admin', value: 3, fill: '#10b981' },
  { name: 'SME Admin', value: 8, fill: '#14b8a6' },
  { name: 'SME Editor', value: 2, fill: '#34d399' },
  { name: 'Viewer', value: 1, fill: '#6ee7b7' },
]

const loginActivityData = [
  { day: 'Lun', connexions: 28 },
  { day: 'Mar', connexions: 35 },
  { day: 'Mer', connexions: 42 },
  { day: 'Jeu', connexions: 38 },
  { day: 'Ven', connexions: 45 },
  { day: 'Sam', connexions: 15 },
  { day: 'Dim', connexions: 8 },
]

const runsByStatusData = [
  { mois: 'Sept', succès: 180, échoué: 12, partiel: 8 },
  { mois: 'Oct', succès: 210, échoué: 15, partiel: 10 },
  { mois: 'Nov', succès: 245, échoué: 18, partiel: 12 },
  { mois: 'Déc', succès: 280, échoué: 20, partiel: 14 },
  { mois: 'Jan', succès: 310, échoué: 22, partiel: 16 },
]

const dataVolumeData = [
  { mois: 'Août', lignes: 120000, stockage: 1.2 },
  { mois: 'Sept', lignes: 280000, stockage: 2.1 },
  { mois: 'Oct', lignes: 520000, stockage: 3.4 },
  { mois: 'Nov', lignes: 780000, stockage: 4.8 },
  { mois: 'Déc', lignes: 1100000, stockage: 5.9 },
  { mois: 'Jan', lignes: 1500000, stockage: 7.2 },
]

const topAgenciesData = [
  { name: 'DataViz Pro', clients: 8 },
  { name: 'InsightHub', clients: 5 },
]

const revenueBreakdownData = [
  { name: 'Enterprise', value: 45, fill: '#0d9488' },
  { name: 'Pro', value: 35, fill: '#10b981' },
  { name: 'Starter', value: 15, fill: '#6ee7b7' },
  { name: 'Essai', value: 5, fill: '#99f6e4' },
]

const topPipelinesData = [
  { name: 'Delivery Analytics', exécutions: 5040,成功率: 99.5 },
  { name: 'Inventory Alerts', exécutions: 4320,成功率: 99.7 },
  { name: 'MRR Pipeline', exécutions: 310,成功率: 99.4 },
  { name: 'Churn Prediction', exécutions: 300,成功率: 95.0 },
  { name: 'Daily Sales Report', exécutions: 184,成功率: 98.4 },
  { name: 'Sales by Category', exécutions: 308,成功率: 98.1 },
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

const statusColorScheme = ['#0d9488', '#f43f5e', '#f59e0b']


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}


function UptimeGauge({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            opacity="0.3"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#0d9488"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            className="transition-all duration-1000"
          />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground text-lg font-bold"
          >
            {value}%
          </text>
        </svg>
      </div>
      <span className="text-xs text-muted-foreground">Disponibilité</span>
    </div>
  )
}

function SystemHealthSection() {
  const metrics = [
    { label: 'Temps de réponse moyen', value: '45ms', status: 'good', icon: Clock },
    { label: 'Taux d\'erreur', value: '0.3%', status: 'good', icon: AlertTriangle },
    { label: 'Requêtes/min', value: '1,240', status: 'good', icon: Zap },
    { label: 'CPU Usage', value: '34%', status: 'good', icon: Activity },
    { label: 'Mémoire', value: '62%', status: 'good', icon: HardDrive },
    { label: 'Dernière mise à jour', value: 'Il y a 30s', status: 'good', icon: CheckCircle2 },
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
        <CardContent>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <UptimeGauge value={99.97} />
            <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {metrics.map((m) => (
                <div key={m.label} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <m.icon className="size-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold">{m.value}</span>
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="size-10 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function SectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-60" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  )
}


export function AdminStats() {
  const [dateRange, setDateRange] = React.useState('30d')

  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await fetch('/api/stats/platform')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistiques de la Plateforme"
        description="Métriques détaillées et analyses"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Statistiques' }]}
        actions={
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="all">Tout le temps</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* 1. User Analytics */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5 text-teal-500" />
            Analyse des Utilisateurs
          </h2>
          <p className="text-sm text-muted-foreground">Statistiques d&apos;utilisation et de connexion</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          {isLoading ? (
            <KpiRowSkeleton />
          ) : (
            <>
              <motion.div variants={itemVariants}>
                <KpiCard
                  title="Total Utilisateurs"
                  value={stats?.users ?? 0}
                  change={15}
                  changeLabel="vs mois dernier"
                  icon={<Users className="size-5" />}
                  trend="up"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <KpiCard
                  title="Actifs cette semaine"
                  value={Math.round((stats?.users ?? 0) * 0.85)}
                  change={5}
                  changeLabel="vs semaine dernière"
                  icon={<Zap className="size-5" />}
                  trend="up"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <KpiCard
                  title="Nouveaux inscrits"
                  value={3}
                  change={-10}
                  changeLabel="vs mois dernier"
                  icon={<ArrowUpRight className="size-5" />}
                  trend="down"
                />
              </motion.div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div variants={itemVariants}>
            <ChartWidget
              title="Utilisateurs par Rôle"
              type="donut"
              data={usersByRoleData}
              xKey="name"
              yKey="value"
              colorScheme={['#0d9488', '#10b981', '#14b8a6', '#34d399', '#6ee7b7']}
              height={260}
              loading={isLoading}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ChartWidget
              title="Activité de Connexion"
              subtitle="Connexions par jour cette semaine"
              type="bar"
              data={loginActivityData}
              xKey="day"
              yKey="connexions"
              colorScheme={['#0d9488']}
              height={260}
              loading={isLoading}
            />
          </motion.div>
        </div>
      </motion.div>

      <Separator className="my-6" />

      {/* 2. Pipeline Analytics */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Workflow className="size-5 text-teal-500" />
            Analyse des Pipelines
          </h2>
          <p className="text-sm text-muted-foreground">Exécutions, performances et taux de réussite</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          {isLoading ? (
            <KpiRowSkeleton />
          ) : (
            <>
              <motion.div variants={itemVariants}>
                <KpiCard
                  title="Total Exécutions"
                  value="11,380"
                  change={22}
                  changeLabel="vs mois dernier"
                  icon={<BarChart3 className="size-5" />}
                  trend="up"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <KpiCard
                  title="Taux de Réussite"
                  value="96.7%"
                  change={1.2}
                  changeLabel="vs mois dernier"
                  icon={<CheckCircle2 className="size-5" />}
                  trend="up"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <KpiCard
                  title="Durée Moyenne"
                  value="8.4s"
                  change={-5}
                  changeLabel="vs mois dernier"
                  icon={<Clock className="size-5" />}
                  trend="up"
                />
              </motion.div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div variants={itemVariants}>
            <ChartWidget
              title="Exécutions par Statut"
              subtitle="Derniers 5 mois"
              type="bar"
              data={runsByStatusData}
              xKey="mois"
              yKey="succès,échoué,partiel"
              colorScheme={statusColorScheme}
              height={260}
              loading={isLoading}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Top Pipelines par Exécutions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPipelinesData.map((pipeline, index) => (
                    <motion.div
                      key={pipeline.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{pipeline.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pipeline.exécutions.toLocaleString('fr-FR')} exécutions
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          pipeline.成功率 >= 99 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        )}
                      >
                        {pipeline.成功率}%
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      <Separator className="my-6" />

      {/* 3. Data Volume */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="size-5 text-teal-500" />
            Volume de Données
          </h2>
          <p className="text-sm text-muted-foreground">Stockage et lignes traitées</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SectionSkeleton />
              <SectionSkeleton />
            </div>
          ) : (
            <>
              <motion.div variants={itemVariants}>
                <KpiCard
                  title="Lignes Traitées"
                  value={formatNumber(stats?.processedDataRows ?? 0)}
                  change={32}
                  changeLabel="vs mois dernier"
                  icon={<Database className="size-5" />}
                  trend="up"
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <KpiCard
                  title="Stockage Utilisé"
                  value={`${stats?.totalStorageGb ?? 0} Go`}
                  change={15}
                  changeLabel="vs mois dernier"
                  icon={<HardDrive className="size-5" />}
                  trend="up"
                />
              </motion.div>
            </>
          )}
        </div>

        <motion.div variants={itemVariants}>
          <ChartWidget
            title="Croissance du Volume de Données"
            subtitle="Lignes traitées par mois"
            type="area"
            data={dataVolumeData}
            xKey="mois"
            yKey="lignes"
            colorScheme={['#0d9488']}
            height={260}
            loading={isLoading}
          />
        </motion.div>
      </motion.div>

      <Separator className="my-6" />

      {/* 4. Agency Performance */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="size-5 text-teal-500" />
            Performance des Agences
          </h2>
          <p className="text-sm text-muted-foreground">Classement et revenus</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div variants={itemVariants}>
            <ChartWidget
              title="Top Agences par Nombre de Clients"
              type="bar"
              data={topAgenciesData}
              xKey="name"
              yKey="clients"
              colorScheme={['#0d9488']}
              height={240}
              loading={isLoading}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <ChartWidget
              title="Répartition des Revenus"
              type="donut"
              data={revenueBreakdownData}
              xKey="name"
              yKey="value"
              colorScheme={['#0d9488', '#10b981', '#6ee7b7', '#99f6e4']}
              height={240}
              loading={isLoading}
            />
          </motion.div>
        </div>
      </motion.div>

      <Separator className="my-6" />

      {/* 5. System Health */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gauge className="size-5 text-teal-500" />
            Santé du Système
          </h2>
          <p className="text-sm text-muted-foreground">Indicateurs de performance et disponibilité</p>
        </div>

        <SystemHealthSection />
      </motion.div>
    </div>
  )
}
