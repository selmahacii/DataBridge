'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import {
  Plus,
  Save,
  Eye,
  Trash2,
  Settings,
  GripVertical,
  Gauge,
  BarChart3,
  PieChart as PieChartIcon,
  AreaChart,
  Table,
  Type as TypeIcon,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { widgetTypes, type WidgetType, type WidgetTypeConfig } from '@/lib/config/widget-types'
import { cn } from '@/lib/utils'


interface CanvasWidget {
  id: string
  type: WidgetType
  title: string
  subtitle: string
  colSpan: number
  rowSpan: number
  dataSource: string
  xField: string
  yField: string
  aggregation: string
  color: string
  height: number
}

const widgetIconMap: Record<string, React.ReactNode> = {
  Gauge: <Gauge className="size-4" />,
  LineChart: <AreaChart className="size-4" />,
  BarChart3: <BarChart3 className="size-4" />,
  PieChart: <PieChartIcon className="size-4" />,
  AreaChart: <AreaChart className="size-4" />,
  Table: <Table className="size-4" />,
  Type: <TypeIcon className="size-4" />,
}

const widgetTypeConfig: Record<WidgetType, { color: string; icon: React.ReactNode }> = {
  kpi_card: { color: 'bg-teal-100 text-teal-700 border-teal-200', icon: <Gauge className="size-4" /> },
  line_chart: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <AreaChart className="size-4" /> },
  bar_chart: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <BarChart3 className="size-4" /> },
  pie_chart: { color: 'bg-rose-100 text-rose-700 border-rose-200', icon: <PieChartIcon className="size-4" /> },
  area_chart: { color: 'bg-violet-100 text-violet-700 border-violet-200', icon: <AreaChart className="size-4" /> },
  data_table: { color: 'bg-sky-100 text-sky-700 border-sky-200', icon: <Table className="size-4" /> },
  text_block: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <TypeIcon className="size-4" /> },
}

const sampleDataSources = [
  'Ventes quotidiennes',
  'Clients actifs',
  'Revenus mensuels',
  'Trafic web',
  'Stock inventaire',
  'Commandes',
]

const sampleXFields = ['Date', 'Mois', 'Catégorie', 'Région', 'Produit']
const sampleYFields = ['Montant', 'Quantité', 'Visiteurs', 'Conversions', 'CA']
const aggregations = ['Somme', 'Moyenne', 'Compter', 'Min', 'Max']

const defaultColors = [
  '#0d9488',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
]


function CanvasWidgetCard({
  widget,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  widget: CanvasWidget
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const config = widgetTypeConfig[widget.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'group relative cursor-pointer rounded-lg border-2 transition-all overflow-hidden',
        isSelected ? 'border-teal-500 shadow-lg ring-2 ring-teal-500/20' : 'border-border hover:border-muted-foreground/30'
      )}
      onClick={onSelect}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('flex size-6 items-center justify-center rounded-md border', config.color)}>
            {config.icon}
          </div>
          <span className="text-xs font-medium truncate">{widget.title || widget.type.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate()
                }}
              >
                <Copy className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Dupliquer</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-red-500 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Supprimer</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Widget Preview */}
      <div
        className="flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60"
        style={{ height: `${widget.height}px` }}
      >
        {widget.type === 'kpi_card' ? (
          <div className="text-center p-4">
            <p className="text-2xl font-bold text-foreground">12,345</p>
            <p className="text-xs text-muted-foreground mt-1">{widget.title || 'KPI'}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-xs text-emerald-600 font-medium">+12.5%</span>
            </div>
          </div>
        ) : widget.type === 'text_block' ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground italic">
              {widget.title || 'Bloc de texte'}
            </p>
            {widget.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{widget.subtitle}</p>
            )}
          </div>
        ) : widget.type === 'data_table' ? (
          <div className="w-full p-3 space-y-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : widget.type === 'pie_chart' ? (
          <div className="flex items-center justify-center">
            <div className="size-24 rounded-full border-4 border-dashed" style={{ borderColor: widget.color || '#0d9488' }}>
              <div className="w-full h-full rounded-full flex items-center justify-center bg-muted/50">
                <span className="text-xs text-muted-foreground">100%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full p-3">
            <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={widget.color || '#0d9488'} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={widget.color || '#0d9488'} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`M 10 60 Q 50 10 100 30 T 190 20 L 190 80 L 10 80 Z`}
                fill={`url(#grad-${widget.id})`}
              />
              <path
                d={`M 10 60 Q 50 10 100 30 T 190 20`}
                fill="none"
                stroke={widget.color || '#0d9488'}
                strokeWidth="2"
              />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  )
}


