'use client'

import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useAuthStore, type UserRole } from '@/stores/auth-store'
import { useAppStore, type AppPage } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Database,
  GitBranch,
  FileText,
  MessageSquare,
  Users,
  Palette,
  LayoutTemplate,
  Workflow,
  Grid3X3,
  Activity,
  Building2,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  User,
} from 'lucide-react'

interface NavItemConfig {
  page: AppPage
  label: string
  icon: ReactNode
}

const smeNavItems: NavItemConfig[] = [
  { page: 'sme-dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="size-4" /> },
  { page: 'sme-sources', label: 'Sources de données', icon: <Database className="size-4" /> },
  { page: 'sme-pipelines', label: 'Pipelines', icon: <GitBranch className="size-4" /> },
  { page: 'sme-reports', label: 'Rapports', icon: <FileText className="size-4" /> },
  { page: 'sme-ai-chat', label: 'Assistant DataBridge', icon: <MessageSquare className="size-4" /> },
]

const agencyNavItems: NavItemConfig[] = [
  { page: 'agency-dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="size-4" /> },
  { page: 'agency-clients', label: 'Clients', icon: <Users className="size-4" /> },
  { page: 'agency-branding', label: 'Marque & Branding', icon: <Palette className="size-4" /> },
  { page: 'agency-templates', label: 'Templates', icon: <LayoutTemplate className="size-4" /> },
  { page: 'agency-pipeline-builder', label: 'Constructeur de Pipeline', icon: <Workflow className="size-4" /> },
  { page: 'agency-dashboard-builder', label: 'Constructeur de Dashboard', icon: <Grid3X3 className="size-4" /> },
]

const adminNavItems: NavItemConfig[] = [
  { page: 'admin-platform', label: 'Plateforme', icon: <Activity className="size-4" /> },
  { page: 'admin-agencies', label: 'Agences', icon: <Building2 className="size-4" /> },
  { page: 'admin-stats', label: 'Statistiques', icon: <BarChart3 className="size-4" /> },
]

function getNavItems(role?: UserRole): NavItemConfig[] {
  if (role === 'super_admin') return adminNavItems
  if (role === 'agency_admin' || role === 'agency_viewer') return agencyNavItems
  return smeNavItems
}

function getPageBreadcrumbs(page: AppPage): { label: string }[] {
  const map: Record<AppPage, string[]> = {
    'sme-dashboard': ['Tableau de bord'],
    'sme-sources': ['Sources de données'],
    'sme-pipelines': ['Pipelines'],
    'sme-reports': ['Rapports'],
    'sme-ai-chat': ['Assistant DataBridge'],
    'agency-dashboard': ['Tableau de bord'],
    'agency-clients': ['Clients'],
    'agency-branding': ['Marque & Branding'],
    'agency-templates': ['Templates'],
    'agency-pipeline-builder': ['Constructeur de Pipeline'],
    'agency-dashboard-builder': ['Constructeur de Dashboard'],
    'admin-platform': ['Plateforme'],
    'admin-agencies': ['Agences'],
    'admin-stats': ['Statistiques'],
  }
  return (map[page] || [page]).map((label) => ({ label }))
}

function getPageTitle(page: AppPage): string {
  const map: Record<AppPage, string> = {
    'sme-dashboard': 'Tableau de bord',
    'sme-sources': 'Sources de données',
    'sme-pipelines': 'Pipelines',
    'sme-reports': 'Rapports',
    'sme-ai-chat': 'Assistant DataBridge',
    'agency-dashboard': 'Tableau de bord',
    'agency-clients': 'Clients',
    'agency-branding': 'Marque & Branding',
    'agency-templates': 'Templates',
    'agency-pipeline-builder': 'Constructeur de Pipeline',
    'agency-dashboard-builder': 'Constructeur de Dashboard',
    'admin-platform': 'Plateforme',
    'admin-agencies': 'Agences',
    'admin-stats': 'Statistiques',
  }
  return map[page] || page
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function Sidebar() {
  const { user } = useAuthStore()
  const { currentPage, setCurrentPage, sidebarCollapsed, toggleSidebar } = useAppStore()
  const navItems = getNavItems(user?.role)
  const appName = user?.agencyName || 'DataBridge'

  return (
    <motion.aside
      className={cn(
        'sidebar-transition brand-gradient relative z-20 flex flex-col border-r border-white/10',
        sidebarCollapsed ? 'w-[68px] min-w-[68px]' : 'w-[260px] min-w-[260px]'
      )}
      animate={{ width: sidebarCollapsed ? 68 : 260 }}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        <img src="/logo.png" alt="DataBridge" className="size-9 shrink-0 rounded-lg" />
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              className="overflow-hidden"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="whitespace-nowrap text-base font-bold text-white tracking-tight">
                {appName}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator className="bg-white/10" />

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.page
            return (
              <li key={item.page}>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setCurrentPage(item.page)}
                        className={cn(
                          'sidebar-item-transition group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                          isActive
                            ? 'bg-white/15 text-white shadow-sm'
                            : 'text-teal-100/70 hover:bg-white/8 hover:text-white'
                        )}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <AnimatePresence>
                          {!sidebarCollapsed && (
                            <motion.span
                              className="truncate"
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        {isActive && (
                          <motion.div
                            className="absolute left-0 h-6 w-[3px] rounded-r-full bg-white"
                            layoutId="activeIndicator"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator className="bg-white/10" />

      <div className="px-3 py-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/8">
                <Avatar className="size-8 shrink-0 ring-2 ring-white/20">
                  <AvatarFallback className="bg-white/20 text-xs font-semibold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      className="min-w-0 flex-1 overflow-hidden"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <p className="truncate text-sm font-medium text-white">{user.name}</p>
                      <p className="truncate text-xs text-teal-200/60">
                        {user.role === 'super_admin'
                          ? 'Super Admin'
                          : user.role === 'agency_admin'
                            ? 'Admin Agence'
                            : user.role === 'agency_viewer'
                              ? 'Viewer'
                              : 'Utilisateur'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 size-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 size-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 size-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-30 flex size-6 items-center justify-center rounded-full border border-white/20 bg-white text-slate-600 shadow-md transition-colors hover:bg-slate-50 hover:text-slate-900"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="size-3.5" />
        ) : (
          <ChevronLeft className="size-3.5" />
        )}
      </button>
    </motion.aside>
  )
}

function Header() {
  const { currentPage } = useAppStore()
  const { user, logout } = useAuthStore()
  const breadcrumbs = getPageBreadcrumbs(currentPage)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-6">
      {/* Left: Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index}>
              {index < breadcrumbs.length - 1 ? (
                <BreadcrumbLink href="#">{crumb.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative size-9 text-muted-foreground">
                <Bell className="size-4" />
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* User avatar */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-9 rounded-full p-0">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-teal-600 text-xs font-semibold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 size-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 size-4" />
                Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 size-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

function PlaceholderContent({ page }: { page: AppPage }) {
  const title = getPageTitle(page)
  return (
    <motion.div
      className="flex h-full flex-col items-center justify-center gap-4 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
        <LayoutDashboard className="size-8" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Cette page est en cours de développement.
        </p>
      </div>
    </motion.div>
  )
}

interface AppShellProps {
  children?: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { currentPage } = useAppStore()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="custom-scrollbar flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children || <PlaceholderContent page={currentPage} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
