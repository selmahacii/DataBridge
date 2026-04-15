"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye, LayoutGrid, Activity, Target, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  industry: string;
  website?: string;
  email?: string;
  phone?: string;
  agencyId?: string;
  agencyName?: string;
  status: string;
  sourcesCount: number;
  createdAt: string;
}

const statusVariant: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  churned: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface ClientFormData {
  name: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  agencyId: string;
}

const defaultFormData: ClientFormData = {
  name: "",
  industry: "",
  website: "",
  email: "",
  phone: "",
  agencyId: "",
};

export function ClientsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(defaultFormData);
  const [isEditing, setIsEditing] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.getClients() as Promise<Client[]>,
  });

  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies-select"],
    queryFn: () =>
      api.getAgencies() as Promise<Array<{ id: string; name: string }>>,
  });

  const createMutation = useMutation({
    mutationFn: (data: ClientFormData) => api.createClient(data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setFormData(defaultFormData);
      toast.success("Client created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientFormData }) =>
      api.updateClient(id, data as unknown as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setSelected(null);
      setFormData(defaultFormData);
      setIsEditing(false);
      toast.success("Client updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDeleteOpen(false);
      setSelected(null);
      toast.success("Client deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleOpenCreate() {
    setFormData(defaultFormData);
    setSelected(null);
    setIsEditing(false);
    setOpen(true);
  }

  function handleOpenEdit(client: Client) {
    setSelected(client);
    setFormData({
      name: client.name,
      industry: client.industry,
      website: client.website ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      agencyId: client.agencyId ?? "",
    });
    setIsEditing(true);
    setOpen(true);
  }

  function handleOpenDelete(client: Client) {
    setSelected(client);
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

  const [viewOpen, setViewOpen] = useState(false);

  function handleViewDetails(client: Client) {
    setSelected(client);
    setViewOpen(true);
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Portfolio Orchestration</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight tracking-tighter">Client Registry</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Manage high-fidelity account parameters and strategic signal mappings.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="h-11 px-8 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          ESTABLISH ACCOUNT
        </Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-10 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/40">
                    <TableHead className="font-black text-[10px] uppercase tracking-widest px-10 py-5">Client Signature</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Industry & Region</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Engagement Tier</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Active Streams</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Created</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-right px-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-24 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                           <LayoutGrid className="h-10 w-10" />
                           <span className="text-xs font-bold uppercase tracking-widest">No active client signals found</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client: Client) => (
                      <TableRow key={client.id} className="hover:bg-primary/5 border-border/20 group transition-all cursor-default">
                        <TableCell className="px-10 py-6">
                           <div className="flex flex-col gap-0.5">
                              <span className="font-black text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">{client.name}</span>
                              <div className="flex items-center gap-2">
                                 <div className={cn("h-1.5 w-1.5 rounded-full", client.status === 'active' ? 'bg-green-500' : 'bg-amber-500')} />
                                 <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{client.status}</span>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold">{client.industry}</span>
                              <Badge variant="outline" className="w-fit text-[9px] font-bold uppercase px-2 h-4 border-border/80 bg-background/50 text-muted-foreground/80 rounded-md">EMEA</Badge>
                           </div>
                        </TableCell>
                        <TableCell>
                           <Badge className="bg-muted/50 text-foreground text-[9px] font-bold uppercase tracking-[0.15em] h-6 px-3 border border-border/50 rounded-lg shadow-none">Enterprise</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                           <span className="font-black text-sm tabular-nums text-primary/80">{client.sourcesCount}</span>
                        </TableCell>
                        <TableCell>
                           <span className="text-[11px] font-bold opacity-60 tabular-nums">
                              {client.createdAt ? new Date(client.createdAt).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}
                           </span>
                        </TableCell>
                        <TableCell className="text-right px-10">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-xl hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleViewDetails(client)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-xl hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleOpenEdit(client)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleOpenDelete(client)}
                              >
                                <Trash2 className="h-4 w-4" />
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

      {/* Traceability & Detailed Info View - Structured & Hierarchical */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1500px] w-full h-[92vh] border-border/40 bg-background/98 backdrop-blur-3xl p-0 overflow-hidden rounded-[3rem] shadow-2xl flex flex-col">
          {/* 1. HERO HEADER - RADIANT MACHINE IDENTITY */}
          <div className="shrink-0 z-30 sticky top-0 bg-background/95 backdrop-blur-3xl border-b-2 border-border/60 px-12 py-10">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                   <div className="h-16 w-16 rounded-[1.25rem] bg-foreground flex items-center justify-center shadow-2xl shadow-black/20 ring-4 ring-muted">
                      <Target className="h-8 w-8 text-background" />
                   </div>
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center gap-2 sm:gap-4">
                         <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full bg-primary" />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-foreground">MASTER_ACCOUNT</span>
                         </div>
                         <div className="h-3 sm:h-4 w-[1px] bg-border" />
                         <span className="text-[9px] sm:text-[11px] font-mono font-medium text-muted-foreground/60 tabular-nums lowercase tracking-tighter italic truncate max-w-[100px] sm:max-w-none">sys_id: {selected?.id?.substr(0, 16)}</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tightest text-foreground leading-none">{selected?.name}</h2>
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 sm:gap-10">
                   <div className="flex flex-col items-start sm:items-end sm:border-r-2 border-border/40 sm:pr-10">
                      <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.4em] mb-1.5">DATA_NODE_CLUSTER</span>
                      <div className="flex items-center gap-2.5">
                         <span className="text-xs sm:text-sm font-mono font-bold tracking-tight text-foreground/80 uppercase">EMEA_CENTRAL_01</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 sm:gap-6 bg-muted/20 border-2 border-border/40 rounded-[1.25rem] sm:rounded-[1.5rem] px-4 sm:px-7 py-3 sm:py-4">
                      <div className="flex flex-col items-start sm:items-end">
                         <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-muted-foreground/30">HANDSHAKE_PROTOCOL</span>
                         <span className="text-[9px] sm:text-[11px] font-mono font-black text-green-500 uppercase tracking-widest whitespace-nowrap">EXT_LIVE</span>
                      </div>
                      <div className="h-8 sm:h-10 w-8 sm:w-10 rounded-lg sm:rounded-[1rem] border-2 border-green-500/20 bg-green-500/5 flex items-center justify-center">
                         <Activity className="h-4 sm:h-5 w-4 sm:w-5 text-green-500 animate-[pulse_2s_infinite]" />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-12 space-y-16 scrollbar-thin scrollbar-thumb-primary/10 bg-muted/5">
             
             {/* 2. TELEMETRY DECK - MODULAR METRICS */}
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="h-[2px] w-12 bg-primary" />
                   <h3 className="font-black text-xs uppercase tracking-[0.3em] text-foreground/40">Operational Telemetry Deck</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                      { label: 'Ingress Volume', value: '4,242,109', sub: 'Total Records Syncing', icon: Database, color: 'text-primary' },
                      { label: 'Signal Fidelity', value: '99.85%', sub: 'Source Precision Rate', icon: Activity, color: 'text-green-500' },
                      { label: 'Active Streams', value: selected?.sourcesCount || '0', sub: 'Validated Data Nodes', icon: Eye, color: 'text-amber-500' },
                      { label: 'Growth Vector', value: '+18.4%', sub: 'Inbound Velocity Trend', icon: Target, color: 'text-primary' },
                   ].map((stat, i) => (
                      <div key={i} className="p-8 rounded-[2rem] bg-background border-2 border-border/40 shadow-xl shadow-black/5 flex flex-col gap-2 transition-all hover:border-primary/40 hover:-translate-y-1 cursor-default group">
                         <div className="flex items-center justify-between mb-2">
                            <div className={cn("h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center border border-border/60", stat.color)}>
                               <stat.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">LATEST_SNAPSHOT</span>
                         </div>
                         <p className="text-3xl font-black tracking-tighter tabular-nums leading-none">{stat.value}</p>
                         <div className="mt-2 space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">{stat.label}</span>
                            <p className="text-[10px] font-bold text-muted-foreground opacity-40 italic">{stat.sub}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                
                {/* 3. LEFT COLUMN: CONTEXT & DIAGNOSTICS */}
                <div className="lg:col-span-5 space-y-16">
                   
                   {/* Account Identification Info */}
                   <div className="space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="h-[2px] w-12 bg-primary" />
                         <h3 className="font-black text-xs uppercase tracking-[0.3em] text-foreground/40">Identity Framework</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         {[
                            { label: 'Market Vertical', value: selected?.industry, icon: LayoutGrid },
                            { label: 'Strategic Tier', value: 'Enterprise Intelligence', icon: Target },
                            { label: 'SLA Architecture', value: 'Diamond 24/7 Priority', icon: Activity },
                            { label: 'Access Cluster', value: selected?.email || 'ingress@corp.net', icon: Eye },
                         ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-background border-2 border-border/40 group hover:border-primary/30 transition-all shadow-lg shadow-black/5">
                               <div className="flex items-center gap-5">
                                  <div className="h-12 w-12 rounded-[1.25rem] bg-muted/50 border border-border/60 flex items-center justify-center shadow-inner">
                                     <item.icon className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{item.label}</span>
                                     <span className="text-md font-bold tracking-tight text-foreground/90">{item.value}</span>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   {/* AI Narrative Card */}
                   <div className="p-10 rounded-[2.5rem] bg-primary/10 border-2 border-primary/20 relative overflow-hidden group shadow-2xl shadow-primary/10">
                      <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                         <Activity className="h-40 w-40 rotate-12" />
                      </div>
                      <div className="relative z-10 space-y-6">
                         <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Predictive Quality Analysis</span>
                         </div>
                         <p className="text-lg font-bold leading-relaxed text-foreground tracking-tight italic">
                            "Statistical clustering confirms that <strong>{selected?.name}</strong> exhibits a high-fidelity ingress cycle. Current bandwidth allocation is optimal for the current epoch, with normalized source latencies."
                         </p>
                         <div className="pt-4 flex items-center gap-4">
                            <Button variant="outline" className="h-10 px-6 rounded-xl border-primary/30 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all">RE-EVALUATE CLUSTER</Button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* 4. RIGHT COLUMN: ORCHESTRATION TIMELINE */}
                <div className="lg:col-span-7 space-y-12">
                   <div className="flex items-center justify-between border-b-2 border-border/40 pb-8">
                      <div className="flex items-center gap-4">
                         <div className="h-[2px] w-12 bg-primary" />
                         <h3 className="font-black text-xs uppercase tracking-[0.3em] text-foreground/40">Operational Audit & Trace</h3>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-4 border-2 border-border/60 bg-background">EPOCH: Q2-2026-ACTIVE</Badge>
                   </div>

                   <div className="space-y-12 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[2px] before:bg-border/60">
                      {[
                         { date: 'Operational Cycle: Today', events: [
                            { action: 'Signal Recalibration', desc: 'Normalized attribution weights for GA4 multi-property global cluster', ts: '2h 14m ago', level: 'info' },
                            { action: 'API Secret Rotation', desc: 'Secure handshake successful via AWS Secret Manager for Meta Ads node', ts: '5h 30m ago', level: 'secure' }
                         ]},
                         { date: 'Execution History: Last 72 Hours', events: [
                            { action: 'Strategic Intelligence synthesis', desc: 'Auto-generated 14-page Strategic Performance Report (PDF/JSON)', ts: '1d ago', level: 'info' },
                            { action: 'Infrastructure Self-Healing', desc: 'Dynamically reallocated Flink worker memory on pod cluster B-12', ts: '2d ago', level: 'warning' },
                            { action: 'Cross-Source Schema Sync', desc: `Verified industrial taxonomy alignment for ${selected?.industry} sector`, ts: '2d ago', level: 'info' },
                            { action: 'Ingress Point Verification', desc: 'Domain validation successful for primary analytics endpoint', ts: '3d ago', level: 'info' }
                         ]}
                      ].map((group, groupIdx) => (
                         <div key={groupIdx} className="space-y-6">
                            <div className="flex items-center gap-4 ml-2">
                               <div className="h-2 w-2 rounded-full border-2 border-primary bg-background z-10" />
                               <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">{group.date}</span>
                            </div>
                            <div className="space-y-4 pl-12">
                               {group.events.map((event, eventIdx) => (
                                  <div key={eventIdx} className="p-6 rounded-[2rem] bg-background border-2 border-border/40 flex items-center justify-between transition-all hover:bg-muted/5 hover:border-primary/30 group relative">
                                     <div className="flex items-center gap-5">
                                        <div className={cn(
                                           "h-3 w-3 rounded-full border-2 border-background shadow-lg",
                                           event.level === 'warning' ? "bg-amber-500 animate-bounce" : "bg-primary"
                                        )} />
                                        <div className="flex flex-col gap-0.5">
                                           <span className="text-md font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors">{event.action}</span>
                                           <span className="text-xs text-muted-foreground font-bold opacity-70 tracking-tight">{event.desc}</span>
                                        </div>
                                     </div>
                                     <Badge variant="secondary" className="text-[10px] font-black tabular-nums tracking-widest bg-muted border-none opacity-50 px-3">{event.ts}</Badge>
                                  </div>
                                ))}
                            </div>
                         </div>
                      ))}
                   </div>

                    <div className="pt-12">
                       <Button className="w-full h-14 rounded-xl bg-foreground text-background font-bold uppercase tracking-[0.2em] text-[10px] shadow-none hover:bg-foreground/90 transition-all active:scale-[0.98] border border-transparent">
                          ARCHIVE & DOWNLOAD CRYPTOGRAPHIC AUDIT (PDF)
                       </Button>
                    </div>
                </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Client" : "Add Client"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the client information below."
                : "Fill in the details to create a new client."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, industry: e.target.value }))
                    }
                    placeholder="e.g. Fintech"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="region">Geographic Region</Label>
                  <Select defaultValue="emea">
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="na">North America (NA)</SelectItem>
                      <SelectItem value="emea">EMEA</SelectItem>
                      <SelectItem value="apac">APAC</SelectItem>
                      <SelectItem value="latam">LATAM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tier">Account Tier</Label>
                  <Select defaultValue="enterprise">
                    <SelectTrigger id="tier">
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="enterprise">Enterprise Intelligence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="agency">Managing Agency</Label>
                  <Select
                    value={formData.agencyId}
                    onValueChange={(v) =>
                      setFormData((d: ClientFormData) => ({ ...d, agencyId: v as string }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agency" />
                    </SelectTrigger>
                    <SelectContent>
                      {agencies.map(
                        (agency: { id: string; name: string }) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Primary Domain</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((d) => ({ ...d, website: e.target.value }))
                  }
                  placeholder="https://nexus-digital.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, email: e.target.value }))
                    }
                    placeholder="admin@client.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Architecture</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, phone: e.target.value }))
                    }
                    placeholder="+213780125700"
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-all" onClick={() => toast.info("Simulating logo upload to S3...")}>
                <Plus className="h-4 w-4 text-muted-foreground/50" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Upload Brand Assets (Logo / Colors)</span>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Client"
                  : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
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
