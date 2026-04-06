"use client";

import { useAppStore } from "@/stores/app-store";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { ClientsPage } from "@/components/dashboard/clients-page";
import { SourcesPage } from "@/components/dashboard/sources-page";
import { PipelinesPage } from "@/components/dashboard/pipelines-page";
import { ReportsPage } from "@/components/dashboard/reports-page";
import { TemplatesPage } from "@/components/dashboard/templates-page";
import { UsersPage } from "@/components/dashboard/users-page";
import { AgenciesPage } from "@/components/dashboard/agencies-page";
import { BrandingPage } from "@/components/dashboard/branding-page";
import { AiChatPage } from "@/components/dashboard/ai-chat-page";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, Menu, LayoutGrid, AlertCircle, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const pageMap: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  clients: ClientsPage,
  sources: SourcesPage,
  pipelines: PipelinesPage,
  reports: ReportsPage,
  templates: TemplatesPage,
  users: UsersPage,
  agencies: AgenciesPage,
  branding: BrandingPage,
  "ai-chat": AiChatPage,
};

export default function Home() {
  const { currentPage, selectedClientId, setSelectedClientId } = useAppStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const PageComponent = pageMap[currentPage] ?? DashboardPage;

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.getClients() as Promise<any[]>,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["global-alerts"],
    queryFn: () => api.getAlerts() as Promise<any[]>,
    refetchInterval: 30000, 
  });

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background/50">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-xl transition-all duration-300">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 h-9 w-9 rounded-lg hover:bg-accent/50" />
            <Separator orientation="vertical" className="h-4 opacity-50" />
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Active Context</span>
              <Select
                value={selectedClientId || "all"}
                onValueChange={(val) => setSelectedClientId(val === "all" ? null : val)}
              >
                <SelectTrigger className="h-9 w-[220px] rounded-lg border-none bg-accent/30 font-medium hover:bg-accent/50 transition-colors focus:ring-1 focus:ring-primary/20" size="sm">
                  <SelectValue placeholder="All Clients (Aggregate)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-medium">All Clients (Aggregate)</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:flex items-center bg-accent/30 rounded-lg h-9 px-3 border border-border/20 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <Input 
                placeholder="Search analytics..." 
                className="h-full border-none bg-transparent p-0 text-xs w-[180px] focus-visible:ring-0"
              />
              <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
            
            <Popover>
              <PopoverTrigger className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9 rounded-lg relative"
              )}>
                <Bell className="h-4 w-4" />
                {alerts.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl" align="end">
                <div className="p-4 border-b border-border/50 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Intelligence Alerts</span>
                    <Badge variant="secondary" className="text-[10px] h-4 font-bold">{alerts.length}</Badge>
                  </div>
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-4 border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer group">
                        <div className="flex gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner",
                            alert.severity === 'high' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                          )}>
                            {alert.severity === 'high' ? <AlertCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold leading-tight group-hover:text-primary transition-colors">{alert.message}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">Just now • Systems Engine</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <Bell className="h-8 w-8 opacity-10" />
                      <p className="text-xs font-medium">All systems operational</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-muted/10 border-t border-border/50 text-center">
                  <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest h-8">View History Log</Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg lg:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            <div className="p-6 md:p-8">
              <PageComponent />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
