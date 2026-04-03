import { create } from 'zustand';

export type PipelineStepCategory = 'source' | 'cleaning' | 'transform' | 'aggregate' | 'output';

export interface TransformationStep {
  id: string;
  type: string;
  name: string;
  icon: string;
  enabled: boolean;
  config: Record<string, unknown>;
  category: PipelineStepCategory;
}

export interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  steps: TransformationStep[];
  scheduleType: 'manual' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  scheduleCron: string | null;
  status: 'draft' | 'active' | 'paused' | 'error';
  outputRowCount: number;
  lastRunAt: Date | null;
  lastRunDurationMs: number | null;
  lastRunStatus: 'success' | 'error' | 'running' | null;
  totalRuns: number;
  failedRuns: number;
}

export interface PipelineRunLog {
  runId: string;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  status: 'running' | 'success' | 'error';
  rowsProcessed: number;
  errorMessage: string | null;
}

export interface PipelineState {
  // Current pipeline being edited/viewed
  currentPipeline: PipelineConfig | null;
  availableSteps: AvailableStep[];
  isDirty: boolean;
  isRunning: boolean;
  runProgress: number;
  runLogs: PipelineRunLog[];

  // Actions
  loadPipeline: (pipeline: PipelineConfig) => void;
  createNewPipeline: (name: string, description?: string) => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  addStep: (step: TransformationStep) => void;
  addStepByType: (type: string) => void;
  removeStep: (index: number) => void;
  updateStep: (index: number, config: Partial<TransformationStep>) => void;
  moveStep: (from: number, to: number) => void;
  toggleStep: (index: number) => void;
  duplicateStep: (index: number) => void;
  clearSteps: () => void;
  runPipeline: () => Promise<void>;
  resetPipeline: () => void;
  markClean: () => void;
  setRunProgress: (progress: number) => void;
  addRunLog: (log: PipelineRunLog) => void;
  clearRunLogs: () => void;
}

export interface AvailableStep {
  type: string;
  name: string;
  icon: string;
  category: PipelineStepCategory;
  description: string;
  defaultConfig: Record<string, unknown>;
}

