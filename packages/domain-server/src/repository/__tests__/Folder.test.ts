import { describe, it, expect } from 'vitest';
import { Folder } from '../entities/Folder';

describe('Folder Entity', () => {
  describe('rename', () => {
    it('should rename folder and update path correctly', () => {
      // Arrange
      const folder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'OldName',
        parentUuid: null,
        metadata: null,
      });

      // Act
      const renamedFolder = folder.rename('NewName');

      // Assert
      expect(renamedFolder.name).toBe('NewName');
      expect(renamedFolder.path).toBe('/NewName');
      expect(renamedFolder.uuid).toBe(folder.uuid); // UUID should remain the same
    });

    it('should update path for nested folders correctly', () => {
      // Arrange
      const parentFolder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Parent',
        parentUuid: null,
        metadata: null,
      });

      const childFolder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Child',
        parentUuid: parentFolder.uuid,
        metadata: null,
      });

      // Manually set path (normally set by FolderHierarchyService)
      Object.assign(childFolder, { path: '/Parent/Child' });

      // Act
      const renamedChild = childFolder.rename('RenamedChild');

      // Assert
      expect(renamedChild.name).toBe('RenamedChild');
      expect(renamedChild.path).toBe('/Parent/RenamedChild');
    });

    it('should throw error if new name is empty', () => {
      // Arrange
      const folder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Folder',
        parentUuid: null,
        metadata: null,
      });

      // Act & Assert
      expect(() => folder.rename('')).toThrow('文件夹名称不能为空');
    });

    it('should throw error if new name contains invalid characters', () => {
      // Arrange
      const folder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Folder',
        parentUuid: null,
        metadata: null,
      });

      // Act & Assert
      expect(() => folder.rename('Invalid/Name')).toThrow('文件夹名称不能包含特殊字符');
    });

    it('should preserve metadata when renaming', () => {
      // Arrange
      const folder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Folder',
        parentUuid: null,
        metadata: { icon: 'mdi-folder', color: '#2196F3' },
      });

      // Act
      const renamedFolder = folder.rename('NewName');

      // Assert
      expect(renamedFolder.metadata).toEqual({ icon: 'mdi-folder', color: '#2196F3' });
    });

    it('should update updatedAt timestamp', () => {
      // Arrange
      const folder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Folder',
        parentUuid: null,
        metadata: null,
      });

      const originalUpdatedAt = folder.updatedAt;

      // Wait a bit to ensure timestamp difference
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      return wait(10).then(() => {
        // Act
        const renamedFolder = folder.rename('NewName');

        // Assert
        expect(renamedFolder.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });
    });
  });

  describe('create', () => {
    it('should create a root folder with correct path', () => {
      // Arrange & Act
      const folder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'RootFolder',
        parentUuid: null,
        metadata: null,
      });

      // Assert
      expect(folder.name).toBe('RootFolder');
      expect(folder.path).toBe('/RootFolder');
      expect(folder.parentUuid).toBeNull();
      expect(folder.repositoryUuid).toBe('repo-123');
    });

    it('should create a folder with metadata', () => {
      // Arrange & Act
      const folder = Folder.create({
        repositoryUuid: 'repo-123',
        name: 'Folder',
        parentUuid: null,
        metadata: { icon: 'mdi-star', tags: ['important'] },
      });

      // Assert
      expect(folder.metadata).toEqual({ icon: 'mdi-star', tags: ['important'] });
    });
  });
});
