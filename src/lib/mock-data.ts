// Type definitions for DataBridge Analytics Agency Platform
// NOTE: Config constants have been moved to /src/lib/config/
//   - WidgetType, WidgetTypeConfig, widgetTypes → @/lib/config/widget-types
//   - PipelineStep, pipelineStepTypes, stepCategories → @/lib/config/pipeline-steps
//   - Industry, ClientStatus, industryOptions, fontOptions → @/lib/config/constants

// Re-export types from config for backward compatibility
export type { ClientStatus, Industry } from '@/lib/config/constants'
export { industryOptions, fontOptions } from '@/lib/config/constants'

export type PipelineStatus = 'draft' | 'active' | 'paused' | 'error'
export type DataSourceStatus = 'active' | 'error' | 'disconnected' | 'syncing'

export interface ActivityEvent {
  id: string
  type: 'pipeline_run' | 'client_added' | 'client_suspended' | 'data_source_connected' | 'dashboard_created' | 'template_deployed'
  message: string
  clientName: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export interface DashboardTemplate {
  id: string
  name: string
  description: string
  widgetCount: number
  category: string
  thumbnail: string
  deployedCount: number
}

export interface SmeClient {
  id: string
  name: string
  industry: string
  contactName: string
  contactEmail: string
  contactPhone: string
  status: string
  storageUsedBytes: number
  dataSourcesCount: number
  pipelinesCount: number
  dashboardsCount: number
  mrr: number
  planName: string
  rowsProcessed: number
  lastActive: string
  createdAt: string
}

export interface Agency {
  id: string
  name: string
  slug: string
  plan: string
  brandAppName: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  brandAccentColor: string
  brandFont: string
  brandLogoUrl: string | null
  brandSupportEmail: string | null
  customDomain: string | null
  customDomainVerified: boolean
  maxSmeClients: number
  maxPipelinesPerClient: number
  maxDataSourcesPerClient: number
  maxStorageGb: number
  status: string
}
