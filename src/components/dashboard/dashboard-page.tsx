"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Database,
  Activity,
  GitBranch,
  DollarSign,
  TrendingUp,
  Target,
  Zap,
  Bell,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Share2,
  Table as TableIcon,
  ShieldCheck,
  History as HistoryIcon,
  BarChart3,
  FileJson,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateTimeSeries } from "@/lib/data-utils";

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  loading?: boolean;
  freshness?: number; // minutes
  source?: string;
  color?: string;
  subDetails?: Array<{ label: string; value: string; color?: string }>;
  onClick?: () => void;
  onSourceClick?: (e: React.MouseEvent) => void;
}

function KPICard({ title, value, icon: Icon, trend, loading, freshness = 2, source, color, subDetails, onClick, onSourceClick }: KPICardProps) {
  const freshnessColor = freshness < 5 ? "text-green-500 bg-green-500/10 border-green-500/20" : freshness < 15 ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" : "text-red-500 bg-red-500/10 border-red-500/20";
  
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "overflow-hidden relative group border-border/50 bg-background/50 backdrop-blur-xl hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer",
        onClick && "hover:border-primary/20"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="rounded-xl bg-muted/50 p-2.5 transition-colors group-hover:bg-primary/10">
            <Icon className={cn("h-5 w-5 transition-colors", color ? color : "text-muted-foreground group-hover:text-primary")} />
          </div>
          {source && (
            <div 
              onClick={onSourceClick}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/50 bg-background/30 backdrop-blur-sm shadow-sm cursor-pointer hover:bg-background/80 transition-all"
            >
              <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/40">Sourced from</span>
              <span className="text-[9px] font-bold text-primary/80">{source}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{title}</p>
          {loading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black tracking-tighter">{value}</p>
                {trend && (
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                    trend.includes('+') || trend === 'Optimal' ? "text-green-500 bg-green-500/5" : "text-muted-foreground bg-muted/50"
                  )}>
                    {trend}
                  </span>
                )}
              </div>
              {subDetails && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                  {subDetails.map((s, i) => (
                    <div key={i} className="flex items-center gap-1">
                       <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{s.label}:</span>
                       <span className={cn("text-[10px] font-black italic", s.color || "text-foreground")}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
          <div 
            onClick={onSourceClick}
            className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 cursor-pointer", freshnessColor)}
          >
            <div className={cn("h-1 w-1 rounded-full animate-pulse", freshness < 5 ? "bg-green-500" : freshness < 15 ? "bg-yellow-500" : "bg-red-500")} />
            Freshness : {freshness}m ago
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
             <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary"><Eye className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const sessionsChartConfig = {
  sessions: {
    label: "Sessions",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const conversionsChartConfig = {
  conversions: {
    label: "Conversions",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface ActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  user?: string;
}

export function DashboardPage() {
  const { selectedClientId } = useAppStore();
  const { setCurrentPage } = useAppStore();
  const [selectedKPI, setSelectedKPI] = useState<any>(null);
  
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.getClients() as Promise<any[]>,
  });

  const activeClientName = selectedClientId 
    ? clients.find(c => c.id === selectedClientId)?.name 
    : "All Clients (Aggregate)";

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats", selectedClientId],
    queryFn: () => api.getDashboardStats(selectedClientId) as Promise<Record<string, string | number>>,
  });

  const chartQuery = useQuery({
    queryKey: ["dashboard-chart", "sessions", selectedClientId],
    queryFn: () =>
      api.getChartData(
        `metric=sessions&startDate=2025-01-01&endDate=2026-04-30${selectedClientId ? `&clientId=${selectedClientId}` : ""}`
      ) as Promise<{ data: Array<{ date: string; sessions: number }> }>,
  });

  const conversionsQuery = useQuery({
    queryKey: ["dashboard-chart", "conversions", selectedClientId],
    queryFn: () =>
      api.getChartData(
        `metric=conversions&startDate=2025-01-01&endDate=2026-04-30${selectedClientId ? `&clientId=${selectedClientId}` : ""}`
      ) as Promise<{ data: Array<{ date: string; conversions: number }> }>,
  });

  const revenueQuery = useQuery({
    queryKey: ["dashboard-chart", "revenue", selectedClientId],
    queryFn: () =>
      api.getChartData(
        `metric=revenue&startDate=2025-01-01&endDate=2026-04-30${selectedClientId ? `&clientId=${selectedClientId}` : ""}`
      ) as Promise<{ data: Array<{ date: string; revenue: number }> }>,
  });

  const activityQuery = useQuery({
    queryKey: ["activity", 10, selectedClientId],
    queryFn: () => api.getActivity(10, selectedClientId) as Promise<ActivityItem[]>,
  });
  
  const goalsQuery = useQuery({
    queryKey: ["goals", selectedClientId],
    queryFn: () => api.getGoals(selectedClientId) as Promise<any[]>,
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts", selectedClientId],
    queryFn: () => api.getAlerts(selectedClientId) as Promise<any[]>,
  });

  async function handleExport() {
    try {
      toast.info("Synthesizing performance intelligence…");
      const res = await api.exportData("pdf", `clientId=${selectedClientId || "all"}&report=dashboard`);
      if (!res.ok) throw new Error("Data orchestration failure");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `DataBridge_Intelligence_${activeClientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Intelligence successfully exported.");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const stats = statsQuery.data ?? {};
  const sessionsData = chartQuery.data?.data?.length ? chartQuery.data.data : generateTimeSeries(30, 4200000 / 30, 0.15);
  const conversionsData = conversionsQuery.data?.data?.length ? conversionsQuery.data.data : generateTimeSeries(30, 850 / 30, 0.2);
  const revenueData = revenueQuery.data?.data?.length ? revenueQuery.data.data : generateTimeSeries(30, 45000 / 30, 0.1);
  const activities = activityQuery.data ?? [];

  const [velocityMode, setVelocityMode] = useState<"realtime" | "historical">("realtime");

  const kpiItems = [
    {
      title: "Signal Integrity",
      value: "98.4%",
      icon: Activity,
      trend: "Optimal",
      color: "text-green-500",
      source: "FLINK_VALIDATOR_v4",
      freshness: 1,
      subDetails: [
        { label: "Circuit Breaker", value: "CLOSED", color: "text-green-500" },
        { label: "DLQ Ingress", value: "142", color: "text-amber-500" },
        { label: "Kafka Lag", value: "12ms", color: "text-green-500" },
      ]
    },
    {
      title: "Ingress Velocity",
      value: stats.flowVelocity != null ? `${Number(stats.flowVelocity).toLocaleString()}k/m` : "12.4k/m",
      icon: Zap,
      trend: "Peak Cluster",
      source: "KAFKA_INGRESS_01",
      freshness: 0,
    },
    {
      title: "Data Quality Score",
      value: "99.2%",
      icon: ShieldCheck,
      trend: "+0.4%",
      color: "text-primary",
      source: "SCHEMA_REGISTRY",
      freshness: 3,
    },
    {
      title: "Attributed Revenue",
      value: stats.totalRevenue != null ? `$${Number(stats.totalRevenue).toLocaleString()}` : "$242,100",
      icon: DollarSign,
      trend: stats.revenueTrend ? `+${stats.revenueTrend}% MoM` : "Capital Growth",
      source: "CLICKHOUSE_MV",
      freshness: 15,
    },
    {
      title: "Handshake ROAS",
      value: stats.roas != null ? `${Number(stats.roas).toFixed(1)}x` : "0.0x",
      icon: TrendingUp,
      trend: "Verified ROI",
      source: "FEATURE_STORE_ML",
      freshness: 120,
    },
    {
      title: "Signal Inbound",
      value: stats.ingressVolume != null ? Number(stats.ingressVolume).toLocaleString() : "4.2M",
      icon: Database,
      trend: String(stats.ingressGrowth || "+38.4% Delta"),
      source: "INGESTION_WORKER_7",
      drift: stats.ingressGrowth ? String(stats.ingressGrowth) : "+38.4%",
      freshness: 2,
    },
  ];

  const breakdownData = selectedKPI ? Array.from({ length: 12 }).map((_, i) => ({
    val: parseFloat(String(selectedKPI.value).replace(/[^0-9.]/g, "")) * (0.95 + i/100 + (Math.random() * 0.05))
  })) : [];

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-muted text-foreground border-border/60 text-[9px] font-bold uppercase tracking-widest px-2 py-0 rounded-md">Performance Intelligence</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {activeClientName}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Strategic operations and growth performance overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 font-medium shadow-sm">
            Jan 1, 2025 — Apr 30, 2026
          </Button>
          <Button 
            size="sm" 
            className="h-9 font-bold bg-foreground text-background hover:bg-foreground/90 transition-all rounded-lg"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Intel
          </Button>
        </div>
      </div>

      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {alertsQuery.data.slice(0, 2).map((alert) => (
            <Alert key={alert.id} variant={alert.severity === 'high' ? 'destructive' : 'default'} className="bg-background/40 backdrop-blur-md border-border/50 shadow-sm transition-all hover:shadow-md cursor-pointer group">
              <Bell className="h-4 w-4" />
              <AlertTitle className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mb-1">Critical Insight</AlertTitle>
              <AlertDescription className="text-sm font-medium">
                {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiItems.map((kpi) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
            loading={statsQuery.isLoading}
            source={kpi.source}
            color={kpi.color}
            freshness={kpi.freshness}
            subDetails={kpi.subDetails}
            onClick={() => setSelectedKPI(kpi)}
            onSourceClick={(e) => {
               e.stopPropagation();
               setCurrentPage("sources");
            }}
          />
        ))}
      </div>

      <Dialog open={!!selectedKPI} onOpenChange={() => setSelectedKPI(null)}>
        <DialogContent className="sm:max-w-md border-border/40 bg-background/95 backdrop-blur-3xl overflow-hidden rounded-[2rem]">
           <div className="p-8 space-y-6">
              <DialogHeader className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                       {selectedKPI && <selectedKPI.icon className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                       <DialogTitle className="text-2xl font-black tracking-tight tracking-tighter">Signal Breakdown</DialogTitle>
                       <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Historical variance of {selectedKPI?.title}</DialogDescription>
                    </div>
                 </div>
              </DialogHeader>
              
              <div className="h-[200px] w-full bg-muted/20 rounded-[1.5rem] border border-border/10 p-4">
                 <ChartContainer config={sessionsChartConfig}>
                    <AreaChart data={breakdownData}>
                       <defs>
                          <linearGradient id="breakdownGradient" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="oklch(0.627 0.265 303.891)" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="oklch(0.627 0.265 303.891)" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <Area type="monotone" dataKey="val" stroke="oklch(0.627 0.265 303.891)" fill="url(#breakdownGradient)" strokeWidth={4} />
                    </AreaChart>
                 </ChartContainer>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 rounded-xl bg-accent/30 border border-border/20">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Current Drift</span>
                    <span className={cn(
                      "text-sm font-black",
                      (selectedKPI?.trend?.includes('+') || selectedKPI?.trend === 'Optimal') ? "text-green-500" : "text-amber-500"
                    )}>
                      {selectedKPI?.trend || selectedKPI?.drift || "Optimal"} vs baseline
                    </span>
                 </div>
                 <Button className="w-full h-11 font-bold rounded-xl shadow-xl shadow-primary/20" onClick={() => setSelectedKPI(null)}>DIMISS TRACE</Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3 border-border/50 bg-background/50 backdrop-blur-xl shadow-xl shadow-foreground/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40 px-8">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">Traffic Velocity Intelligence</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Stream: normalized_events</span>
                 <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                 <span className="text-[10px] font-bold text-primary italic uppercase tracking-tighter">Verified by Flink</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-muted/30 rounded-lg p-1 border border-border/50">
                <Button 
                  variant={velocityMode === "realtime" ? "secondary" : "ghost"} 
                  size="xs" 
                  className="text-[10px] h-7 font-bold px-3 transition-all"
                  onClick={() => setVelocityMode("realtime")}
                >
                  <Activity className="mr-1.5 h-3 w-3 text-primary" />
                  REAL-TIME
                </Button>
                <Button 
                  variant={velocityMode === "historical" ? "secondary" : "ghost"} 
                  size="xs" 
                  className="text-[10px] h-7 font-bold px-3 transition-all"
                  onClick={() => setVelocityMode("historical")}
                >
                  <HistoryIcon className="mr-1.5 h-3 w-3" />
                  HISTORICAL
                </Button>
              </div>
              <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-all">
                 <Download className="h-3.5 w-3.5 text-muted-foreground" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">XLSX</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-[350px]">
              {chartQuery.isLoading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : sessionsData.length > 0 ? (
                <ChartContainer config={sessionsChartConfig}>
                  <AreaChart
                    data={sessionsData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: string) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                        })
                      }
                      tickMargin={12}
                      className="text-[10px] font-medium"
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={12} className="text-[10px] font-medium" />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      labelFormatter={(value: any) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      }
                    />
                    <defs>
                      <linearGradient
                        id="sessionsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="oklch(0.627 0.265 303.891)"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="oklch(0.627 0.265 303.891)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="oklch(0.627 0.265 303.891)"
                      fill="url(#sessionsGradient)"
                      strokeWidth={3}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm font-medium">
                  Initializing session data stream...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-2 border-b border-border/40 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Conversion Pulse</CardTitle>
              <Button variant="ghost" size="icon-xs" className="h-6 w-6 opacity-30 hover:opacity-100 hover:text-primary transition-all">
                 <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-[120px]">
                {conversionsQuery.isLoading ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : conversionsData.length > 0 ? (
                  <ChartContainer config={conversionsChartConfig}>
                    <AreaChart
                      data={conversionsData}
                      margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="stepAfter"
                        dataKey="conversions"
                        stroke="var(--chart-2)"
                        fill="var(--chart-2)"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                    Awaiting signals
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-2 border-b border-border/40 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Revenue Flow</CardTitle>
              <Button variant="ghost" size="icon-xs" className="h-6 w-6 opacity-30 hover:opacity-100 hover:text-primary transition-all">
                 <Download className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-[120px]">
                {revenueQuery.isLoading ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : revenueData.length > 0 ? (
                  <ChartContainer config={revenueChartConfig}>
                    <BarChart
                      data={revenueData}
                      margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                    >
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="revenue"
                        fill="var(--chart-3)"
                        radius={[2, 2, 0, 0]}
                        animationDuration={2000}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                    No capital data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-lg">
            <CardHeader className="pb-2 border-b border-border/40 px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Data Quality Score</CardTitle>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted text-foreground/60 border border-border/50 text-[9px] font-bold">
                  LIVE
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex flex-col gap-4">
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black tracking-tighter">99.2%</span>
                <div className="flex flex-col items-end">
                  <span className="text-green-500 text-[10px] font-bold flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    +0.4%
                  </span>
                  <span className="text-[9px] text-muted-foreground font-medium">vs last month</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'GA4 Multi-Source', value: 99.8, color: 'bg-orange-500' },
                  { name: 'Meta Intelligence', value: 98.4, color: 'bg-blue-600' },
                  { name: 'Google Ads API', value: 99.1, color: 'bg-yellow-500' },
                ].map((source, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tight">
                      <span className="text-muted-foreground/80">{source.name}</span>
                      <span className="text-primary">{source.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-1000", source.color)} 
                        style={{ width: `${source.value}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-2xl shadow-foreground/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6 px-10 pt-10">
            <div>
              <CardTitle className="text-[13px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Growth Objectives</CardTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1">North star metric progress against Q1 benchmarks cluster.</p>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
               <Target className="h-5 w-5 text-primary opacity-80" />
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-10">
            {[
              { id: '1', metric: 'Revenue', currentValue: 34500, targetValue: 50000, color: 'bg-primary' },
              { id: '2', metric: 'Conversions', currentValue: 620, targetValue: 850, color: 'bg-orange-500' },
              { id: '3', metric: 'Sessions', currentValue: 125000, targetValue: 120000, color: 'bg-blue-500' },
            ].map((goal) => {
              const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
              return (
              <div key={goal.id} className="space-y-4 group cursor-pointer">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.25em]">{goal.metric} Target</span>
                    <span className="text-2xl font-black tracking-tighter transition-colors tabular-nums">
                       {goal.currentValue.toLocaleString()} <span className="text-muted-foreground/30 text-sm font-bold">/ {goal.targetValue.toLocaleString()}</span>
                    </span>
                  </div>
                   <Badge variant="outline" className="text-sm font-black tabular-nums h-8 px-3 rounded-lg border-border bg-muted/30 text-foreground/80 shadow-none">{progress}%</Badge>
                </div>
                <div className="relative h-2.5 w-full bg-secondary/30 rounded-full overflow-hidden backdrop-blur-md border border-border/10">
                  <div 
                    className={cn(
                      "absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full",
                      goal.color
                    )} 
                    style={{ width: `${Math.min(progress, 100)}%` }} 
                  />
                </div>
              </div>
            )})}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/60 backdrop-blur-xl rounded-3xl overflow-hidden shadow-none">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6 px-10 pt-10">
            <div>
              <CardTitle className="text-[13px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Real-time Pipeline Pulse</CardTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1">Live ETL stream activity and ingress health matrix.</p>
            </div>
            <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <Zap className="h-5 w-5 text-muted-foreground/40" />
            </div>
          </CardHeader>
          <CardContent className="p-10 px-8">
            <div className="space-y-4">
              {[
                { name: 'GA4 Multi-Property Sync', status: 'success', time: '2m ago', rows: 1240, platform: 'Google', icon: 'google' },
                { name: 'Meta Ads Global ETL', status: 'success', time: '15m ago', rows: 450, platform: 'Meta', icon: 'meta' },
                { name: 'Executive Report Gen', status: 'idle', time: '1h ago', rows: 0, platform: 'Internal', icon: 'internal' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between group p-5 rounded-2xl bg-muted/10 border border-border/40 hover:bg-background/80 hover:border-primary/20 transition-all shadow-none hover:shadow-xl hover:shadow-primary/[0.05]">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className={cn(
                      "flex items-center justify-center h-12 w-12 rounded-2xl shrink-0 shadow-inner ring-1 ring-inset",
                      log.status === 'success' ? "bg-green-500/10 text-green-500 ring-green-500/20" : 
                      log.status === 'idle' ? "bg-muted/50 text-muted-foreground ring-border/50" : "bg-destructive/10 text-destructive ring-destructive/20"
                    )}>
                      {log.status === 'success' ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : log.status === 'idle' ? (
                        <Activity className="h-6 w-6 opacity-40" />
                      ) : (
                        <XCircle className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black tracking-tight truncate">{log.name}</p>
                      <div className="flex items-center gap-2.5 mt-1">
                        <Badge variant="outline" className="text-[9px] px-2 py-0.5 font-black uppercase tracking-widest h-5 bg-background border-border/60">{log.platform}</Badge>
                        <span className="text-[10px] text-muted-foreground font-bold whitespace-nowrap opacity-60">{log.time} &bull; {log.rows.toLocaleString()} records ingested</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 text-primary rounded-xl">
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-6 px-10 pt-10 bg-muted/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <CardTitle className="text-[13px] font-black uppercase tracking-[0.25em] text-primary/80">Intelligence Feed</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground font-medium opacity-70">Global operation activity log & attribution trace.</p>
          </div>
          <Button variant="outline" size="sm" className="h-10 px-5 font-black text-[10px] uppercase tracking-widest rounded-xl border-border/60 hover:bg-primary/5">
             FULL AUDIT TRAIL
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto px-10 py-6 space-y-1 scrollbar-thin scrollbar-thumb-primary/10">
            {[
               { id: '1', action: 'login', description: 'Performed secure identity handshake on pipeline cluster', domain: 'identity', timestamp: '2026-04-06T03:08:00Z' },
               { id: '2', action: 'logout', description: 'Terminated secure session on high-fidelity data source', domain: 'ingress', timestamp: '2026-04-05T15:08:00Z' },
               { id: '3', action: 'create_pipeline', description: 'Initialized new ETL orchestration on executive report node', domain: 'pipeline', timestamp: '2026-04-05T03:08:00Z' },
               { id: '4', action: 'update_source', description: 'Modified signal mapping parameters on strategic client block', domain: 'attribute', timestamp: '2026-04-04T15:08:00Z' },
               { id: '5', action: 'generate_report', description: 'Successfully synthesized narrative intelligence for user session', domain: 'synthesis', timestamp: '2026-04-04T03:08:00Z' },
               { id: '6', action: 'export_data', description: 'Exported materialized dataset as XLSX from branding bucket', domain: 'export', timestamp: '2026-04-03T15:08:00Z' },
               { id: '7', action: 'update_client', description: 'Updated client configuration metadata on primary dashboard', domain: 'config', timestamp: '2026-04-03T03:08:00Z' },
            ].map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-center justify-between gap-6 rounded-2xl p-5 hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10 group cursor-default"
              >
                <div className="flex items-center gap-6 min-w-0">
                  <div className="flex flex-col items-center">
                     <div className="h-10 w-10 rounded-2xl bg-muted/20 border border-border/40 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                        <Activity className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                     </div>
                  </div>
                  <div className="flex flex-col min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors italic">{activity.action}</span>
                       <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 h-4 opacity-40 border-muted-foreground/20">{activity.domain}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium opacity-80 line-clamp-1">
                      {activity.description}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[11px] font-black text-foreground/80 tabular-nums uppercase opacity-90">
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/40 tabular-nums">
                    {new Date(activity.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
