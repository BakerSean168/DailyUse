/**
 * Notification 聚合根单元测试
 */

import { describe, it, expect } from 'vitest';
import { Notification } from './Notification';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

describe('Notification Aggregate', () => {
  describe('create', () => {
    it('should create a new notification with default values', () => {
      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test Notification',
        content: 'This is a test notification',
        type: 'SYSTEM',
      });

      expect(notification.uuid).toBeDefined();
      expect(notification.accountUuid).toBe('account-123');
      expect(notification.title).toBe('Test Notification');
      expect(notification.content).toBe('This is a test notification');
      expect(notification.type).toBe('SYSTEM');
      expect(notification.category).toBe('GENERAL');
      expect(notification.importance).toBe(ImportanceLevel.NORMAL);
      expect(notification.urgency).toBe(UrgencyLevel.NORMAL);
      expect(notification.status).toBe('PENDING');
      expect(notification.isRead).toBe(false);
    });

    it('should create a notification with custom values', () => {
      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Urgent Task',
        content: 'Complete this task ASAP',
        type: 'TASK',
        category: 'ALERT',
        importance: ImportanceLevel.HIGH,
        urgency: UrgencyLevel.HIGH,
        relatedEntityType: 'TASK',
        relatedEntityUuid: 'task-456',
        metadata: { taskTitle: 'Important Task' },
      });

      expect(notification.type).toBe('TASK');
      expect(notification.category).toBe('ALERT');
      expect(notification.importance).toBe(ImportanceLevel.HIGH);
      expect(notification.urgency).toBe(UrgencyLevel.HIGH);
      expect(notification.relatedEntityType).toBe('TASK');
      expect(notification.relatedEntityUuid).toBe('task-456');
      expect(notification.metadata).toEqual({ taskTitle: 'Important Task' });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test',
        content: 'Content',
        type: 'SYSTEM',
      });

      notification.markAsSent(); // 先标记为已发送
      notification.markAsRead();

      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeDefined();
      expect(notification.status).toBe('READ');
    });

    it('should not mark as read twice', () => {
      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test',
        content: 'Content',
        type: 'SYSTEM',
      });

      notification.markAsSent();
      notification.markAsRead();
      const firstReadAt = notification.readAt;

      // 尝试再次标记为已读
      notification.markAsRead();

      expect(notification.readAt).toBe(firstReadAt);
    });
  });

  describe('markAsSent', () => {
    it('should mark notification as sent', () => {
      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test',
        content: 'Content',
        type: 'SYSTEM',
      });

      notification.markAsSent();

      expect(notification.status).toBe('SENT');
      expect(notification.sentAt).toBeDefined();
    });

    it('should not mark as sent if already sent', () => {
      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test',
        content: 'Content',
        type: 'SYSTEM',
      });

      notification.markAsSent();
      const firstSentAt = notification.sentAt;

      notification.markAsSent(); // 尝试再次标记

      expect(notification.sentAt).toBe(firstSentAt);
    });
  });

  describe('softDelete', () => {
    it('should soft delete notification', () => {
      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test',
        content: 'Content',
        type: 'SYSTEM',
      });

      notification.softDelete();

      expect(notification.status).toBe('DELETED');
      expect(notification.deletedAt).toBeDefined();
    });
  });

  describe('isExpired', () => {
    it('should return false if no expiration set', () => {
      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test',
        content: 'Content',
        type: 'SYSTEM',
      });

      expect(notification.isExpired()).toBe(false);
    });

    it('should return true if expired', () => {
      const pastTime = Date.now() - 1000 * 60 * 60; // 1 hour ago

      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test',
        content: 'Content',
        type: 'SYSTEM',
        expiresAt: pastTime,
      });

      expect(notification.isExpired()).toBe(true);
    });

    it('should return false if not expired yet', () => {
      const futureTime = Date.now() + 1000 * 60 * 60; // 1 hour from now

      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test',
        content: 'Content',
        type: 'SYSTEM',
        expiresAt: futureTime,
      });

      expect(notification.isExpired()).toBe(false);
    });
  });

  describe('DTO conversions', () => {
    it('should convert to client DTO', () => {
      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test',
        content: 'Content',
        type: 'SYSTEM',
      });

      const clientDTO = notification.toClientDTO();

      expect(clientDTO.uuid).toBe(notification.uuid);
      expect(clientDTO.title).toBe('Test');
      expect(clientDTO.type).toBe('SYSTEM');
      expect(clientDTO.isRead).toBe(false);
      expect(clientDTO.createdAt).toBeDefined();
      expect(typeof clientDTO.createdAt).toBe('string'); // ISO string
    });

    it('should convert to persistence DTO', () => {
      const notification = Notification.create({
        accountUuid: 'account-123',
        title: 'Test',
        content: 'Content',
        type: 'SYSTEM',
        metadata: { key: 'value' },
      });

      const persistenceDTO = notification.toPersistence();

      expect(persistenceDTO.uuid).toBe(notification.uuid);
      expect(persistenceDTO.metadata).toBe('{"key":"value"}'); // JSON string
      expect(typeof persistenceDTO.createdAt).toBe('number'); // epoch ms
    });
  });
});
