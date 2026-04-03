import { create } from "zustand";

export type Page =
  | "dashboard"
  | "clients"
  | "sources"
  | "pipelines"
  | "reports"
  | "templates"
  | "users"
  | "agencies"
  | "branding"
  | "ai-chat";

// simple client-side page router. we don't use next/link because all pages
// are client components rendered inside AppShell based on this state.

interface AppState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  setCurrentPage: (page) => set({ currentPage: page }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  theme: "light",
  setTheme: (theme) => set({ theme }),
}));
