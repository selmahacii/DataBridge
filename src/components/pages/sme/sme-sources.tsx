'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus,
  FileSpreadsheet,
  Table,
  Database,
  Globe,
  HardDrive,
  Clock,
  Rows3,
  HardDriveDownload,
  Info,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

interface DataSourceItem {
  id: string
  name: string
  description: string | null
  connectorType: string
  status: string
  lastSyncAt: string | null
  lastSyncRows: number | null
  syncFrequency: string
  fileSizeBytes: number | null
  lastErrorMessage: string | null
  consecutiveErrors: number
  createdAt: string
  org: { id: string; name: string }
  agency: { id: string; name: string } | null
}

function getConnectorIcon(type: string) {
  switch (type) {
    case 'csv_upload': return <FileSpreadsheet className="size-6" />
    case 'excel_upload': return <FileSpreadsheet className="size-6" />
    case 'google_sheets': return <Table className="size-6" />
    case 'postgresql':
    case 'mysql':
    case 'database_query': return <Database className="size-6" />
    case 'rest_api':
    case 'api_fetch': return <Globe className="size-6" />
    case 'woocommerce':
    case 'quickbooks': return <HardDrive className="size-6" />
    default: return <HardDrive className="size-6" />
  }
}

function getConnectorColor(type: string): string {
  switch (type) {
    case 'csv_upload': return 'bg-emerald-100 text-emerald-700'
    case 'excel_upload': return 'bg-green-100 text-green-700'
    case 'google_sheets': return 'bg-teal-100 text-teal-700'
    case 'postgresql':
    case 'mysql':
    case 'database_query': return 'bg-orange-100 text-orange-700'
    case 'rest_api':
    case 'api_fetch': return 'bg-violet-100 text-violet-700'
    case 'woocommerce': return 'bg-purple-100 text-purple-700'
    case 'quickbooks': return 'bg-sky-100 text-sky-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getConnectorLabel(type: string): string {
  switch (type) {
    case 'csv_upload': return 'CSV'
    case 'excel_upload': return 'Excel'
    case 'google_sheets': return 'Google Sheets'
    case 'postgresql': return 'PostgreSQL'
    case 'mysql': return 'MySQL'
    case 'database_query': return 'Base de données'
    case 'rest_api': return 'API REST'
    case 'api_fetch': return 'API'
    case 'woocommerce': return 'WooCommerce'
    case 'quickbooks': return 'QuickBooks'
    default: return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
}

function SourceCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </CardContent>
    </Card>
  )
}

