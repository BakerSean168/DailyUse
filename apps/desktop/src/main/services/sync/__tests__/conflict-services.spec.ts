/**
 * Conflict Resolution Services Unit Tests
 * 
 * EPIC-004: Offline Sync - STORY-021
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ConflictDetectionService, 
  type VersionedData 
} from '../conflict-detection.service';
import { ConflictResolverService } from '../conflict-resolver.service';
import type { ConflictRecord } from '../conflict-record.service';

describe('ConflictDetectionService', () => {
  let service: ConflictDetectionService;

  beforeEach(() => {
    service = new ConflictDetectionService();
  });

  describe('detectConflict', () => {
    it('should return no conflict when versions are equal', () => {
      const local: VersionedData = { version: 1, updatedAt: 1000, title: 'Test' };
      const server: VersionedData = { version: 1, updatedAt: 1000, title: 'Test' };

      const result = service.detectConflict(local, server);

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingFields).toHaveLength(0);
    });

    it('should detect conflicting fields when versions differ', () => {
      const local: VersionedData = { 
        version: 1, 
        updatedAt: 1000, 
        title: 'Local Title',
        description: 'Same description'
      };
      const server: VersionedData = { 
        version: 2, 
        updatedAt: 2000, 
        title: 'Server Title',
        description: 'Same description'
      };

      const result = service.detectConflict(local, server);

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingFields).toHaveLength(1);
      expect(result.conflictingFields[0].field).toBe('title');
      expect(result.conflictingFields[0].localValue).toBe('Local Title');
      expect(result.conflictingFields[0].serverValue).toBe('Server Title');
    });

    it('should detect local-only fields', () => {
      const local: VersionedData = { 
        version: 1, 
        updatedAt: 1000, 
        title: 'Test',
        localField: 'only local'
      };
      const server: VersionedData = { 
        version: 2, 
        updatedAt: 2000, 
        title: 'Test'
      };

      const result = service.detectConflict(local, server);

      expect(result.hasConflict).toBe(true);
      expect(result.localOnlyFields).toContain('localField');
    });

    it('should detect server-only fields', () => {
      const local: VersionedData = { 
        version: 1, 
        updatedAt: 1000, 
        title: 'Test'
      };
      const server: VersionedData = { 
        version: 2, 
        updatedAt: 2000, 
        title: 'Test',
        serverField: 'only server'
      };

      const result = service.detectConflict(local, server);

      expect(result.hasConflict).toBe(true);
      expect(result.serverOnlyFields).toContain('serverField');
    });

    it('should ignore system fields', () => {
      const local: VersionedData = { 
        version: 1, 
        updatedAt: 1000, 
        createdAt: 500,
        title: 'Test'
      };
      const server: VersionedData = { 
        version: 2, 
        updatedAt: 2000, 
        createdAt: 600,
        title: 'Test'
      };

      const result = service.detectConflict(local, server);

      // createdAt is ignored, so no conflict
      expect(result.hasConflict).toBe(false);
    });

    it('should respect fieldsToCompare option', () => {
      const local: VersionedData = { 
        version: 1, 
        updatedAt: 1000, 
        title: 'Local',
        description: 'Local Desc'
      };
      const server: VersionedData = { 
        version: 2, 
        updatedAt: 2000, 
        title: 'Server',
        description: 'Server Desc'
      };

      const result = service.detectConflict(local, server, {
        fieldsToCompare: ['title']
      });

      expect(result.conflictingFields).toHaveLength(1);
      expect(result.conflictingFields[0].field).toBe('title');
    });

    it('should handle deep object comparison', () => {
      const local: VersionedData = { 
        version: 1, 
        updatedAt: 1000,
        metadata: { tags: ['a', 'b'], priority: 1 }
      };
      const server: VersionedData = { 
        version: 2, 
        updatedAt: 2000,
        metadata: { tags: ['a', 'c'], priority: 1 }
      };

      const result = service.detectConflict(local, server);

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingFields[0].field).toBe('metadata');
    });
  });

  describe('detectBatchConflicts', () => {
    it('should detect conflicts across multiple items', () => {
      const local = new Map<string, VersionedData>([
        ['1', { version: 1, updatedAt: 1000, title: 'Local 1' }],
        ['2', { version: 1, updatedAt: 1000, title: 'Same' }],
        ['3', { version: 1, updatedAt: 1000, title: 'Local 3' }],
      ]);

      const server = new Map<string, VersionedData>([
        ['1', { version: 2, updatedAt: 2000, title: 'Server 1' }],
        ['2', { version: 1, updatedAt: 1000, title: 'Same' }],
        ['3', { version: 2, updatedAt: 2000, title: 'Server 3' }],
      ]);

      const results = service.detectBatchConflicts(local, server);

      expect(results.size).toBe(2);
      expect(results.has('1')).toBe(true);
      expect(results.has('3')).toBe(true);
      expect(results.has('2')).toBe(false);
    });
  });

  describe('compareFields', () => {
    it('should compare specific fields', () => {
      const local = { title: 'A', description: 'B', status: 'active' };
      const server = { title: 'A', description: 'C', status: 'completed' };

      const diffs = service.compareFields(local, server, ['description', 'status']);

      expect(diffs).toHaveLength(2);
      expect(diffs.map(d => d.field)).toContain('description');
      expect(diffs.map(d => d.field)).toContain('status');
    });
  });

  describe('shouldAutoResolveToServer', () => {
    it('should return true when local has no changes from last sync', () => {
      const lastSynced: VersionedData = { version: 1, updatedAt: 1000, title: 'Original' };
      const local: VersionedData = { version: 1, updatedAt: 1000, title: 'Original' };
      const server: VersionedData = { version: 2, updatedAt: 2000, title: 'Updated' };

      const result = service.shouldAutoResolveToServer(local, server, lastSynced);

      expect(result).toBe(true);
    });

    it('should return false when local has changes', () => {
      const lastSynced: VersionedData = { version: 1, updatedAt: 1000, title: 'Original' };
      const local: VersionedData = { version: 1, updatedAt: 1500, title: 'Local Changed' };
      const server: VersionedData = { version: 2, updatedAt: 2000, title: 'Server Updated' };

      const result = service.shouldAutoResolveToServer(local, server, lastSynced);

      expect(result).toBe(false);
    });
  });
});

describe('ConflictResolverService', () => {
  let service: ConflictResolverService;

  beforeEach(() => {
    service = new ConflictResolverService();
  });

  describe('tryAutoResolve', () => {
    it('should use server data for setting entities', () => {
      const conflict: ConflictRecord = {
        id: '1',
        entityType: 'setting',
        entityId: 'theme',
        localData: { value: 'dark', version: 1 },
        serverData: { value: 'light', version: 2 },
        conflictingFields: [{ field: 'value', localValue: 'dark', serverValue: 'light' }],
        createdAt: Date.now(),
      };

      const result = service.tryAutoResolve(conflict);

      expect(result?.success).toBe(true);
      expect(result?.strategy).toBe('merged');
      expect(result?.mergedData.value).toBe('light');
    });

    it('should use max strategy for progress field', () => {
      const conflict: ConflictRecord = {
        id: '1',
        entityType: 'goal',
        entityId: 'goal-1',
        localData: { progress: 80, title: 'Goal', version: 1 },
        serverData: { progress: 60, title: 'Goal', version: 2 },
        conflictingFields: [{ field: 'progress', localValue: 80, serverValue: 60 }],
        createdAt: Date.now(),
      };

      const result = service.tryAutoResolve(conflict);

      expect(result?.success).toBe(true);
      expect(result?.mergedData.progress).toBe(80);
    });

    it('should require manual resolution for title field', () => {
      const conflict: ConflictRecord = {
        id: '1',
        entityType: 'goal',
        entityId: 'goal-1',
        localData: { title: 'Local Title', version: 1 },
        serverData: { title: 'Server Title', version: 2 },
        conflictingFields: [{ field: 'title', localValue: 'Local Title', serverValue: 'Server Title' }],
        createdAt: Date.now(),
      };

      const result = service.tryAutoResolve(conflict);

      expect(result?.success).toBe(false);
      expect(result?.strategy).toBe('manual');
      expect(result?.manualFields).toContain('title');
    });

    it('should use min strategy for dueDate field', () => {
      const earlier = new Date('2024-01-01').getTime();
      const later = new Date('2024-02-01').getTime();

      const conflict: ConflictRecord = {
        id: '1',
        entityType: 'task',
        entityId: 'task-1',
        localData: { dueDate: later, version: 1 },
        serverData: { dueDate: earlier, version: 2 },
        conflictingFields: [{ field: 'dueDate', localValue: later, serverValue: earlier }],
        createdAt: Date.now(),
      };

      const result = service.tryAutoResolve(conflict);

      expect(result?.success).toBe(true);
      expect(result?.mergedData.dueDate).toBe(earlier);
    });

    it('should use server strategy for unknown entity types', () => {
      const conflict: ConflictRecord = {
        id: '1',
        entityType: 'unknown',
        entityId: 'unknown-1',
        localData: { foo: 'local', version: 1 },
        serverData: { foo: 'server', version: 2 },
        conflictingFields: [{ field: 'foo', localValue: 'local', serverValue: 'server' }],
        createdAt: Date.now(),
      };

      const result = service.tryAutoResolve(conflict);

      expect(result?.success).toBe(true);
      expect(result?.strategy).toBe('server');
      expect(result?.mergedData.foo).toBe('server');
    });
  });

  describe('manualResolve', () => {
    it('should apply user field selections', () => {
      const conflict: ConflictRecord = {
        id: '1',
        entityType: 'goal',
        entityId: 'goal-1',
        localData: { title: 'Local', description: 'Local Desc', version: 1 },
        serverData: { title: 'Server', description: 'Server Desc', version: 2 },
        conflictingFields: [
          { field: 'title', localValue: 'Local', serverValue: 'Server' },
          { field: 'description', localValue: 'Local Desc', serverValue: 'Server Desc' },
        ],
        createdAt: Date.now(),
      };

      const result = service.manualResolve(conflict, {
        title: 'local',
        description: 'server',
      });

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('manual');
      expect(result.mergedData.title).toBe('Local');
      expect(result.mergedData.description).toBe('Server Desc');
    });
  });

  describe('resolveWithLocal', () => {
    it('should use all local data', () => {
      const conflict: ConflictRecord = {
        id: '1',
        entityType: 'goal',
        entityId: 'goal-1',
        localData: { title: 'Local', progress: 50, version: 1 },
        serverData: { title: 'Server', progress: 80, version: 2 },
        conflictingFields: [],
        createdAt: Date.now(),
      };

      const result = service.resolveWithLocal(conflict);

      expect(result.strategy).toBe('local');
      expect(result.mergedData).toEqual(conflict.localData);
    });
  });

  describe('resolveWithServer', () => {
    it('should use all server data', () => {
      const conflict: ConflictRecord = {
        id: '1',
        entityType: 'goal',
        entityId: 'goal-1',
        localData: { title: 'Local', progress: 50, version: 1 },
        serverData: { title: 'Server', progress: 80, version: 2 },
        conflictingFields: [],
        createdAt: Date.now(),
      };

      const result = service.resolveWithServer(conflict);

      expect(result.strategy).toBe('server');
      expect(result.mergedData).toEqual(conflict.serverData);
    });
  });

  describe('registerEntityRules', () => {
    it('should allow registering custom rules', () => {
      service.registerEntityRules({
        entityType: 'custom',
        fieldRules: {
          priority: 'max',
          name: 'local',
        },
        defaultStrategy: 'server',
      });

      const rules = service.getEntityRules('custom');
      expect(rules).toBeDefined();
      expect(rules?.fieldRules.priority).toBe('max');
    });
  });
});

// Mock Database for ConflictRecordService and ConflictHistoryService tests
describe('ConflictRecordService (with mock DB)', () => {
  // These tests would require a mock SQLite database
  // In a real implementation, we'd use better-sqlite3 with an in-memory database
  
  it.skip('should create conflict record', () => {
    // Requires mock DB setup
  });

  it.skip('should get unresolved conflicts', () => {
    // Requires mock DB setup
  });

  it.skip('should resolve conflict', () => {
    // Requires mock DB setup
  });
});

describe('ConflictHistoryService (with mock DB)', () => {
  it.skip('should query history with filters', () => {
    // Requires mock DB setup
  });

  it.skip('should get stats', () => {
    // Requires mock DB setup
  });
});
