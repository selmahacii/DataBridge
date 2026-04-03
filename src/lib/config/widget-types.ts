// widget types for the dashboard builder
// NOTE: defaultWidth/Height are in grid units (12-col grid)

export type WidgetType = 'kpi_card' | 'line_chart' | 'bar_chart' | 'pie_chart' | 'area_chart' | 'data_table' | 'text_block'

export interface WidgetTypeConfig {
  type: WidgetType
  name: string
  icon: string
  description: string
  defaultWidth: number
  defaultHeight: number
}

export const widgetTypes: WidgetTypeConfig[] = [
  { type: 'kpi_card', name: 'KPI Card', icon: 'Gauge', description: 'Display a single key metric with trend', defaultWidth: 3, defaultHeight: 2 },
  { type: 'line_chart', name: 'Line Chart', icon: 'LineChart', description: 'Show trends over time', defaultWidth: 6, defaultHeight: 4 },
  { type: 'bar_chart', name: 'Bar Chart', icon: 'BarChart3', description: 'Compare values across categories', defaultWidth: 6, defaultHeight: 4 },
  { type: 'pie_chart', name: 'Pie Chart', icon: 'PieChart', description: 'Show proportions of a whole', defaultWidth: 4, defaultHeight: 4 },
  { type: 'area_chart', name: 'Area Chart', icon: 'AreaChart', description: 'Show volume over time with filled area', defaultWidth: 6, defaultHeight: 4 },
  { type: 'data_table', name: 'Data Table', icon: 'Table', description: 'Display data in a tabular format', defaultWidth: 8, defaultHeight: 4 },
  { type: 'text_block', name: 'Text Block', icon: 'Type', description: 'Add descriptive text or notes', defaultWidth: 4, defaultHeight: 2 },
]
