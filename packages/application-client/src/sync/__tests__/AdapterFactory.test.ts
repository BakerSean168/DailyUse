/**
 * @fileoverview SyncAdapterFactory 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SyncAdapterFactory } from '../factory/AdapterFactory';
import type { ISyncAdapter, SyncAdapterConstructor } from '../interfaces/ISyncAdapter';
import type { AdapterCredentials } from '../types';

// Mock 适配器类用于测试
class MockSyncAdapter implements ISyncAdapter {
  constructor(public credentials: AdapterCredentials) {}
  
  async authenticate(credentials: AdapterCredentials) {}
  async checkHealth() {
    return {
      connected: true,
      authenticated: true,
      quotaExceeded: false,
      lastSyncTime: Date.now(),
    };
  }
  async push() { return { success: true, version: 1, timestamp: Date.now() }; }
  async pull() { 
    return { 
      success: true, 
      items: [], 
      cursor: { entityType: 'test', lastSyncTimestamp: 0, lastSyncVersion: 0, createdAt: Date.now() },
      hasMore: false 
    }; 
  }
  async batchPush() { return { succeeded: 0, failed: 0, conflicts: 0, results: [] }; }
  async getRemoteVersion() { return { version: 1, updatedAt: Date.now(), exists: true }; }
  async resolveConflict() {}
  async getCursor() { return { entityType: 'test', lastSyncTimestamp: 0, lastSyncVersion: 0, createdAt: Date.now() }; }
  async updateCursor() {}
  async getQuota() { return { used: 0, total: 1000, available: 1000, usagePercent: 0 }; }
  async setConfig() {}
  async getConfig() { 
    return { 
      retryCount: 3, 
      retryDelay: 1000, 
      timeout: 10000, 
      enableCache: true, 
      cacheExpiry: 300000,
      maxConcurrentRequests: 5
    }; 
  }
  async exportAll() { 
    return { 
      version: 1 as const, 
      exportedAt: Date.now(), 
      checksum: '', 
      items: [], 
      metadata: { totalItems: 0, provider: 'mock' } 
    }; 
  }
  async importData() {}
  async clearCache() {}
  async disconnect() {}
}

describe('SyncAdapterFactory', () => {
  beforeEach(() => {
    // 清除所有注册的适配器
    SyncAdapterFactory.clear();
  });

  describe('register', () => {
    it('应该成功注册适配器', () => {
      SyncAdapterFactory.register('mock', MockSyncAdapter as SyncAdapterConstructor);
      
      expect(SyncAdapterFactory.has('mock')).toBe(true);
      expect(SyncAdapterFactory.getAvailableProviders()).toContain('mock');
    });

    it('应该在重复注册时发出警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      SyncAdapterFactory.register('mock', MockSyncAdapter as SyncAdapterConstructor);
      SyncAdapterFactory.register('mock', MockSyncAdapter as SyncAdapterConstructor);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already registered')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('create', () => {
    it('应该成功创建适配器实例', () => {
      SyncAdapterFactory.register('mock', MockSyncAdapter as SyncAdapterConstructor);
      
      const credentials: AdapterCredentials = {
        provider: 'mock' as any,
        encryptionKey: 'test-key',
      };
      
      const adapter = SyncAdapterFactory.create('mock', credentials);
      
      expect(adapter).toBeInstanceOf(MockSyncAdapter);
      expect((adapter as MockSyncAdapter).credentials).toEqual(credentials);
    });

    it('应该在提供商未注册时抛出错误', () => {
      expect(() => {
        SyncAdapterFactory.create('unknown', {
          provider: 'unknown' as any,
          encryptionKey: 'test',
        });
      }).toThrow('Unknown sync provider');
    });

    it('应该在错误信息中列出可用提供商', () => {
      SyncAdapterFactory.register('mock1', MockSyncAdapter as SyncAdapterConstructor);
      SyncAdapterFactory.register('mock2', MockSyncAdapter as SyncAdapterConstructor);
      
      try {
        SyncAdapterFactory.create('unknown', {
          provider: 'unknown' as any,
          encryptionKey: 'test',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('mock1');
        expect(error.message).toContain('mock2');
      }
    });
  });

  describe('getAvailableProviders', () => {
    it('应该返回空数组当没有注册时', () => {
      expect(SyncAdapterFactory.getAvailableProviders()).toEqual([]);
    });

    it('应该返回所有注册的提供商', () => {
      SyncAdapterFactory.register('mock1', MockSyncAdapter as SyncAdapterConstructor);
      SyncAdapterFactory.register('mock2', MockSyncAdapter as SyncAdapterConstructor);
      SyncAdapterFactory.register('mock3', MockSyncAdapter as SyncAdapterConstructor);
      
      const providers = SyncAdapterFactory.getAvailableProviders();
      
      expect(providers).toHaveLength(3);
      expect(providers).toContain('mock1');
      expect(providers).toContain('mock2');
      expect(providers).toContain('mock3');
    });
  });

  describe('has', () => {
    it('应该在提供商已注册时返回 true', () => {
      SyncAdapterFactory.register('mock', MockSyncAdapter as SyncAdapterConstructor);
      
      expect(SyncAdapterFactory.has('mock')).toBe(true);
    });

    it('应该在提供商未注册时返回 false', () => {
      expect(SyncAdapterFactory.has('unknown')).toBe(false);
    });
  });

  describe('unregister', () => {
    it('应该成功注销适配器', () => {
      SyncAdapterFactory.register('mock', MockSyncAdapter as SyncAdapterConstructor);
      
      expect(SyncAdapterFactory.has('mock')).toBe(true);
      
      const result = SyncAdapterFactory.unregister('mock');
      
      expect(result).toBe(true);
      expect(SyncAdapterFactory.has('mock')).toBe(false);
    });

    it('应该在提供商不存在时返回 false', () => {
      const result = SyncAdapterFactory.unregister('unknown');
      
      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('应该清除所有注册的适配器', () => {
      SyncAdapterFactory.register('mock1', MockSyncAdapter as SyncAdapterConstructor);
      SyncAdapterFactory.register('mock2', MockSyncAdapter as SyncAdapterConstructor);
      
      expect(SyncAdapterFactory.getAvailableProviders()).toHaveLength(2);
      
      SyncAdapterFactory.clear();
      
      expect(SyncAdapterFactory.getAvailableProviders()).toHaveLength(0);
    });
  });
});
