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

interface NavItem {
  label: string;
  page: Page;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", page: "dashboard", icon: LayoutDashboard },
  { label: "Clients", page: "clients", icon: Users },
  { label: "Data Sources", page: "sources", icon: Database },
  { label: "Pipelines", page: "pipelines", icon: GitBranch },
  { label: "Reports", page: "reports", icon: FileBarChart },
];

const managementNav: NavItem[] = [
  { label: "Templates", page: "templates", icon: LayoutTemplate },
  { label: "Users", page: "users", icon: UserCog },
  { label: "Agencies", page: "agencies", icon: Building2 },
  { label: "Branding", page: "branding", icon: Palette },
];

const toolsNav: NavItem[] = [
  { label: "Data Assistant", page: "ai-chat", icon: MessageSquare },
];

export function AppSidebar() {
  const { currentPage, setCurrentPage } = useAppStore();
  const { theme, setTheme } = useTheme();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-sm font-semibold tracking-tight whitespace-nowrap group-data-[collapsible=icon]:hidden font-heading uppercase text-glow">
            DataBridge
          </span>
        </div>
        <div className="flex group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span className="text-[10px] font-bold text-green-500 tracking-wider">PULSE: LIVE</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={currentPage === item.page}
                    onClick={() => setCurrentPage(item.page)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNav.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={currentPage === item.page}
                    onClick={() => setCurrentPage(item.page)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNav.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={currentPage === item.page}
                    onClick={() => setCurrentPage(item.page)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="shrink-0"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <div className="flex items-center gap-2 min-w-0 group-data-[collapsible=icon]:hidden">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate">Admin User</span>
              <span className="text-xs text-muted-foreground truncate">
                admin@databridge.io
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
