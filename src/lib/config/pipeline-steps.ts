// pipeline step types for the pipeline builder
// some of these (e.g. pivot/unpivot) are defined but the actual transform
// logic in the backend only handles the basic ones for now

export interface PipelineStep {
  id: string
  type: string
  category: 'source' | 'cleaning' | 'transform' | 'aggregate' | 'output'
  name: string
  description: string
  icon: string
  config: Record<string, unknown>
}

export const pipelineStepTypes: PipelineStep[] = [
  // Source
  { id: 'step-source-load', type: 'load_source', category: 'source', name: 'Load Source', description: 'Load data from a connected data source', icon: 'Database', config: { sourceId: '', previewRows: 100 } },
  { id: 'step-source-merge', type: 'merge_sources', category: 'source', name: 'Merge Sources', description: 'Join multiple data sources together', icon: 'GitMerge', config: { sources: [], joinType: 'inner', joinKey: '' } },
  // Cleaning
  { id: 'step-clean-rename', type: 'rename_columns', category: 'cleaning', name: 'Rename Columns', description: 'Rename one or more columns', icon: 'Type', config: { mappings: [] } },
  { id: 'step-clean-select', type: 'select_columns', category: 'cleaning', name: 'Select Columns', description: 'Keep only specified columns', icon: 'Columns', config: { columns: [] } },
  { id: 'step-clean-filter', type: 'filter_rows', category: 'cleaning', name: 'Filter Rows', description: 'Filter rows based on conditions', icon: 'Filter', config: { conditions: [], logic: 'and' } },
  { id: 'step-clean-dedup', type: 'drop_duplicates', category: 'cleaning', name: 'Drop Duplicates', description: 'Remove duplicate rows', icon: 'CopyX', config: { columns: [] } },
  { id: 'step-clean-fill', type: 'fill_nulls', category: 'cleaning', name: 'Fill Nulls', description: 'Fill null values with specified defaults', icon: 'PaintBucket', config: { strategy: 'value', value: '' } },
  { id: 'step-clean-dropnull', type: 'drop_nulls', category: 'cleaning', name: 'Drop Nulls', description: 'Remove rows with null values', icon: 'Trash2', config: { columns: [], threshold: 0.5 } },
  { id: 'step-clean-trim', type: 'trim_whitespace', category: 'cleaning', name: 'Trim Whitespace', description: 'Remove leading and trailing whitespace', icon: 'Space', config: { columns: ['all'] } },
  { id: 'step-clean-case', type: 'standardize_case', category: 'cleaning', name: 'Standardize Case', description: 'Convert text to consistent case', icon: 'CaseSensitive', config: { columns: [], case: 'title' } },
  // Transform
  { id: 'step-trans-date', type: 'parse_dates', category: 'transform', name: 'Parse Dates', description: 'Convert date strings to date values', icon: 'Calendar', config: { columns: [], format: 'auto' } },
  { id: 'step-trans-num', type: 'parse_numbers', category: 'transform', name: 'Parse Numbers', description: 'Convert strings to numeric values', icon: 'Hash', config: { columns: [], locale: 'en-US' } },
  { id: 'step-trans-currency', type: 'parse_currency', category: 'transform', name: 'Parse Currency', description: 'Extract numeric values from currency strings', icon: 'DollarSign', config: { columns: [], currency: 'USD' } },
  { id: 'step-trans-addcol', type: 'add_column', category: 'transform', name: 'Add Column', description: 'Create a new computed column', icon: 'PlusCircle', config: { name: '', expression: '' } },
  { id: 'step-trans-dateparts', type: 'extract_date_parts', category: 'transform', name: 'Extract Date Parts', description: 'Extract year, month, day from date columns', icon: 'CalendarDays', config: { column: '', parts: ['year', 'month', 'day'] } },
  { id: 'step-trans-categorize', type: 'categorize', category: 'transform', name: 'Categorize', description: 'Create categories based on value ranges', icon: 'Tag', config: { column: '', rules: [] } },
  { id: 'step-trans-normalize', type: 'normalize', category: 'transform', name: 'Normalize', description: 'Scale numeric values to a standard range', icon: 'Minimize2', config: { columns: [], method: 'minmax', range: [0, 1] } },
  // Aggregate
  { id: 'step-agg-group', type: 'group_aggregate', category: 'aggregate', name: 'Group Aggregate', description: 'Group rows and compute aggregates', icon: 'LayoutGrid', config: { groupBy: [], aggregations: [] } },
  // TODO: pivot and unpivot are defined here but not yet implemented in
  // the actual pipeline execution engine. frontend only for now.
  { id: 'step-agg-pivot', type: 'pivot', category: 'aggregate', name: 'Pivot', description: 'Pivot data from long to wide format', icon: 'RotateCw', config: { indexColumn: '', pivotColumn: '', valueColumn: '', aggFunction: 'sum' } },
  { id: 'step-agg-unpivot', type: 'unpivot', category: 'aggregate', name: 'Unpivot', description: 'Unpivot data from wide to long format', icon: 'RotateCcw', config: { idColumns: [], valueColumns: [], variableName: 'variable', valueName: 'value' } },
  // Output
  { id: 'step-out-sort', type: 'sort', category: 'output', name: 'Sort', description: 'Sort rows by one or more columns', icon: 'ArrowUpDown', config: { columns: [], directions: [] } },
  { id: 'step-out-limit', type: 'limit', category: 'output', name: 'Limit', description: 'Limit the number of output rows', icon: 'ArrowDownToLine', config: { count: 1000, offset: 0 } },
]

export const stepCategories = [
  { id: 'source', name: 'Source', color: '#2563EB' },
  { id: 'cleaning', name: 'Cleaning', color: '#10B981' },
  { id: 'transform', name: 'Transform', color: '#F59E0B' },
  { id: 'aggregate', name: 'Aggregate', color: '#EF4444' },
  { id: 'output', name: 'Output', color: '#8B5CF6' },
]
