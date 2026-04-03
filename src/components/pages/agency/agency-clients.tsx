'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import {
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  MoreHorizontal,
  ExternalLink,
  Database,
  GitBranch,
  LayoutDashboard,
  HardDrive,
  Users,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/stores/auth-store'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'


type ClientStatus = 'active' | 'trial' | 'suspended' | 'churned'
type Industry = 'retail' | 'restaurant' | 'btp' | 'healthcare' | 'services' | 'manufacturing' | 'logistics' | 'ecommerce' | 'other'

interface SmeClient {
  id: string
  name: string
  industry: string
  contactName: string
  contactEmail: string
  contactPhone: string
  status: string
  storageUsedBytes: number
  dataSourcesCount: number
  pipelinesCount: number
  dashboardsCount: number
  mrr: number
  planName: string
  rowsProcessed: number
  lastActive: string
  createdAt: string
}

interface ClientApiResponse {
  id: string
  name: string
  industry: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  status: string
  storageUsedBytes: number
  lastActiveAt: string | null
  createdAt: string
  updatedAt: string
  agencyId: string
  slug: string
  onboardingCompleted: boolean
  _count?: {
    dataSources: number
    pipelines: number
    dashboards: number
    reports: number
    users: number
  }
}

interface DataSource {
  id: string
  orgId: string
  name: string
  connectorType: string
  status: string
  lastSyncAt: string | null
  lastSyncRows: number | null
  syncFrequency: string
  fileSizeBytes: number | null
}

interface Pipeline {
  id: string
  orgId: string
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
  _count?: {
    processedData: number
    runs: number
    widgets: number
  }
}

const industryOptions: { value: string; label: string }[] = [
  { value: 'retail', label: 'Retail' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'btp', label: 'Business/Technology Services' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'services', label: 'Professional Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'other', label: 'Other' },
]

type FilterTab = 'all' | ClientStatus


function transformClient(raw: ClientApiResponse): SmeClient {
  return {
    id: raw.id,
    name: raw.name,
    industry: raw.industry ?? 'other',
    contactName: raw.contactName ?? '',
    contactEmail: raw.contactEmail ?? '',
    contactPhone: raw.contactPhone ?? '',
    status: raw.status,
    storageUsedBytes: raw.storageUsedBytes,
    dataSourcesCount: raw._count?.dataSources ?? 0,
    pipelinesCount: raw._count?.pipelines ?? 0,
    dashboardsCount: raw._count?.dashboards ?? 0,
    mrr: 0,
    planName: 'Professional',
    rowsProcessed: 0,
    lastActive: raw.lastActiveAt ?? raw.createdAt,
    createdAt: raw.createdAt,
  }
}


const filterTabs: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'trial', label: 'Essai' },
  { value: 'suspended', label: 'Suspendus' },
  { value: 'churned', label: 'Perdus' },
]


function getClientColumns(onRowClick: (client: SmeClient) => void): ColumnDef<SmeClient>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Client',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700 font-semibold text-sm">
            {row.original.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.planName}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'industry',
      header: 'Industrie',
      cell: ({ row }) => {
        const label = industryOptions.find((i) => i.value === row.original.industry)?.label ?? row.original.industry
        return (
          <Badge variant="outline" className="text-xs font-normal">
            {label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => <StatusBadge status={row.original.status as ClientStatus} />,
    },
    {
      accessorKey: 'contactName',
      header: 'Contact',
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{row.original.contactName}</p>
          <p className="text-xs text-muted-foreground">{row.original.contactEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: 'pipelinesCount',
      header: 'Pipelines',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.pipelinesCount}</span>
      ),
    },
    {
      accessorKey: 'dashboardsCount',
      header: 'Dashboards',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.dashboardsCount}</span>
      ),
    },
    {
      accessorKey: 'storageUsedBytes',
      header: 'Stockage',
      cell: ({ row }) => {
        const gb = row.original.storageUsedBytes / (1024 * 1024 * 1024)
        return <span className="text-sm text-muted-foreground">{gb.toFixed(1)} Go</span>
      },
    },
    {
      accessorKey: 'mrr',
      header: 'MRR',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.mrr > 0 ? `${row.original.mrr} €` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'lastActive',
      header: 'Dernière activité',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.lastActive), {
            addSuffix: true,
            locale: fr,
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <ExternalLink className="mr-2 size-4" />
              Voir le détail
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 size-4" />
              Contacter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Suspendre</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}


