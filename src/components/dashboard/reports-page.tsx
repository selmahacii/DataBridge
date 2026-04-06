"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/stores/app-store";
import { Plus, Trash2, Download, Eye, TrendingUp, BarChart3, LineChart } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
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
    createMutation.mutate(formData);
  }

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">Autonomous Analytics</span>
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
          <Button onClick={() => { setFormData(defaultFormData); setOpen(true); }} className="h-10 px-6 shadow-md hover:shadow-lg transition-all">
            <Plus className="mr-2 h-4 w-4" />
            Establish Report
          </Button>
        </div>
      </div>

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
                                "h-2 w-2 rounded-full",
                                report.status === 'completed' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-amber-500 animate-pulse"
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] border-border/50 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Synthesize Intelligence</DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Initialize cross-channel data aggregation and narrative generation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="report-title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Operational Title</Label>
                <Input
                  id="report-title"
                  placeholder="e.g., Q1 Strategic Performance"
                  className="h-11 bg-accent/30 border-border/40 focus:ring-1 focus:ring-primary/20"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, title: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Narrative Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData((d) => ({ ...d, type: v ?? "" }))
                    }
                  >
                    <SelectTrigger className="h-11 bg-accent/30 border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Executive Performance</SelectItem>
                      <SelectItem value="roi">ROI Intelligence</SelectItem>
                      <SelectItem value="summary">Network Summary</SelectItem>
                      <SelectItem value="detailed">In-Depth Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-format" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Ingress Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(v) =>
                      setFormData((d) => ({ ...d, format: v ?? "" }))
                    }
                  >
                    <SelectTrigger className="h-11 bg-accent/30 border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">Electronic PDF</SelectItem>
                      <SelectItem value="csv">Standard CSV</SelectItem>
                      <SelectItem value="xlsx">Matrix Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="report-client" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Strategic Client Context</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(v) =>
                    setFormData((d) => ({ ...d, clientId: v ?? "" }))
                  }
                >
                  <SelectTrigger className="h-11 bg-accent/30 border-border/40">
                    <SelectValue placeholder="Select high-fidelity client path…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Global Aggregate (Internal)</SelectItem>
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
            </div>
            
            <DialogFooter className="gap-3 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                className="h-11 px-6 font-bold"
                onClick={() => setOpen(false)}
              >
                Abort
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="h-11 px-8 font-bold shadow-md shadow-primary/20">
                {createMutation.isPending
                  ? "Synthesizing Pulse..."
                  : "Initialize Generation"}
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
        <DialogContent className="max-w-4xl border-border/50 bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
          <div className="flex flex-col h-[80vh]">
            <div className="p-8 border-b border-border/40 bg-muted/20">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest">Live Intelligence Preview</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">ID: {selected?.id.slice(0, 8)}</span>
                  </div>
                  <DialogTitle className="text-3xl font-bold tracking-tight">{selected?.title}</DialogTitle>
                  <DialogDescription className="text-base font-medium text-muted-foreground/80">
                    Generated Intelligence for {selected?.clientName || "Global Ecosystem"} • {selected?.format.toUpperCase()} Format
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-9 font-bold" onClick={() => selected && handleDownload(selected)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setViewOpen(false)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Aggregate Ingress", value: "2.4M", trend: "+12%", icon: TrendingUp },
                  { label: "Engagement Velocity", value: "6.8%", trend: "+0.4%", icon: BarChart3 },
                  { label: "Synthesis Duration", value: "1.2s", trend: "Optimized", icon: LineChart },
                  { label: "Data Fidelity", value: "99.9%", trend: "High", icon: Badge },
                ].map((stat, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-accent/30 border border-border/20 space-y-1 hover:bg-accent/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <stat.icon className="h-3.5 w-3.5 text-primary opacity-70" />
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-tight">{stat.trend}</span>
                    </div>
                    <p className="text-xl font-bold tracking-tight">{stat.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold tracking-tight flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Performance Narrative Visualization
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium">Historical trend analysis derived from cross-channel signals.</p>
                  </div>
                </div>
                <div className="h-[300px] w-full bg-accent/20 rounded-3xl border border-border/20 p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { name: 'Jan', val: 4000 },
                        { name: 'Feb', val: 3000 },
                        { name: 'Mar', val: 5000 },
                        { name: 'Apr', val: 4500 },
                        { name: 'May', val: 6000 },
                        { name: 'Jun', val: 5500 },
                      ]}
                    >
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 700, fill: 'oklch(var(--muted-foreground))'}}
                      />
                      <YAxis hide />
                      <RechartsTooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="val" 
                        stroke="oklch(var(--primary))" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorVal)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border/40 bg-muted/10 flex justify-end gap-3">
              <Button variant="ghost" className="font-bold text-xs" onClick={() => setViewOpen(false)}>Close View</Button>
              <Button className="font-bold text-xs px-6" onClick={() => selected && handleDownload(selected)}>Export Document</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
