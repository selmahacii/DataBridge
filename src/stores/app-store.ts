import { create } from "zustand";

export type Page =
  | "dashboard"
  | "clients"
  | "sources"
  | "pipelines"
  | "pipeline-status"
  | "data-quality"
  | "feature-store"
  | "inference-results"
  | "reports"
  | "templates"
  | "users"
  | "agencies"
  | "branding"
  | "ai-chat"
  | "audit-trail";

interface AppState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  setCurrentPage: (page) => set({ currentPage: page }),
  selectedClientId: null,
  setSelectedClientId: (id) => set({ selectedClientId: id }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: "light",
  setTheme: (theme) => set({ theme }),
}));