function ClientDetailSheet({
  client,
  open,
  onOpenChange,
}: {
  client: SmeClient | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: clientSources, isLoading: sourcesLoading } = useQuery<DataSource[]>({
    queryKey: ['client-sources', client?.id],
    queryFn: async () => {
      const res = await fetch(`/api/sources?orgId=${client?.id}`)
      if (!res.ok) throw new Error('Failed to fetch sources')
      return res.json()
    },
    enabled: !!client?.id,
  })

  const { data: clientPipelines, isLoading: pipelinesLoading } = useQuery<Pipeline[]>({
    queryKey: ['client-pipelines', client?.id],
    queryFn: async () => {
      const res = await fetch(`/api/pipelines?orgId=${client?.id}`)
      if (!res.ok) throw new Error('Failed to fetch pipelines')
      return res.json()
    },
    enabled: !!client?.id,
  })

  if (!client) return null

  const storageGb = client.storageUsedBytes / (1024 * 1024 * 1024)
  const industryLabel = industryOptions.find((i) => i.value === client.industry)?.label ?? client.industry

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-teal-100 text-teal-700 text-xl font-bold">
              {client.name.charAt(0)}
            </div>
            <div className="flex-1">
              <SheetTitle className="text-xl">{client.name}</SheetTitle>
              <SheetDescription>{industryLabel} · {client.planName}</SheetDescription>
            </div>
            <StatusBadge status={client.status as ClientStatus} />
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-6 pr-3 pb-6">
            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-muted-foreground" />
                  <span>{client.contactName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{client.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{client.contactPhone}</span>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Utilisation</h4>
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-3 text-center">
                    <Database className="mx-auto size-5 text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{client.dataSourcesCount}</p>
                    <p className="text-xs text-muted-foreground">Sources</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <GitBranch className="mx-auto size-5 text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{client.pipelinesCount}</p>
                    <p className="text-xs text-muted-foreground">Pipelines</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <LayoutDashboard className="mx-auto size-5 text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{client.dashboardsCount}</p>
                    <p className="text-xs text-muted-foreground">Dashboards</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <HardDrive className="mx-auto size-5 text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{storageGb.toFixed(1)} Go</p>
                    <p className="text-xs text-muted-foreground">Stockage</p>
                  </CardContent>
                </Card>
              </div>
              {client.mrr > 0 && (
                <div className="mt-3 rounded-lg bg-teal-50 p-3 text-center">
                  <p className="text-xs text-teal-600 font-medium">MRR</p>
                  <p className="text-xl font-bold text-teal-700">{client.mrr} €</p>
                </div>
              )}
            </div>

            {/* Data Sources */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Sources de données
                {sourcesLoading ? (
                  <Loader2 className="inline size-3 ml-1 animate-spin text-muted-foreground" />
                ) : (
                  ` (${clientSources?.length ?? 0})`
                )}
              </h4>
              {sourcesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : clientSources && clientSources.length > 0 ? (
                <div className="space-y-2">
                  {clientSources.map((ds) => (
                    <div key={ds.id} className="flex items-center justify-between rounded-lg border p-2.5">
                      <div className="flex items-center gap-2">
                        <Database className="size-4 text-muted-foreground" />
                        <span className="text-sm">{ds.name}</span>
                      </div>
                      <StatusBadge status={ds.status as 'active' | 'error' | 'disconnected' | 'syncing'} showDot />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune source de données</p>
              )}
            </div>

            {/* Pipelines */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Pipelines
                {pipelinesLoading ? (
                  <Loader2 className="inline size-3 ml-1 animate-spin text-muted-foreground" />
                ) : (
                  ` (${clientPipelines?.length ?? 0})`
                )}
              </h4>
              {pipelinesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : clientPipelines && clientPipelines.length > 0 ? (
                <div className="space-y-2">
                  {clientPipelines.map((pipe) => (
                    <div key={pipe.id} className="flex items-center justify-between rounded-lg border p-2.5">
                      <div>
                        <p className="text-sm font-medium">{pipe.name}</p>
                        <p className="text-xs text-muted-foreground">{pipe.scheduleType} · {pipe.outputRowCount.toLocaleString()} lignes</p>
                      </div>
                      <StatusBadge status={pipe.status as 'active' | 'paused' | 'draft' | 'error'} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun pipeline</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}


export function AgencyClients() {
  const user = useAuthStore((s) => s.user)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClient, setSelectedClient] = useState<SmeClient | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: clients, isLoading } = useQuery<SmeClient[]>({
    queryKey: ['clients', user?.agencyId],
    queryFn: async () => {
      const res = await fetch(`/api/clients?agencyId=${user?.agencyId}`)
      if (!res.ok) throw new Error('Failed to fetch clients')
      const raw: ClientApiResponse[] = await res.json()
      return raw.map(transformClient)
    },
    enabled: !!user?.agencyId,
  })

  const displayClients = useMemo(() => {
    if (!clients) return []
    let filtered = clients

    if (activeFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === activeFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q) ||
          c.contactEmail.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [clients, activeFilter, searchQuery])

  const tabCounts = useMemo(() => {
    if (!clients) return { all: 0, active: 0, trial: 0, suspended: 0, churned: 0 }
    return {
      all: clients.length,
      active: clients.filter((c) => c.status === 'active').length,
      trial: clients.filter((c) => c.status === 'trial').length,
      suspended: clients.filter((c) => c.status === 'suspended').length,
      churned: clients.filter((c) => c.status === 'churned').length,
    }
  }, [clients])

  const handleRowClick = (client: SmeClient) => {
    setSelectedClient(client)
    setDetailOpen(true)
  }

  const columns = useMemo(() => getClientColumns(handleRowClick), [])

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Clients"
        description={`${tabCounts.all} clients au total`}
        actions={
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="mr-2 size-4" />
            Ajouter un Client
          </Button>
        }
      />

      {/* Filter Tabs + Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeFilter === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">{tabCounts[tab.value as keyof typeof tabCounts]}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Client Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : displayClients.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-8" />}
          title="Aucun client trouvé"
          description={
            activeFilter !== 'all'
              ? `Aucun client avec le statut "${filterTabs.find((t) => t.value === activeFilter)?.label}"`
              : 'Aucun client correspondant à votre recherche'
          }
          action={
            searchQuery || activeFilter !== 'all'
              ? {
                  label: 'Réinitialiser les filtres',
                  onClick: () => {
                    setSearchQuery('')
                    setActiveFilter('all')
                  },
                }
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={displayClients}
          searchable={false}
          onRowClick={handleRowClick}
          pageSize={10}
        />
      )}

      {/* Client Detail Sheet */}
      <ClientDetailSheet
        client={selectedClient}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </motion.div>
  )
}
