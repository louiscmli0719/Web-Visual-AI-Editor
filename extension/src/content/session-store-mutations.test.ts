import { describe, it, expect } from 'vitest';
import {
  createInitialSession,
  addEditRecord,
  updateEditRecord,
  deleteEditRecord,
  setRecordStatus,
} from './session-store';
import type { ElementSnapshot, RecordMetadata, SharedGroup } from '../shared/types';

const mockElement: ElementSnapshot = {
  tagName: 'button',
  id: 'test-btn',
  className: 'btn-primary',
  selector: '#test-btn',
  text: 'Click me',
  rect: { x: 100, y: 200, width: 80, height: 40 },
};

const mockOptions = {
  idFactory: () => 'test-id',
  now: () => '2026-05-23T12:00:00.000Z',
};

const mockSharedGroup: SharedGroup = {
  matchLevel: 'class-primary',
  primaryFeature: 'button.btn-primary',
  totalMatched: 2,
  truncated: false,
  targets: [{ ...mockElement, id: 'peer-btn', selector: '#peer-btn' }],
};

describe('session-store mutations', () => {
  describe('addEditRecord with metadata', () => {
    it('should add element-scope record with full metadata', () => {
      const session = createInitialSession(mockOptions);
      const metadata: RecordMetadata = {
        category: 'interaction',
        priority: 'high',
        status: 'open',
        interactionState: 'hover',
        scope: 'element',
      };

      const updated = addEditRecord(session, mockElement, 'Hover state needs darker color', [], metadata, null, null, mockOptions);

      expect(updated.records).toHaveLength(1);
      expect(updated.records[0]).toMatchObject({
        element: mockElement,
        comment: 'Hover state needs darker color',
        category: 'interaction',
        priority: 'high',
        status: 'open',
        interactionState: 'hover',
        scope: 'element',
      });
    });

    it('should add page-scope record with null element', () => {
      const session = createInitialSession(mockOptions);
      const metadata: RecordMetadata = {
        category: 'layout',
        priority: 'medium',
        status: 'open',
        interactionState: 'hover',
        scope: 'page',
      };

      const updated = addEditRecord(
        session,
        mockElement,
        'Overall spacing too tight',
        [{ property: 'color', label: 'Text color', oldValue: '#000', newValue: '#fff' }],
        metadata,
        {
          size: { width: 80, height: 40 },
          viewport: { top: 200, right: 1260, bottom: 660, left: 100 },
          parent: null,
          pair: null,
        },
        mockSharedGroup,
        mockOptions
      );

      expect(updated.records).toHaveLength(1);
      expect(updated.records[0]).toMatchObject({
        element: null,
        comment: 'Overall spacing too tight',
        category: 'layout',
        priority: 'medium',
        interactionState: null,
        scope: 'page',
        styleChanges: [],
        measurements: null,
        sharedGroup: null,
      });
    });

    it('should use default metadata when not provided', () => {
      const session = createInitialSession(mockOptions);

      const updated = addEditRecord(session, mockElement, 'Fix this', [], undefined, null, null, mockOptions);

      expect(updated.records[0]).toMatchObject({
        category: 'visual',
        priority: 'medium',
        status: 'open',
        interactionState: null,
        scope: 'element',
      });
    });

    it('should add record with measurements (V0.4)', () => {
      const session = createInitialSession(mockOptions);
      const measurements = {
        size: { width: 100, height: 40 },
        viewport: { top: 200, right: 1260, bottom: 660, left: 100 },
        parent: null,
        pair: null,
      };

      const updated = addEditRecord(
        session,
        mockElement,
        'Width should be 120px',
        [],
        undefined,
        measurements,
        null,
        mockOptions
      );

      expect(updated.records[0].measurements).toEqual(measurements);
    });

    it('should add a record with shared-group scope (V0.5)', () => {
      const session = createInitialSession(mockOptions);
      const updated = addEditRecord(session, mockElement, 'Apply to all buttons', [], undefined, null, mockSharedGroup, mockOptions);

      expect(updated.records[0].sharedGroup).toEqual(mockSharedGroup);
    });
  });

  describe('updateEditRecord', () => {
    it('should update comment and metadata', () => {
      let session = createInitialSession(mockOptions);
      const metadata: RecordMetadata = {
        category: 'visual',
        priority: 'low',
        status: 'open',
        interactionState: null,
        scope: 'element',
      };
      session = addEditRecord(session, mockElement, 'Original comment', [], metadata, null, mockSharedGroup, mockOptions);

      const recordId = session.records[0].id;
      const newMetadata: RecordMetadata = {
        category: 'interaction',
        priority: 'high',
        status: 'open',
        interactionState: 'hover',
        scope: 'element',
      };

      const updated = updateEditRecord(session, recordId, 'Updated comment', newMetadata, null, null, mockOptions);

      expect(updated.records[0]).toMatchObject({
        id: recordId,
        comment: 'Updated comment',
        category: 'interaction',
        priority: 'high',
        interactionState: 'hover',
      });
      expect(updated.records[0].updatedAt).toBe('2026-05-23T12:00:00.000Z');
      expect(updated.records[0].sharedGroup).toBe(null);
    });

    it('should return unchanged session if record not found', () => {
      const session = createInitialSession(mockOptions);
      const metadata: RecordMetadata = {
        category: 'visual',
        priority: 'medium',
        status: 'open',
        interactionState: null,
        scope: 'element',
      };

      const updated = updateEditRecord(session, 'non-existent-id', 'New comment', metadata, null, null, mockOptions);

      expect(updated).toBe(session);
    });

    it('should clear element-only fields when an updated record is page-scoped', () => {
      let session = createInitialSession(mockOptions);
      session = addEditRecord(
        session,
        mockElement,
        'Element suggestion',
        [{ property: 'color', label: 'Text color', oldValue: '#000', newValue: '#fff' }],
        undefined,
        null,
        mockSharedGroup,
        mockOptions
      );

      const updated = updateEditRecord(
        session,
        session.records[0].id,
        'Page suggestion',
        {
          category: 'layout',
          priority: 'medium',
          status: 'open',
          interactionState: 'hover',
          scope: 'page',
        },
        null,
        mockSharedGroup,
        mockOptions
      );

      expect(updated.records[0]).toMatchObject({
        element: null,
        scope: 'page',
        interactionState: null,
        styleChanges: [],
        measurements: null,
        sharedGroup: null,
      });
    });
  });

  describe('deleteEditRecord', () => {
    it('should remove record by id', () => {
      let idCounter = 0;
      const uniqueIdOptions = {
        idFactory: () => `test-id-${idCounter++}`,
        now: () => '2026-05-23T12:00:00.000Z',
      };

      let session = createInitialSession(uniqueIdOptions);
      const metadata: RecordMetadata = {
        category: 'visual',
        priority: 'medium',
        status: 'open',
        interactionState: null,
        scope: 'element',
      };
      session = addEditRecord(session, mockElement, 'First', [], metadata, null, null, uniqueIdOptions);
      session = addEditRecord(session, mockElement, 'Second', [], metadata, null, null, uniqueIdOptions);

      const recordId = session.records[0].id;
      const updated = deleteEditRecord(session, recordId, uniqueIdOptions);

      expect(updated.records).toHaveLength(1);
      expect(updated.records[0].comment).toBe('Second');
    });

    it('should return unchanged session if record not found', () => {
      const session = createInitialSession(mockOptions);

      const updated = deleteEditRecord(session, 'non-existent-id', mockOptions);

      expect(updated).toBe(session);
    });
  });

  describe('setRecordStatus', () => {
    it('should update record status and updatedAt', () => {
      let session = createInitialSession(mockOptions);
      const metadata: RecordMetadata = {
        category: 'visual',
        priority: 'medium',
        status: 'open',
        interactionState: null,
        scope: 'element',
      };
      session = addEditRecord(session, mockElement, 'Test', [], metadata, null, null, mockOptions);

      const recordId = session.records[0].id;
      const updated = setRecordStatus(session, recordId, 'resolved', mockOptions);

      expect(updated.records[0].status).toBe('resolved');
      expect(updated.records[0].updatedAt).toBe('2026-05-23T12:00:00.000Z');
    });

    it('should support deferred status', () => {
      let session = createInitialSession(mockOptions);
      const metadata: RecordMetadata = {
        category: 'visual',
        priority: 'medium',
        status: 'open',
        interactionState: null,
        scope: 'element',
      };
      session = addEditRecord(session, mockElement, 'Test', [], metadata, null, null, mockOptions);

      const recordId = session.records[0].id;
      const updated = setRecordStatus(session, recordId, 'deferred', mockOptions);

      expect(updated.records[0].status).toBe('deferred');
    });

    it('should return unchanged session if record not found', () => {
      const session = createInitialSession(mockOptions);

      const updated = setRecordStatus(session, 'non-existent-id', 'resolved', mockOptions);

      expect(updated).toBe(session);
    });
  });
});
