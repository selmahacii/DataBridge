'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Play,
  Save,
  Trash2,
  Copy,
  GripVertical,
  Settings,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  Clock,
  Zap,
  FileSpreadsheet,
  Sheet,
  Table,
  Globe,
  Database,
  Filter,
  Eraser,
  Scissors,
  Type,
  PenLine,
  Columns3,
  GitMerge,
  Split,
  Calculator,
  Link,
  Layers,
  RotateCcw,
  ArrowUpDown,
  ListFilter,
  Download,
  LayoutDashboard,
  Webhook,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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
import { useToast } from '@/hooks/use-toast'
import {
  usePipelineStore,
  AVAILABLE_STEPS,
  type TransformationStep,
  type AvailableStep,
  type PipelineStepCategory,
} from '@/stores/pipeline-store'
import { cn } from '@/lib/utils'


const iconMap: Record<string, React.ReactNode> = {
  FileSpreadsheet: <FileSpreadsheet className="size-4" />,
  Sheet: <Sheet className="size-4" />,
  Table: <Table className="size-4" />,
  Globe: <Globe className="size-4" />,
  Database: <Database className="size-4" />,
  CopyX: <Eraser className="size-4" />,
  Filter: <Filter className="size-4" />,
  Eraser: <Eraser className="size-4" />,
  Scissors: <Scissors className="size-4" />,
  Type: <Type className="size-4" />,
  PenLine: <PenLine className="size-4" />,
  Columns3: <Columns3 className="size-4" />,
  GitMerge: <GitMerge className="size-4" />,
  Split: <Split className="size-4" />,
  Calculator: <Calculator className="size-4" />,
  Link: <Link className="size-4" />,
  Layers: <Layers className="size-4" />,
  RotateCcw: <RotateCcw className="size-4" />,
  ArrowUpDown: <ArrowUpDown className="size-4" />,
  ListFilter: <ListFilter className="size-4" />,
  Download: <Download className="size-4" />,
  LayoutDashboard: <LayoutDashboard className="size-4" />,
  Webhook: <Webhook className="size-4" />,
  Mail: <Mail className="size-4" />,
}

const categoryColors: Record<PipelineStepCategory, string> = {
  source: 'bg-teal-100 text-teal-700 border-teal-200',
  cleaning: 'bg-amber-100 text-amber-700 border-amber-200',
  transform: 'bg-violet-100 text-violet-700 border-violet-200',
  aggregate: 'bg-rose-100 text-rose-700 border-rose-200',
  output: 'bg-sky-100 text-sky-700 border-sky-200',
}

const categoryLabels: Record<PipelineStepCategory, string> = {
  source: 'Source',
  cleaning: 'Nettoyage',
  transform: 'Transformation',
  aggregate: 'Agrégation',
  output: 'Sortie',
}


function SortableStepCard({
  step,
  index,
  isSelected,
  onSelect,
}: {
  step: TransformationStep
  index: number
  isSelected: boolean
  onSelect: () => void
}) {
  const store = usePipelineStore()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'group relative rounded-lg border-2 bg-card p-3 transition-all',
          isDragging && 'opacity-50 shadow-xl z-50',
          isSelected
            ? 'border-teal-500 shadow-md'
            : 'border-border hover:border-muted-foreground/30',
          !step.enabled && 'opacity-60'
        )}
      >
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>

          {/* Step Number */}
          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            {index + 1}
          </span>

          {/* Icon */}
          <div className={cn('flex size-8 items-center justify-center rounded-md border', categoryColors[step.category])}>
            {iconMap[step.icon] ?? <Settings className="size-4" />}
          </div>

          {/* Name & Category */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{step.name}</p>
            <p className="text-xs text-muted-foreground">{categoryLabels[step.category]}</p>
          </div>

          {/* Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={step.enabled}
                  onCheckedChange={() => store.toggleStep(index)}
                  className="data-[state=checked]:bg-teal-600"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>{step.enabled ? 'Désactiver' : 'Activer'}</TooltipContent>
          </Tooltip>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => store.duplicateStep(index)}
                >
                  <Copy className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dupliquer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => store.removeStep(index)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Supprimer</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Click area for selection */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={onSelect}
        />
      </motion.div>
    </div>
  )
}


