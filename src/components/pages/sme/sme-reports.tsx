'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  FileText,
  Clock,
  Calendar,
  Users,
  Mail,
  Send,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

interface ReportItem {
  id: string
  name: string
  description: string | null
  scheduleType: string
  status: string
  lastSentAt: string | null
  recipients: string | null
  dashboardIds: string | null
  createdAt: string
  org: { id: string; name: string }
  agency: { id: string; name: string } | null
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Jamais'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "à l'instant"
  if (diffMins < 60) return `il y a ${diffMins} min`
  if (diffHours < 24) return `il y a ${diffHours}h`
  if (diffDays < 7) return `il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getScheduleLabel(type: string): { label: string; color: string } {
  switch (type) {
    case 'manual':
      return { label: 'Manuel', color: 'bg-gray-100 text-gray-700 border-gray-200' }
    case 'daily':
      return { label: 'Quotidien', color: 'bg-teal-100 text-teal-700 border-teal-200' }
    case 'weekly':
      return { label: 'Hebdomadaire', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    case 'monthly':
      return { label: 'Mensuel', color: 'bg-amber-100 text-amber-700 border-amber-200' }
    default:
      return { label: type, color: 'bg-gray-100 text-gray-700 border-gray-200' }
  }
}

function parseRecipients(recipientsStr: string | null): string[] {
  if (!recipientsStr) return []
  try {
    return JSON.parse(recipientsStr)
  } catch {
    return recipientsStr.split(',').map((s) => s.trim()).filter(Boolean)
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

function ReportCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-3 w-48" />
      </CardContent>
    </Card>
  )
}

export function SmeReports() {
  const user = useAuthStore((s) => s.user)
  const orgId = user?.orgId ?? ''

  const { data: reports, isLoading, error: reportsError } = useQuery({
    queryKey: ['reports', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/reports?orgId=${orgId}`)
      if (!res.ok) throw new Error('Failed to fetch reports')
      return res.json() as Promise<ReportItem[]>
    },
    enabled: !!orgId,
  })

  if (!orgId) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Vous devez être connecté en tant qu'utilisateur PME pour accéder à cette page.</p>
      </div>
    )
  }

  if (reportsError) {
    return (
      <Card>
        <CardContent className="py-8">
          <EmptyState title="Erreur de chargement" description={reportsError.message || "Impossible de charger les rapports"} />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={cardVariants}>
        <PageHeader
          title="Rapports"
          description="Gérez vos rapports programmés et leurs destinataires"
          actions={
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Nouveau Rapport
            </Button>
          }
        />
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      ) : !reports || reports.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<FileText className="size-8" />}
              title="Aucun rapport"
              description="Vous n'avez encore créé aucun rapport programmé. Créez-en un pour recevoir des analyses régulières par email."
              action={{ label: 'Créer un rapport', onClick: () => {} }}
            />
          </CardContent>
        </Card>
      ) : (
        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {reports.map((report) => {
            const scheduleInfo = getScheduleLabel(report.scheduleType)
            const recipients = parseRecipients(report.recipients)
            return (
              <motion.div key={report.id} variants={cardVariants}>
                <Card className="transition-all hover:shadow-md hover:border-teal-200">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Left: Info */}
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-teal-100 text-teal-700 flex-shrink-0">
                            <FileText className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold">{report.name}</h3>
                            {report.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                          {/* Schedule type */}
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3" />
                            <span className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                              scheduleInfo.color
                            )}>
                              {scheduleInfo.label}
                            </span>
                          </div>

                          {/* Last sent */}
                          <div className="flex items-center gap-1.5">
                            <Send className="size-3" />
                            <span>Dernier envoi : {formatRelativeTime(report.lastSentAt)}</span>
                          </div>

                          {/* Created */}
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3" />
                            <span>Créé le {new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>

                        {/* Recipients */}
                        {recipients.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="size-3 text-muted-foreground" />
                            <div className="flex items-center gap-1 flex-wrap">
                              {recipients.slice(0, 4).map((email, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                                  <Mail className="size-2.5" />
                                  {email}
                                </Badge>
                              ))}
                              {recipients.length > 4 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  +{recipients.length - 4} autres
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Status + actions */}
                      <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-3 flex-shrink-0">
                        <StatusBadge status={report.status as 'active' | 'draft' | 'error'} />
                        <Button variant="ghost" size="sm" className="text-xs h-7">
                          Configurer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