function WidgetConfigPanel({
  widget,
  onUpdate,
}: {
  widget: CanvasWidget | null
  onUpdate: (key: keyof CanvasWidget, value: unknown) => void
}) {
  if (!widget) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Settings className="size-7 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Configuration du widget</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Cliquez sur un widget du canevas pour le configurer
        </p>
      </div>
    )
  }

  const config = widgetTypeConfig[widget.type]

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        <div className="flex items-center gap-2">
          <div className={cn('flex size-8 items-center justify-center rounded-md border', config.color)}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold capitalize">
              {widget.type.replace('_', ' ')}
            </h3>
            <Badge variant="outline" className={cn('text-xs mt-0.5', config.color)}>
              Widget
            </Badge>
          </div>
        </div>

        <Separator />

        {/* General */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Général
          </h4>
          <div className="space-y-1.5">
            <Label className="text-xs">Titre</Label>
            <Input
              value={widget.title}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="h-8 text-sm"
              placeholder="Titre du widget"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sous-titre</Label>
            <Input
              value={widget.subtitle}
              onChange={(e) => onUpdate('subtitle', e.target.value)}
              className="h-8 text-sm"
              placeholder="Description optionnelle"
            />
          </div>
        </div>

        <Separator />

        {/* Data */}
        {widget.type !== 'text_block' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Données
            </h4>
            <div className="space-y-1.5">
              <Label className="text-xs">Source de données</Label>
              <Select value={widget.dataSource} onValueChange={(v) => onUpdate('dataSource', v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {sampleDataSources.map((ds) => (
                    <SelectItem key={ds} value={ds}>
                      {ds}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {widget.type !== 'kpi_card' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Axe X</Label>
                    <Select value={widget.xField} onValueChange={(v) => onUpdate('xField', v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Champ" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleXFields.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Axe Y</Label>
                    <Select value={widget.yField} onValueChange={(v) => onUpdate('yField', v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Champ" />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleYFields.map((f) => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Agrégation</Label>
                  <Select value={widget.aggregation} onValueChange={(v) => onUpdate('aggregation', v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {aggregations.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}

        <Separator />

        {/* Visual */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Apparence
          </h4>
          <div className="space-y-1.5">
            <Label className="text-xs">Couleur</Label>
            <div className="flex items-center gap-2">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdate('color', color)}
                  className={cn(
                    'size-7 rounded-md border-2 transition-all',
                    widget.color === color
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hauteur ({widget.height}px)</Label>
            <Input
              type="range"
              min={120}
              max={400}
              step={20}
              value={widget.height}
              onChange={(e) => onUpdate('height', Number(e.target.value))}
              className="h-2"
            />
          </div>
        </div>

        <Separator />

        {/* Layout */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Disposition
          </h4>
          <div className="space-y-1.5">
            <Label className="text-xs">Largeur (colonnes)</Label>
            <div className="flex gap-1.5">
              {[2, 3, 4, 6, 8, 12].map((cols) => (
                <button
                  key={cols}
                  onClick={() => onUpdate('colSpan', cols)}
                  className={cn(
                    'size-8 rounded-md text-xs font-medium transition-all border',
                    widget.colSpan === cols
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-muted text-muted-foreground border-transparent hover:border-foreground/20'
                  )}
                >
                  {cols}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}


export function AgencyDashboardBuilder() {
  const { toast } = useToast()
  const [widgets, setWidgets] = useState<CanvasWidget[]>([])
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [dashboardName, setDashboardName] = useState('Nouveau Dashboard')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const selectedWidget = useMemo(
    () => widgets.find((w) => w.id === selectedWidgetId) ?? null,
    [widgets, selectedWidgetId]
  )

  const handleAddWidget = (typeConfig: WidgetTypeConfig) => {
    const newWidget: CanvasWidget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: typeConfig.type,
      title: typeConfig.name,
      subtitle: '',
      colSpan: typeConfig.defaultWidth,
      rowSpan: typeConfig.defaultHeight,
      dataSource: '',
      xField: '',
      yField: '',
      aggregation: 'Somme',
      color: defaultColors[Math.floor(Math.random() * defaultColors.length)],
      height: 180,
    }
    setWidgets((prev) => [...prev, newWidget])
    setSelectedWidgetId(newWidget.id)
    toast({
      title: 'Widget ajouté',
      description: `"${typeConfig.name}" a été ajouté au dashboard.`,
    })
  }

  const handleUpdateWidget = useCallback(
    (key: keyof CanvasWidget, value: unknown) => {
      if (!selectedWidgetId) return
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === selectedWidgetId ? { ...w, [key]: value } : w
        )
      )
    },
    [selectedWidgetId]
  )

  const handleDeleteWidget = useCallback(
    (id: string) => {
      setWidgets((prev) => prev.filter((w) => w.id !== id))
      if (selectedWidgetId === id) setSelectedWidgetId(null)
      toast({
        title: 'Widget supprimé',
        description: 'Le widget a été retiré du dashboard.',
      })
    },
    [selectedWidgetId, toast]
  )

  const handleDuplicateWidget = useCallback(
    (id: string) => {
      const source = widgets.find((w) => w.id === id)
      if (!source) return
      const copy: CanvasWidget = {
        ...source,
        id: `widget_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: `${source.title} (copie)`,
      }
      setWidgets((prev) => [...prev, copy])
      setSelectedWidgetId(copy.id)
    },
    [widgets]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      setWidgets((prev) => {
        const oldIndex = prev.findIndex((w) => w.id === active.id)
        const newIndex = prev.findIndex((w) => w.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const handleSave = () => {
    toast({
      title: 'Dashboard sauvegardé',
      description: `"${dashboardName}" a été sauvegardé avec ${widgets.length} widgets.`,
    })
  }

  return (
    <motion.div
      className="flex flex-col h-[calc(100vh-4rem)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 border-b bg-card px-4 py-2.5">
        <Input
          value={dashboardName}
          onChange={(e) => setDashboardName(e.target.value)}
          className="max-w-xs font-semibold border-transparent hover:border-input focus:border-input h-8"
        />

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Auto-refresh</Label>
          <Switch
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
            className="data-[state=checked]:bg-teal-600"
          />
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => setIsPreview(!isPreview)}
        >
          <Eye className="mr-1.5 size-3.5" />
          {isPreview ? 'Éditer' : 'Aperçu'}
        </Button>
        <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave}>
          <Save className="mr-1.5 size-3.5" />
          Sauvegarder
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Widget Palette */}
        {!isPreview && (
          <div className="w-56 border-r bg-muted/30 flex flex-col">
            <div className="px-3 py-2.5 border-b">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Widgets
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {widgetTypes.map((type) => {
                  const config = widgetTypeConfig[type.type]
                  return (
                    <button
                      key={type.type}
                      onClick={() => handleAddWidget(type)}
                      className="flex items-center gap-2.5 w-full rounded-md px-2 py-2 text-xs hover:bg-accent transition-colors text-left group"
                    >
                      <div className={cn('flex size-7 items-center justify-center rounded-md border flex-shrink-0', config.color)}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{type.name}</p>
                        <p className="text-muted-foreground truncate">{type.description}</p>
                      </div>
                      <Plus className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Center Panel: Dashboard Canvas */}
        <div className="flex-1 overflow-auto bg-muted/20">
          {widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <BarChart3 className="size-9 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Dashboard vide</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Ajoutez des widgets depuis le panneau de gauche pour construire votre dashboard personnalisé.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => handleAddWidget(widgetTypes[0])}
              >
                <Plus className="mr-2 size-4" />
                Ajouter le premier widget
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e: DragStartEvent) => setActiveDragId(e.active.id as string)}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-12 gap-4 p-6 max-w-6xl mx-auto">
                <AnimatePresence>
                  {widgets.map((widget) => (
                    <motion.div
                      key={widget.id}
                      layout
                      className={cn(
                        'col-span-12',
                        widget.colSpan <= 4 && 'sm:col-span-6',
                        widget.colSpan > 4 && 'sm:col-span-12',
                        widget.colSpan >= 6 && 'md:col-span-8',
                        widget.colSpan <= 6 && widget.colSpan > 4 && 'md:col-span-6',
                        widget.colSpan <= 4 && 'md:col-span-4',
                        widget.colSpan <= 3 && 'lg:col-span-3',
                        widget.colSpan > 3 && widget.colSpan <= 4 && 'lg:col-span-4',
                      )}
                      style={{
                        gridColumn: `span min(${widget.colSpan}, 12)`,
                      }}
                    >
                      <CanvasWidgetCard
                        widget={widget}
                        isSelected={selectedWidgetId === widget.id}
                        onSelect={() => setSelectedWidgetId(widget.id)}
                        onDelete={() => handleDeleteWidget(widget.id)}
                        onDuplicate={() => handleDuplicateWidget(widget.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <DragOverlay>
                {activeDragId ? (
                  <div className="rounded-lg border-2 border-teal-500 bg-card shadow-xl p-4 opacity-90">
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {widgets.find((w) => w.id === activeDragId)?.title ?? 'Widget'}
                      </span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        {/* Right Panel: Widget Config */}
        {!isPreview && (
          <div className="w-72 border-l bg-card">
            <div className="px-3 py-2.5 border-b">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Configuration
              </h3>
            </div>
            <div className="h-[calc(100%-2.5rem)]">
              <WidgetConfigPanel
                widget={selectedWidget}
                onUpdate={handleUpdateWidget}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