function StepConfigPanel({
  step,
  index,
}: {
  step: TransformationStep | null
  index: number
}) {
  const store = usePipelineStore()

  if (!step) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-4">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Settings className="size-7 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Configuration de l'étape</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Cliquez sur une étape du pipeline pour la configurer
        </p>
      </div>
    )
  }

  const availableStep = AVAILABLE_STEPS.find((s) => s.type === step.type)

  const configFields = Object.entries(step.config)

  const handleConfigChange = (key: string, value: unknown) => {
    store.updateStep(index, {
      config: { ...step.config, [key]: value },
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={cn('flex size-8 items-center justify-center rounded-md border', categoryColors[step.category])}>
              {iconMap[step.icon] ?? <Settings className="size-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold">{step.name}</h3>
              <Badge variant="outline" className={cn('text-xs mt-0.5', categoryColors[step.category])}>
                {categoryLabels[step.category]}
              </Badge>
            </div>
          </div>
          {availableStep?.description && (
            <p className="text-xs text-muted-foreground">{availableStep.description}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Configuration
          </h4>

          {configFields.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune configuration requise pour cette étape.</p>
          ) : (
            configFields.map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                {typeof value === 'boolean' ? (
                  <Switch
                    checked={value}
                    onCheckedChange={(v) => handleConfigChange(key, v)}
                    className="data-[state=checked]:bg-teal-600"
                  />
                ) : typeof value === 'number' ? (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => handleConfigChange(key, Number(e.target.value))}
                    className="h-8 text-sm"
                  />
                ) : typeof value === 'string' ? (
                  <Input
                    value={value}
                    onChange={(e) => handleConfigChange(key, e.target.value)}
                    className="h-8 text-sm"
                    placeholder={key}
                  />
                ) : (
                  <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-32">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Actions rapides
          </h4>
          <div className="flex flex-col gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="justify-start text-xs"
              onClick={() => store.duplicateStep(index)}
            >
              <Copy className="mr-2 size-3.5" />
              Dupliquer cette étape
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => store.removeStep(index)}
            >
              <Trash2 className="mr-2 size-3.5" />
              Supprimer cette étape
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}


export function AgencyPipelineBuilder() {
  const store = usePipelineStore()
  const { toast } = useToast()

  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const steps = store.currentPipeline?.steps ?? []
  const selectedStep = selectedStepIndex !== null ? steps[selectedStepIndex] ?? null : null

  const stepsByCategory = useMemo(() => {
    const grouped: Record<string, AvailableStep[]> = {}
    AVAILABLE_STEPS.forEach((step) => {
      if (!grouped[step.category]) grouped[step.category] = []
      grouped[step.category].push(step)
    })
    return grouped
  }, [])

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id)
      const newIndex = steps.findIndex((s) => s.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        store.moveStep(oldIndex, newIndex)
      }
    }
  }

  const handleAddStep = (available: AvailableStep) => {
    const newStep: TransformationStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: available.type,
      name: available.name,
      icon: available.icon,
      enabled: true,
      config: { ...available.defaultConfig },
      category: available.category,
    }
    store.addStep(newStep)
    setSelectedStepIndex(steps.length)
    toast({
      title: 'Étape ajoutée',
      description: `"${available.name}" a été ajoutée au pipeline.`,
    })
  }

  const handleSave = () => {
    toast({
      title: 'Pipeline sauvegardé',
      description: `"${store.currentPipeline?.name ?? 'Pipeline'}" a été sauvegardé.`,
    })
    store.markClean()
  }

  const handleRun = async () => {
    await store.runPipeline()
    toast({
      title: 'Pipeline exécuté',
      description: `Le pipeline s'est terminé avec succès. ${store.currentPipeline?.outputRowCount ?? 0} lignes traitées.`,
    })
  }

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Initialize pipeline if null
  if (!store.currentPipeline) {
    store.createNewPipeline('Nouveau Pipeline', 'Pipeline en construction')
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
          value={store.currentPipeline?.name ?? ''}
          onChange={(e) => store.setName(e.target.value)}
          className="max-w-xs font-semibold border-transparent hover:border-input focus:border-input h-8"
        />

        <div className="flex-1" />

        {/* Schedule */}
        <Select
          value={store.currentPipeline?.scheduleType ?? 'manual'}
          onValueChange={(v) =>
            store.updateStep && store.currentPipeline &&
            usePipelineStore.setState((s) => ({
              currentPipeline: s.currentPipeline
                ? { ...s.currentPipeline, scheduleType: v as 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly' }
                : null,
              isDirty: true,
            }))
          }
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <Clock className="mr-1.5 size-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manuel</SelectItem>
            <SelectItem value="hourly">Chaque heure</SelectItem>
            <SelectItem value="daily">Quotidien</SelectItem>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuel</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

        {/* Run Progress */}
        {store.isRunning && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-teal-500"
                initial={{ width: '0%' }}
                animate={{ width: `${store.runProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{store.runProgress}%</span>
          </div>
        )}

        {/* Action Buttons */}
        <Button variant="outline" size="sm" className="h-8" onClick={handleSave}>
          <Save className="mr-1.5 size-3.5" />
          Sauvegarder
        </Button>
        <Button
          size="sm"
          className="h-8 bg-teal-600 hover:bg-teal-700 text-white"
          onClick={handleRun}
          disabled={store.isRunning || steps.length === 0}
        >
          {store.isRunning ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Exécution...
            </>
          ) : (
            <>
              <Play className="mr-1.5 size-3.5" />
              Exécuter
            </>
          )}
        </Button>

        {/* Last Run Status */}
        {store.currentPipeline?.lastRunStatus && (
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              store.currentPipeline.lastRunStatus === 'success'
                ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                : 'border-red-300 text-red-700 bg-red-50'
            )}
          >
            {store.currentPipeline.lastRunStatus === 'success' ? (
              <Check className="mr-1 size-3" />
            ) : (
              <AlertCircle className="mr-1 size-3" />
            )}
            {store.currentPipeline.lastRunStatus === 'success' ? 'Succès' : 'Erreur'}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Available Steps */}
        <div className="w-64 border-r bg-muted/30 flex flex-col">
          <div className="px-3 py-2.5 border-b">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Étapes disponibles
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {Object.entries(stepsByCategory).map(([category, steps]) => (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                  >
                    {collapsedCategories.has(category) ? (
                      <ChevronRight className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                    {categoryLabels[category as PipelineStepCategory]}
                    <Badge variant="outline" className="ml-auto text-xs font-normal h-5 px-1.5">
                      {steps.length}
                    </Badge>
                  </button>
                  {!collapsedCategories.has(category) && (
                    <div className="space-y-1 ml-1">
                      {steps.map((step) => (
                        <button
                          key={step.type}
                          onClick={() => handleAddStep(step)}
                          className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs hover:bg-accent transition-colors text-left group"
                        >
                          <div className={cn('flex size-6 items-center justify-center rounded border', categoryColors[step.category as PipelineStepCategory])}>
                            <span className="scale-75">
                              {iconMap[step.icon] ?? <Settings className="size-3" />}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{step.name}</p>
                          </div>
                          <Plus className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel: Pipeline Canvas */}
        <div className="flex-1 overflow-auto bg-background">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <GitMerge className="size-9 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Pipeline vide</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Ajoutez des étapes depuis le panneau de gauche pour construire votre pipeline de données.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  handleAddStep(AVAILABLE_STEPS[0])
                }}
              >
                <Plus className="mr-2 size-4" />
                Ajouter la première étape
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e: DragStartEvent) => setActiveDragId(e.active.id as string)}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={steps.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="max-w-2xl mx-auto py-6 px-4 space-y-2">
                  {/* Start Node */}
                  <div className="flex items-center justify-center mb-2">
                    <div className="flex items-center gap-2 rounded-full bg-teal-100 px-4 py-1.5 text-teal-700">
                      <Zap className="size-3.5" />
                      <span className="text-xs font-semibold">Début</span>
                    </div>
                  </div>

                  <AnimatePresence>
                    {steps.map((step, index) => (
                      <div key={step.id} className="relative">
                        {/* Connector Line */}
                        {index > 0 && (
                          <div className="absolute left-1/2 -top-2 w-px h-2 bg-border" />
                        )}
                        <SortableStepCard
                          step={step}
                          index={index}
                          isSelected={selectedStepIndex === index}
                          onSelect={() => setSelectedStepIndex(index)}
                        />
                      </div>
                    ))}
                  </AnimatePresence>

                  {/* End Node */}
                  <div className="flex items-center justify-center mt-2">
                    <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-muted-foreground">
                      <div className="size-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold">Fin</span>
                    </div>
                  </div>

                  {/* Step Count Badge */}
                  <div className="text-center mt-4">
                    <p className="text-xs text-muted-foreground">
                      {steps.length} étape{steps.length > 1 ? 's' : ''} · {steps.filter((s) => s.enabled).length} activée{steps.filter((s) => s.enabled).length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </SortableContext>

              <DragOverlay>
                {activeDragId ? (
                  <div className="rounded-lg border-2 border-teal-500 bg-card p-3 shadow-xl opacity-90">
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {steps.find((s) => s.id === activeDragId)?.name ?? 'Étape'}
                      </span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        {/* Right Panel: Step Config */}
        <div className="w-72 border-l bg-card">
          <div className="px-3 py-2.5 border-b">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Configuration
            </h3>
          </div>
          <div className="h-[calc(100%-2.5rem)]">
            <StepConfigPanel
              step={selectedStep}
              index={selectedStepIndex ?? -1}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
