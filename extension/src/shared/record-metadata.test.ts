import { describe, it, expect } from 'vitest';
import {
  RECORD_CATEGORY_OPTIONS,
  RECORD_PRIORITY_OPTIONS,
  RECORD_STATUS_OPTIONS,
  INTERACTION_STATE_OPTIONS,
  DEFAULT_RECORD_METADATA,
  formatRecordCategory,
  formatRecordPriority,
  formatRecordStatus,
  formatInteractionState,
  shouldShowInteractionState,
} from './record-metadata';

describe('record-metadata', () => {
  describe('option lists', () => {
    it('should export category options in correct order', () => {
      expect(RECORD_CATEGORY_OPTIONS).toEqual([
        { value: 'visual', label: '视觉' },
        { value: 'copy', label: '文案' },
        { value: 'interaction', label: '交互' },
        { value: 'layout', label: '布局' },
        { value: 'data', label: '数据' },
        { value: 'state', label: '状态' },
      ]);
    });

    it('should export priority options in correct order', () => {
      expect(RECORD_PRIORITY_OPTIONS).toEqual([
        { value: 'high', label: '高' },
        { value: 'medium', label: '中' },
        { value: 'low', label: '低' },
      ]);
    });

    it('should export status options in correct order', () => {
      expect(RECORD_STATUS_OPTIONS).toEqual([
        { value: 'open', label: '待处理' },
        { value: 'resolved', label: '已处理' },
        { value: 'deferred', label: '暂缓' },
      ]);
    });

    it('should export interaction state options in correct order', () => {
      expect(INTERACTION_STATE_OPTIONS).toEqual([
        { value: 'default', label: '默认' },
        { value: 'hover', label: '悬停' },
        { value: 'focus', label: '聚焦' },
        { value: 'active', label: '按下' },
        { value: 'disabled', label: '禁用' },
        { value: 'loading', label: '加载' },
        { value: 'empty', label: '空状态' },
        { value: 'error', label: '错误' },
      ]);
    });
  });

  describe('default metadata', () => {
    it('should provide correct default values', () => {
      expect(DEFAULT_RECORD_METADATA).toEqual({
        category: 'visual',
        priority: 'medium',
        status: 'open',
        interactionState: null,
        scope: 'element',
      });
    });
  });

  describe('format helpers', () => {
    it('should format category correctly', () => {
      expect(formatRecordCategory('visual')).toBe('视觉');
      expect(formatRecordCategory('interaction')).toBe('交互');
      expect(formatRecordCategory('unknown' as any)).toBe('unknown');
    });

    it('should format priority correctly', () => {
      expect(formatRecordPriority('high')).toBe('高');
      expect(formatRecordPriority('medium')).toBe('中');
      expect(formatRecordPriority('low')).toBe('低');
    });

    it('should format status correctly', () => {
      expect(formatRecordStatus('open')).toBe('待处理');
      expect(formatRecordStatus('resolved')).toBe('已处理');
      expect(formatRecordStatus('deferred')).toBe('暂缓');
    });

    it('should format interaction state correctly', () => {
      expect(formatInteractionState('hover')).toBe('悬停');
      expect(formatInteractionState('disabled')).toBe('禁用');
      expect(formatInteractionState(null)).toBe('');
    });
  });

  describe('shouldShowInteractionState', () => {
    it('should return true for interaction and state categories', () => {
      expect(shouldShowInteractionState('interaction')).toBe(true);
      expect(shouldShowInteractionState('state')).toBe(true);
    });

    it('should return false for other categories', () => {
      expect(shouldShowInteractionState('visual')).toBe(false);
      expect(shouldShowInteractionState('copy')).toBe(false);
      expect(shouldShowInteractionState('layout')).toBe(false);
      expect(shouldShowInteractionState('data')).toBe(false);
    });
  });
});
