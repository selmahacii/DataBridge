'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore, type AuthUser, type UserRole } from '@/stores/auth-store'
import { useAppStore, getDefaultPage } from '@/stores/app-store'
import {
  Database,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Building2,
  Users,
  MessageSquare,
} from 'lucide-react'

interface RoleGroup {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  badgeVariant: 'default' | 'secondary' | 'outline'
  badgeClass: string
  roles: UserRole[]
}

const roleGroups: RoleGroup[] = [
  {
    key: 'super_admin',
    label: 'Super Admin',
    description: 'Administrateur plateforme',
    icon: <Shield className="size-4" />,
    badgeVariant: 'default',
    badgeClass: 'bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20',
    roles: ['super_admin'],
  },
  {
    key: 'agency',
    label: 'Agency Admins',
    description: 'Gestionnaires d\'agence',
    icon: <Building2 className="size-4" />,
    badgeVariant: 'default',
    badgeClass: 'bg-teal-700/10 text-teal-700 border-teal-200 hover:bg-teal-700/20',
    roles: ['agency_admin', 'agency_viewer'],
  },
  {
    key: 'sme',
    label: 'SME Users',
    description: 'Utilisateurs PME',
    icon: <Users className="size-4" />,
    badgeVariant: 'secondary',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20',
    roles: ['sme_admin', 'sme_editor', 'sme_viewer'],
  },
]

