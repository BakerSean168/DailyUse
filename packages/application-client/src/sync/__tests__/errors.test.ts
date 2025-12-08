/**
 * @fileoverview 错误类型测试
 */

import { describe, it, expect } from 'vitest';
import {
  AuthenticationError,
  ConflictError,
  NetworkError,
  NotFoundError,
  QuotaExceededError,
  SyncError,
  ValidationError,
} from '../errors';

describe('Sync Errors', () => {
  describe('SyncError', () => {
    it('应该创建基础错误', () => {
      const error = new SyncError('Test error', 'TEST_CODE', { detail: 'test' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ detail: 'test' });
      expect(error.name).toBe('SyncError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SyncError);
    });
  });

  describe('AuthenticationError', () => {
    it('应该创建认证错误', () => {
      const error = new AuthenticationError('Invalid credentials', { 
        username: 'test' 
      });
      
      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.name).toBe('AuthenticationError');
      expect(error).toBeInstanceOf(SyncError);
      expect(error).toBeInstanceOf(AuthenticationError);
    });
  });

  describe('NetworkError', () => {
    it('应该创建网络错误', () => {
      const error = new NetworkError('Connection timeout', {
        url: 'https://api.example.com',
        timeout: 5000,
      });
      
      expect(error.message).toBe('Connection timeout');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.name).toBe('NetworkError');
      expect(error).toBeInstanceOf(NetworkError);
    });
  });

  describe('ConflictError', () => {
    it('应该创建冲突错误', () => {
      const error = new ConflictError('Version mismatch', {
        localVersion: 1,
        remoteVersion: 2,
      });
      
      expect(error.message).toBe('Version mismatch');
      expect(error.code).toBe('CONFLICT_ERROR');
      expect(error.name).toBe('ConflictError');
      expect(error).toBeInstanceOf(ConflictError);
    });
  });

  describe('QuotaExceededError', () => {
    it('应该创建配额超限错误', () => {
      const error = new QuotaExceededError('Storage quota exceeded', {
        used: 1000,
        total: 1000,
      });
      
      expect(error.message).toBe('Storage quota exceeded');
      expect(error.code).toBe('QUOTA_EXCEEDED');
      expect(error.name).toBe('QuotaExceededError');
      expect(error).toBeInstanceOf(QuotaExceededError);
    });
  });

  describe('NotFoundError', () => {
    it('应该创建未找到错误', () => {
      const error = new NotFoundError('Entity not found', {
        entityType: 'goal',
        entityId: '123',
      });
      
      expect(error.message).toBe('Entity not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('NotFoundError');
      expect(error).toBeInstanceOf(NotFoundError);
    });
  });

  describe('ValidationError', () => {
    it('应该创建验证错误', () => {
      const error = new ValidationError('Invalid data format', {
        field: 'encryptedPayload',
        expected: 'base64 string',
      });
      
      expect(error.message).toBe('Invalid data format');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('Error hierarchy', () => {
    it('所有错误类型应继承自 SyncError', () => {
      const errors = [
        new AuthenticationError('test'),
        new NetworkError('test'),
        new ConflictError('test'),
        new QuotaExceededError('test'),
        new NotFoundError('test'),
        new ValidationError('test'),
      ];
      
      errors.forEach(error => {
        expect(error).toBeInstanceOf(SyncError);
        expect(error).toBeInstanceOf(Error);
      });
    });

    it('错误应该有正确的 instanceof 检查', () => {
      const authError = new AuthenticationError('test');
      
      expect(authError instanceof AuthenticationError).toBe(true);
      expect(authError instanceof SyncError).toBe(true);
      expect(authError instanceof Error).toBe(true);
      
      // 不应是其他错误类型
      expect(authError instanceof NetworkError).toBe(false);
      expect(authError instanceof ConflictError).toBe(false);
    });
  });
});
