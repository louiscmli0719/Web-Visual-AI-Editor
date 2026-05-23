import type {
  RecordCategory,
  RecordPriority,
  RecordStatus,
  InteractionState,
  RecordMetadata,
} from './types';

export type RecordCategoryOption = {
  value: RecordCategory;
  label: string;
};

export type RecordPriorityOption = {
  value: RecordPriority;
  label: string;
};

export type RecordStatusOption = {
  value: RecordStatus;
  label: string;
};

export type InteractionStateOption = {
  value: InteractionState;
  label: string;
};

export const RECORD_CATEGORY_OPTIONS: RecordCategoryOption[] = [
  { value: 'visual', label: '视觉' },
  { value: 'copy', label: '文案' },
  { value: 'interaction', label: '交互' },
  { value: 'layout', label: '布局' },
  { value: 'data', label: '数据' },
  { value: 'state', label: '状态' },
];

export const RECORD_PRIORITY_OPTIONS: RecordPriorityOption[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

export const RECORD_STATUS_OPTIONS: RecordStatusOption[] = [
  { value: 'open', label: '待处理' },
  { value: 'resolved', label: '已处理' },
  { value: 'deferred', label: '暂缓' },
];

export const INTERACTION_STATE_OPTIONS: InteractionStateOption[] = [
  { value: 'default', label: '默认' },
  { value: 'hover', label: '悬停' },
  { value: 'focus', label: '聚焦' },
  { value: 'active', label: '按下' },
  { value: 'disabled', label: '禁用' },
  { value: 'loading', label: '加载' },
  { value: 'empty', label: '空状态' },
  { value: 'error', label: '错误' },
];

export const DEFAULT_RECORD_METADATA: RecordMetadata = {
  category: 'visual',
  priority: 'medium',
  status: 'open',
  interactionState: null,
  scope: 'element',
};

const CATEGORY_LABEL_MAP: Record<RecordCategory, string> = {
  visual: '视觉',
  copy: '文案',
  interaction: '交互',
  layout: '布局',
  data: '数据',
  state: '状态',
};

const PRIORITY_LABEL_MAP: Record<RecordPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const STATUS_LABEL_MAP: Record<RecordStatus, string> = {
  open: '待处理',
  resolved: '已处理',
  deferred: '暂缓',
};

const INTERACTION_STATE_LABEL_MAP: Record<InteractionState, string> = {
  default: '默认',
  hover: '悬停',
  focus: '聚焦',
  active: '按下',
  disabled: '禁用',
  loading: '加载',
  empty: '空状态',
  error: '错误',
};

export function formatRecordCategory(category: RecordCategory): string {
  return CATEGORY_LABEL_MAP[category] || category;
}

export function formatRecordPriority(priority: RecordPriority): string {
  return PRIORITY_LABEL_MAP[priority] || priority;
}

export function formatRecordStatus(status: RecordStatus): string {
  return STATUS_LABEL_MAP[status] || status;
}

export function formatInteractionState(state: InteractionState | null): string {
  if (state === null) return '';
  return INTERACTION_STATE_LABEL_MAP[state] || state;
}

export function shouldShowInteractionState(category: RecordCategory): boolean {
  return category === 'interaction' || category === 'state';
}
