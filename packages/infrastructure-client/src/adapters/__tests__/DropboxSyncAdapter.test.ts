/**
 * @fileoverview Dropbox Sync 适配器单元测试
 * @module @dailyuse/infrastructure-client/adapters/__tests__
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DropboxSyncAdapter } from '../DropboxSyncAdapter';
import type { AdapterCredentials } from '@dailyuse/application-client/sync';

describe('DropboxSyncAdapter', () => {
  let adapter: DropboxSyncAdapter;

  const credentials: AdapterCredentials = {
    provider: 'dropbox',
    token: 'dropbox-access-token',
    encryptionKey: 'MySecurePassword123!@#',
  };

  beforeEach(() => {
    adapter = new DropboxSyncAdapter(credentials);
  });

  describe('Constructor', () => {
    it('should throw error if token is missing', () => {
      expect(() => {
        new DropboxSyncAdapter({
          ...credentials,
          token: undefined,
        });
      }).toThrow('Dropbox access token is required');
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
      expect(config.maxConcurrentRequests).toBe(6);
    });
  });

  describe('Cursor Management', () => {
    it('should get cursor for entity type', async () => {
      const cursor = await adapter.getCursor('goal');
      expect(cursor.entityType).toBe('goal');
      expect(cursor.lastSyncTimestamp).toBe(0);
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

  describe('Cache', () => {
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
});
