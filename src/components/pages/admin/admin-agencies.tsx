'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  ExternalLink,
  Users,
  Workflow,
  HardDrive,
  Globe,
  ChevronRight,
  Palette,
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/shared/page-header'
import { KpiCard } from '@/components/shared/kpi-card'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { cn } from '@/lib/utils'


interface Agency {
  id: string
  name: string
  slug: string
  plan: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  brandAccentColor: string
  customDomain: string | null
  customDomainVerified: boolean
  maxSmeClients: number
  maxStorageGb: number
  status: string
  _count: {
    smeClients: number
    users: number
    dataSources: number
    pipelines: number
    dashboards: number
    reports: number
  }
}

interface AgencyClient {
  id: string
  name: string
  industry: string
  status: string
  mrr: number
  pipelinesCount?: number
}


const mockAgencies: Agency[] = [
  {
    id: 'agency-1',
    name: 'DataViz Pro',
    slug: 'dataviz-pro',
    plan: 'enterprise',
    brandPrimaryColor: '#0d9488',
    brandSecondaryColor: '#134e4a',
    brandAccentColor: '#14b8a6',
    customDomain: 'app.dataviz-pro.com',
    customDomainVerified: true,
    maxSmeClients: 50,
    maxStorageGb: 100,
    status: 'active',
    _count: {
      smeClients: 8,
      users: 5,
      dataSources: 18,
      pipelines: 12,
      dashboards: 10,
      reports: 4,
    },
  },
  {
    id: 'agency-2',
    name: 'InsightHub',
    slug: 'insighthub',
    plan: 'pro',
    brandPrimaryColor: '#f59e0b',
    brandSecondaryColor: '#78350f',
    brandAccentColor: '#fbbf24',
    customDomain: 'analytics.insighthub.fr',
    customDomainVerified: true,
    maxSmeClients: 20,
    maxStorageGb: 50,
    status: 'active',
    _count: {
      smeClients: 5,
      users: 3,
      dataSources: 12,
      pipelines: 8,
      dashboards: 6,
      reports: 3,
    },
  },
]

const mockAgencyClients: Record<string, AgencyClient[]> = {
  'agency-1': [
    { id: 'c1', name: 'Bloom & Petal Florists', industry: 'retail', status: 'active', mrr: 299 },
    { id: 'c2', name: 'Metro Bistro Group', industry: 'restaurant', status: 'active', mrr: 499 },
    { id: 'c3', name: 'TechFlow Solutions', industry: 'btp', status: 'active', mrr: 799 },
    { id: 'c4', name: 'GreenCare Clinics', industry: 'healthcare', status: 'trial', mrr: 0 },
  ],
  'agency-2': [
    { id: 'c5', name: 'QuickShip Logistics', industry: 'logistics', status: 'active', mrr: 599 },
    { id: 'c6', name: 'Artisan Furniture Co.', industry: 'ecommerce', status: 'suspended', mrr: 0 },
    { id: 'c7', name: 'Peak Fitness Studios', industry: 'services', status: 'active', mrr: 299 },
  ],
}


const createAgencySchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  slug: z.string().min(2, 'Le slug doit contenir au moins 2 caractères').regex(/^[a-z0-9-]+$/, 'Slug invalide (minuscules, chiffres, tirets)'),
  plan: z.enum(['starter', 'pro', 'enterprise']),
  email: z.string().email('Email invalide'),
  maxClients: z.coerce.number().min(1).max(100),
})

type CreateAgencyForm = z.infer<typeof createAgencySchema>


