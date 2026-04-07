"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  Zap, 
  AlertCircle, 
  Layers, 
  Database, 
  Cpu, 
  Network, 
  ArrowRight,
  RefreshCw,
  Play,
  Settings,
  MoreVertical,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PipelineStatusPage() {
  const { setCurrentPage } = useAppStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleClusterSettings = () => {
    toast.info("Opening Cluster Orchestration Protocol v4.2...");
    setTimeout(() => {
       toast.success("Ready for adjustments (K8s / Flink / Kafka).");
    }, 1000);
  };

  const stats = [
    { label: "Throughput", value: "2.4M", sub: "events/min", icon: Zap, color: "text-amber-500" },
    { label: "E2E Latency", value: "42ms", sub: "99th percentile", icon: Clock, color: "text-blue-500" },
    { label: "Error Rate", value: "0.02%", sub: "Last 5 mins", icon: AlertCircle, color: "text-red-500" },
    { label: "Circuit Breaker", value: "Closed", sub: "All systems green", icon: Activity, color: "text-green-500" },
    { label: "Kafka Lag", value: "1.2k", sub: "Consuming live", icon: Network, color: "text-purple-500" },
    { label: "Active Nodes", value: "24/24", sub: "Cluster healthy", icon: Server, color: "text-primary" },
  ];

  const pipelineSteps = [
    { id: '1', name: 'Ingestion Workers', type: 'Go', status: 'healthy', metrics: '12 pods active' },
    { id: '2', name: 'Kafka: raw_events', type: 'Message Bus', status: 'healthy', metrics: '450MB/s' },
    { id: '3', name: 'Flink DQ Validator', type: 'Stream Proc', status: 'healthy', metrics: 'Lat: 4ms' },
    { id: '4', name: 'Kafka: normalized', type: 'Message Bus', status: 'healthy', metrics: '442MB/s' },
    { id: '5', name: 'ClickHouse Sink', type: 'Storage', status: 'healthy', metrics: '12k inserts/s' },
    { id: '6', name: 'Feature Store', type: 'Cache/DB', status: 'degraded', metrics: 'High IOPS' },
    { id: '7', name: 'ML Inference', type: 'Prophet/SHAP', status: 'healthy', metrics: '99% conf' },
  ];

  const temporalJobs = [
    { name: "Executive Report Aggregation", trigger: "Cron (Daily)", status: "Running", progress: 65, lastRun: "2h ago", retries: 0 },
    { name: "Meta Ads Signal Sync", trigger: "Event-based", status: "Completed", progress: 100, lastRun: "15m ago", retries: 2 },
    { name: "GA4 Multi-Tenant Batch", trigger: "Cron (Hourly)", status: "Scheduled", progress: 0, lastRun: "45m ago", retries: 0 },
    { name: "Global Intelligence Re-index", trigger: "Manual", status: "Completed", progress: 100, lastRun: "1d ago", retries: 1 },
    { name: "Client Prediction Engine", trigger: "Dynamic", status: "Failed", progress: 32, lastRun: "5m ago", retries: 5 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary cursor-pointer hover:opacity-70 transition-all" onClick={() => setCurrentPage("dashboard")}>
            <ChevronLeft className="h-3 w-3" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Back to Performance Overview</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight tracking-tighter">Infrastructure Health</h1>
          <p className="text-muted-foreground text-sm font-medium">Real-time telemetry and flow visualization for the entire DataBridge stack.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 font-bold gap-2"
            onClick={() => {
               setIsPaused(!isPaused);
               toast(isPaused ? "Resuming live telemetry stream." : "Telemetry stream paused for inspection.", {
                  icon: isPaused ? <Play className="h-4 w-4" /> : <Clock className="h-4 w-4" />
               });
            }}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <RefreshCw className={cn("h-4 w-4", !isPaused && "animate-spin-slow")} />}
            {isPaused ? "RESUME UPDATES" : "AUTO-REFRESHING"}
          </Button>
          <Button size="sm" className="h-9 font-bold bg-primary shadow-lg shadow-primary/20" onClick={handleClusterSettings}>
            CLUSTER SETTINGS
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border/50 bg-background/50 backdrop-blur-xl group hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[9px] font-bold opacity-50 uppercase tracking-tighter">Live</Badge>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{stat.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black">{stat.value}</span>
                  <span className="text-[10px] font-bold text-muted-foreground/40">{stat.sub}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 bg-background/40 backdrop-blur-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4 px-8">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Data Flow Visualization</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">End-to-end stream architecture and node status</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-muted-foreground italic">Healthy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-muted-foreground italic">Degraded</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-primary/5 via-primary/40 to-primary/5 hidden lg:block -translate-y-1/2 z-0" />
            
            {pipelineSteps.map((step, i) => (
              <div key={step.id} className="relative z-10 w-full lg:w-auto">
                <div className="flex flex-col items-center gap-4 group cursor-pointer">
                  <div className={cn(
                    "h-20 w-40 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 backdrop-blur-xl shadow-xl",
                    step.status === 'healthy' 
                      ? "bg-background/80 border-primary/20 group-hover:border-primary/50 group-hover:shadow-primary/10" 
                      : "bg-background/80 border-amber-500/30 group-hover:border-amber-500/60 group-hover:shadow-amber-500/10"
                  )}>
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{step.type}</span>
                    <span className="text-xs font-bold text-center px-2">{step.name}</span>
                    <Badge variant="secondary" className="text-[8px] h-4 font-bold uppercase tracking-tighter bg-muted/50">{step.metrics}</Badge>
                    <div className={cn(
                      "absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full border-4 border-background flex items-center justify-center",
                      step.status === 'healthy' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-amber-500"
                    )} />
                  </div>
                  {i < pipelineSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground/30 lg:hidden" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Temporal Orchestrator: Active Jobs</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Automated workflow execution and task scheduling</p>
            </div>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold h-8" onClick={() => toast.info("Deep-linking to Temporal Web UI...")}>VIEW ALL RUNS</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 px-6 text-muted-foreground/70">Job Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 text-muted-foreground/70">Trigger</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 text-muted-foreground/70">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 text-muted-foreground/70">Execution</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 text-muted-foreground/70">Retry Count</TableHead>
                <TableHead className="text-right py-4 px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {temporalJobs.map((job, i) => (
                <TableRow key={i} className="hover:bg-accent/30 border-border/20 transition-colors">
                  <TableCell className="py-4 px-6">
                    <div className="font-bold text-sm tracking-tight">{job.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase py-0">{job.trigger}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        job.status === 'Running' ? "bg-primary animate-pulse" : 
                        job.status === 'Completed' ? "bg-green-500" : 
                        job.status === 'Scheduled' ? "bg-muted-foreground/40" : "bg-destructive"
                      )} />
                      <span className={cn(
                        "text-xs font-bold",
                        job.status === 'Running' ? "text-primary" : 
                        job.status === 'Completed' ? "text-green-500" : 
                        job.status === 'Scheduled' ? "text-muted-foreground" : "text-destructive"
                      )}>{job.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5 w-[150px]">
                      <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                        <span>{job.lastRun}</span>
                        <span>{job.progress}%</span>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            job.status === 'Failed' ? "bg-destructive" : "bg-primary"
                          )} 
                          style={{ width: `${job.progress}%` }} 
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-xs font-bold tabular-nums",
                      job.retries > 0 ? "text-amber-500" : "text-muted-foreground/40"
                    )}>{job.retries} attempts</span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon-xs"><ExternalLink className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon-xs"><MoreVertical className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const Server = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
    <line x1="6" x2="6.01" y1="6" y2="6"/>
    <line x1="6" x2="6.01" y1="18" y2="18"/>
  </svg>
);
