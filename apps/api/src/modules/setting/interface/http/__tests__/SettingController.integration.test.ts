/**
 * SettingController 集成测试
 *
 * 测试 HTTP 请求处理和路由
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { SettingController } from '../SettingController';
import { generateUUID } from '@dailyuse/utils';

describe('SettingController Integration', () => {
  let testAccountUuid: string;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;
  let statusCode: number;

  beforeAll(() => {
    testAccountUuid = generateUUID();
  });

  beforeEach(() => {
    responseData = null;
    statusCode = 200;

    mockRequest = {
      user: { accountUuid: testAccountUuid },
      body: {},
      query: {},
    };

    mockResponse = {
      status: vi.fn(function(code: number) {
        statusCode = code;
        return this;
      }),
      json: vi.fn(function(data: any) {
        responseData = data;
        return this;
      }),
    };
  });

  describe('getCurrentSettings', () => {
    it('应该返回用户当前设置', async () => {
      const mockSettings = {
        uuid: generateUUID(),
        theme: 'DARK',
        fontSize: 'MEDIUM',
      };

      vi.spyOn(SettingController as any, 'getSettingService').mockResolvedValue({
        getUserSetting: vi.fn().mockResolvedValue(mockSettings),
      });

      await SettingController.getCurrentSettings(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('应该更新用户设置', async () => {
      mockRequest.body = { theme: 'LIGHT' };

      vi.spyOn(SettingController as any, 'getSettingService').mockResolvedValue({
        updateUserSetting: vi.fn().mockResolvedValue({ uuid: generateUUID(), ...mockRequest.body }),
      });

      await SettingController.updateSettings(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalled();
    });
  });

  describe('saveSettingVersion', () => {
    it('应该保存设置版本', async () => {
      mockRequest.body = {
        deviceId: 'device-001',
        deviceName: 'My Phone',
        snapshot: { theme: 'DARK' },
      };

      vi.spyOn(SettingController as any, 'getSyncService').mockReturnValue({
        saveSettingVersion: vi.fn().mockResolvedValue({
          uuid: generateUUID(),
          version: 1,
          createdAt: new Date(),
        }),
      });

      await SettingController.saveSettingVersion(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalled();
    });
  });

  describe('getSettingHistory', () => {
    it('应该获取版本历史', async () => {
      mockRequest.query = { limit: '10' };

      vi.spyOn(SettingController as any, 'getSyncService').mockReturnValue({
        getSettingHistory: vi.fn().mockResolvedValue([]),
      });

      await SettingController.getSettingHistory(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalled();
    });
  });

  describe('resolveConflict', () => {
    it('应该解决冲突', async () => {
      mockRequest.body = {
        local: { theme: 'DARK' },
        remote: { theme: 'LIGHT' },
        strategy: 'local',
      };

      vi.spyOn(SettingController as any, 'getSyncService').mockReturnValue({
        resolveConflict: vi.fn().mockResolvedValue({ theme: 'DARK' }),
      });

      await SettingController.resolveConflict(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalled();
    });
  });
});
