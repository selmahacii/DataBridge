"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Database,
  Activity,
  GitBranch,
  DollarSign,
  TrendingUp,
} from "lucide-react";
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