function getRoleBadge(user: AuthUser) {
  const group = roleGroups.find((g) => g.roles.includes(user.role))
  if (!group) return null
  const label =
    user.role === 'super_admin'
      ? 'Super Admin'
      : user.role === 'agency_admin'
        ? 'Admin Agence'
        : user.role === 'agency_viewer'
          ? 'Viewer Agence'
          : user.role === 'sme_admin'
            ? 'Admin PME'
            : user.role === 'sme_editor'
              ? 'Éditeur'
              : 'Viewer'
  return (
    <Badge variant={group.badgeVariant} className={group.badgeClass}>
      {label}
    </Badge>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-teal-600 text-white',
    'bg-emerald-600 text-white',
    'bg-cyan-700 text-white',
    'bg-teal-700 text-white',
    'bg-emerald-700 text-white',
    'bg-cyan-600 text-white',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const valueProps = [
  {
    icon: <Database className="size-5 text-teal-300" />,
    title: 'Sources de données',
    description: 'Connectez vos fichiers CSV, Excel, Google Sheets et plus encore.',
  },
  {
    icon: <Zap className="size-5 text-teal-300" />,
    title: 'Pipelines automatiques',
    description: 'Transformez et nettoyez vos données avec des pipelines visuels.',
  },
  {
    icon: <BarChart3 className="size-5 text-teal-300" />,
    title: 'Dashboards interactifs',
    description: 'Visualisez vos KPIs avec des tableaux de bord personnalisés.',
  },
  {
    icon: <MessageSquare className="size-5 text-teal-300" />,
    title: 'Assistant DataBridge',
    description: 'Posez vos questions en langage naturel pour obtenir des insights sur vos données.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
}

const brandVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function UserCard({ user, onSelect, index }: { user: AuthUser; onSelect: (u: AuthUser) => void; index: number }) {
  return (
    <motion.div variants={cardVariants} custom={index}>
      <Card
        className="login-card group relative overflow-hidden border-border/60 bg-white p-0"
        onClick={() => onSelect(user)}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <Avatar className="size-11 shrink-0 ring-2 ring-transparent transition-all group-hover:ring-teal-500/30">
            <AvatarFallback className={`${getAvatarColor(user.name)} text-sm font-semibold`}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <ArrowRight className="size-3.5 shrink-0 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </div>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            {user.orgName && (
              <p className="truncate text-xs text-slate-400">{user.orgName}</p>
            )}
          </div>
          <div className="shrink-0">
            {getRoleBadge(user)}
          </div>
        </CardContent>
        {/* Teal accent bar on hover */}
        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-300 group-hover:w-full" />
      </Card>
    </motion.div>
  )
}

export function LoginPage() {
  const { availableUsers, isLoading, loadAvailableUsers, login } = useAuthStore()
  const { setCurrentPage } = useAppStore()
  const [selectingUser, setSelectingUser] = useState<string | null>(null)

  useEffect(() => {
    loadAvailableUsers()
  }, [loadAvailableUsers])

  const handleSelectUser = async (user: AuthUser) => {
    setSelectingUser(user.id)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      if (res.ok) {
        await res.json()
        login(user.id)
        setCurrentPage(getDefaultPage(user.role))
      } else {
        setSelectingUser(null)
        return
      }
    } catch (error) {
      console.error('Login failed:', error)
      setSelectingUser(null)
    }
  }

  const groupedUsers = roleGroups
    .map((group) => ({
      ...group,
      users: availableUsers.filter((u) => group.roles.includes(u.role)),
    }))
    .filter((group) => group.users.length > 0)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <motion.div
        className="brand-gradient relative hidden w-[480px] shrink-0 overflow-hidden lg:flex lg:flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="absolute right-20 top-1/3 h-40 w-40 rounded-full bg-teal-300/5 blur-2xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-between p-10">
          {/* Logo area */}
          <motion.div variants={brandVariants} initial="hidden" animate="visible" className="space-y-2">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="DataBridge Analytics" className="size-11 rounded-xl shadow-lg" />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">DataBridge</h1>
                <p className="text-xs font-medium text-teal-200/80">Analytics Platform</p>
              </div>
            </div>
          </motion.div>

          {/* Value props */}
          <motion.div
            className="space-y-6"
            variants={brandVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <div>
              <h2 className="text-3xl font-bold leading-tight text-white">
                Transformez vos données
                <br />
                en décisions stratégiques
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-teal-100/70">
                La plateforme tout-en-un pour les agences et PME. Connectez, transformez et visualisez vos données en toute simplicité.
              </p>
            </div>

            <div className="space-y-4">
              {valueProps.map((prop, i) => (
                <motion.div
                  key={prop.title}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                    {prop.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{prop.title}</p>
                    <p className="text-xs text-teal-200/60">{prop.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom footer */}
          <motion.div
            className="space-y-1"
            variants={brandVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs font-medium text-teal-200/60">© 2025 DataBridge Analytics</p>
            <p className="text-xs text-teal-200/40">Plateforme B2B de pipelines de données</p>
          </motion.div>
        </div>
      </motion.div>

      <div className="flex flex-1 flex-col overflow-y-auto custom-scrollbar">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-12 lg:px-12">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/logo.png" alt="DataBridge Analytics" className="size-10 rounded-xl" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">DataBridge</h1>
              <p className="text-xs font-medium text-slate-500">Analytics Platform</p>
            </div>
          </div>

          {/* Header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Choisissez votre persona
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Sélectionnez un compte pour explorer la plateforme avec les permissions correspondantes.
            </p>
          </motion.div>

          {/* User Cards */}
          <AnimatePresence mode="wait">
            {isLoading && availableUsers.length === 0 ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {groupedUsers.map((group) => (
                  <div key={group.key} className="space-y-3">
                    {/* Group header */}
                    <motion.div className="flex items-center gap-2">
                      {group.icon}
                      <h3 className="text-sm font-semibold text-slate-700">{group.label}</h3>
                      <span className="text-xs text-slate-400">({group.users.length})</span>
                    </motion.div>

                    {/* User cards grid */}
                    <motion.div
                      className="grid gap-3 sm:grid-cols-2"
                      variants={containerVariants}
                    >
                      {group.users.map((user, i) => (
                        <UserCard
                          key={user.id}
                          user={user}
                          onSelect={handleSelectUser}
                          index={i}
                        />
                      ))}
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selecting indicator */}
          {selectingUser && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <div className="flex gap-1">
                  <div className="loading-dot size-2 rounded-full bg-teal-600" />
                  <div className="loading-dot size-2 rounded-full bg-teal-600" />
                  <div className="loading-dot size-2 rounded-full bg-teal-600" />
                </div>
                <span className="text-sm text-slate-600">Connexion en cours...</span>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
