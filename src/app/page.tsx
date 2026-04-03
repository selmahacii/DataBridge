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
  const { currentPage } = useAppStore();
  const PageComponent = pageMap[currentPage] ?? DashboardPage;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
          <h2 className="text-sm font-medium capitalize">
            {currentPage.replace(/-/g, " ")}
          </h2>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <PageComponent />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
