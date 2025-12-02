/**
 * Upload Statistics Service Tests
 * 上传统计服务单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createUploadSession,
  recordUploadStart,
  recordUploadSuccess,
  recordUploadFailure,
  endUploadSession,
  getGlobalStats,
  getRecentSessions,
  getCurrentSession,
  clearStats,
  formatSize,
  formatDuration,
} from '../UploadStats';

describe('UploadStats', () => {
  beforeEach(() => {
    // Clear all stats before each test
    clearStats();
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Session Management', () => {
    it('should create a new upload session', () => {
      const sessionId = createUploadSession();

      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      
      const session = getCurrentSession();
      expect(session).not.toBeNull();
      expect(session!.sessionId).toBe(sessionId);
      expect(session!.totalFiles).toBe(0);
      expect(session!.successCount).toBe(0);
      expect(session!.failCount).toBe(0);
    });

    it('should end upload session and calculate stats', () => {
      createUploadSession();
      
      const recordId = recordUploadStart('test.png', 1024, 'image/png');
      recordUploadSuccess(recordId);
      
      const session = endUploadSession();

      expect(session).not.toBeNull();
      expect(session!.endTime).toBeDefined();
      expect(session!.totalFiles).toBe(1);
      expect(session!.successCount).toBe(1);
      expect(session!.totalSize).toBe(1024);
      expect(getCurrentSession()).toBeNull();
    });

    it('should save session to history', () => {
      createUploadSession();
      endUploadSession();

      const sessions = getRecentSessions();
      expect(sessions.length).toBe(1);
    });

    it('should limit session history', () => {
      // Create more than max sessions
      for (let i = 0; i < 55; i++) {
        createUploadSession();
        endUploadSession();
      }

      const sessions = getRecentSessions(100);
      expect(sessions.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Upload Recording', () => {
    it('should record upload start', () => {
      createUploadSession();
      
      const recordId = recordUploadStart('photo.jpg', 2048, 'image/jpeg');

      expect(recordId).toMatch(/^record_\d+_[a-z0-9]+$/);
      
      const session = getCurrentSession();
      expect(session!.totalFiles).toBe(1);
      expect(session!.records.length).toBe(1);
      expect(session!.records[0].filename).toBe('photo.jpg');
      expect(session!.records[0].size).toBe(2048);
      expect(session!.records[0].success).toBe(false);
    });

    it('should auto-create session if none exists', () => {
      const recordId = recordUploadStart('test.png', 1024, 'image/png');

      expect(getCurrentSession()).not.toBeNull();
      expect(recordId).toBeDefined();
    });

    it('should record upload success', () => {
      createUploadSession();
      const recordId = recordUploadStart('test.png', 1024, 'image/png');
      
      recordUploadSuccess(recordId);

      const session = getCurrentSession();
      const record = session!.records[0];
      
      expect(record.success).toBe(true);
      expect(record.endTime).toBeDefined();
      expect(record.duration).toBeDefined();
      expect(session!.successCount).toBe(1);
      expect(session!.totalSize).toBe(1024);
    });

    it('should record compression info on success', () => {
      createUploadSession();
      const recordId = recordUploadStart('test.png', 2048, 'image/png', 4096);
      
      recordUploadSuccess(recordId, 2048);

      const session = getCurrentSession();
      const record = session!.records[0];
      
      expect(record.compressed).toBe(true);
      expect(record.compressionRatio).toBe(0.5);
      expect(record.size).toBe(2048);
    });

    it('should record upload failure', () => {
      createUploadSession();
      const recordId = recordUploadStart('test.png', 1024, 'image/png');
      
      recordUploadFailure(recordId, 'Network error');

      const session = getCurrentSession();
      const record = session!.records[0];
      
      expect(record.success).toBe(false);
      expect(record.error).toBe('Network error');
      expect(session!.failCount).toBe(1);
    });

    it('should handle multiple uploads in one session', () => {
      createUploadSession();
      
      const id1 = recordUploadStart('file1.png', 1000, 'image/png');
      const id2 = recordUploadStart('file2.jpg', 2000, 'image/jpeg');
      const id3 = recordUploadStart('file3.gif', 3000, 'image/gif');
      
      recordUploadSuccess(id1);
      recordUploadFailure(id2, 'Timeout');
      recordUploadSuccess(id3);

      const session = getCurrentSession();
      
      expect(session!.totalFiles).toBe(3);
      expect(session!.successCount).toBe(2);
      expect(session!.failCount).toBe(1);
      expect(session!.totalSize).toBe(4000); // Only successful uploads
    });
  });

  describe('Global Statistics', () => {
    it('should calculate global stats from all sessions', () => {
      // Session 1: 2 successful uploads
      createUploadSession();
      const id1 = recordUploadStart('file1.png', 1000, 'image/png');
      recordUploadSuccess(id1);
      const id2 = recordUploadStart('file2.jpg', 2000, 'image/jpeg');
      recordUploadSuccess(id2);
      endUploadSession();

      // Session 2: 1 success, 1 failure
      createUploadSession();
      const id3 = recordUploadStart('file3.gif', 3000, 'image/gif');
      recordUploadSuccess(id3);
      const id4 = recordUploadStart('file4.webp', 4000, 'image/webp');
      recordUploadFailure(id4, 'Error');
      endUploadSession();

      const stats = getGlobalStats();

      expect(stats.totalUploads).toBe(4);
      expect(stats.totalSuccess).toBe(3);
      expect(stats.totalFailed).toBe(1);
      expect(stats.totalBytes).toBe(6000); // 1000 + 2000 + 3000
      expect(stats.successRate).toBe(75); // 3/4 = 75%
      expect(stats.averageFileSize).toBe(2000); // 6000 / 3
    });

    it('should return zero stats when no uploads', () => {
      const stats = getGlobalStats();

      expect(stats.totalUploads).toBe(0);
      expect(stats.totalSuccess).toBe(0);
      expect(stats.totalFailed).toBe(0);
      expect(stats.totalBytes).toBe(0);
      expect(stats.successRate).toBe(0);
    });
  });

  describe('Utility Functions', () => {
    describe('formatSize', () => {
      it('should format bytes', () => {
        expect(formatSize(0)).toBe('0 B');
        expect(formatSize(500)).toBe('500.00 B');
      });

      it('should format kilobytes', () => {
        expect(formatSize(1024)).toBe('1.00 KB');
        expect(formatSize(1536)).toBe('1.50 KB');
      });

      it('should format megabytes', () => {
        expect(formatSize(1048576)).toBe('1.00 MB');
        expect(formatSize(5242880)).toBe('5.00 MB');
      });

      it('should format gigabytes', () => {
        expect(formatSize(1073741824)).toBe('1.00 GB');
      });
    });

    describe('formatDuration', () => {
      it('should format milliseconds', () => {
        expect(formatDuration(500)).toBe('500ms');
        expect(formatDuration(999)).toBe('999ms');
      });

      it('should format seconds', () => {
        expect(formatDuration(1000)).toBe('1.0s');
        expect(formatDuration(5500)).toBe('5.5s');
      });

      it('should format minutes', () => {
        expect(formatDuration(60000)).toBe('1.0min');
        expect(formatDuration(90000)).toBe('1.5min');
      });
    });
  });

  describe('clearStats', () => {
    it('should clear all statistics', () => {
      createUploadSession();
      recordUploadStart('test.png', 1024, 'image/png');
      endUploadSession();

      clearStats();

      expect(getCurrentSession()).toBeNull();
      expect(getRecentSessions()).toHaveLength(0);
      expect(getGlobalStats().totalUploads).toBe(0);
    });
  });
});
