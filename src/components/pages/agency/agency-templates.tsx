'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Rocket,
  LayoutDashboard,
  Grid3X3,
  BarChart3,
  Users,
  ShoppingCart,
  TrendingUp,
  Building2,
  Wrench,
  Briefcase,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'


interface DashboardTemplate {
  id: string
  name: string
  description: string | null
  category: string | null
  config: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
  // Frontend-only computed fields
  widgetCount?: number
  deployedCount?: number
  thumbnail?: string
}

interface ClientBasic {
  id: string
  name: string
  status: string
}

type CategoryFilter = 'All' | 'Business' | 'Sales' | 'Marketing' | 'Operations' | 'Finance' | 'Industry' | 'E-commerce'

const categories: CategoryFilter[] = [
  'All',
  'Business',
  'Sales',
  'Marketing',
  'Operations',
  'Finance',
  'Industry',
  'E-commerce',
]


const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  Business: { icon: <Briefcase className="size-4" />, color: 'bg-teal-100 text-teal-700' },
  Sales: { icon: <TrendingUp className="size-4" />, color: 'bg-emerald-100 text-emerald-700' },
  Marketing: { icon: <Users className="size-4" />, color: 'bg-amber-100 text-amber-700' },
  Operations: { icon: <Wrench className="size-4" />, color: 'bg-orange-100 text-orange-700' },
  Finance: { icon: <BarChart3 className="size-4" />, color: 'bg-rose-100 text-rose-700' },
  Industry: { icon: <Building2 className="size-4" />, color: 'bg-violet-100 text-violet-700' },
  'E-commerce': { icon: <ShoppingCart className="size-4" />, color: 'bg-cyan-100 text-cyan-700' },
}


function TemplateCard({
  template,
  onDeploy,
}: {
  template: DashboardTemplate
  onDeploy: (template: DashboardTemplate) => void
}) {
  const config = categoryConfig[template.category ?? 'Business'] ?? categoryConfig['Business']
  const thumbnailColors = [
    ['#0d9488', '#14b8a6', '#2dd4bf'],
    ['#059669', '#10b981', '#34d399'],
    ['#d97706', '#f59e0b', '#fbbf24'],
    ['#dc2626', '#ef4444', '#f87171'],
    ['#7c3aed', '#8b5cf6', '#a78bfa'],
    ['#0891b2', '#06b6d4', '#22d3ee'],
  ]
  const colors = thumbnailColors[template.id.charCodeAt(template.id.length - 1) % thumbnailColors.length]

  // Parse widget count from config JSON
  const widgetCount = useMemo(() => {
    try {
      const parsed = JSON.parse(template.config)
      return parsed.widgets?.length ?? 0
    } catch {
      return 0
    }
  }, [template.config])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        {/* Thumbnail */}
        <div className="relative h-36 overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})` }}>
          <div className="absolute inset-0 flex flex-col gap-2 p-3">
            <div className="flex gap-2">
              <div className="h-6 flex-[2] rounded bg-white/20" />
              <div className="h-6 w-8 rounded bg-white/20" />
            </div>
            <div className="flex gap-2 flex-1">
              <div className="w-1/3 rounded bg-white/15" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-full rounded bg-white/25" />
                <div className="h-3 w-3/4 rounded bg-white/20" />
                <div className="h-3 w-1/2 rounded bg-white/15" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-12 rounded bg-white/15" />
              <div className="flex-1 h-12 rounded bg-white/10" />
            </div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Badge className="bg-white/90 text-foreground text-xs backdrop-blur-sm">
              <Grid3X3 className="mr-1 size-3" />
              {widgetCount} widgets
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground leading-tight">
                {template.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {template.description ?? ''}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className={cn('text-xs gap-1', config.color)}>
              {config.icon}
              {template.category ?? 'Business'}
            </Badge>
          </div>

          <Button
            size="sm"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => onDeploy(template)}
          >
            <Rocket className="mr-2 size-3.5" />
            Déployer
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}


