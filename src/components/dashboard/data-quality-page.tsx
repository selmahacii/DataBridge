"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  FileCheck, 
  History,
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  Database,
  GitBranch,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Activity,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from "recharts";
import { generateTimeSeries } from "@/lib/data-utils";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";

const trendData = generateTimeSeries(7, 98.5, 0.02).map(d => ({ 
  day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }), 
  score: d.val 
}));

const compareData = [
  { source: 'KAFKA_PRD', raw: 124000, normalized: 123850 },
  { source: 'META_ADS', raw: 45000, normalized: 44200 },
  { source: 'GADS_API', raw: 78000, normalized: 77950 },
  { source: 'TIKTOK_ING', raw: 12000, normalized: 11500 },
];

const rules = [
  { name: "Avro Schema Signature Match", pass: 99.9, source: "All Clusters", status: "Active" },
  { name: "GA4 Protocol Integrity Check", pass: 99.2, source: "Google Ingress", status: "Active" },
  { name: "Meta Conversion Payload Drift", pass: 87.4, source: "Meta Edge", status: "Warning" },
  { name: "UTM Parameter Heuristic", pass: 94.5, source: "Marketing Nodes", status: "Active" },
  { name: "Flink Deduplication Logic", pass: 100, source: "Stream Engine", status: "Active" },
];

const rejectedEvents = [
  { id: "0xcf20...a1b", reason: "Malformed Avro Binary", source: "TikTok_Hook_Edge", timestamp: "2m ago", severity: "high" },
  { id: "0x8a1d...42e", reason: "Missing Pixel Signature", source: "Meta_Conversions_v4", timestamp: "15m ago", severity: "medium" },
  { id: "0xf4b9...9de", reason: "Schema Revision Mismatch", source: "Internal_GA4_Node", timestamp: "45m ago", severity: "low" },
  { id: "0xd3c2...12b", reason: "Invalid UTM Encoding", source: "GAds_Hub_Ingress", timestamp: "1h ago", severity: "low" },
];

const avroSchemas = [
  { name: "industrial_dist_v4", version: 4, updated: "2d ago", evolution: "Backward Compatible" },
  { name: "maghreb_finance_v2", version: 2, updated: "1w ago", evolution: "Breaking Change" },
  { name: "ooredoo_sync_v12", version: 12, updated: "5h ago", evolution: "Forward Compatible" },
];

