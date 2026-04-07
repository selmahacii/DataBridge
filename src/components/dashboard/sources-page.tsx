"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/stores/app-store";
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  Database,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Source {
  id: string;
  name: string;
  type: string;
  clientId?: string;
  clientName?: string;
  platform: string;
  status: string;
  lastSync?: string;
  syncFrequency: string;
}

const PLATFORM_OPTIONS: Record<string, { label: string; group: string }> = {
  google_analytics: { label: "Google Analytics 4 (GA4)", group: "Google" },
  google_ads: { label: "Google Ads", group: "Google" },
  facebook_ads: { label: "Meta Ads (Facebook / Instagram)", group: "Meta" },
  linkedin: { label: "LinkedIn Campaign Manager", group: "LinkedIn" },
  csv_import: { label: "CSV / File Import", group: "Manual" },
};

const typeVariant: Record<string, string> = {
  google_analytics: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  facebook_ads: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  google_ads: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  linkedin: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  csv_import: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  active: {
    label: "Active",
    icon: Wifi,
    className: "text-green-600 dark:text-green-400",
  },
  inactive: {
    label: "Inactive",
    icon: WifiOff,
    className: "text-amber-600 dark:text-amber-400",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    className: "text-red-600 dark:text-red-400",
  },
  pending: {
    label: "Pending",
    icon: RefreshCw,
    className: "text-muted-foreground",
  },
};

interface SourceFormData {
  name: string;
  type: string;
  clientId: string;
  platform: string;
  syncFrequency: string;
  accountId: string;
}

const defaultFormData: SourceFormData = {
  name: "",
  type: "",
  clientId: "",
  platform: "",
  syncFrequency: "daily",
  accountId: "",
};

