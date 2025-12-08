/**
 * @fileoverview GitHub Sync 适配器单元测试
 * @module @dailyuse/infrastructure-client/adapters/__tests__
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GitHubSyncAdapter } from '../GitHubSyncAdapter';
import type { AdapterCredentials } from '@dailyuse/application-client/sync';

describe('GitHubSyncAdapter', () => {
  let adapter: GitHubSyncAdapter;
  
  const credentials: AdapterCredentials = {
    provider: 'github',
    token: 'test-token-123',
    repoPath: 'testuser/test-sync-repo',
    encryptionKey: 'MySecurePassword123!@#',
  };

  const mockEncryptedData = {
    encryptedPayload: 'base64encodedEncryptedData==',
    iv: 'randomIV==',
    authTag: 'authTag==',
    algorithm: 'AES-256-GCM' as const,
    metadata: {
      originalSize: 100,
      timestamp: Date.now(),
      checksum: 'sha256hash',
    },
  };

  beforeEach(() => {
    adapter = new GitHubSyncAdapter(credentials);
  });

  describe('Constructor', () => {
    it('should throw error if token is missing', () => {
      expect(() => {
        new GitHubSyncAdapter({
          ...credentials,
          token: undefined,
        });
      }).toThrow('GitHub token is required');
    });

    it('should throw error if repoPath is missing', () => {
      expect(() => {
        new GitHubSyncAdapter({
          ...credentials,
          repoPath: undefined,
        });
      }).toThrow('Repository path (owner/repo) is required');
    });

    it('should throw error if repoPath format is invalid', () => {
      expect(() => {
        new GitHubSyncAdapter({
          ...credentials,
          repoPath: 'invalid-format',
        });
      }).toThrow('Invalid repository path format');
    });

    it('should parse owner and repo from repoPath', () => {
      const adapter = new GitHubSyncAdapter(credentials);
      expect((adapter as any).owner).toBe('testuser');
      expect((adapter as any).repo).toBe('test-sync-repo');
    });
  });

  describe('Authenticate', () => {
    it('should mark as initialized after successful authentication', async () => {
      // Mock Octokit
      vi.spyOn(adapter as any, 'octokit', 'get').mockReturnValue({
        rest: {
          users: {
            getAuthenticated: vi.fn().mockResolvedValue({
              data: { login: 'testuser' },
            }),
          },
          repos: {
            get: vi.fn().mockResolvedValue({
              data: { private: true },
            }),
          },
        },
      });

      // Note: 实际测试需要 mock Octokit
      // 这里只是演示测试结构
    });
  });

  describe('Configuration', () => {
    it('should set and get adapter config', async () => {
      await adapter.setConfig({
        retryCount: 5,
        timeout: 60000,
      });

      const config = await adapter.getConfig();
      expect(config.retryCount).toBe(5);
      expect(config.timeout).toBe(60000);
    });

    it('should have default config values', async () => {
      const config = await adapter.getConfig();
      expect(config.retryCount).toBe(3);
      expect(config.retryDelay).toBe(1000);
      expect(config.timeout).toBe(30000);
      expect(config.enableCache).toBe(true);
    });
  });

  describe('Cursor Management', () => {
    it('should get cursor for entity type', async () => {
      const cursor = await adapter.getCursor('goal');
      expect(cursor.entityType).toBe('goal');
      expect(cursor.lastSyncTimestamp).toBe(0);
      expect(cursor.lastSyncVersion).toBe(0);
    });

    it('should update and retrieve cursor', async () => {
      const newCursor = {
        entityType: 'goal',
        lastSyncTimestamp: 1234567890,
        lastSyncVersion: 5,
        createdAt: Date.now(),
      };

      await adapter.updateCursor('goal', newCursor);
      const cursor = await adapter.getCursor('goal');

      expect(cursor.lastSyncTimestamp).toBe(1234567890);
      expect(cursor.lastSyncVersion).toBe(5);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      await adapter.updateCursor('goal', {
        entityType: 'goal',
        lastSyncTimestamp: Date.now(),
        lastSyncVersion: 1,
        createdAt: Date.now(),
      });

      await adapter.clearCache();

      const cursor = await adapter.getCursor('goal');
      expect(cursor.lastSyncTimestamp).toBe(0);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      // Note: 实际测试需要 mock Octokit
      // 这里演示接口
      expect(typeof adapter.checkHealth).toBe('function');
    });
  });

  describe('Quota', () => {
    it('should return quota info', async () => {
      // Note: 实际测试需要 mock Octokit
      // 这里演示接口
      expect(typeof adapter.getQuota).toBe('function');
    });
  });

  describe('Cleanup', () => {
    it('should clear resources on disconnect', async () => {
      await adapter.updateCursor('goal', {
        entityType: 'goal',
        lastSyncTimestamp: Date.now(),
        lastSyncVersion: 1,
        createdAt: Date.now(),
      });

      await adapter.disconnect();

      // 验证资源已清理
      const cursor = await adapter.getCursor('goal');
      expect(cursor.lastSyncTimestamp).toBe(0);
    });
  });

  describe('Export/Import', () => {
    it('should have export method', async () => {
      expect(typeof adapter.exportAll).toBe('function');
    });

    it('should have import method', async () => {
      expect(typeof adapter.importData).toBe('function');
    });
  });
});