export function DataQualityPage() {
  const { setCurrentPage } = useAppStore();
  const [activeTab, setActiveTab] = useState("overview");

  const handleReorchestrate = () => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: 'Recalibrating Flink state and cleaning validation buffers...',
      success: 'Stream re-orchestrated. DQ scores normalized.',
      error: 'Re-orchestration failed. Memory overflow in worker-3.',
    });
  };

  const handleFilter = () => {
    toast.info("Opening Global DQ Filters (Multi-Source)...");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary cursor-pointer hover:opacity-70 transition-all" onClick={() => setCurrentPage("dashboard")}>
            <ChevronLeft className="h-3 w-3" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Back to Performance Overview</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight tracking-tighter">Data Quality Center</h1>
          <p className="text-muted-foreground text-sm font-medium">Monitoring validation rules, rejected signals, and schema registry state.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 font-bold px-4" onClick={handleFilter}>
            <Filter className="mr-2 h-4 w-4" />
            GLOBAL FILTERS
          </Button>
          <Button size="sm" className="h-9 font-bold bg-primary shadow-lg shadow-primary/20 px-6" onClick={handleReorchestrate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            RE-ORCHESTRATE
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1 border-border/50 bg-background/50 backdrop-blur-xl group hover:border-primary/20 transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Global Integrity Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-black tracking-tighter text-glow">99.2%</span>
              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] font-bold">+0.4%</Badge>
            </div>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.627 0.265 303.891)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="oklch(0.627 0.265 303.891)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="score" stroke="oklch(0.627 0.265 303.891)" fill="url(#scoreGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">
              <span>Mon</span>
              <span>Wed</span>
              <span>Sun</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/50 bg-background/50 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40 px-8">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Raw vs Normalized Stream Comparison</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Ingested event volume vs validated records</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-[9px] font-bold">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" /> RAW
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-[9px] font-bold text-primary">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" /> NORMALIZED
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData}>
                  <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} content={() => null} />
                  <Bar dataKey="raw" fill="currentColor" className="text-muted/20" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="normalized" fill="oklch(0.627 0.265 303.891)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/20 backdrop-blur-md p-1 border border-border/40 shadow-sm rounded-xl mb-6">
          <TabsTrigger value="rules" className="text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all rounded-lg">Flink Validation Rules</TabsTrigger>
          <TabsTrigger value="dlq" className="text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all rounded-lg">Rejected Events (DLQ)</TabsTrigger>
          <TabsTrigger value="schema" className="text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all rounded-lg">Schema Registry</TabsTrigger>
          <TabsTrigger value="lineage" className="text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all rounded-lg">Data Lineage Trace</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rules">
          <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40">
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest px-8 py-4">Rule Signature</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Concerns Source</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Validation Rate</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4">Health</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right py-4 px-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule, i) => (
                  <TableRow key={i} className="hover:bg-accent/30 border-border/20 transition-all group">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10">
                          <FileCheck className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm">{rule.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tighter bg-muted/50">{rule.source}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 w-40">
                        <div className="flex justify-between text-[10px] font-black italic">
                          <span className="text-primary">{rule.pass}%</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{width: `${rule.pass}%`}} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-[9px] font-bold uppercase tracking-widest", rule.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')}>
                        {rule.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="dlq">
          <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
             <div className="p-6 border-b border-border/40 flex items-center justify-between bg-muted/10">
               <div className="flex items-center gap-4 flex-1">
                 <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    <Input placeholder="Search event IDs or reasons..." className="pl-9 h-9 text-xs border-border/50 bg-background/50" />
                 </div>
                 <Button variant="outline" size="sm" className="h-9 font-bold px-3 border-border/50">
                    <Filter className="h-3 w-3 mr-2 text-muted-foreground/50" />
                    ALL SOURCES
                 </Button>
               </div>
               <div className="flex items-center gap-2">
                 <Button size="sm" className="h-9 font-bold bg-primary px-4" onClick={() => {
                    toast.promise(new Promise(resolve => setTimeout(resolve, 3000)), {
                       loading: 'Bulk replaying 1,242 events to Flink ingress...',
                       success: 'Orchestration complete. All valid events re-injected.',
                       error: 'Partial failure. 14 events still in DLQ.',
                    });
                 }}>REPLAY ALL VALID</Button>
               </div>
             </div>
             <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40">
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest px-8">Event ID</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Reason for Rejection</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Source</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Received</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right px-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejectedEvents.map((ev, i) => (
                  <TableRow key={i} className="hover:bg-accent/30 border-border/20 group">
                    <TableCell className="px-8 font-mono text-[10px] font-bold text-primary">{ev.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <XCircle className="h-3.5 w-3.5 text-destructive" />
                         <span className="text-xs font-bold opacity-80">{ev.reason}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase py-0">{ev.source}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-muted-foreground">{ev.timestamp}</TableCell>
                    <TableCell className="text-right px-8">
                       <div className="flex justify-end gap-2">
                         <Button variant="outline" size="xs" className="h-8 font-bold border-primary/20 text-primary hover:bg-primary/5" onClick={() => toast.success(`Event ${ev.id} successfully replayed.`)}>
                            <RotateCcw className="h-3 w-3 mr-1.5" /> REPLAY
                         </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all" onClick={() => toast.info(`Viewing raw JSON payload for ${ev.id}`)}>
                            <Eye className="h-4 w-4" />
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border/30 flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic flex items-center gap-1.5">
                <Activity className="h-3 w-3" /> Showing 1-4 of 1,242 rejected events
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 border-border/50"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 border-border/50"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
          <div className="grid gap-6 md:grid-cols-3">
             {avroSchemas.map((schema, i) => (
               <Card key={i} className="border-border/50 bg-background/50 group overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/5">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                        <GitBranch className="h-5 w-5 text-primary" />
                      </div>
                      <Badge className="text-[10px] font-bold uppercase tracking-widest bg-muted p-1 px-2">V{schema.version}</Badge>
                    </div>
                    <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">{schema.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Registry: Apache Avro</p>
                    
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Evolution strategy</span>
                          <span className="text-[10px] font-black italic">{schema.evolution}</span>
                       </div>
                       <div className="h-1 w-full bg-muted/30 rounded-full">
                          <div className={cn("h-full rounded-full w-2/3", schema.evolution.includes('Breaking') ? 'bg-destructive' : 'bg-green-500')} />
                       </div>
                       <div className="flex items-center gap-2 pt-2 text-[10px] font-bold text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Last synced {schema.updated}
                       </div>
                    </div>
                  </div>
                  <Button variant="secondary" className="w-full h-10 font-bold text-[10px] uppercase tracking-[0.2em] rounded-none bg-muted/20 hover:bg-primary hover:text-white transition-all border-t border-border/40">VIEW SCHEMA SOURCE</Button>
               </Card>
             ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Tooltip = ({ children, content, cursor }: any) => null;
