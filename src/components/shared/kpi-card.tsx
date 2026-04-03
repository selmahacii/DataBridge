'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  sparklineData?: number[]
  className?: string
}

function MiniSparkline({ data, trend }: { data: number[]; trend?: 'up' | 'down' | 'neutral' }) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 80
  const height = 32
  const padding = 2

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const lineColor =
    trend === 'up' ? '#10b981' :
    trend === 'down' ? '#ef4444' :
    '#6b7280'

  const areaPoints = `${points} ${padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)},${height - padding} ${padding},${height - padding}`

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <defs>
        <linearGradient id={`sparkGrad-${trend ?? 'neutral'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sparkGrad-${trend ?? 'neutral'})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend,
  sparklineData,
  className,
}: KpiCardProps) {
  const effectiveTrend = trend ?? (change !== undefined ? (change >= 0 ? 'up' : 'down') : undefined)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'group cursor-default transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {title}
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {value}
              </p>
            </div>
            {icon && (
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {change !== undefined && (
              <div className="flex items-center gap-1.5">
                {effectiveTrend === 'up' && (
                  <TrendingUp className="size-3.5 text-emerald-500" />
                )}
                {effectiveTrend === 'down' && (
                  <TrendingDown className="size-3.5 text-red-500" />
                )}
                {effectiveTrend === 'neutral' && (
                  <Minus className="size-3.5 text-gray-400" />
                )}
                <span
                  className={cn(
                    'text-xs font-semibold',
                    effectiveTrend === 'up' && 'text-emerald-600',
                    effectiveTrend === 'down' && 'text-red-600',
                    effectiveTrend === 'neutral' && 'text-gray-500'
                  )}
                >
                  {change > 0 ? '+' : ''}
                  {change}%
                </span>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
            {sparklineData && sparklineData.length > 0 && (
              <MiniSparkline data={sparklineData} trend={effectiveTrend} />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
