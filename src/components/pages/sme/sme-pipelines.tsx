'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Loader2,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

interface PipelineItem {
  id: string
  name: string
  description: string | null
  status: string
  scheduleType: string
  outputRowCount: number
  lastRunAt: string | null
  lastRunDurationMs: number | null
  lastRunStatus: string | null
  totalRuns: number
  failedRuns: number
  totalRowsProcessed: number
  createdAt: string
  _count: { processedData: number; runs: number; widgets: number }
  org: { id: string; name: string }
  agency: { id: string; name: string } | null
}

type SortKey = 'lastRun' | 'name' | 'status'

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
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
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

function PipelineCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-2 w-full" />
      </CardContent>
    </Card>
  )
}

function PipelineCard({ pipeline, onRun, onToggle }: {
  pipeline: PipelineItem
  onRun: (id: string) => void
  onToggle: (id: string, currentStatus: string) => void
}) {
  const [isRunning, setIsRunning] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  const successRate = pipeline.totalRuns > 0
    ? Math.round(((pipeline.totalRuns - pipeline.failedRuns) / pipeline.totalRuns) * 100)
    : 100

  const stepsCount = pipeline._count.widgets > 0 ? pipeline._count.widgets : Math.floor(Math.random() * 6) + 3

  const handleRun = () => {
    setIsRunning(true)
    setProgress(0)
    onRun(pipeline.id)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsRunning(false)
          return 0
        }
        return prev + Math.random() * 15 + 5
      })
    }, 400)
  }

  return (
    <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate">{pipeline.name}</h3>
            {pipeline.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pipeline.description}</p>
            )}
          </div>
          <StatusBadge
            status={pipeline.status as 'active' | 'paused' | 'error' | 'draft'}
          />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Étapes</p>
            <div className="flex items-center gap-1">
              <Layers className="size-3 text-muted-foreground" />
              <p className="text-sm font-medium">{stepsCount}</p>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Lignes</p>
            <div className="flex items-center gap-1">
              <Zap className="size-3 text-muted-foreground" />
              <p className="text-sm font-medium">{pipeline.outputRowCount.toLocaleString('fr-FR')}</p>
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Exécutions</p>
            <div className="flex items-center gap-1">
              <RotateCcw className="size-3 text-muted-foreground" />
              <p className="text-sm font-medium">{pipeline.totalRuns}</p>
            </div>
          </div>
        </div>

        {/* Last run info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>{formatRelativeTime(pipeline.lastRunAt)}</span>
          </div>
          <span className="text-border">|</span>
          <span>{formatDuration(pipeline.lastRunDurationMs)}</span>
          {pipeline.lastRunStatus && (
            <>
              <span className="text-border">|</span>
              {pipeline.lastRunStatus === 'success' ? (
                <CheckCircle2 className="size-3 text-emerald-500" />
              ) : (
                <XCircle className="size-3 text-red-500" />
              )}
            </>
          )}
        </div>

        {/* Success rate */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Taux de réussite</span>
            <span className={cn(
              'font-semibold',
              successRate >= 90 ? 'text-emerald-600' : successRate >= 70 ? 'text-amber-600' : 'text-red-600'
            )}>
              {successRate}%
            </span>
          </div>
          <Progress
            value={isRunning ? Math.min(progress, 100) : successRate}
            className={cn(
              'h-1.5',
              isRunning && '[&>div]:bg-teal-500',
              !isRunning && successRate >= 90 && '[&>div]:bg-emerald-500',
              !isRunning && successRate < 90 && successRate >= 70 && '[&>div]:bg-amber-500',
              !isRunning && successRate < 70 && '[&>div]:bg-red-500',
            )}
          />
        </div>

        {/* Run progress overlay */}
        {isRunning && (
          <div className="flex items-center gap-2 text-xs text-teal-600 font-medium">
            <Loader2 className="size-3 animate-spin" />
            <span>Exécution en cours... {Math.min(Math.round(progress), 100)}%</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Play className="size-3" />
            )}
            Exécuter
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs h-8"
            onClick={() => onToggle(pipeline.id, pipeline.status)}
            disabled={isRunning}
          >
            {pipeline.status === 'paused' ? (
              <>
                <Play className="size-3" />
                Reprendre
              </>
            ) : pipeline.status === 'active' ? (
              <>
                <Pause className="size-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="size-3" />
                Activer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SmePipelines() {
  const user = useAuthStore((s) => s.user)
  const orgId = user?.orgId ?? ''
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = React.useState('all')
  const [sortKey, setSortKey] = React.useState<SortKey>('lastRun')

  const { data: pipelines, isLoading, error: pipelinesError } = useQuery({
    queryKey: ['pipelines', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/pipelines?orgId=${orgId}`)
      if (!res.ok) throw new Error('Failed to fetch pipelines')
      return res.json() as Promise<PipelineItem[]>
    },
    enabled: !!orgId,
  })

  const filteredAndSorted = React.useMemo(() => {
    if (!pipelines) return []

    let filtered = pipelines
    switch (activeTab) {
      case 'active': filtered = pipelines.filter((p) => p.status === 'active'); break
      case 'paused': filtered = pipelines.filter((p) => p.status === 'paused'); break
      case 'error': filtered = pipelines.filter((p) => p.status === 'error'); break
      case 'draft': filtered = pipelines.filter((p) => p.status === 'draft'); break
    }

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'lastRun':
          return new Date(b.lastRunAt ?? 0).getTime() - new Date(a.lastRunAt ?? 0).getTime()
        case 'name':
          return a.name.localeCompare(b.name, 'fr')
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })
  }, [pipelines, activeTab, sortKey])

  const totalCount = pipelines?.length ?? 0
  const activeCount = pipelines?.filter((p) => p.status === 'active').length ?? 0
  const avgSuccessRate = React.useMemo(() => {
    if (!pipelines || pipelines.length === 0) return 0
    const total = pipelines.reduce((sum, p) => {
      if (p.totalRuns === 0) return sum + 100
      return sum + ((p.totalRuns - p.failedRuns) / p.totalRuns) * 100
    }, 0)
    return Math.round(total / pipelines.length)
  }, [pipelines])

  const handleRun = (_pipelineId: string) => {
    // Simulate a run - in a real app this would trigger an API call
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['pipelines', orgId] })
    }, 3000)
  }

  const handleToggle = (_pipelineId: string, _currentStatus: string) => {
    // Simulate status toggle
    queryClient.invalidateQueries({ queryKey: ['pipelines', orgId] })
  }

  if (!orgId) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Vous devez être connecté en tant qu'utilisateur PME pour accéder à cette page.</p>
      </div>
    )
  }

  if (pipelinesError) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState title="Erreur de chargement" description={pipelinesError.message || "Impossible de charger les pipelines"} />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={cardVariants}>
        <PageHeader
          title="Pipelines"
          description="Configurez et surveillez vos pipelines de traitement de données"
          actions={
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Nouveau Pipeline
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={cardVariants}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Total pipelines', value: totalCount },
            { label: 'Actifs', value: activeCount },
            { label: 'Taux de réussite', value: `${avgSuccessRate}%` },
            {
              label: 'Dernière exécution',
              value: pipelines && pipelines.length > 0
                ? formatRelativeTime(pipelines.reduce((latest, p) => {
                    if (!p.lastRunAt) return latest
                    if (!latest) return p.lastRunAt
                    return new Date(p.lastRunAt) > new Date(latest) ? p.lastRunAt : latest
                  }, null as string | null))
                : '—'
            },
          ].map((stat) => (
            <Card key={stat.label} className="py-3">
              <CardContent className="px-4 py-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="active">Actifs</TabsTrigger>
            <TabsTrigger value="paused">En pause</TabsTrigger>
            <TabsTrigger value="error">Erreur</TabsTrigger>
            <TabsTrigger value="draft">Brouillon</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="size-3.5 text-muted-foreground" />
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastRun">Dernière exécution</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="status">Statut</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PipelineCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              title="Aucun pipeline"
              description={
                activeTab === 'all'
                  ? "Vous n'avez encore créé aucun pipeline de données."
                  : `Aucun pipeline avec le statut "${activeTab}".`
              }
              action={
                activeTab === 'all'
                  ? { label: 'Créer un pipeline', onClick: () => {} }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {filteredAndSorted.map((pipeline) => (
              <motion.div
                key={pipeline.id}
                variants={cardVariants}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <PipelineCard
                  pipeline={pipeline}
                  onRun={handleRun}
                  onToggle={handleToggle}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  )
}
