'use client'

import { cn } from '@/lib/utils'

type StatusType =
  | 'active'
  | 'error'
  | 'disconnected'
  | 'syncing'
  | 'draft'
  | 'paused'
  | 'trial'
  | 'suspended'
  | 'churned'

interface StatusBadgeProps {
  status: StatusType
  label?: string
  showDot?: boolean
  className?: string
}

const statusConfig: Record<StatusType, { color: string; dotColor: string; defaultLabel: string }> = {
  active: {
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
    defaultLabel: 'Actif',
  },
  error: {
    color: 'bg-red-100 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
    defaultLabel: 'Erreur',
  },
  disconnected: {
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    dotColor: 'bg-gray-400',
    defaultLabel: 'Déconnecté',
  },
  syncing: {
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500 animate-pulse',
    defaultLabel: 'Synchronisation',
  },
  draft: {
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    defaultLabel: 'Brouillon',
  },
  paused: {
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500',
    defaultLabel: 'En pause',
  },
  trial: {
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    dotColor: 'bg-violet-500',
    defaultLabel: 'Essai',
  },
  suspended: {
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
    defaultLabel: 'Suspendu',
  },
  churned: {
    color: 'bg-slate-100 text-slate-600 border-slate-200',
    dotColor: 'bg-slate-400',
    defaultLabel: 'Perdu',
  },
}

export function StatusBadge({ status, label, showDot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const displayLabel = label ?? config.defaultLabel

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.color,
        className
      )}
    >
      {showDot && (
        <span className={cn('size-1.5 rounded-full', config.dotColor)} />
      )}
      {displayLabel}
    </span>
  )
}
