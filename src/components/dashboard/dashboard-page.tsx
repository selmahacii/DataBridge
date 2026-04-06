"use client";

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
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  loading?: boolean;
}

function KPICard({ title, value, icon: Icon, trend, loading }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
          </div>
          <div className="rounded-lg bg-muted p-2.5">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        {trend && (
          <p className="mt-2 text-xs text-muted-foreground">{trend}</p>
        )}
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
  const sessionsData = chartQuery.data?.data ?? [];
  const conversionsData = conversionsQuery.data?.data ?? [];
  const revenueData = revenueQuery.data?.data ?? [];
  const activities = activityQuery.data ?? [];

  const kpiItems = [
    {
      title: "Active Channels",
      value: String(stats.dataSources ?? 0),
      icon: Zap,
      trend: "Operational",
    },
    {
      title: "Total Ingress",
      value: stats.dataPoints != null ? Number(stats.dataPoints).toLocaleString() : "0",
      icon: Activity,
      trend: "Rows processed",
    },
    {
      title: "Gross Revenue",
      value: stats.totalRevenue != null ? `$${Number(stats.totalRevenue).toLocaleString()}` : "$0",
      icon: DollarSign,
      trend: stats.revenueTrend ? `+${stats.revenueTrend}% MoM` : undefined,
    },
    {
      title: "Avg. ROAS",
      value: stats.avgConversion != null ? `${(Number(stats.avgConversion) * 0.85).toFixed(1)}x` : "0.0x",
      icon: TrendingUp,
      trend: "Return on Ad Spend",
    },
    {
      title: "Active Pipelines",
      value: String(stats.activePipelines ?? 0),
      icon: GitBranch,
      trend: "Running now",
    },
    {
      title: "Engagement Rate",
      value: stats.avgConversion != null ? `${stats.avgConversion}%` : "0%",
      icon: Target,
      trend: "Conversion velocity",
    },
  ];

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-widest px-2 py-0">Performance Intelligence</Badge>
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
            className="h-9 font-bold shadow-md bg-primary hover:shadow-primary/20"
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
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-3 border-border/50 bg-background/50 backdrop-blur-xl shadow-xl shadow-foreground/[0.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Traffic Velocity</CardTitle>
              <p className="text-xs text-muted-foreground">Sessions count over time</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 text-[10px] font-bold">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                SESSIONS
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
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Conversion Pulse</CardTitle>
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
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Revenue Flow</CardTitle>
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
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-border/50 bg-background/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
            <div>
              <CardTitle className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">Growth Objectives</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">North star metric progress</p>
            </div>
            <Target className="h-4 w-4 text-primary opacity-50" />
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {goalsQuery.data?.map((goal) => {
              const progress = Math.round((goal.currentValue / goal.targetValue) * 100);
              return (
              <div key={goal.id} className="space-y-3 group cursor-pointer">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{goal.metric} Target</span>
                    <span className="text-sm font-bold group-hover:text-primary transition-colors">{goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}</span>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{progress}%</span>
                </div>
                <div className="relative h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
                    style={{ width: `${Math.min(progress, 100)}%` }} 
                  />
                </div>
              </div>
            )})}
            {(!goalsQuery.data || goalsQuery.data.length === 0) && (
              <div className="py-12 text-center text-sm text-muted-foreground font-medium animate-pulse">Establishing strategic benchmarks...</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/60 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
            <div>
              <CardTitle className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">Real-time Pipeline Pulse</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Live ETL stream activity</p>
            </div>
            <Zap className="h-4 w-4 text-amber-500 animate-pulse" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {[
                { name: 'GA4 Multi-Property Sync', status: 'success', time: '2m ago', rows: 1240, platform: 'Google' },
                { name: 'Meta Ads Global ETL', status: 'success', time: '15m ago', rows: 450, platform: 'Meta' },
                { name: 'Executive Report Gen', status: 'failure', time: '1h ago', rows: 0, platform: 'Internal' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between group p-3 rounded-xl hover:bg-accent/50 transition-all border border-transparent hover:border-border/50 shadow-none hover:shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-xl shadow-inner",
                      log.status === 'success' ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                    )}>
                      {log.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{log.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider h-4">{log.platform}</Badge>
                        <span className="text-[10px] text-muted-foreground font-medium">{log.time} • {log.rows.toLocaleString()} records ingested</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Activity className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
          <div>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">Intelligence Feed</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Global operation activity log</p>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {activityQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto pr-4 space-y-2 scrollbar-thin scrollbar-thumb-accent">
              {activities.map((activity: ActivityItem) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between gap-4 rounded-xl p-4 hover:bg-accent/50 transition-all border border-transparent hover:border-border/50 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-2 w-2 rounded-full bg-primary/40 ring-4 ring-primary/5 shrink-0 group-hover:bg-primary transition-all duration-300" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold truncate">{activity.action}</span>
                      <span className="text-xs text-muted-foreground font-medium truncate">
                        {activity.description}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                      {activity.timestamp
                        ? new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ""}
                    </span>
                    <span className="text-[9px] font-medium text-muted-foreground/40 italic">
                      {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Activity className="h-10 w-10 opacity-10 mb-4" />
              <p className="text-sm font-medium">Awaiting first analytical signals...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
