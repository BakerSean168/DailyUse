/**
 * Network Sync Layer Unit Tests
 * 
 * EPIC-004: Offline Sync
 * STORY-020: Network Sync Layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NetworkService } from '../network.service';
import { RetryQueueService } from '../retry-queue.service';
import { SyncClientService, SyncApiError } from '../sync-client.service';

// ========== NetworkService Tests ==========

describe('NetworkService', () => {
  let service: NetworkService;

  beforeEach(() => {
    service = new NetworkService({
      syncServerUrl: 'http://localhost:3000',
      healthCheckInterval: 1000,
    });
  });

  afterEach(() => {
    service.destroy();
  });

  it('should initialize with online status', () => {
    service.initialize();
    // 默认假设在线
    expect(service.getStatus()).toBe(true);
  });

  it('should emit status-change event', () => {
    service.initialize();
    
    const listener = vi.fn();
    service.on('status-change', listener);

    // 手动触发状态变化（通过私有方法模拟）
    (service as unknown as { setOnline: (online: boolean) => void }).setOnline(false);
    
    expect(listener).toHaveBeenCalledWith(false);
  });

  it('should emit online event when coming online', () => {
    service.initialize();
    
    // 先设置为离线
    (service as unknown as { setOnline: (online: boolean) => void }).setOnline(false);
    
    const onlineListener = vi.fn();
    service.on('online', onlineListener);
    
    // 设置为在线
    (service as unknown as { setOnline: (online: boolean) => void }).setOnline(true);
    
    expect(onlineListener).toHaveBeenCalled();
  });

  it('should emit offline event when going offline', () => {
    service.initialize();
    
    const offlineListener = vi.fn();
    service.on('offline', offlineListener);
    
    // 设置为离线
    (service as unknown as { setOnline: (online: boolean) => void }).setOnline(false);
    
    expect(offlineListener).toHaveBeenCalled();
  });

  it('should not emit events if status unchanged', () => {
    service.initialize();
    
    const listener = vi.fn();
    service.on('status-change', listener);

    // 状态未变化
    (service as unknown as { setOnline: (online: boolean) => void }).setOnline(true);
    
    expect(listener).not.toHaveBeenCalled();
  });

  it('should allow setting sync server URL', () => {
    service.setSyncServerUrl('http://new-server:4000');
    // 不抛出错误即可
  });

  it('should clean up on destroy', () => {
    service.initialize();
    service.destroy();
    // 不应抛出错误
  });
});

// ========== RetryQueueService Tests ==========

describe('RetryQueueService', () => {
  let service: RetryQueueService;

  beforeEach(() => {
    service = new RetryQueueService({
      baseDelay: 100, // 加快测试
      maxRetries: 3,
    });
  });

  afterEach(() => {
    service.clear();
  });

  it('should calculate exponential delay', () => {
    expect(service.calculateDelay(1)).toBe(100);  // 100 * 2^0
    expect(service.calculateDelay(2)).toBe(200);  // 100 * 2^1
    expect(service.calculateDelay(3)).toBe(400);  // 100 * 2^2
    expect(service.calculateDelay(4)).toBe(800);  // 100 * 2^3
  });

  it('should cap delay at maxDelay', () => {
    const serviceWithLowMax = new RetryQueueService({
      baseDelay: 100,
      maxDelay: 300,
    });

    expect(serviceWithLowMax.calculateDelay(1)).toBe(100);
    expect(serviceWithLowMax.calculateDelay(2)).toBe(200);
    expect(serviceWithLowMax.calculateDelay(3)).toBe(300); // Capped
    expect(serviceWithLowMax.calculateDelay(4)).toBe(300); // Capped
  });

  it('should execute task immediately on enqueue', async () => {
    const task = vi.fn().mockResolvedValue('success');
    const onSuccess = vi.fn();

    await service.enqueue('task-1', task, onSuccess);

    // 等待任务执行
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(task).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('success');
    expect(service.size()).toBe(0);
  });

  it('should retry on failure', async () => {
    let attempts = 0;
    const task = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 2) {
        return Promise.reject(new Error('Failed'));
      }
      return Promise.resolve('success');
    });

    const onSuccess = vi.fn();

    await service.enqueue('task-1', task, onSuccess);

    // 等待重试
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(attempts).toBe(2);
    expect(onSuccess).toHaveBeenCalledWith('success');
  });

  it('should call onFailure after max retries', async () => {
    const task = vi.fn().mockRejectedValue(new Error('Always fails'));
    const onFailure = vi.fn();

    await service.enqueue('task-1', task, undefined, onFailure);

    // 等待所有重试完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    expect(task).toHaveBeenCalledTimes(3); // maxRetries
    expect(onFailure).toHaveBeenCalled();
    expect(service.size()).toBe(0);
  }, 5000);

  it('should not add duplicate tasks', async () => {
    const task = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 500))
    );

    service.enqueue('task-1', task);
    service.enqueue('task-1', task);

    expect(service.size()).toBe(1);
  });

  it('should remove task from queue', () => {
    service.enqueue('task-1', () => Promise.resolve());
    expect(service.has('task-1')).toBe(true);

    service.remove('task-1');
    expect(service.has('task-1')).toBe(false);
  });

  it('should clear all tasks', () => {
    service.enqueue('task-1', () => Promise.resolve());
    service.enqueue('task-2', () => Promise.resolve());

    service.clear();

    expect(service.size()).toBe(0);
  });
});

// ========== SyncClientService Tests ==========

describe('SyncClientService', () => {
  let service: SyncClientService;

  beforeEach(() => {
    service = new SyncClientService({
      baseUrl: 'http://localhost:3000/api',
      timeout: 5000,
    });
  });

  it('should set auth token', () => {
    service.setAuthToken('test-token');
    // 不抛出错误即可
  });

  it('should update base URL', () => {
    service.setBaseUrl('http://new-server:4000/api/');
    // 不抛出错误即可
  });

  describe('SyncApiError', () => {
    it('should identify network errors', () => {
      const error = new SyncApiError(0, 'Network error');
      expect(error.isNetworkError()).toBe(true);
      expect(error.isRetryable()).toBe(true);
    });

    it('should identify auth errors', () => {
      const error401 = new SyncApiError(401, 'Unauthorized');
      expect(error401.isAuthError()).toBe(true);
      expect(error401.isRetryable()).toBe(false);

      const error403 = new SyncApiError(403, 'Forbidden');
      expect(error403.isAuthError()).toBe(true);
    });

    it('should identify server errors', () => {
      const error500 = new SyncApiError(500, 'Server error');
      expect(error500.isServerError()).toBe(true);
      expect(error500.isRetryable()).toBe(true);

      const error503 = new SyncApiError(503, 'Service unavailable');
      expect(error503.isServerError()).toBe(true);
    });

    it('should identify conflict errors', () => {
      const error = new SyncApiError(409, 'Conflict');
      expect(error.isConflictError()).toBe(true);
    });
  });
});

// ========== SyncEngine Tests ==========
// Note: SyncEngine tests require more mocking and are in a separate integration test file