export const AVAILABLE_STEPS: AvailableStep[] = [
  {
    type: 'csv_import',
    name: 'CSV Import',
    icon: 'FileSpreadsheet',
    category: 'source',
    description: 'Import data from a CSV file',
    defaultConfig: { delimiter: ',', encoding: 'utf-8', hasHeader: true, skipRows: 0 },
  },
  {
    type: 'excel_import',
    name: 'Excel Import',
    icon: 'Sheet',
    category: 'source',
    description: 'Import data from an Excel spreadsheet',
    defaultConfig: { sheetName: 'Sheet1', hasHeader: true },
  },
  {
    type: 'google_sheets',
    name: 'Google Sheets',
    icon: 'Table',
    category: 'source',
    description: 'Connect to a Google Sheets document',
    defaultConfig: { sheetId: '', range: 'A:Z', hasHeader: true },
  },
  {
    type: 'api_fetch',
    name: 'API Fetch',
    icon: 'Globe',
    category: 'source',
    description: 'Fetch data from a REST API endpoint',
    defaultConfig: { url: '', method: 'GET', headers: '{}', body: '', paginationType: 'none' },
  },
  {
    type: 'database_query',
    name: 'Database Query',
    icon: 'Database',
    category: 'source',
    description: 'Query an external database',
    defaultConfig: { connector: '', query: '', connectionParams: {} },
  },

  {
    type: 'remove_duplicates',
    name: 'Remove Duplicates',
    icon: 'CopyX',
    category: 'cleaning',
    description: 'Remove duplicate rows from the dataset',
    defaultConfig: { columns: [], keep: 'first' },
  },
  {
    type: 'filter_rows',
    name: 'Filter Rows',
    icon: 'Filter',
    category: 'cleaning',
    description: 'Filter rows based on conditions',
    defaultConfig: { conditions: [], logic: 'and' },
  },
  {
    type: 'handle_nulls',
    name: 'Handle Null Values',
    icon: 'Eraser',
    category: 'cleaning',
    description: 'Fill or remove null/empty values',
    defaultConfig: { strategy: 'drop', fillValue: '', columns: [] },
  },
  {
    type: 'trim_whitespace',
    name: 'Trim Whitespace',
    icon: 'Scissors',
    category: 'cleaning',
    description: 'Remove leading and trailing whitespace',
    defaultConfig: { columns: [] },
  },
  {
    type: 'change_types',
    name: 'Change Data Types',
    icon: 'Type',
    category: 'cleaning',
    description: 'Convert column data types',
    defaultConfig: { mappings: {} },
  },

  {
    type: 'rename_columns',
    name: 'Rename Columns',
    icon: 'PenLine',
    category: 'transform',
    description: 'Rename one or more columns',
    defaultConfig: { mappings: {} },
  },
  {
    type: 'select_columns',
    name: 'Select Columns',
    icon: 'Columns3',
    category: 'transform',
    description: 'Keep only specific columns',
    defaultConfig: { columns: [], mode: 'keep' },
  },
  {
    type: 'merge_columns',
    name: 'Merge Columns',
    icon: 'GitMerge',
    category: 'transform',
    description: 'Merge two or more columns into one',
    defaultConfig: { sourceColumns: [], targetColumn: '', separator: ' ' },
  },
  {
    type: 'split_column',
    name: 'Split Column',
    icon: 'Split',
    category: 'transform',
    description: 'Split a column into multiple columns',
    defaultConfig: { sourceColumn: '', delimiter: ',', newColumnNames: [] },
  },
  {
    type: 'add_formula',
    name: 'Calculated Column',
    icon: 'Calculator',
    category: 'transform',
    description: 'Add a new column with a formula',
    defaultConfig: { newColumnName: '', expression: '' },
  },
  {
    type: 'lookup',
    name: 'Lookup / Join',
    icon: 'Link',
    category: 'transform',
    description: 'Join with another data source',
    defaultConfig: { sourceId: '', joinType: 'left', leftKey: '', rightKey: '' },
  },

  {
    type: 'group_by',
    name: 'Group & Aggregate',
    icon: 'Layers',
    category: 'aggregate',
    description: 'Group rows and compute aggregates',
    defaultConfig: { groupByColumns: [], aggregations: [] },
  },
  {
    type: 'pivot',
    name: 'Pivot Table',
    icon: 'RotateCcw',
    category: 'aggregate',
    description: 'Create a pivot table from the data',
    defaultConfig: { indexColumn: '', columnsColumn: '', valuesColumn: '', aggFunc: 'sum' },
  },
  {
    type: 'sort',
    name: 'Sort',
    icon: 'ArrowUpDown',
    category: 'aggregate',
    description: 'Sort rows by one or more columns',
    defaultConfig: { sortColumns: [], direction: 'asc' },
  },
  {
    type: 'limit_rows',
    name: 'Limit Rows',
    icon: 'ListFilter',
    category: 'aggregate',
    description: 'Limit the number of rows returned',
    defaultConfig: { limit: 1000, offset: 0 },
  },

  {
    type: 'export_csv',
    name: 'Export CSV',
    icon: 'Download',
    category: 'output',
    description: 'Export the result as a CSV file',
    defaultConfig: { filename: 'output.csv', delimiter: ',', includeHeader: true },
  },
  {
    type: 'export_to_dashboard',
    name: 'Send to Dashboard',
    icon: 'LayoutDashboard',
    category: 'output',
    description: 'Push results to a dashboard widget',
    defaultConfig: { dashboardId: '', widgetId: '', refreshOnRun: true },
  },
  {
    type: 'webhook',
    name: 'Webhook',
    icon: 'Webhook',
    category: 'output',
    description: 'Send data to a webhook endpoint',
    defaultConfig: { url: '', method: 'POST', headers: '{}' },
  },
  {
    type: 'send_email',
    name: 'Email Report',
    icon: 'Mail',
    category: 'output',
    description: 'Email the results as a report',
    defaultConfig: { recipients: [], subject: '', format: 'csv' },
  },
];

