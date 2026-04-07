// TODO: add request dedup / caching layer for dashboard endpoints
// that get called on every nav. TanStack Query handles some of this
// but the raw fetch calls in exportData don't go through it.

const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  getDashboardStats: (clientId?: string | null) => 
    request<Record<string, unknown>>(`/dashboard/stats${clientId ? `?clientId=${clientId}` : ""}`),
  getChartData: (params: string) => request<Record<string, unknown>>(`/dashboard/chart?${params}`),
  getGoals: (clientId?: string | null) => 
    request<any[]>(`/dashboard/goals${clientId ? `?clientId=${clientId}` : ""}`),
  getAlerts: (clientId?: string | null) => 
    request<any[]>(`/dashboard/alerts${clientId ? `?clientId=${clientId}` : ""}`),

  // Clients
  getClients: () => request<any[]>("/clients"),
  getClient: (id: string) => request(`/clients/${id}`),
  createClient: (data: Record<string, unknown>) => request("/clients", { method: "POST", body: JSON.stringify(data) }),
  updateClient: (id: string, data: Record<string, unknown>) => request(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteClient: (id: string) => request(`/clients/${id}`, { method: "DELETE" }),

  // Sources
  getSources: (clientId?: string | null) => 
    request<any[]>(`/sources${clientId ? `?clientId=${clientId}` : ""}`),
  getSource: (id: string) => request(`/sources/${id}`),
  createSource: (data: Record<string, unknown>) => request("/sources", { method: "POST", body: JSON.stringify(data) }),
  updateSource: (id: string, data: Record<string, unknown>) => request(`/sources/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSource: (id: string) => request(`/sources/${id}`, { method: "DELETE" }),

  // Pipelines
  getPipelines: (clientId?: string | null) => 
    request<any[]>(`/pipelines${clientId ? `?clientId=${clientId}` : ""}`),
  getPipeline: (id: string) => request(`/pipelines/${id}`),
  createPipeline: (data: Record<string, unknown>) => request("/pipelines", { method: "POST", body: JSON.stringify(data) }),
  updatePipeline: (id: string, data: Record<string, unknown>) => request(`/pipelines/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePipeline: (id: string) => request(`/pipelines/${id}`, { method: "DELETE" }),

  // Reports
  getReports: (clientId?: string | null) => 
    request<any[]>(`/reports${clientId ? `?clientId=${clientId}` : ""}`),
  createReport: (data: Record<string, unknown>) => request("/reports", { method: "POST", body: JSON.stringify(data) }),
  deleteReport: (id: string) => request(`/reports/${id}`, { method: "DELETE" }),
  getDispatches: (clientId?: string | null) => 
    request<any[]>(`/reports/dispatches${clientId ? `?clientId=${clientId}` : ""}`),
  createDispatch: (data: Record<string, unknown>) => request("/reports/dispatches", { method: "POST", body: JSON.stringify(data) }),
  updateDispatch: (id: string, data: Record<string, unknown>) => request(`/reports/dispatches/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDispatch: (id: string) => request(`/reports/dispatches/${id}`, { method: "DELETE" }),

  // Templates
  getTemplates: () => request("/templates"),
  createTemplate: (data: Record<string, unknown>) => request("/templates", { method: "POST", body: JSON.stringify(data) }),
  updateTemplate: (id: string, data: Record<string, unknown>) => request(`/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTemplate: (id: string) => request(`/templates/${id}`, { method: "DELETE" }),

  // Users
  getUsers: () => request("/users"),
  createUser: (data: Record<string, unknown>) => request("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: Record<string, unknown>) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: "DELETE" }),

  // Agencies
  getAgencies: () => request("/agencies"),
  createAgency: (data: Record<string, unknown>) => request("/agencies", { method: "POST", body: JSON.stringify(data) }),
  updateAgency: (id: string, data: Record<string, unknown>) => request(`/agencies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAgency: (id: string) => request(`/agencies/${id}`, { method: "DELETE" }),

  // Activity
  getActivity: (limit?: number, clientId?: string | null) => 
    request<any[]>(`/activity?limit=${limit || 50}${clientId ? `&clientId=${clientId}` : ""}`),

  // Branding
  getBranding: () => request("/branding"),
  updateBranding: (data: Record<string, unknown>) => request("/branding", { method: "PUT", body: JSON.stringify(data) }),

  // Data export — note: this returns a raw Response, not parsed JSON
  // because we sometimes want to stream the download directly
  exportData: (format: string, params: string) => fetch(`${API_BASE}/export?format=${format}&${params}`),
};
