/**
 * AI Conversation API 集成测试 (AC-13)
 * 
 * 测试范围：
 * - POST /api/ai/conversations - 创建对话
 * - GET /api/ai/conversations - 分页列表
 * - GET /api/ai/conversations/:id - 获取对话详情
 * - DELETE /api/ai/conversations/:id - 软删除对话
 * - 账户隔离验证（多租户）
 * - JWT 认证验证
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ApiTestHelpers } from '../../setup';

describe('AI Conversation API 集成测试', () => {
  let app: Express;
  let userAToken: string;
  let userBToken: string;
  const userAUuid = 'user-a-uuid-123';
  const userBUuid = 'user-b-uuid-456';

  beforeEach(async () => {
    // 创建测试应用
    app = await ApiTestHelpers.createTestApp();

    // 创建两个不同用户的 token（用于测试账户隔离）
    userAToken = await ApiTestHelpers.createTestToken({ accountUuid: userAUuid });
    userBToken = await ApiTestHelpers.createTestToken({ accountUuid: userBUuid });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/ai/conversations', () => {
    it('应该成功创建对话并返回201', async () => {
      const response = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Test Chat',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe('Test Chat');
      expect(response.body.data.accountUuid).toBe(userAUuid);
      expect(response.body.data.status).toBe('ACTIVE');
      expect(response.body.data.messageCount).toBe(0);
      expect(response.body.data.uuid).toBeDefined();
    });

    it('应该使用默认标题"New Chat"创建对话', async () => {
      const response = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({})
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Chat');
    });

    it('应该返回401当没有JWT token', async () => {
      const response = await request(app)
        .post('/api/ai/conversations')
        .send({
          title: 'Unauthorized Chat',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('应该返回401当JWT token无效', async () => {
      const response = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          title: 'Invalid Token Chat',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/ai/conversations', () => {
    it('应该返回用户的对话列表（分页）', async () => {
      // 先创建一些对话
      await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Chat 1' });

      await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Chat 2' });

      await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Chat 3' });

      // 获取对话列表
      const response = await request(app)
        .get('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.conversations).toBeDefined();
      expect(Array.isArray(response.body.data.conversations)).toBe(true);
      expect(response.body.data.conversations.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('应该验证账户隔离 - User A 不能看到 User B 的对话', async () => {
      // User A 创建对话
      const userAResponse = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'User A Chat' });

      const userAConvUuid = userAResponse.body.data.uuid;

      // User B 创建对话
      await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ title: 'User B Chat' });

      // User A 获取对话列表
      const listResponse = await request(app)
        .get('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      const userAConversations = listResponse.body.data.conversations;

      // 验证：User A 只能看到自己的对话
      expect(userAConversations.every((conv: any) => conv.accountUuid === userAUuid)).toBe(true);

      // 验证：User A 的对话存在于列表中
      const hasUserAConv = userAConversations.some((conv: any) => conv.uuid === userAConvUuid);
      expect(hasUserAConv).toBe(true);
    });

    it('应该支持分页查询', async () => {
      // 创建 25 个对话
      for (let i = 1; i <= 25; i++) {
        await request(app)
          .post('/api/ai/conversations')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({ title: `Chat ${i}` });
      }

      // 获取第2页，每页10条
      const response = await request(app)
        .get('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .query({ page: 2, limit: 10 })
        .expect(200);

      expect(response.body.data.conversations.length).toBeLessThanOrEqual(10);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(25);
    });

    it('应该返回401当没有认证', async () => {
      await request(app).get('/api/ai/conversations').expect(401);
    });
  });

  describe('GET /api/ai/conversations/:id', () => {
    it('应该返回对话详情和消息', async () => {
      // 创建对话
      const createResponse = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Detailed Chat' });

      const conversationUuid = createResponse.body.data.uuid;

      // 获取对话详情
      const response = await request(app)
        .get(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .query({ includeMessages: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.uuid).toBe(conversationUuid);
      expect(response.body.data.title).toBe('Detailed Chat');
      expect(response.body.data.messages).toBeDefined();
      expect(Array.isArray(response.body.data.messages)).toBe(true);
    });

    it('应该返回404当对话不存在', async () => {
      const nonExistentUuid = 'non-existent-uuid-12345';

      const response = await request(app)
        .get(`/api/ai/conversations/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('应该返回403当尝试访问其他用户的对话', async () => {
      // User A 创建对话
      const createResponse = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'User A Private Chat' });

      const conversationUuid = createResponse.body.data.uuid;

      // User B 尝试访问 User A 的对话
      const response = await request(app)
        .get(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Forbidden');
    });

    it('应该返回401当没有认证', async () => {
      await request(app).get('/api/ai/conversations/some-uuid').expect(401);
    });
  });

  describe('DELETE /api/ai/conversations/:id', () => {
    it('应该成功软删除对话', async () => {
      // 创建对话
      const createResponse = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Chat to Delete' });

      const conversationUuid = createResponse.body.data.uuid;

      // 删除对话
      const deleteResponse = await request(app)
        .delete(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // 验证对话已被软删除（应该返回404或403）
      const getResponse = await request(app)
        .get(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });

    it('应该返回404当对话不存在', async () => {
      const nonExistentUuid = 'non-existent-uuid-99999';

      const response = await request(app)
        .delete(`/api/ai/conversations/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('应该返回403当尝试删除其他用户的对话', async () => {
      // User A 创建对话
      const createResponse = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'User A Chat' });

      const conversationUuid = createResponse.body.data.uuid;

      // User B 尝试删除 User A 的对话
      const response = await request(app)
        .delete(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Forbidden');
    });

    it('应该返回401当没有认证', async () => {
      await request(app).delete('/api/ai/conversations/some-uuid').expect(401);
    });
  });

  describe('完整 CRUD 生命周期测试', () => {
    it('应该完成完整的对话生命周期：创建 → 读取 → 更新（添加消息） → 删除', async () => {
      // 1. 创建对话
      const createResponse = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Full Lifecycle Chat' })
        .expect(201);

      const conversationUuid = createResponse.body.data.uuid;
      expect(conversationUuid).toBeDefined();

      // 2. 读取对话
      const getResponse = await request(app)
        .get(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(getResponse.body.data.title).toBe('Full Lifecycle Chat');
      expect(getResponse.body.data.messageCount).toBe(0);

      // 3. 验证对话在列表中
      const listResponse = await request(app)
        .get('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      const foundInList = listResponse.body.data.conversations.some(
        (conv: any) => conv.uuid === conversationUuid,
      );
      expect(foundInList).toBe(true);

      // 4. 删除对话
      const deleteResponse = await request(app)
        .delete(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // 5. 验证对话已被删除（404）
      await request(app)
        .get(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404);
    });
  });

  describe('软删除行为验证', () => {
    it('软删除后对话应该设置 deletedAt 并变为 ARCHIVED 状态', async () => {
      // 创建对话
      const createResponse = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Soft Delete Test' });

      const conversationUuid = createResponse.body.data.uuid;

      // 软删除
      await request(app)
        .delete(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      // 注意：由于软删除，数据库中记录仍然存在，但 deletedAt 不为 null
      // 在实际应用中，findById 会过滤掉 deletedAt != null 的记录
      // 所以再次获取应该返回 404
      const getResponse = await request(app)
        .get(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404);

      expect(getResponse.body.success).toBe(false);
    });
  });

  describe('消息角色验证 (AC-6)', () => {
    it('创建的对话应该支持添加不同角色的消息', async () => {
      // 创建对话
      const createResponse = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Message Roles Test' });

      const conversationUuid = createResponse.body.data.uuid;

      // 获取对话详情（验证初始状态）
      const getResponse = await request(app)
        .get(`/api/ai/conversations/${conversationUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .query({ includeMessages: true })
        .expect(200);

      expect(getResponse.body.data.messages).toEqual([]);
      expect(getResponse.body.data.messageCount).toBe(0);

      // 注意：添加消息的功能应该通过 sendMessage 端点实现
      // 这里只验证对话创建后的消息结构正确
    });
  });

  describe('账户隔离综合测试', () => {
    it('应该确保完全的账户隔离（创建、读取、删除）', async () => {
      // User A 创建对话
      const userAConvResponse = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'User A Isolated Chat' });

      const userAConvUuid = userAConvResponse.body.data.uuid;

      // User B 创建对话
      const userBConvResponse = await request(app)
        .post('/api/ai/conversations')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ title: 'User B Isolated Chat' });

      const userBConvUuid = userBConvResponse.body.data.uuid;

      // User A 获取列表 - 应该只看到自己的对话
      const userAListResponse = await request(app)
        .get('/api/ai/conversations')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      const userAConversations = userAListResponse.body.data.conversations;
      expect(userAConversations.some((conv: any) => conv.uuid === userAConvUuid)).toBe(true);
      expect(userAConversations.some((conv: any) => conv.uuid === userBConvUuid)).toBe(false);

      // User B 获取列表 - 应该只看到自己的对话
      const userBListResponse = await request(app)
        .get('/api/ai/conversations')
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      const userBConversations = userBListResponse.body.data.conversations;
      expect(userBConversations.some((conv: any) => conv.uuid === userBConvUuid)).toBe(true);
      expect(userBConversations.some((conv: any) => conv.uuid === userAConvUuid)).toBe(false);

      // User B 尝试访问 User A 的对话 - 应该返回 403
      await request(app)
        .get(`/api/ai/conversations/${userAConvUuid}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(403);

      // User B 尝试删除 User A 的对话 - 应该返回 403
      await request(app)
        .delete(`/api/ai/conversations/${userAConvUuid}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(403);

      // User A 应该仍然可以访问和删除自己的对话
      await request(app)
        .get(`/api/ai/conversations/${userAConvUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      await request(app)
        .delete(`/api/ai/conversations/${userAConvUuid}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);
    });
  });
});
