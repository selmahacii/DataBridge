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
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.getDashboardStats() as Promise<Record<string, string | number>>,
  });

  const chartQuery = useQuery({
    queryKey: ["dashboard-chart", "sessions"],
    queryFn: () =>
      api.getChartData(
        "metric=sessions&startDate=2025-01-01&endDate=2026-04-30"
      ) as Promise<{ data: Array<{ date: string; sessions: number }> }>,
  });

  const conversionsQuery = useQuery({
    queryKey: ["dashboard-chart", "conversions"],
    queryFn: () =>
      api.getChartData(
        "metric=conversions&startDate=2025-01-01&endDate=2026-04-30"
      ) as Promise<{ data: Array<{ date: string; conversions: number }> }>,
  });

  const revenueQuery = useQuery({
    queryKey: ["dashboard-chart", "revenue"],
    queryFn: () =>
      api.getChartData(
        "metric=revenue&startDate=2025-01-01&endDate=2026-04-30"
      ) as Promise<{ data: Array<{ date: string; revenue: number }> }>,
  });

  const activityQuery = useQuery({
    queryKey: ["activity", 10],
    queryFn: () => api.getActivity(10) as Promise<ActivityItem[]>,
  });
  
  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: () => api.getGoals() as Promise<any[]>,
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.getAlerts() as Promise<any[]>,
  });

  const stats = statsQuery.data ?? {};
  const sessionsData = chartQuery.data?.data ?? [];
  const conversionsData = conversionsQuery.data?.data ?? [];
  const revenueData = revenueQuery.data?.data ?? [];
  const activities = activityQuery.data ?? [];

  const kpiItems = [
    {
      title: "Total Clients",
      value: String(stats.totalClients ?? 0),
      icon: Users,
      trend: stats.clientsTrend ? `+${stats.clientsTrend}% from last month` : undefined,
    },
    {
      title: "Data Sources",
      value: String(stats.dataSources ?? 0),
      icon: Database,
      trend: "Connected and syncing",
    },
    {
      title: "Data Points",
      value: stats.dataPoints != null ? Number(stats.dataPoints).toLocaleString() : "0",
      icon: Activity,
      trend: "Across all sources",
    },
    {
      title: "Active Pipelines",
      value: String(stats.activePipelines ?? 0),
      icon: GitBranch,
      trend: `${String(stats.totalPipelines ?? 0)} total pipelines`,
    },
    {
      title: "Total Revenue",
      value: stats.totalRevenue != null ? `$${Number(stats.totalRevenue).toLocaleString()}` : "$0",
      icon: DollarSign,
      trend: stats.revenueTrend ? `+${stats.revenueTrend}% from last month` : undefined,
    },
    {
      title: "Avg. Conversion Rate",
      value: stats.avgConversion != null ? `${stats.avgConversion}%` : "0%",
      icon: TrendingUp,
      trend: "Across all campaigns",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your analytics platform
        </p>
      </div>

      {alertsQuery.data && alertsQuery.data.length > 0 && (
        <div className="space-y-3">
          {alertsQuery.data.slice(0, 2).map((alert) => (
            <Alert key={alert.id} variant={alert.severity === 'high' ? 'destructive' : 'default'} className="bg-background/50 backdrop-blur-sm">
              <Bell className="h-4 w-4" />
              <AlertTitle className="text-xs font-bold uppercase tracking-widest">Anomaly Detected</AlertTitle>
              <AlertDescription className="text-sm">
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Sessions Over Time</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-[300px]">
              {chartQuery.isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : sessionsData.length > 0 ? (
                <ChartContainer config={sessionsChartConfig}>
                  <AreaChart
                    data={sessionsData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: string) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                        })
                      }
                      tickMargin={8}
                    />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      labelFormatter={(value: string) =>
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
                          stopColor="var(--chart-1)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="var(--chart-1)"
                      fill="url(#sessionsGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No session data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[130px]">
                {conversionsQuery.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : conversionsData.length > 0 ? (
                  <ChartContainer config={conversionsChartConfig}>
                    <BarChart
                      data={conversionsData}
                      margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: string) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                          })
                        }
                        tickMargin={4}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={4} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="conversions"
                        fill="var(--chart-2)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[130px]">
                {revenueQuery.isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : revenueData.length > 0 ? (
                  <ChartContainer config={revenueChartConfig}>
                    <AreaChart
                      data={revenueData}
                      margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: string) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                          })
                        }
                        tickMargin={4}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={4} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <defs>
                        <linearGradient
                          id="revenueGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--chart-3)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--chart-3)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--chart-3)"
                        fill="url(#revenueGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No data
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 🎯 Goal Progress */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">KPI Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            {goalsQuery.data?.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium capitalize">{goal.metric} Target</span>
                  <span className="text-muted-foreground">{Math.round((goal.currentValue / goal.targetValue) * 100)}%</span>
                </div>
                <Progress value={(goal.currentValue / goal.targetValue) * 100} className="h-2" />
                <p className="text-[10px] text-muted-foreground">Current: {goal.currentValue.toLocaleString()} / Target: {goal.targetValue.toLocaleString()}</p>
              </div>
            ))}
            {(!goalsQuery.data || goalsQuery.data.length === 0) && (
              <div className="py-8 text-center text-sm text-muted-foreground">No active goals set</div>
            )}
          </CardContent>
        </Card>

        {/* ⚡ Pipeline Pulse */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Bridge Pulse</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {[
                { name: 'GA4 Sync', status: 'success', time: '2m ago', rows: 1240 },
                { name: 'Meta Ads ETL', status: 'success', time: '15m ago', rows: 450 },
                { name: 'Weekly Report Gen', status: 'failure', time: '1h ago', rows: 0 },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{log.name}</p>
                      <p className="text-[10px] text-muted-foreground">{log.time} • {log.rows} rows</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Details</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {activityQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="max-h-96 overflow-y-auto space-y-1">
              {activities.map((activity: ActivityItem) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {activity.timestamp
                      ? new Date(activity.timestamp).toLocaleDateString()
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No recent activity
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
