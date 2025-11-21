/**
 * AI Chat (non-stream) Integration Tests
 * 验证普通聊天端点 /api/ai/chat
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Express } from 'express';
import request from 'supertest';
import { ApiTestHelpers } from '../../setup';

describe('AI Chat API 集成测试 (非流式)', () => {
  let app: Express;
  let token: string;
  const accountUuid = 'chat-user-123';

  beforeEach(async () => {
    app = await ApiTestHelpers.createTestApp();
    token = await ApiTestHelpers.createTestToken({ accountUuid });
  });

  describe('POST /api/ai/chat', () => {
    it('should return 401 without authentication', async () => {
      const res = await request(app).post('/api/ai/chat').send({ message: 'Hello' }).expect(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 when message is missing', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should create a new conversation and return AI response', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Hello AI, give me a productivity tip.' })
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.conversationUuid).toBeDefined();
      expect(data.userMessageUuid).toBeDefined();
      expect(data.assistantMessageUuid).toBeDefined();
      expect(typeof data.content).toBe('string');
      expect(typeof data.tokensUsed).toBe('number');
      expect(typeof data.quotaRemaining).toBe('number');
    });

    it('should reuse existing conversation when conversationUuid provided', async () => {
      // First request creates conversation
      const first = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'First message' })
        .expect(200);
      const convUuid = first.body.data.conversationUuid;

      // Second request reuses conversation
      const second = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Second follow-up', conversationUuid: convUuid })
        .expect(200);
      expect(second.body.success).toBe(true);
      expect(second.body.data.conversationUuid).toBe(convUuid);

      // Fetch conversation details to verify message count >=2
      const details = await request(app)
        .get(`/api/ai/conversations/${convUuid}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(details.body.data.messageCount).toBeGreaterThanOrEqual(2);
    });

    it('should return 500 for overly long message (current behavior) and suggest improvement', async () => {
      const longMessage = 'x'.repeat(10050);
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({ message: longMessage })
        .expect(500); // application service throws generic Error -> mapped to 500
      expect(res.body.success).toBe(false);
      // NOTE: Architectural improvement: controller should pre-validate length and return 400.
    });
  });
});