function PlanBadge({ plan }: { plan: string }) {
  const config: Record<string, { label: string; className: string }> = {
    enterprise: { label: 'Enterprise', className: 'bg-teal-100 text-teal-700 border-teal-200' },
    pro: { label: 'Pro', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    starter: { label: 'Starter', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  }
  const c = config[plan] ?? config.starter
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', c.className)}>
      {c.label}
    </span>
  )
}


function getColumns(onViewDetail: (agency: Agency) => void): ColumnDef<Agency>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Agence',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 items-center justify-center rounded-lg text-white font-bold text-sm"
            style={{ backgroundColor: row.original.brandPrimaryColor }}
          >
            {row.original.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => <PlanBadge plan={row.original.plan} />,
    },
    {
      accessorKey: '_count.smeClients',
      header: 'Clients',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original._count.smeClients}</span>
      ),
    },
    {
      accessorKey: '_count.users',
      header: 'Utilisateurs',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original._count.users}</span>
      ),
    },
    {
      accessorKey: '_count.pipelines',
      header: 'Pipelines',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original._count.pipelines}</span>
      ),
    },
    {
      id: 'storage',
      header: 'Stockage',
      cell: ({ row }) => {
        const used = (row.original._count.smeClients * 3.2).toFixed(1)
        const max = row.original.maxStorageGb
        return (
          <div className="space-y-1">
            <span className="text-sm font-medium">{used} Go</span>
            <div className="w-16">
              <Progress value={(parseFloat(used) / max) * 100} className="h-1.5" />
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'customDomain',
      header: 'Domaine',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {row.original.customDomainVerified && (
            <Globe className="size-3.5 text-emerald-500" />
          )}
          <span className="text-xs text-muted-foreground">
            {row.original.customDomain ?? '—'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status as 'active' | 'trial' | 'suspended'} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetail(row.original)}>
              <Eye className="size-4 mr-2" />
              Voir détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              <ExternalLink className="size-4 mr-2" />
              Impersoner
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}


function AgencyDetailSheet({
  agency,
  open,
  onOpenChange,
}: {
  agency: Agency | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!agency) return null

  const clients = mockAgencyClients[agency.id] ?? []
  const activeClients = clients.filter((c) => c.status === 'active').length
  const totalMrr = clients.reduce((sum, c) => sum + c.mrr, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[560px] sm:max-w-[560px] overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 items-center justify-center rounded-xl text-white font-bold text-lg"
              style={{ backgroundColor: agency.brandPrimaryColor }}
            >
              {agency.name.charAt(0)}
            </div>
            <div>
              <SheetTitle className="text-xl">{agency.name}</SheetTitle>
              <SheetDescription>{agency.slug}</SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PlanBadge plan={agency.plan} />
            <StatusBadge status={agency.status as 'active' | 'trial' | 'suspended'} />
            {agency.customDomainVerified && (
              <Badge variant="outline" className="text-xs gap-1">
                <Globe className="size-3" />
                Domaine vérifié
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 px-4">
          {/* Brand Preview */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Palette className="size-4 text-muted-foreground" />
              Aperçu de la marque
            </h4>
            <div className="rounded-lg border p-4" style={{ backgroundColor: agency.brandSecondaryColor }}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="size-8 rounded-lg"
                  style={{ backgroundColor: agency.brandPrimaryColor }}
                />
                <div>
                  <p className="text-sm font-semibold text-white">{agency.name}</p>
                  <p className="text-xs text-white/60">Tableau de bord</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[agency.brandPrimaryColor, agency.brandSecondaryColor, agency.brandAccentColor].map((color) => (
                  <div key={color} className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1">
                    <div className="size-3 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                    <span className="text-xs text-white/70">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Usage Metrics */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Métriques d&apos;utilisation</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Clients SME', value: agency._count.smeClients, icon: Building2, color: 'text-teal-600 bg-teal-50' },
                { label: 'Utilisateurs', value: agency._count.users, icon: Users, color: 'text-amber-600 bg-amber-50' },
                { label: 'Pipelines', value: agency._count.pipelines, icon: Workflow, color: 'text-violet-600 bg-violet-50' },
                { label: 'Sources de données', value: agency._count.dataSources, icon: HardDrive, color: 'text-rose-600 bg-rose-50' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={cn('flex size-7 items-center justify-center rounded-md', item.color)}>
                      <item.icon className="size-3.5" />
                    </div>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <p className="text-xl font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Limits */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Limites du plan</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Clients</span>
                  <span className="font-medium">{agency._count.smeClients} / {agency.maxSmeClients}</span>
                </div>
                <Progress value={(agency._count.smeClients / agency.maxSmeClients) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Stockage</span>
                  <span className="font-medium">{(agency._count.smeClients * 3.2).toFixed(1)} / {agency.maxStorageGb} Go</span>
                </div>
                <Progress value={((agency._count.smeClients * 3.2) / agency.maxStorageGb) * 100} className="h-2" />
              </div>
            </div>
          </div>

          {/* Client List */}
          <div>
            <h4 className="text-sm font-semibold mb-3">
              Clients ({clients.length}) · MRR: {totalMrr.toLocaleString('fr-FR')} €
            </h4>
            <div className="space-y-2">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={client.status as 'active' | 'trial' | 'suspended' | 'churned'} />
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{client.industry}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">
                    {client.mrr > 0 ? `${client.mrr} €/mois` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Impersonate Button */}
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {}}
          >
            <ExternalLink className="size-4 mr-2" />
            Impersoner cette agence
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}


function CreateAgencyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<CreateAgencyForm>({
    resolver: zodResolver(createAgencySchema),
    defaultValues: {
      name: '',
      slug: '',
      plan: 'starter',
      email: '',
      maxClients: 10,
    },
  })

  const onSubmit = (data: CreateAgencyForm) => {
    // Simulated - just close
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une Agence</DialogTitle>
          <DialogDescription>
            Ajoutez une nouvelle agence à la plateforme DataBridge.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l&apos;agence</Label>
            <Input
              id="name"
              placeholder="Ex: DataViz Pro"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              placeholder="Ex: dataviz-pro"
              {...form.register('slug')}
            />
            {form.formState.errors.slug && (
              <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            <Select
              defaultValue={form.getValues('plan')}
              onValueChange={(value) => form.setValue('plan', value as 'starter' | 'pro' | 'enterprise')}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email de contact</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxClients">Nombre max de clients</Label>
            <Input
              id="maxClients"
              type="number"
              min={1}
              max={100}
              {...form.register('maxClients')}
            />
            {form.formState.errors.maxClients && (
              <p className="text-xs text-red-500">{form.formState.errors.maxClients.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              <Plus className="size-4 mr-2" />
              Créer l&apos;agence
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


function TableSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="border-b p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <Skeleton className="h-9 max-w-sm" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}


export function AdminAgencies() {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [detailAgency, setDetailAgency] = React.useState<Agency | null>(null)
  const [planFilter, setPlanFilter] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  const { data: agencies, isLoading } = useQuery<Agency[]>({
    queryKey: ['agencies'],
    queryFn: async () => {
      const res = await fetch('/api/agencies')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  // Use mock data if API returns empty or fails
  const displayAgencies = (agencies && agencies.length > 0 ? agencies : mockAgencies) as Agency[]

  const filteredAgencies = React.useMemo(() => {
    let result = displayAgencies

    if (planFilter !== 'all') {
      result = result.filter((a) => a.plan === planFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q)
      )
    }

    return result
  }, [displayAgencies, planFilter, searchQuery])

  const columns = React.useMemo(
    () => getColumns((agency) => setDetailAgency(agency)),
    []
  )

  // Stats
  const totalCount = displayAgencies.length
  const enterpriseCount = displayAgencies.filter((a) => a.plan === 'enterprise').length
  const proCount = displayAgencies.filter((a) => a.plan === 'pro').length
  const starterCount = displayAgencies.filter((a) => a.plan === 'starter').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agences"
        description="Gérez les agences de la plateforme"
        breadcrumbs={[{ label: 'Admin' }, { label: 'Agences' }]}
        actions={
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4 mr-2" />
            Créer une Agence
          </Button>
        }
      />

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <KpiCard
          title="Total Agences"
          value={totalCount}
          icon={<Building2 className="size-5" />}
        />
        <KpiCard
          title="Enterprise"
          value={enterpriseCount}
          icon={<Building2 className="size-5" />}
          className="border-teal-100"
        />
        <KpiCard
          title="Pro"
          value={proCount}
          icon={<Building2 className="size-5" />}
          className="border-amber-100"
        />
        <KpiCard
          title="Starter"
          value={starterCount}
          icon={<Building2 className="size-5" />}
        />
      </motion.div>

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Tabs value={planFilter} onValueChange={setPlanFilter}>
                  <TabsList>
                    <TabsTrigger value="all">Tous</TabsTrigger>
                    <TabsTrigger value="enterprise">Enterprise</TabsTrigger>
                    <TabsTrigger value="pro">Pro</TabsTrigger>
                    <TabsTrigger value="starter">Starter</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une agence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={filteredAgencies}
                searchable={false}
                pagination={false}
                onRowClick={(agency) => setDetailAgency(agency)}
                emptyMessage="Aucune agence trouvée."
              />
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Agency Detail Sheet */}
      <AgencyDetailSheet
        agency={detailAgency}
        open={!!detailAgency}
        onOpenChange={(open) => !open && setDetailAgency(null)}
      />

      {/* Create Agency Dialog */}
      <CreateAgencyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
