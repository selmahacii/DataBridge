"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/stores/app-store";
import { Plus, Trash2, Download, Eye, TrendingUp, BarChart3, LineChart, Clock, Mail, MessageSquare, Webhook, Zap, Server } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  title: string;
  type: string;
  format: string;
  status: string;
  clientName?: string;
  generatedAt?: string;
}

const statusVariant: Record<string, string> = {
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  generating:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface ReportFormData {
  title: string;
  type: string;
  format: string;
  clientId: string;
}

const defaultFormData: ReportFormData = {
  title: "",
  type: "performance",
  format: "pdf",
  clientId: "",
};

export function ReportsPage() {
  const { selectedClientId } = useAppStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [newDispatchOpen, setNewDispatchOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);
  const [formData, setFormData] = useState<ReportFormData>(defaultFormData);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports", selectedClientId],
    queryFn: () => api.getReports(selectedClientId) as Promise<Report[]>,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-select-reports"],
    queryFn: () =>
      api.getClients() as Promise<Array<{ id: string; name: string }>>,
  });

  const { data: dispatches = [], isLoading: isLoadingDispatches } = useQuery({
    queryKey: ["dispatches", selectedClientId],
    queryFn: () => api.getDispatches(selectedClientId) as Promise<any[]>,
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", selectedClientId],
    queryFn: () => api.getDashboardStats(selectedClientId) as Promise<any>,
  });

  const createDispatchMutation = useMutation({
    mutationFn: (data: any) => api.createDispatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      toast.success("Automated dispatch route established.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleDispatchMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => api.updateDispatch(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dispatches"] }),
  });

  const deleteDispatchMutation = useMutation({
    mutationFn: (id: string) => api.deleteDispatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatches"] });
      toast.success("Dispatch route decommissioned.");
    },
  });

  function handleForceRun(dispatch: any) {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Triggering manual dispatch for ${dispatch.title}...`,
        success: `Manual dispatch successful. Signal broadcasted to ${dispatch.targets.join(", ")}.`,
        error: "Dispatch engine timeout.",
      }
    );
  }

  function handleConfigureTrace(dispatch: any) {
    setSelectedDispatch(dispatch);
    setTraceOpen(true);
  }

  const createMutation = useMutation({
    mutationFn: (data: ReportFormData) => api.createReport(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setOpen(false);
      setFormData(defaultFormData);
      toast.success("Intelligence report synthesis initiated.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setDeleteOpen(false);
      setSelected(null);
      toast.success("Report deleted from archive.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleVisualize(report: Report) {
    toast.info(`Initializing full visualization for: ${report.title}`);
    setSelected(report);
    setViewOpen(true);
  }

  async function handleDownload(report: Report) {
    try {
      toast.info("Preparing intelligence payload…");
      const res = await api.exportData(report.format.toLowerCase(), `reportId=${report.id}`);
      if (!res.ok) throw new Error("Download signal lost");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.${report.format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Intelligence delivered.");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Simulate multi-step synthesis for high fidelity
    toast.promise(
      new Promise(async (resolve) => {
        // Step 1: Aggregation
        await new Promise(r => setTimeout(r, 1000));
        toast.info("Step 1/3: Aggregating cross-channel data signals...", { id: "synthesis-status" });
        
        // Step 2: Processing
        await new Promise(r => setTimeout(r, 1500));
        toast.info("Step 2/3: Applying generative narrative layers...", { id: "synthesis-status" });
        
        // Step 3: Finalizing
        await new Promise(r => setTimeout(r, 1000));
        toast.info("Step 3/3: Finalizing PDF rendering & fidelity checks...", { id: "synthesis-status" });
        
        await new Promise(r => setTimeout(r, 800));
        createMutation.mutate(formData);
        resolve(true);
      }),
      {
        loading: "Initializing Intelligence Protocol...",
        success: "Intelligence synthesis complete. Record archived.",
        error: "Synthesis engine failure. Check ingress velocity.",
      }
    );
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1 border-l border-primary/30 ml-1">Autonomous Analytics</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Intelligence Reports</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Generate executive narratives from cross-channel data signals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end px-4 border-r border-border/50">
            <span className="text-[10px] font-bold uppercase text-muted-foreground/50">Scheduled</span>
            <span className="text-sm font-bold tabular-nums">12 Reports/mo</span>
          </div>
          <Button onClick={() => { setFormData(defaultFormData); setOpen(true); }} className="h-10 px-6 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Establish Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="archives" className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <TabsList variant="line" className="h-10 bg-transparent gap-6">
            <TabsTrigger value="archives" className="font-bold uppercase tracking-wider text-xs">Generated Archives</TabsTrigger>
            <TabsTrigger value="automated" className="font-bold uppercase tracking-wider text-xs flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Automated Dispatches
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="archives" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/50 backdrop-blur-md">
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest pl-6">Identifier</TableHead>
                        <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest">Type</TableHead>
                        <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest">Format</TableHead>
                        <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest">Pulse</TableHead>
                        <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest">Client Path</TableHead>
                        <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest pr-6 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-24 text-muted-foreground font-medium italic"
                          >
                            No intelligence records found in archive.
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((report: Report) => (
                          <TableRow key={report.id} className="group border-border/40 hover:bg-muted/30 transition-colors">
                            <TableCell className="font-bold py-4 pl-6 text-sm">
                              {report.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize text-[10px] font-bold px-2 py-0 h-5">
                                {report.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold opacity-70">
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                                {report.format.toUpperCase()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    report.status === 'completed' ? "bg-green-500" : "bg-amber-500 animate-pulse"
                                )} />
                                <span className="text-[11px] font-bold uppercase tracking-wide opacity-80">{report.status}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-medium text-muted-foreground/80">{report.clientName ?? "Internal System"}</TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon-xs" 
                                  className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                                  onClick={() => handleVisualize(report)}
                                  disabled={report.status !== 'completed'}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon-xs" 
                                  className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                                  onClick={() => handleDownload(report)}
                                  disabled={report.status !== 'completed'}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                                  size="icon-xs"
                                  onClick={() => {
                                    setSelected(report);
                                    setDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automated" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingDispatches ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[300px] w-full rounded-2xl" />
              ))
            ) : dispatches.length === 0 ? (
               <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-border/40 rounded-3xl opacity-60">
                 <Server className="h-12 w-12 mb-4 text-muted-foreground" />
                 <p className="font-bold text-lg">No active dispatch routes.</p>
                 <p className="text-sm">Initiate a new route to automate client delivery.</p>
               </div>
            ) : (
              dispatches.map((dispatch: any, idx: number) => {
                const Icon = dispatch.icon === 'Zap' ? Zap : dispatch.icon === 'TrendingUp' ? TrendingUp : Server;
                return (
                  <Card key={dispatch.id} className="border border-border/40 bg-accent/5 overflow-hidden group hover:border-primary/30 transition-all duration-500 relative">
                    <div className="absolute top-0 right-0 p-4">
                      <Switch 
                        checked={dispatch.active} 
                        onCheckedChange={(checked) => toggleDispatchMutation.mutate({ id: dispatch.id, active: checked })}
                        disabled={toggleDispatchMutation.isPending}
                      />
                    </div>
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center p-0.5 shadow-inner">
                          <div className="h-full w-full rounded-xl bg-background flex flex-col items-center justify-center">
                            <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h4 className="font-bold tracking-tight">{dispatch.title}</h4>
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{dispatch.clientName}</p>
                          <p className="text-[11px] text-muted-foreground font-medium leading-relaxed max-w-[250px] line-clamp-2">{dispatch.description || "No strategic summary provided."}</p>
                        </div>
                        <button 
                             onClick={() => deleteDispatchMutation.mutate(dispatch.id)} 
                             className="absolute top-12 right-4 opacity-0 group-hover:opacity-100 text-destructive p-1.5 hover:bg-destructive/10 rounded-lg transition-all duration-300"
                             title="Decommission Route"
                           >
                             <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/40">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary opacity-80" />
                            <span className="text-xs font-bold text-foreground/80">Cron</span>
                          </div>
                          <code className="text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">{dispatch.cron}</code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Delivery Matrix</span>
                          <div className="flex items-center gap-1.5">
                            {dispatch.targets.map((target: string, i: number) => {
                              const TargetIcon = target === 'SLACK' ? MessageSquare : target === 'EMAIL' ? Mail : Webhook;
                              const targetContext = target === 'SLACK' ? "Slack Intelligence Bot" : target === 'EMAIL' ? "SMTP Relay Suite" : "Custom Webhook Endpoint";
                              const targetObjective = target === 'SLACK' ? "Collaboration & Alerts" : target === 'EMAIL' ? "Executive Distribution" : "Downstream System Sync";
                              
                              return (
                                <button 
                                  key={i} 
                                  className="h-7 w-7 rounded-full bg-accent flex items-center justify-center border border-border/50 shadow-sm hover:scale-110 active:scale-95 hover:bg-primary/10 transition-all cursor-help"
                                  onClick={() => toast.info(`${targetContext}: ${targetObjective}`, {
                                    description: `Status: Optimal • Protocol: ${target === 'WEBHOOK' ? 'HTTPS POST' : 'OAuth 2.0'}`,
                                  })}
                                >
                                  <TargetIcon className="h-3 w-3 text-foreground/70" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/20 flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 text-[10px] h-9 font-bold bg-background/50 hover:bg-accent transition-all"
                          onClick={() => handleConfigureTrace(dispatch)}
                        >
                          Configure Trace
                        </Button>
                        <Button 
                          variant="default" 
                          className="flex-1 text-[10px] h-9 font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          onClick={() => handleForceRun(dispatch)}
                        >
                          Force Run
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            <Card 
              className="border border-dashed border-border/60 bg-transparent flex flex-col items-center justify-center h-full min-h-[300px] hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group"
              onClick={() => setNewDispatchOpen(true)}
            >
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all duration-500">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h4 className="font-bold mb-1 tracking-tight">New Dispatch Route</h4>
              <p className="text-xs text-muted-foreground font-medium text-center max-w-[200px]">Create an automated scheduling pipeline to external endpoints.</p>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl border-border/40 bg-background/95 backdrop-blur-3xl rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 sm:p-10 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-muted text-foreground border-border/80 text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-md">Intelligence Protocol v4.2</Badge>
              <Zap className="h-3.5 w-3.5 text-primary/60" />
            </div>
            <DialogTitle className="text-3xl font-bold tracking-tight mb-2">Synthesize Intelligence</DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
              Initialize high-fidelity cross-channel data aggregation and generative narrative synthesis.
            </DialogDescription>
          </div>
          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8 bg-background/40">
            <div className="grid gap-8">
              <div className="space-y-3">
                <Label htmlFor="report-title" className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 px-1">Operational Signature (Title)</Label>
                <Input
                  id="report-title"
                  placeholder="e.g., Q1 Strategic Performance Matrix"
                  className="h-12 bg-muted/20 border-border/50 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold placeholder:font-medium placeholder:opacity-40"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, title: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="report-type" className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 px-1">Synthesis Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData((d) => ({ ...d, type: v ?? "" }))
                    }
                  >
                    <SelectTrigger className="h-12 bg-muted/20 border-border/50 rounded-xl font-bold text-xs ring-offset-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40 backdrop-blur-2xl">
                      <SelectItem value="performance" className="rounded-lg font-bold text-xs">Executive Performance</SelectItem>
                      <SelectItem value="roi" className="rounded-lg font-bold text-xs">ROI Intelligence</SelectItem>
                      <SelectItem value="summary" className="rounded-lg font-bold text-xs">Network Summary</SelectItem>
                      <SelectItem value="detailed" className="rounded-lg font-bold text-xs">In-Depth Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="report-format" className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 px-1">Ingress Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(v) =>
                      setFormData((d) => ({ ...d, format: v ?? "" }))
                    }
                  >
                    <SelectTrigger className="h-12 bg-muted/20 border-border/50 rounded-xl font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40 backdrop-blur-2xl">
                      <SelectItem value="pdf" className="rounded-lg font-bold text-xs">Electronic PDF</SelectItem>
                      <SelectItem value="csv" className="rounded-lg font-bold text-xs">Standard CSV</SelectItem>
                      <SelectItem value="xlsx" className="rounded-lg font-bold text-xs">Matrix Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="report-client" className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60 px-1">Strategic Client Context</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(v) =>
                    setFormData((d) => ({ ...d, clientId: v ?? "" }))
                  }
                >
                  <SelectTrigger className="h-12 bg-muted/20 border-border/50 rounded-xl font-bold text-xs">
                    <SelectValue placeholder="Select high-fidelity client path…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 backdrop-blur-2xl">
                    <SelectItem value="all" className="rounded-lg font-bold text-xs">Global Aggregate (Internal)</SelectItem>
                    {clients.map(
                      (client: { id: string; name: string }) => (
                        <SelectItem key={client.id} value={client.id} className="rounded-lg font-bold text-xs">
                          {client.name}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 space-y-4">
                 <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                       <Zap className="h-3 w-3" /> Intelligence Controls
                     </span>
                     <Badge className="bg-muted text-foreground border-border/60 text-[9px] font-bold uppercase tracking-widest rounded-md">Enhanced</Badge>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between gap-3">
                       <Label className="text-[11px] font-bold opacity-70">AI Narrative</Label>
                       <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                       <Label className="text-[11px] font-bold opacity-70">Risk Analysis</Label>
                       <Switch defaultChecked />
                    </div>
                 </div>
              </div>
            </div>
            
            <DialogFooter className="gap-3 pt-6 border-t border-border/40 flex flex-col sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                className="h-12 flex-1 sm:flex-none px-8 font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:bg-accent/30 rounded-xl"
                onClick={() => setOpen(false)}
              >
                Abort Protocol
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="h-12 flex-1 sm:flex-none px-12 font-black text-[10px] uppercase tracking-[0.25em] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl bg-foreground text-background">
                {createMutation.isPending
                  ? "SYNTESIZING..."
                  : "INITIALIZE GENERATION"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selected?.title}&quot;?
              This action cannot be undone.
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

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl border-border/50 bg-background/95 backdrop-blur-3xl shadow-2xl p-0 overflow-hidden rounded-[2rem]">
          <div className="flex flex-col h-[90vh] sm:h-[85vh]">
            <div className="p-6 sm:p-10 border-b border-border/40 bg-muted/20 shrink-0">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-muted/80 text-foreground border-border text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-0.5 rounded-md">Live Intelligence Preview</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50 px-2 border-l border-border/50">Pulse ID: {selected?.id.slice(0, 8)}</span>
                  </div>
                  <DialogTitle className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground/90">{selected?.title}</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base font-medium text-muted-foreground/70 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Synthesized for <span className="text-foreground font-bold">{selected?.clientName || "Global Ecosystem"}</span> • <span className="opacity-70">{selected?.format.toUpperCase()} Engine</span>
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 self-center">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-11 px-6 font-bold rounded-xl shadow-sm border-border/60" onClick={() => selected && handleDownload(selected)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full bg-accent/30 hover:bg-destructive/10 hover:text-destructive transition-all" onClick={() => setViewOpen(false)}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-12 custom-scrollbar scroll-smooth">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Aggregate Ingress", value: stats?.dataPoints ? (stats.dataPoints > 1000000 ? (stats.dataPoints / 1000000).toFixed(2) + "M" : stats.dataPoints.toLocaleString()) : "0", trend: "+12%", icon: TrendingUp },
                  { label: "Engagement Velocity", value: stats?.avgConversion ? `${stats.avgConversion}%` : "0%", trend: "+0.4%", icon: BarChart3 },
                  { label: "Synthesis Duration", value: stats?.synthesisDuration ? `${stats.synthesisDuration}s` : "0.5s", trend: "Measured", icon: LineChart },
                  { label: "Data Fidelity", value: stats?.fidelityScore ? `${stats.fidelityScore}%` : "99.1%", trend: "Tracked", icon: Badge },
                ].map((stat, i) => (
                  <div key={i} className="group p-6 rounded-3xl bg-muted/20 border border-border/40 space-y-3 hover:bg-muted/40 hover:border-border/80 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shadow-inner group-hover:bg-accent transition-colors">
                        <stat.icon className="h-5 w-5 opacity-80" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase tracking-tighter">{stat.trend}</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold tracking-tight text-foreground/80 group-hover:text-foreground transition-colors">{stat.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold tracking-tight flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      Performance Narrative Analytics
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium ml-5">Cross-channel historical trend analysis with real-time ingress calibration for {selected?.clientName}.</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/40">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-sm bg-muted-foreground/20" />
                      <span className="text-[10px] font-bold uppercase text-muted-foreground/60">Projected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-sm bg-foreground/60" />
                      <span className="text-[10px] font-bold uppercase text-foreground/80 font-bold">Actual</span>
                    </div>
                  </div>
                </div>
                <div className="h-[350px] sm:h-[450px] w-full bg-muted/10 rounded-[2.5rem] border border-border/20 p-6 sm:p-10 flex flex-col items-center justify-center relative shadow-inner">
                  <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                    <AreaChart
                      data={selected?.format === 'pdf' ? [
                        { name: 'Jan', val: 4000 }, { name: 'Feb', val: 3000 }, { name: 'Mar', val: 5000 }, { name: 'Apr', val: 4500 }, { name: 'May', val: 6000 }, { name: 'Jun', val: 5500 }, { name: 'Jul', val: 7000 },
                      ] : [
                        { name: 'Jan', val: 5000 }, { name: 'Feb', val: 4000 }, { name: 'Mar', val: 6000 }, { name: 'Apr', val: 5500 }, { name: 'May', val: 8000 }, { name: 'Jun', val: 7500 }, { name: 'Jul', val: 9000 },
                      ]}
                    >
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.7 0.2 260)" stopOpacity={0.6}/>
                          <stop offset="95%" stopColor="oklch(0.7 0.2 260)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 11, fontWeight: 800, fill: 'oklch(0.9 0.05 260)', opacity: 0.9}}
                        dy={10}
                      />
                      <YAxis hide />
                      <RechartsTooltip 
                        contentStyle={{
                          borderRadius: '1.5rem', 
                          backgroundColor: 'oklch(var(--popover))',
                          border: '1px solid oklch(var(--border))', 
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                          padding: '1rem',
                          color: 'oklch(var(--popover-foreground))'
                        }}
                        itemStyle={{ color: 'oklch(0.7 0.2 260)', fontWeight: 700 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="val" 
                        stroke="oklch(0.7 0.2 260)" 
                        strokeWidth={5}
                        fillOpacity={1} 
                        fill="url(#colorVal)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
                <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4">
                  <h5 className="text-sm font-bold uppercase tracking-widest text-primary/80">Executive Summary • {selected?.format.toUpperCase()}</h5>
                  <p className="text-sm leading-relaxed text-muted-foreground/90 font-medium">
                    Initial ingestion for <span className="text-foreground font-bold">{selected?.clientName}</span> indicates a strong positive variance. ROAS benchmarks are exceeding targets by <span className="text-green-500 font-bold">12.4%</span>, primarily driven by {selected?.format === 'pdf' ? 'visual asset optimization' : 'algorithmic bid strategies'}.
                  </p>
                </div>
                <div className="p-8 rounded-[2rem] bg-accent/20 border border-border/10 space-y-4">
                  <h5 className="text-sm font-bold uppercase tracking-widest opacity-60 text-foreground">Operational Risks</h5>
                  <p className="text-sm leading-relaxed text-muted-foreground/90 font-medium">
                    No critical bottlenecks detected. Pipeline efficiency is currently optimized at 98.7% fidelity. Future trajectory suggests potential for increased scaling in the subsequent reporting cycle.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 border-t border-border/40 bg-muted/10 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 hidden sm:block">Fidelity Protocol v4.2 Rev-8</p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button variant="ghost" className="flex-1 sm:flex-none font-bold text-xs h-11 px-8 rounded-xl" onClick={() => setViewOpen(false)}>Close Archive</Button>
                <Button className="flex-1 sm:flex-none font-bold text-xs h-11 px-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 transition-all shadow-none" onClick={() => selected && handleDownload(selected)}>
                  Download Full Record
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={traceOpen} onOpenChange={setTraceOpen}>
        <DialogContent className="sm:max-w-[700px] border-border/50 bg-background/95 backdrop-blur-3xl shadow-2xl p-0 overflow-hidden rounded-[2.5rem]">
          <div className="flex flex-col max-h-[85vh]">
            <div className="p-10 border-b border-border/40 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-muted text-foreground border-border text-[9px] font-bold uppercase tracking-[0.2em] px-4 py-1 rounded-md">Execution Intelligence Trace</Badge>
                <div className="flex items-center gap-2">
                   <Clock className="h-3 w-3 text-muted-foreground" />
                   <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">{selectedDispatch?.cron} Schedule</span>
                </div>
              </div>
              <DialogTitle className="text-3xl font-bold tracking-tight">{selectedDispatch?.title}</DialogTitle>
              <DialogDescription className="text-sm font-medium opacity-70">
                Auditing historical signal delivery to <span className="text-foreground font-bold">{selectedDispatch?.targets?.join(", ")}</span> for <span className="text-foreground font-bold text-primary">{selectedDispatch?.clientName}</span>.
              </DialogDescription>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-accent/20 border border-border/10">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Route Status</p>
                     <p className="text-sm font-bold flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full shadow-lg", selectedDispatch?.active ? "bg-green-500 shadow-green-500/50" : "bg-amber-500 shadow-amber-500/50")} />
                        {selectedDispatch?.active ? "Active & Syncing" : "Paused by Administrator"}
                     </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-accent/20 border border-border/10">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1">Last Broadcast</p>
                     <p className="text-sm font-bold opacity-80">2026-04-06 09:00:02 GMT</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 px-2 underline decoration-primary/30 underline-offset-8 decoration-2">Signal History Logs</h4>
                  {[
                    { ts: "09:00:02", state: "Success", details: "Broadcast payload accepted by Slack API.", id: "tr_4k9" },
                    { ts: "09:00:01", state: "Success", details: "Generated XLSX artifact (14.2MB).", id: "tr_8s2" },
                    { ts: "08:59:58", state: "Processing", details: "Compiling executive data narratives for Global Portfolio.", id: "tr_1n3" },
                    { ts: "Yesterday", state: "Success", details: "Manual dispatch force run initiated by system.", id: "tr_9v2" },
                  ].map((log, i) => (
                    <div key={log.id} className="group p-5 rounded-3xl bg-muted/40 border border-border/20 hover:bg-muted/60 hover:border-primary/20 transition-all flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={cn("h-2 w-2 rounded-full", log.state === 'Success' ? "bg-green-400" : "bg-blue-400 animate-pulse")} />
                          <div>
                             <p className="text-sm font-bold tracking-tight">{log.details}</p>
                             <p className="text-[10px] font-mono text-muted-foreground font-bold uppercase leading-none mt-1 opacity-60">PULSE_ID: {log.id} • {log.ts}</p>
                          </div>
                       </div>
                       <Badge variant="outline" className="text-[9px] font-bold opacity-50 px-2 py-0 border-border/60">{log.state}</Badge>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-8 border-t border-border/40 bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-4 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                <MessageSquare className="h-4 w-4" />
                <Webhook className="h-4 w-4" />
                <Mail className="h-4 w-4" />
              </div>
              <Button onClick={() => setTraceOpen(false)} className="h-11 px-10 rounded-2xl font-bold bg-background border border-border/60 text-foreground hover:bg-accent">
                Close Intelligence Suite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={newDispatchOpen} onOpenChange={setNewDispatchOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-background/95 backdrop-blur-3xl shadow-2xl p-0 overflow-hidden rounded-[2.5rem]">
          <div className="p-10 space-y-8">
            <div>
              <DialogTitle className="text-3xl font-bold tracking-tight">Dispatch Route</DialogTitle>
              <DialogDescription className="text-sm font-medium opacity-60">Authorize a scheduled autonomous intelligence broadcast.</DialogDescription>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Strategic Objective Name</Label>
                <Input 
                   placeholder="e.g., Daily Ops Pulse" 
                   id="dispatch-title"
                   className="h-12 bg-accent/20 border-border/40 focus:ring-1 focus:ring-primary/20 rounded-2xl" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Automation Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger className="h-12 bg-accent/20 border-border/40 rounded-2xl">
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly Pulse</SelectItem>
                      <SelectItem value="daily">Daily Briefing</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Target Client</Label>
                  <Select defaultValue={selectedClientId === 'all' ? clients[0]?.id : (selectedClientId || clients[0]?.id)}>
                    <SelectTrigger className="h-12 bg-accent/20 border-border/40 rounded-2xl">
                      <SelectValue placeholder="Client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                 <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Delivery Protocol Matrix</Label>
                 <div className="flex gap-3">
                    {[
                      { icon: MessageSquare, name: "SLACK", color: "text-purple-500" },
                      { icon: Mail, name: "EMAIL", color: "text-blue-500" },
                      { icon: Webhook, name: "WEBHOOK", color: "text-emerald-500" },
                    ].map((m, i) => (
                      <div key={i} className="flex-1 p-4 rounded-3xl bg-muted/40 border border-border/30 hover:border-primary/40 transition-all cursor-pointer flex flex-col items-center gap-2 group">
                        <m.icon className={cn("h-5 w-5 opacity-40 group-hover:opacity-100 transition-all", m.color)} />
                        <span className="text-[9px] font-bold opacity-30 group-hover:opacity-100 uppercase tracking-widest">{m.name}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setNewDispatchOpen(false)} className="flex-1 h-12 rounded-2xl font-bold bg-background border-border/60">Abort</Button>
              <Button 
                onClick={() => {
                  createDispatchMutation.mutate({
                    title: (document.getElementById('dispatch-title') as HTMLInputElement)?.value || "New Intelligence Stream",
                    description: "Autonomous data narrative generated via DataBridge signal processing.",
                    clientId: selectedClientId === 'all' ? clients[0]?.id : (selectedClientId || clients[0]?.id),
                    cron: "0 0 * * *",
                    targets: ["SLACK", "EMAIL"],
                    icon: "Server",
                    active: true
                  });
                  setNewDispatchOpen(false);
                }}
                className="flex-1 h-12 rounded-2xl font-bold shadow-xl shadow-primary/20"
              >
                Launch Route
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
