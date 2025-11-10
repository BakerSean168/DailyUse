import { describe, it, expect } from 'vitest';
import { FolderHierarchyService } from '../services/FolderHierarchyService';
import { Folder } from '../entities/Folder';

describe('FolderHierarchyService', () => {
  describe('detectCycle', () => {
    it('should detect self-reference cycle', () => {
      // Arrange
      const folder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Folder',
        parentUuid: null,
        metadata: null,
      });

      // Act
      const hasCycle = FolderHierarchyService.detectCycle(folder.uuid, folder.uuid, [folder]);

      // Assert
      expect(hasCycle).toBe(true);
    });

    it('should detect two-level cycle', () => {
      // Arrange
      const folderA = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderA',
        parentUuid: null,
        metadata: null,
      });

      const folderB = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderB',
        parentUuid: folderA.uuid,
        metadata: null,
      });

      // Act: Try to move folderA under folderB (creating cycle: A -> B -> A)
      const hasCycle = FolderHierarchyService.detectCycle(folderA.uuid, folderB.uuid, [
        folderA,
        folderB,
      ]);

      // Assert
      expect(hasCycle).toBe(true);
    });

    it('should detect multi-level cycle', () => {
      // Arrange
      const folderA = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderA',
        parentUuid: null,
        metadata: null,
      });

      const folderB = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderB',
        parentUuid: folderA.uuid,
        metadata: null,
      });

      const folderC = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderC',
        parentUuid: folderB.uuid,
        metadata: null,
      });

      // Act: Try to move folderA under folderC (creating cycle: A -> B -> C -> A)
      const hasCycle = FolderHierarchyService.detectCycle(folderA.uuid, folderC.uuid, [
        folderA,
        folderB,
        folderC,
      ]);

      // Assert
      expect(hasCycle).toBe(true);
    });

    it('should not detect cycle for valid parent-child relationship', () => {
      // Arrange
      const folderA = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderA',
        parentUuid: null,
        metadata: null,
      });

      const folderB = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderB',
        parentUuid: null,
        metadata: null,
      });

      // Act: Move folderB under folderA (no cycle)
      const hasCycle = FolderHierarchyService.detectCycle(folderB.uuid, folderA.uuid, [
        folderA,
        folderB,
      ]);

      // Assert
      expect(hasCycle).toBe(false);
    });

    it('should not detect cycle when moving to root', () => {
      // Arrange
      const folderA = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderA',
        parentUuid: null,
        metadata: null,
      });

      const folderB = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderB',
        parentUuid: folderA.uuid,
        metadata: null,
      });

      // Act: Move folderB to root (parentUuid = null)
      const hasCycle = FolderHierarchyService.detectCycle(folderB.uuid, null, [
        folderA,
        folderB,
      ]);

      // Assert
      expect(hasCycle).toBe(false);
    });
  });

  describe('buildTree', () => {
    it('should build flat structure for root folders only', () => {
      // Arrange
      const folderA = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderA',
        parentUuid: null,
        metadata: null,
      });

      const folderB = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'FolderB',
        parentUuid: null,
        metadata: null,
      });

      // Act
      const tree = FolderHierarchyService.buildTree([folderA, folderB]);

      // Assert
      expect(tree).toHaveLength(2);
      expect(tree[0].uuid).toBe(folderA.uuid);
      expect(tree[1].uuid).toBe(folderB.uuid);
    });

    it('should build tree with one level of nesting', () => {
      // Arrange
      const parent = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Parent',
        parentUuid: null,
        metadata: null,
      });

      const child1 = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Child1',
        parentUuid: parent.uuid,
        metadata: null,
      });

      const child2 = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Child2',
        parentUuid: parent.uuid,
        metadata: null,
      });

      // Act
      const tree = FolderHierarchyService.buildTree([parent, child1, child2]);

      // Assert
      expect(tree).toHaveLength(1);
      expect(tree[0].uuid).toBe(parent.uuid);
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children![0].uuid).toBe(child1.uuid);
      expect(tree[0].children![1].uuid).toBe(child2.uuid);
    });

    it('should build deep nested tree', () => {
      // Arrange
      const root = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Root',
        parentUuid: null,
        metadata: null,
      });

      const level1 = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Level1',
        parentUuid: root.uuid,
        metadata: null,
      });

      const level2 = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Level2',
        parentUuid: level1.uuid,
        metadata: null,
      });

      const level3 = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Level3',
        parentUuid: level2.uuid,
        metadata: null,
      });

      // Act
      const tree = FolderHierarchyService.buildTree([root, level1, level2, level3]);

      // Assert
      expect(tree).toHaveLength(1);
      expect(tree[0].uuid).toBe(root.uuid);
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children![0].uuid).toBe(level1.uuid);
      expect(tree[0].children![0].children).toHaveLength(1);
      expect(tree[0].children![0].children![0].uuid).toBe(level2.uuid);
      expect(tree[0].children![0].children![0].children).toHaveLength(1);
      expect(tree[0].children![0].children![0].children![0].uuid).toBe(level3.uuid);
    });

    it('should handle orphaned folders gracefully', () => {
      // Arrange
      const root = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Root',
        parentUuid: null,
        metadata: null,
      });

      const orphan = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Orphan',
        parentUuid: 'non-existent-uuid',
        metadata: null,
      });

      // Act
      const tree = FolderHierarchyService.buildTree([root, orphan]);

      // Assert
      expect(tree).toHaveLength(1); // Only root should appear
      expect(tree[0].uuid).toBe(root.uuid);
    });

    it('should return empty array for empty input', () => {
      // Act
      const tree = FolderHierarchyService.buildTree([]);

      // Assert
      expect(tree).toEqual([]);
    });
  });

  describe('calculatePath', () => {
    it('should calculate path for root folder', () => {
      // Arrange
      const folder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'RootFolder',
        parentUuid: null,
        metadata: null,
      });

      // Act
      const path = FolderHierarchyService.calculatePath(folder, []);

      // Assert
      expect(path).toBe('/RootFolder');
    });

    it('should calculate path for nested folder', () => {
      // Arrange
      const parent = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Parent',
        parentUuid: null,
        metadata: null,
      });

      const child = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Child',
        parentUuid: parent.uuid,
        metadata: null,
      });

      // Act
      const path = FolderHierarchyService.calculatePath(child, [parent, child]);

      // Assert
      expect(path).toBe('/Parent/Child');
    });

    it('should calculate path for deeply nested folder', () => {
      // Arrange
      const root = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Root',
        parentUuid: null,
        metadata: null,
      });

      const level1 = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Level1',
        parentUuid: root.uuid,
        metadata: null,
      });

      const level2 = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Level2',
        parentUuid: level1.uuid,
        metadata: null,
      });

      // Act
      const path = FolderHierarchyService.calculatePath(level2, [root, level1, level2]);

      // Assert
      expect(path).toBe('/Root/Level1/Level2');
    });
  });
});
