"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/stores/app-store";
import { Plus, Pencil, Trash2, Activity, ServerCog } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  status: string;
  frequency: string;
  clientName?: string;
  stepsCount: number;
  createdAt: string;
}

const statusVariant: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface PipelineFormData {
  name: string;
  description: string;
  frequency: string;
  clientId: string;
}

const defaultFormData: PipelineFormData = {
  name: "",
  description: "",
  frequency: "daily",
  clientId: "",
};

export function PipelinesPage() {
  const { selectedClientId } = useAppStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Pipeline | null>(null);
  const [formData, setFormData] = useState<PipelineFormData>(defaultFormData);

  const { data: pipelines = [], isLoading } = useQuery({
    queryKey: ["pipelines", selectedClientId],
    queryFn: () => api.getPipelines(selectedClientId) as Promise<Pipeline[]>,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-select-pipelines"],
    queryFn: () =>
      api.getClients() as Promise<Array<{ id: string; name: string }>>,
  });

  const createMutation = useMutation({
    mutationFn: (data: PipelineFormData) => api.createPipeline(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      setOpen(false);
      setFormData(defaultFormData);
      toast.success("Pipeline created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PipelineFormData }) => 
      api.updatePipeline(id, data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      setOpen(false);
      setSelected(null);
      toast.success("Pipeline updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePipeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      setDeleteOpen(false);
      setSelected(null);
      toast.success("Pipeline removed from orchestration");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleOpenCreate() {
    setFormData(defaultFormData);
    setSelected(null);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected) {
      updateMutation.mutate({ id: selected.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1 border-l border-blue-500/30 ml-1">Worker Nodes: Online</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">ETL Pipelines</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Design and monitor high-performance automated data processing workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end px-4 border-r border-border/50">
            <span className="text-[10px] font-bold uppercase text-muted-foreground/50">Load Average</span>
            <span className="text-sm font-bold tabular-nums">0.12ms</span>
          </div>
          <Button onClick={handleOpenCreate} className="h-10 px-6 shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-4 w-4" />
            New Pipeline
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pipelines.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground py-8">
              No pipelines found. Create your first pipeline to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((pipeline: Pipeline) => (
            <Card key={pipeline.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{pipeline.name}</CardTitle>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      statusVariant[pipeline.status] ?? statusVariant.draft
                    )}
                  >
                    {pipeline.status}
                  </span>
                </div>
                {pipeline.description && (
                  <CardDescription className="line-clamp-2">
                    {pipeline.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Frequency: {pipeline.frequency}</span>
                  <span>Steps: {pipeline.stepsCount}</span>
                </div>
                {pipeline.clientName && (
                  <p className="text-sm mb-4">
                    Client: <span className="font-medium text-foreground">{pipeline.clientName}</span>
                  </p>
                )}

                <div className="flex items-center gap-4 mb-4 p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Worker Node</span>
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <ServerCog className="h-3.5 w-3.5 text-blue-500" />
                      BullMQ (Redis)
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Queue</span>
                    <div className="flex items-center gap-1.5 text-xs text-foreground">
                      <Activity className={cn("h-3.5 w-3.5", pipeline.status === "active" ? "text-green-500 animate-pulse" : "text-muted-foreground")} />
                      {pipeline.status === "active" ? "Listening" : "Idle"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 justify-end">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      setSelected(pipeline);
                      setFormData({
                        name: pipeline.name,
                        description: pipeline.description ?? "",
                        frequency: pipeline.frequency,
                        clientId: pipeline.id || "",
                      });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      setSelected(pipeline);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl border-border/40 bg-background/95 backdrop-blur-3xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">
              {selected ? "Configure ETL Pipeline" : "Architect New Pipeline"}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              {selected
                ? "Calibrate worker nodes and data flow parameters."
                : "Design a high-performance orchestration workflow."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pipeline-name" className="text-[10px] font-black uppercase tracking-widest opacity-50">Pipeline Signature</Label>
                    <Input
                      id="pipeline-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, name: e.target.value }))
                      }
                      placeholder="e.g. GA4 to ClickHouse Production"
                      className="h-11 rounded-xl bg-muted/20 border-border/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pipeline-desc" className="text-[10px] font-black uppercase tracking-widest opacity-50">Operational Intent</Label>
                    <Textarea
                      id="pipeline-desc"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, description: e.target.value }))
                      }
                      placeholder="Describe the data transformation logic..."
                      className="h-24 rounded-xl bg-muted/20 border-border/50 resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pipeline-client" className="text-[10px] font-black uppercase tracking-widest opacity-50">Client Context</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(v) =>
                        setFormData((d) => ({ ...d, clientId: v as string }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50">
                        <SelectValue placeholder="Global Context" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(
                          (client: { id: string; name: string }) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pipeline-freq" className="text-[10px] font-black uppercase tracking-widest opacity-50">Execution Cadence</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(v) =>
                        setFormData((d) => ({ ...d, frequency: v as string }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly (Incremental)</SelectItem>
                        <SelectItem value="daily">Daily (Full Batch)</SelectItem>
                        <SelectItem value="real-time">Real-time Stream</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

               <div className="p-6 rounded-2xl border border-border/40 bg-muted/20 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-muted-foreground">
                      <ServerCog className="h-4 w-4" />
                      <span className="text-xs font-bold tracking-tight">Step Logic & Orchestration</span>
                   </div>
                   <Badge className="bg-muted text-foreground border-border/60 text-[9px] font-bold uppercase tracking-widest rounded-md">Multi-stage</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                   <div className="p-3 rounded-xl bg-background/50 border border-border/40 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-muted-foreground/60 uppercase">SOURCE</span>
                      <span className="text-[11px] font-bold">Raw Ingress</span>
                   </div>
                   <div className="p-3 rounded-xl bg-background/50 border border-border/40 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-muted-foreground/60 uppercase">TRANSFORM</span>
                      <span className="text-[11px] font-bold">Flink SQL</span>
                   </div>
                   <div className="p-3 rounded-xl bg-background/50 border border-border/40 flex flex-col gap-1">
                      <span className="text-[9px] font-black text-muted-foreground/60 uppercase">SINK</span>
                      <span className="text-[11px] font-bold">ClickHouse</span>
                   </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-10 rounded-xl border-dashed border-primary/30 text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5"
                  onClick={() => toast.info("Opening Edge Designer (Vercel-style Drag & Drop logic editor)...")}
                >
                  <Plus className="h-3 w-3 mr-2" /> ADD TRANSFORMATION LAYER
                </Button>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                className="font-bold text-xs"
                onClick={() => setOpen(false)}
              >
                DISCARD
              </Button>
               <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="px-8 h-11 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-foreground text-background shadow-none"
              >
                {createMutation.isPending
                  ? "SAVING..."
                  : selected
                  ? "UPDATE ORCHESTRATION"
                  : "DEPLOY PIPELINE"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selected?.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selected && deleteMutation.mutate(selected.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