function DeployDialog({
  template,
  open,
  onOpenChange,
  onDeploy,
}: {
  template: DashboardTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeploy: (template: DashboardTemplate, clientId: string) => void
}) {
  const user = useAuthStore((s) => s.user)
  const [selectedClient, setSelectedClient] = useState('')

  const { data: clients } = useQuery<ClientBasic[]>({
    queryKey: ['clients-basic', user?.agencyId],
    queryFn: async () => {
      const res = await fetch(`/api/clients?agencyId=${user?.agencyId}`)
      if (!res.ok) throw new Error('Failed to fetch clients')
      return res.json()
    },
    enabled: !!user?.agencyId && open,
  })

  const activeClients = useMemo(() => {
    if (!clients) return []
    return clients.filter(
      (c) => c.status === 'active' || c.status === 'trial'
    )
  }, [clients])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="size-5 text-teal-600" />
            Déployer le template
          </DialogTitle>
          <DialogDescription>
            Sélectionnez le client vers lequel déployer ce dashboard.
          </DialogDescription>
        </DialogHeader>

        {template && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted p-3">
              <p className="font-medium text-sm">{template.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {template.category ?? 'Business'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Client cible</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un client" />
                </SelectTrigger>
                <SelectContent>
                  {activeClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              if (template && selectedClient) {
                onDeploy(template, selectedClient)
                onOpenChange(false)
                setSelectedClient('')
              }
            }}
            disabled={!selectedClient}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Rocket className="mr-2 size-4" />
            Déployer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export function AgencyTemplates() {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [deployTemplate, setDeployTemplate] = useState<DashboardTemplate | null>(null)
  const [deployOpen, setDeployOpen] = useState(false)

  const { data: templates, isLoading } = useQuery<DashboardTemplate[]>({
    queryKey: ['templates', user?.agencyId],
    queryFn: async () => {
      const res = await fetch(`/api/templates?agencyId=${user?.agencyId}`)
      if (!res.ok) throw new Error('Failed to fetch templates')
      return res.json()
    },
    enabled: !!user?.agencyId,
  })

  const deployMutation = useMutation({
    mutationFn: async ({ templateId, clientId }: { templateId: string; clientId: string }) => {
      const res = await fetch('/api/templates/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, clientId }),
      })
      if (!res.ok) throw new Error('Failed to deploy template')
      return res.json()
    },
    onSuccess: (data) => {
      toast({
        title: 'Template déployé',
        description: `"${data.templateName}" a été déployé vers ${data.clientName}.`,
      })
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de déployer le template.',
        variant: 'destructive',
      })
    },
  })

  const displayTemplates = useMemo(() => {
    if (!templates) return []
    let filtered = templates

    if (activeCategory !== 'All') {
      filtered = filtered.filter((t) => t.category === activeCategory)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          (t.category ?? '').toLowerCase().includes(q)
      )
    }

    return filtered
  }, [templates, activeCategory, searchQuery])

  const handleDeployClick = (template: DashboardTemplate) => {
    setDeployTemplate(template)
    setDeployOpen(true)
  }

  const handleDeploy = (template: DashboardTemplate, clientId: string) => {
    deployMutation.mutate({ templateId: template.id, clientId })
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        title="Templates"
        description={`${templates?.length ?? 0} templates disponibles`}
        actions={
          <Button className="bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="mr-2 size-4" />
            Créer un Template
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-36" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayTemplates.length === 0 ? (
        <EmptyState
          icon={<LayoutDashboard className="size-8" />}
          title="Aucun template trouvé"
          description="Aucun template ne correspond à vos critères de recherche"
          action={
            searchQuery || activeCategory !== 'All'
              ? {
                  label: 'Réinitialiser les filtres',
                  onClick: () => {
                    setSearchQuery('')
                    setActiveCategory('All')
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {displayTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDeploy={handleDeployClick}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Deploy Dialog */}
      <DeployDialog
        template={deployTemplate}
        open={deployOpen}
        onOpenChange={setDeployOpen}
        onDeploy={handleDeploy}
      />
    </motion.div>
  )
}