export function SmeSources() {
  const user = useAuthStore((s) => s.user)
  const orgId = user?.orgId ?? ''

  const [activeTab, setActiveTab] = React.useState('all')
  const [selectedSource, setSelectedSource] = React.useState<DataSourceItem | null>(null)

  const { data: sources, isLoading, error } = useQuery({
    queryKey: ['sources', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/sources?orgId=${orgId}`)
      if (!res.ok) throw new Error('Failed to fetch sources')
      return res.json() as Promise<DataSourceItem[]>
    },
    enabled: !!orgId,
  })

  const filteredSources = React.useMemo(() => {
    if (!sources) return []
    switch (activeTab) {
      case 'active': return sources.filter((s) => s.status === 'active')
      case 'error': return sources.filter((s) => s.status === 'error')
      case 'disconnected': return sources.filter((s) => s.status === 'disconnected')
      default: return sources
    }
  }, [sources, activeTab])

  // Stats
  const totalCount = sources?.length ?? 0
  const activeCount = sources?.filter((s) => s.status === 'active').length ?? 0
  const errorCount = sources?.filter((s) => s.status === 'error').length ?? 0

  if (!orgId) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Vous devez être connecté en tant qu'utilisateur PME pour accéder à cette page.</p>
      </div>
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
          title="Sources de données"
          description="Gérez vos connexions de données et leur synchronisation"
          actions={
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Connecter
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={cardVariants}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total sources', value: totalCount, color: 'text-foreground' },
            { label: 'Actives', value: activeCount, color: 'text-emerald-600' },
            { label: 'Erreurs', value: errorCount, color: 'text-red-600' },
          ].map((stat) => (
            <Card key={stat.label} className="py-3">
              <CardContent className="px-4 py-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className={cn('text-xl font-bold', stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div variants={cardVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Toutes ({totalCount})</TabsTrigger>
            <TabsTrigger value="active">Actives ({activeCount})</TabsTrigger>
            <TabsTrigger value="error">Erreurs ({errorCount})</TabsTrigger>
            <TabsTrigger value="disconnected">Déconnectées</TabsTrigger>
          </TabsList>

          {['all', 'active', 'error', 'disconnected'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SourceCardSkeleton key={i} />
                  ))}
                </div>
              ) : error ? (
                <Card>
                  <CardContent className="py-8">
                    <EmptyState
                      title="Erreur de chargement"
                      description="Impossible de charger les sources de données. Veuillez réessayer."
                    />
                  </CardContent>
                </Card>
              ) : filteredSources.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <EmptyState
                      title="Aucune source"
                      description={
                        activeTab === 'all'
                          ? "Vous n'avez encore connecté aucune source de données."
                          : `Aucune source avec le statut "${activeTab}".`
                      }
                      action={
                        activeTab === 'all'
                          ? { label: 'Connecter une source', onClick: () => {} }
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
                    {filteredSources.map((source) => (
                      <motion.div
                        key={source.id}
                        variants={cardVariants}
                        layout
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <Card
                          className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-teal-200"
                          onClick={() => setSelectedSource(source)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'flex size-12 items-center justify-center rounded-lg flex-shrink-0',
                                getConnectorColor(source.connectorType)
                              )}>
                                {getConnectorIcon(source.connectorType)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">{source.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {getConnectorLabel(source.connectorType)}
                                  </Badge>
                                  <StatusBadge status={source.status as 'active' | 'error' | 'disconnected' | 'syncing'} />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedSource(source)
                                }}
                              >
                                <Info className="size-3.5" />
                              </Button>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Clock className="size-3" />
                                <span>{formatRelativeTime(source.lastSyncAt)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Rows3 className="size-3" />
                                <span>{source.lastSyncRows ? `${source.lastSyncRows.toLocaleString('fr-FR')} lignes` : '—'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <HardDriveDownload className="size-3" />
                                <span>{formatFileSize(source.fileSizeBytes)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="size-3" />
                                <span className="capitalize">{source.syncFrequency}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      <Dialog open={!!selectedSource} onOpenChange={() => setSelectedSource(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedSource && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex size-12 items-center justify-center rounded-lg',
                    getConnectorColor(selectedSource.connectorType)
                  )}>
                    {getConnectorIcon(selectedSource.connectorType)}
                  </div>
                  <div>
                    <DialogTitle>{selectedSource.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getConnectorLabel(selectedSource.connectorType)}
                      </Badge>
                      <StatusBadge status={selectedSource.status as 'active' | 'error' | 'disconnected' | 'syncing'} />
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {selectedSource.description && (
                  <p className="text-sm text-muted-foreground">{selectedSource.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Dernière sync', value: formatRelativeTime(selectedSource.lastSyncAt) },
                    { label: 'Lignes synchronisées', value: selectedSource.lastSyncRows?.toLocaleString('fr-FR') ?? '—' },
                    { label: 'Taille du fichier', value: formatFileSize(selectedSource.fileSizeBytes) },
                    { label: 'Fréquence', value: selectedSource.syncFrequency.charAt(0).toUpperCase() + selectedSource.syncFrequency.slice(1) },
                    { label: 'Erreurs consécutives', value: String(selectedSource.consecutiveErrors) },
                    { label: 'Créé le', value: new Date(selectedSource.createdAt).toLocaleDateString('fr-FR') },
                  ].map((item) => (
                    <div key={item.label} className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>

                {selectedSource.lastErrorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs font-medium text-red-700">Dernière erreur</p>
                    <p className="text-xs text-red-600 mt-1">{selectedSource.lastErrorMessage}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