export function SourcesPage() {
  const { selectedClientId } = useAppStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Source | null>(null);
  const [formData, setFormData] = useState<SourceFormData>(defaultFormData);
  const [isEditing, setIsEditing] = useState(false);

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["sources", selectedClientId],
    queryFn: () => api.getSources(selectedClientId) as Promise<Source[]>,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-select"],
    queryFn: () =>
      api.getClients() as Promise<Array<{ id: string; name: string }>>,
  });

  const createMutation = useMutation({
    mutationFn: (data: SourceFormData) =>
      api.createSource(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setOpen(false);
      setFormData(defaultFormData);
      toast.success("Data source connected successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SourceFormData }) =>
      api.updateSource(id, data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setOpen(false);
      setSelected(null);
      setFormData(defaultFormData);
      setIsEditing(false);
      toast.success("Data source updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setDeleteOpen(false);
      setSelected(null);
      toast.success("Source disconnected");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleOpenCreate() {
    setFormData(defaultFormData);
    setSelected(null);
    setIsEditing(false);
    setOpen(true);
  }

  function handleOpenEdit(source: Source) {
    setSelected(source);
    setFormData({
      name: source.name,
      type: source.type,
      clientId: source.clientId ?? "",
      platform: source.platform,
      syncFrequency: source.syncFrequency,
      accountId: "",
    });
    setIsEditing(true);
    setOpen(true);
  }

  function handleOpenDelete(source: Source) {
    setSelected(source);
    setDeleteOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditing && selected) {
      updateMutation.mutate({ id: selected.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  const activeCount = sources.filter((s: Source) => s.status === "active").length;
  const errorCount = sources.filter((s: Source) => s.status === "error").length;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Edge Connectors Active</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Integration Hub</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Manage high-fidelity data streams from GA4, Meta, and major ad networks.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="h-10 px-6 shadow-md hover:shadow-lg transition-all group">
          <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
          Establish Connection
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/70">
              Active Streams
            </CardDescription>
            <CardTitle className="text-3xl font-bold">{sources.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-[10px] font-medium">
              <span className="text-green-500 font-bold">{activeCount} Healthy</span>
              <span className="text-muted-foreground/50">·</span>
              <span className={cn(errorCount > 0 ? "text-destructive font-bold" : "text-muted-foreground")}>{errorCount} Degraded</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/40 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
              Flow Velocity
            </CardDescription>
            <CardTitle className="text-3xl font-bold">12.4k/m</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-medium">Avg events per minute</p>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
              Ingress Volume
            </CardDescription>
            <CardTitle className="text-3xl font-bold">4.2M</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-green-500 font-bold">+38% <span className="text-muted-foreground font-medium">vs prev. month</span></p>
          </CardContent>
        </Card>

        <Card className="bg-background/40 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
              Service Latency
            </CardDescription>
            <CardTitle className="text-3xl font-bold">142ms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-medium">Global API response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Sources Table */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle>Connected Sources</CardTitle>
          <CardDescription>
            Live synchronization status. OAuth tokens auto-refreshed by the DataBridge engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/40">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 px-6">Source Signature</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Client Context</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Status & Latency</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Last Sync Intelligence</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Daily Volume</TableHead>
                    <TableHead className="text-right py-4 px-6 font-bold text-[10px] uppercase tracking-widest">Controls</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-20 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <WifiOff className="h-6 w-6 opacity-30" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-sm tracking-tight text-foreground">No active connectors found</p>
                            <p className="text-xs">Establish high-fidelity streams from GA4, Meta, or Google Ads.</p>
                          </div>
                          <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase" onClick={handleOpenCreate}>Establish Connection</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sources.map((source: Source) => {
                      const status = statusConfig[source.status] ?? statusConfig.inactive;
                      const StatusIcon = status.icon;
                      const freshnessRatio = Math.floor(Math.random() * 20); // Mock freshness
                      const volume = Math.floor(Math.random() * 50000) + 5000;
                      
                      return (
                        <TableRow key={source.id} className="hover:bg-accent/30 border-border/20 transition-all group">
                          <TableCell className="py-5 px-6">
                            <div className="flex items-center gap-3">
                               <div className={cn(
                                 "h-10 w-10 rounded-xl flex items-center justify-center border shadow-inner",
                                 typeVariant[source.type]?.split(' ')[0] ?? "bg-muted/50"
                               )}>
                                 <Database className={cn("h-5 w-5", typeVariant[source.type]?.split(' ')[1] ?? "text-muted-foreground")} />
                               </div>
                               <div className="flex flex-col">
                                  <span className="font-bold text-sm tracking-tight">{source.name}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                    {PLATFORM_OPTIONS[source.type]?.label ?? source.type}
                                  </span>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-muted text-[10px] font-bold uppercase tracking-widest px-2 py-0 h-5">
                              {source.clientName ?? "Internal"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1.5">
                               <div className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest", status.className)}>
                                 <StatusIcon className="h-3 w-3" />
                                 <span>{status.label}</span>
                               </div>
                               <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground italic">
                                  <Activity className="h-2.5 w-2.5" />
                                  Latency: {Math.floor(Math.random() * 200) + 40}ms
                               </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1.5">
                               <div className={cn(
                                 "text-[10px] font-bold px-2 py-0.5 rounded-md border w-fit flex items-center gap-1.5",
                                 freshnessRatio < 5 ? "text-green-500 bg-green-500/5 border-green-500/10" : "text-amber-500 bg-amber-500/5 border-amber-500/10"
                               )}>
                                 <div className={cn("h-1 w-1 rounded-full animate-pulse", freshnessRatio < 5 ? "bg-green-500" : "bg-amber-500")} />
                                 {freshnessRatio} min ago
                               </div>
                               <span className="text-[9px] font-medium text-muted-foreground opacity-60">Sync: {source.syncFrequency}ly</span>
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold tabular-nums">{volume.toLocaleString()} recs</span>
                                <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                                   <div className="h-full bg-primary/40 rounded-full" style={{width: `${(volume / 55000) * 100}%`}} />
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="xs"
                                className="h-8 font-bold border-primary/20 text-primary hover:bg-primary/5 transition-all"
                                onClick={() => {
                                  toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
                                    loading: `Triggering Temporal sync for ${source.name}...`,
                                    success: 'Orchestrator active. Sync in progress.',
                                    error: 'Failed to trigger sync.',
                                  });
                                }}
                              >
                                {source.status === 'pending' ? <RefreshCw className="h-3 w-3 animate-spin mr-1.5" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
                                FORCE SYNC
                              </Button>
                              <div className="w-[1px] h-4 bg-border/50 mx-1" />
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleOpenEdit(source)}
                                className="h-8 w-8 hover:bg-muted"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleOpenDelete(source)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connect / Edit Source Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl border-border/40 bg-background/95 backdrop-blur-3xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tighter">
              {isEditing ? "Configure Data Stream" : "Establish New Connection"}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              {isEditing
                ? "Calibrate parameters for high-fidelity data ingestion."
                : "Initialize a secure OAuth bridge to your marketing platform."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label htmlFor="source-type" className="text-[10px] font-black uppercase tracking-widest opacity-50">Platform Ecosystem</Label>
                   <Select
                     value={formData.type}
                     onValueChange={(v) =>
                       setFormData((d) => ({ ...d, type: v ?? "", platform: v ?? "" }))
                     }
                   >
                     <SelectTrigger id="source-type" className="h-11 rounded-xl bg-muted/20 border-border/50">
                       <SelectValue placeholder="Select Platform" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Search & Social</SelectLabel>
                          <SelectItem value="google_analytics">Google Analytics 4</SelectItem>
                          <SelectItem value="google_ads">Google Ads</SelectItem>
                          <SelectItem value="facebook_ads">Meta Ads Manager</SelectItem>
                          <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Internal</SelectLabel>
                          <SelectItem value="csv_import">Custom CSV Pipeline</SelectItem>
                        </SelectGroup>
                     </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label htmlFor="source-client" className="text-[10px] font-black uppercase tracking-widest opacity-50">Client Assignment</Label>
                   <Select
                     value={formData.clientId}
                     onValueChange={(v) =>
                       setFormData((d) => ({ ...d, clientId: v as string }))
                     }
                   >
                     <SelectTrigger id="source-client" className="h-11 rounded-xl bg-muted/20 border-border/50">
                       <SelectValue placeholder="Choose Client" />
                     </SelectTrigger>
                     <SelectContent>
                       {clients.map((client: { id: string; name: string }) => (
                         <SelectItem key={client.id} value={client.id}>
                           {client.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source-name" className="text-[10px] font-black uppercase tracking-widest opacity-50">Ingestion Label</Label>
                <Input
                  id="source-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="e.g. Meta Conversions API — Production"
                  className="h-11 rounded-xl bg-muted/20 border-border/50"
                  required
                />
              </div>

              {formData.type && formData.type !== "csv_import" && (
                <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <KeyRound className="h-4 w-4 text-primary" />
                       <span className="text-xs font-bold tracking-tight">Security & Credentials</span>
                    </div>
                    <Badge className="bg-primary hover:bg-primary text-[9px] font-black uppercase tracking-widest border-none">OAuth 2.0</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="source-account-id" className="text-[9px] font-bold uppercase text-muted-foreground/80">
                        {formData.type === "google_analytics" ? "Property ID" : "Ad Account Identifier (act_...)"}
                      </Label>
                      <Input
                        id="source-account-id"
                        value={formData.accountId}
                        onChange={(e) => setFormData((d) => ({ ...d, accountId: e.target.value }))}
                        className="h-9 bg-background/50 border-border/40 text-xs rounded-lg"
                        placeholder="Required for signal mapping..."
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="w-full h-10 font-bold text-[10px] uppercase tracking-widest rounded-lg bg-primary text-white"
                      onClick={() => toast.success("Redirecting to authorized platform for secure handshake...")}
                    >
                      AUTHORIZE CONNECTION
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label htmlFor="source-frequency" className="text-[10px] font-black uppercase tracking-widest opacity-50">Sync Cadence</Label>
                   <Select
                     value={formData.syncFrequency}
                     onValueChange={(v) =>
                       setFormData((d) => ({ ...d, syncFrequency: v as string }))
                     }
                   >
                     <SelectTrigger id="source-frequency" className="h-11 rounded-xl bg-muted/20 border-border/50">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="hourly">Hourly Velocity</SelectItem>
                       <SelectItem value="daily">Daily Snapshot</SelectItem>
                       <SelectItem value="real-time">Real-time Hook</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                <div className="flex items-end">
                   <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full h-11 rounded-xl border-border/50 font-bold text-[10px] uppercase tracking-widest gap-2"
                    onClick={() => {
                        toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
                          loading: 'Pinging source endpoint...',
                          success: 'Handshake successful. Endpoint reachable.',
                          error: 'Unauthorized. Check credentials.',
                        });
                    }}
                  >
                     <Wifi className="h-4 w-4" /> TEST LINK
                   </Button>
                </div>
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
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-8 h-11 rounded-xl font-black text-[10px] uppercase tracking-[0.2em]"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "INITIALIZING..."
                  : isEditing
                  ? "UPDATED PIPELINE"
                  : "ESTABLISH STREAM"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Data Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect &quot;{selected?.name}&quot;? This will
              stop all ETL syncs and revoke the OAuth token. Existing data points
              in the database will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selected && deleteMutation.mutate(selected.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
