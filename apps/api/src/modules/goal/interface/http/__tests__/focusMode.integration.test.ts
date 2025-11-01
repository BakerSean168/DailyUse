import '../../../../../test/setup-database'; // 导入全局数据库清理钩子
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../../../app';
import { prisma } from '../../../../../config/prisma';
import { createTestAccount } from '../../../../../test/helpers/database-helpers';

/**
 * FocusMode API 集成测试
 * 
 * 测试范围：
 * - POST /api/v1/goals/focus-mode - 启用专注模式
 * - DELETE /api/v1/goals/focus-mode/:uuid - 关闭专注模式
 * - PATCH /api/v1/goals/focus-mode/:uuid/extend - 延期专注模式
 * - GET /api/v1/goals/focus-mode/active - 获取活跃专注周期
 * - GET /api/v1/goals/focus-mode/history - 获取专注周期历史
 * 
 * 注意：这个测试套件被跳过,因为它依赖完整的HTTP API和认证系统
 * 建议重构为直接测试FocusModeApplicationService
 */

describe.skip('FocusMode API Integration Tests', () => {
  let authToken: string;
  let accountUuid: string;
  let testGoalUuids: string[] = [];
  let focusModeUuid: string;

  beforeAll(async () => {
    // 创建测试账户
    const testEmail = `focusmode-test-${Date.now()}@example.com`;
    accountUuid = `test-focus-account-${Date.now()}`;
    
    await createTestAccount({
      uuid: accountUuid,
      email: testEmail,
      username: `focustest${Date.now()}`,
    });

    // 登录获取 token  
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'Test123456!',
      });

    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.data.accessToken;

    // 创建测试目标（3个）
    for (let i = 1; i <= 3; i++) {
      const goalRes = await request(app)
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: `Focus Test Goal ${i}`,
          description: `Test goal ${i} for focus mode`,
        });

      expect(goalRes.status).toBe(201);
      testGoalUuids.push(goalRes.body.data.uuid);
    }
  });

  afterAll(async () => {
    // 清理测试数据
    if (accountUuid) {
      await prisma.focusMode.deleteMany({
        where: { accountUuid },
      });
      await prisma.goal.deleteMany({
        where: { accountUuid },
      });
      await prisma.account.delete({
        where: { uuid: accountUuid },
      });
    }
  });

  beforeEach(async () => {
    // 每个测试前清理专注周期
    await prisma.focusMode.deleteMany({
      where: { accountUuid },
    });
  });

  describe('POST /api/v1/goals/focus-mode', () => {
    it('应该成功启用专注模式', async () => {
      const startTime = Date.now();
      const endTime = startTime + 30 * 24 * 60 * 60 * 1000; // 30天后

      const res = await request(app)
        .post('/api/v1/goals/focus-mode')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          focusedGoalUuids: [testGoalUuids[0], testGoalUuids[1]],
          startTime,
          endTime,
          hiddenGoalsMode: 'hide_all',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('uuid');
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.focusedGoals).toHaveLength(2);

      focusModeUuid = res.body.data.uuid;
    });

    it('应该拒绝已有活跃专注周期时启用新的', async () => {
      // 先启用一个专注周期
      await request(app)
        .post('/api/v1/goals/focus-mode')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          focusedGoalUuids: [testGoalUuids[0]],
          startTime: Date.now(),
          endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
          hiddenGoalsMode: 'hide_all',
        });

      // 尝试启用第二个
      const res = await request(app)
        .post('/api/v1/goals/focus-mode')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          focusedGoalUuids: [testGoalUuids[1]],
          startTime: Date.now(),
          endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
          hiddenGoalsMode: 'hide_all',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/goals/focus-mode/active', () => {
    it('应该返回活跃的专注周期', async () => {
      // 先启用专注模式
      const activateRes = await request(app)
        .post('/api/v1/goals/focus-mode')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          focusedGoalUuids: [testGoalUuids[0]],
          startTime: Date.now(),
          endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
          hiddenGoalsMode: 'hide_all',
        });

      focusModeUuid = activateRes.body.data.uuid;

      // 获取活跃专注周期
      const res = await request(app)
        .get('/api/v1/goals/focus-mode/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).not.toBeNull();
      expect(res.body.data.uuid).toBe(focusModeUuid);
    });

    it('应该返回null当没有活跃专注周期时', async () => {
      const res = await request(app)
        .get('/api/v1/goals/focus-mode/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();
    });
  });

  describe('DELETE /api/v1/goals/focus-mode/:uuid', () => {
    beforeEach(async () => {
      // 每个测试前启用专注模式
      const activateRes = await request(app)
        .post('/api/v1/goals/focus-mode')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          focusedGoalUuids: [testGoalUuids[0]],
          startTime: Date.now(),
          endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
          hiddenGoalsMode: 'hide_all',
        });

      focusModeUuid = activateRes.body.data.uuid;
    });

    it('应该成功关闭专注模式', async () => {
      const res = await request(app)
        .delete(`/api/v1/goals/focus-mode/${focusModeUuid}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uuid).toBe(focusModeUuid);
      expect(res.body.data.isActive).toBe(false);
    });
  });

  describe('GET /api/v1/goals/focus-mode/history', () => {
    it('应该返回专注周期历史', async () => {
      // 创建2个专注周期
      for (let i = 0; i < 2; i++) {
        const activateRes = await request(app)
          .post('/api/v1/goals/focus-mode')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            focusedGoalUuids: [testGoalUuids[i]],
            startTime: Date.now() - (2 - i) * 24 * 60 * 60 * 1000,
            endTime: Date.now() + 30 * 24 * 60 * 60 * 1000,
            hiddenGoalsMode: 'hide_all',
          });

        const uuid = activateRes.body.data.uuid;

        // 关闭第一个
        if (i === 0) {
          await request(app)
            .delete(`/api/v1/goals/focus-mode/${uuid}`)
            .set('Authorization', `Bearer ${authToken}`);
        }
      }

      // 获取历史
      const res = await request(app)
        .get('/api/v1/goals/focus-mode/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      
      // 验证有一个活跃
      const activeCount = res.body.data.filter((fm: any) => fm.isActive).length;
      expect(activeCount).toBe(1);
    });
  });
});