function generateStepId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createStepFromAvailable(available: AvailableStep): TransformationStep {
  return {
    id: generateStepId(),
    type: available.type,
    name: available.name,
    icon: available.icon,
    enabled: true,
    config: { ...available.defaultConfig },
    category: available.category,
  };
}

export const usePipelineStore = create<PipelineState>()((set, get) => ({
  currentPipeline: null,
  availableSteps: AVAILABLE_STEPS,
  isDirty: false,
  isRunning: false,
  runProgress: 0,
  runLogs: [],

  loadPipeline: (pipeline) =>
    set({
      currentPipeline: { ...pipeline },
      isDirty: false,
      isRunning: false,
      runProgress: 0,
    }),

  createNewPipeline: (name, description = '') =>
    set({
      currentPipeline: {
        id: `pipeline_${Date.now()}`,
        name,
        description,
        steps: [],
        scheduleType: 'manual',
        scheduleCron: null,
        status: 'draft',
        outputRowCount: 0,
        lastRunAt: null,
        lastRunDurationMs: null,
        lastRunStatus: null,
        totalRuns: 0,
        failedRuns: 0,
      },
      isDirty: false,
      isRunning: false,
      runProgress: 0,
    }),

  setName: (name) =>
    set((state) => ({
      currentPipeline: state.currentPipeline
        ? { ...state.currentPipeline, name }
        : null,
      isDirty: true,
    })),

  setDescription: (description) =>
    set((state) => ({
      currentPipeline: state.currentPipeline
        ? { ...state.currentPipeline, description }
        : null,
      isDirty: true,
    })),

  addStep: (step) =>
    set((state) => {
      if (!state.currentPipeline) return state;
      const newSteps = [...state.currentPipeline.steps, step];
      return {
        currentPipeline: { ...state.currentPipeline, steps: newSteps },
        isDirty: true,
      };
    }),

  addStepByType: (type: string) => {
    const { availableSteps } = get();
    const template = availableSteps.find((s) => s.type === type);
    if (!template) return;
    get().addStep(createStepFromAvailable(template));
  },

  removeStep: (index) =>
    set((state) => {
      if (!state.currentPipeline) return state;
      const newSteps = state.currentPipeline.steps.filter((_, i) => i !== index);
      return {
        currentPipeline: { ...state.currentPipeline, steps: newSteps },
        isDirty: true,
      };
    }),

  updateStep: (index, config) =>
    set((state) => {
      if (!state.currentPipeline) return state;
      const newSteps = [...state.currentPipeline.steps];
      if (index < 0 || index >= newSteps.length) return state;
      newSteps[index] = { ...newSteps[index], ...config };
      return {
        currentPipeline: { ...state.currentPipeline, steps: newSteps },
        isDirty: true,
      };
    }),

  moveStep: (from, to) =>
    set((state) => {
      if (!state.currentPipeline) return state;
      const steps = [...state.currentPipeline.steps];
      const [moved] = steps.splice(from, 1);
      steps.splice(to, 0, moved);
      return {
        currentPipeline: { ...state.currentPipeline, steps },
        isDirty: true,
      };
    }),

  toggleStep: (index) =>
    set((state) => {
      if (!state.currentPipeline) return state;
      const newSteps = [...state.currentPipeline.steps];
      if (index < 0 || index >= newSteps.length) return state;
      newSteps[index] = { ...newSteps[index], enabled: !newSteps[index].enabled };
      return {
        currentPipeline: { ...state.currentPipeline, steps: newSteps },
        isDirty: true,
      };
    }),

  duplicateStep: (index) =>
    set((state) => {
      if (!state.currentPipeline) return state;
      const steps = [...state.currentPipeline.steps];
      const original = steps[index];
      if (!original) return state;
      const copy: TransformationStep = {
        ...structuredClone(original),
        id: generateStepId(),
        name: `${original.name} (Copy)`,
      };
      steps.splice(index + 1, 0, copy);
      return {
        currentPipeline: { ...state.currentPipeline, steps },
        isDirty: true,
      };
    }),

  clearSteps: () =>
    set((state) => {
      if (!state.currentPipeline) return state;
      return {
        currentPipeline: { ...state.currentPipeline, steps: [] },
        isDirty: true,
      };
    }),

  runPipeline: async () => {
    const { currentPipeline } = get();
    if (!currentPipeline || get().isRunning) return;

    const runId = `run_${Date.now()}`;
    const runLog: PipelineRunLog = {
      runId,
      startedAt: new Date(),
      completedAt: null,
      durationMs: null,
      status: 'running',
      rowsProcessed: 0,
      errorMessage: null,
    };

    set({
      isRunning: true,
      runProgress: 0,
      currentPipeline: {
        ...currentPipeline,
        status: 'active',
        lastRunStatus: 'running',
      },
    });
    get().addRunLog(runLog);

    // Simulate pipeline execution with progress updates
    const enabledSteps = currentPipeline.steps.filter((s) => s.enabled);
    const totalSteps = enabledSteps.length || 1;

    for (let i = 0; i < enabledSteps.length; i++) {
      // Simulate step processing time
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));
      const progress = Math.round(((i + 1) / totalSteps) * 100);
      set({ runProgress: progress });
    }

    // Finalize
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - runLog.startedAt.getTime();
    const fakeRowCount = Math.floor(Math.random() * 10000) + 100;

    set((state) => ({
      isRunning: false,
      runProgress: 100,
      currentPipeline: state.currentPipeline
        ? {
            ...state.currentPipeline,
            status: 'active',
            lastRunAt: completedAt,
            lastRunDurationMs: durationMs,
            lastRunStatus: 'success',
            outputRowCount: fakeRowCount,
            totalRuns: state.currentPipeline.totalRuns + 1,
          }
        : null,
      isDirty: false,
      runLogs: [
        ...state.runLogs.map((log) =>
          log.runId === runId
            ? {
                ...log,
                completedAt,
                durationMs,
                status: 'success' as const,
                rowsProcessed: fakeRowCount,
              }
            : log
        ),
      ],
    }));
  },

  resetPipeline: () =>
    set({
      currentPipeline: null,
      isDirty: false,
      isRunning: false,
      runProgress: 0,
    }),

  markClean: () => set({ isDirty: false }),

  setRunProgress: (progress) => set({ runProgress: progress }),

  addRunLog: (log) =>
    set((state) => ({
      runLogs: [log, ...state.runLogs],
    })),

  clearRunLogs: () => set({ runLogs: [] }),
}));

