'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter'

interface ChartWidgetProps {
  title: string
  subtitle?: string
  type: ChartType
  data: Record<string, unknown>[]
  xKey?: string
  yKey?: string
  colorScheme?: string[]
  height?: number
  loading?: boolean
  onExpand?: () => void
  className?: string
}

const defaultColorScheme = [
  'hsl(221, 83%, 53%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(326, 100%, 74%)',
  'hsl(45, 93%, 47%)',
]

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="space-y-3 p-2" style={{ height }}>
      <div className="flex items-end gap-2 h-full">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
      {label && <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{typeof entry.value === 'number' ? entry.value.toLocaleString('fr-FR') : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function renderChart(
  type: ChartType,
  data: Record<string, unknown>[],
  xKey: string,
  yKey: string,
  colors: string[]
) {
  const commonAxisProps = {
    tick: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
    axisLine: { stroke: 'hsl(var(--border))' },
    tickLine: { stroke: 'hsl(var(--border))' },
  }

  switch (type) {
    case 'line':
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {yKey.split(',').map((key, i) => (
            <Line
              key={key.trim()}
              type="monotone"
              dataKey={key.trim()}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      )

    case 'bar':
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {yKey.split(',').map((key, i) => (
            <Bar
              key={key.trim()}
              dataKey={key.trim()}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      )

    case 'area':
      return (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {yKey.split(',').map((key, i) => (
            <Area
              key={key.trim()}
              type="monotone"
              dataKey={key.trim()}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      )

    case 'pie':
    case 'donut':
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={yKey || 'value'}
            nameKey={xKey || 'name'}
            cx="50%"
            cy="50%"
            outerRadius={type === 'donut' ? '65%' : '80%'}
            innerRadius={type === 'donut' ? '45%' : '0%'}
            paddingAngle={2}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      )

    case 'scatter':
      return (
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} name={xKey} {...commonAxisProps} />
          <YAxis dataKey={yKey} name={yKey} {...commonAxisProps} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name={yKey} data={data} fill={colors[0]} />
        </ScatterChart>
      )

    default:
      return null
  }
}

export function ChartWidget({
  title,
  subtitle,
  type,
  data,
  xKey = 'name',
  yKey = 'value',
  colorScheme = defaultColorScheme,
  height = 300,
  loading = false,
  onExpand,
  className,
}: ChartWidgetProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="space-y-0.5">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {onExpand && (
          <CardAction>
            <Button variant="ghost" size="icon" className="size-7" onClick={onExpand}>
              <Maximize2 className="size-3.5" />
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <ChartSkeleton height={height} />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {renderChart(type, data, xKey, yKey, colorScheme)}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
