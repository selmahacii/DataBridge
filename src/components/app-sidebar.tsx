"use client";

import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  Database,
  GitBranch,
  FileBarChart,
  LayoutTemplate,
  UserCog,
  Building2,
  Palette,
  MessageSquare,
  Moon,
  Sun,
  Activity,
  ShieldCheck,
  BrainCircuit,
  LineChart,
  History,
  Server,
  Package,
  Fingerprint,
} from "lucide-react";
import { useAppStore, type Page } from "@/stores/app-store";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface NavItem {
  label: string;
  page: Page;
  icon: React.ElementType;
}

const intelligenceNav: NavItem[] = [
  { label: "Performance Overview", page: "dashboard", icon: LayoutDashboard },
  { label: "Strategic Clients", page: "clients", icon: Users },
  { label: "Automated Reports", page: "reports", icon: FileBarChart },
  { label: "AI Feature Store", page: "feature-store", icon: Package },
  { label: "Inference Results", page: "inference-results", icon: BrainCircuit },
];

const operationsNav: NavItem[] = [
  { label: "Integration Hub", page: "sources", icon: Database },
  { label: "ETL Pipelines", page: "pipelines", icon: GitBranch },
  { label: "Pipeline Status", page: "pipeline-status", icon: Activity },
  { label: "Data Quality Center", page: "data-quality", icon: ShieldCheck },
  { label: "Intelligence Sync", page: "ai-chat", icon: MessageSquare },
];

const administrationNav: NavItem[] = [
  { label: "Report Blueprints", page: "templates", icon: LayoutTemplate },
  { label: "Agency Branding", page: "branding", icon: Palette },
  { label: "Access Control", page: "users", icon: UserCog },
  { label: "Global Network", page: "agencies", icon: Building2 },
];

export function AppSidebar() {
  const { currentPage, setCurrentPage } = useAppStore();
  const { theme, setTheme } = useTheme();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-background/95 backdrop-blur-md">
      <SidebarHeader className="flex flex-row items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-primary/10 p-2 shadow-sm ring-1 ring-primary/20 backdrop-blur-xl">
            <Logo className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight font-heading uppercase text-glow">
              DataBridge
            </span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none">
              Analytics OS
            </span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarSeparator className="opacity-50" />
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Intelligence & ML</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {intelligenceNav.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={currentPage === item.page}
                    onClick={() => setCurrentPage(item.page)}
                    tooltip={item.label}
                    className={cn(
                      "transition-all duration-200",
                      currentPage === item.page ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted/50"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", currentPage === item.page ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsNav.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={currentPage === item.page}
                    onClick={() => setCurrentPage(item.page)}
                    tooltip={item.label}
                    className={cn(
                      "transition-all duration-200",
                      currentPage === item.page ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted/50"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", currentPage === item.page ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {administrationNav.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={currentPage === item.page}
                    onClick={() => setCurrentPage(item.page)}
                    tooltip={item.label}
                    className={cn(
                      "transition-all duration-200",
                      currentPage === item.page ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted/50"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", currentPage === item.page ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4 opacity-50" />
        <div className="flex flex-col gap-3">
          <div 
            className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center cursor-pointer hover:bg-muted/30 rounded-lg p-1 transition-colors"
            onClick={() => setCurrentPage("audit-trail")}
          >
            <Avatar className="h-8 w-8 border border-border/50 shadow-sm ring-1 ring-primary/10">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">SH</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-bold truncate">Selma Haci</span>
              <div className="flex items-center gap-1">
                <Fingerprint className="h-2.5 w-2.5 text-primary" />
                <span className="text-[10px] text-muted-foreground truncate font-medium">Audit Trail Available</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center px-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Sun className="h-4 w-4 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-4 w-4 transition-all scale-0 rotate-90 dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:hidden"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