export const selectEnabledSteps = (state: PipelineState): TransformationStep[] =>
  state.currentPipeline?.steps.filter((s) => s.enabled) ?? [];

export const selectStepsByCategory = (state: PipelineState): Record<PipelineStepCategory, TransformationStep[]> => {
  const steps = state.currentPipeline?.steps ?? [];
  return {
    source: steps.filter((s) => s.category === 'source'),
    cleaning: steps.filter((s) => s.category === 'cleaning'),
    transform: steps.filter((s) => s.category === 'transform'),
    aggregate: steps.filter((s) => s.category === 'aggregate'),
    output: steps.filter((s) => s.category === 'output'),
  };
};

export const selectAvailableByCategory = (state: PipelineState): Record<PipelineStepCategory, AvailableStep[]> => {
  return {
    source: state.availableSteps.filter((s) => s.category === 'source'),
    cleaning: state.availableSteps.filter((s) => s.category === 'cleaning'),
    transform: state.availableSteps.filter((s) => s.category === 'transform'),
    aggregate: state.availableSteps.filter((s) => s.category === 'aggregate'),
    output: state.availableSteps.filter((s) => s.category === 'output'),
  };
};

export const selectIsEmpty = (state: PipelineState): boolean =>
  state.currentPipeline !== null && state.currentPipeline.steps.length === 0;

export const selectStepCount = (state: PipelineState): number =>
  state.currentPipeline?.steps.length ?? 0;

export const selectLatestRunLog = (state: PipelineState): PipelineRunLog | undefined =>
  state.runLogs[0];
