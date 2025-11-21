import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ApiTestHelpers } from '../../setup';

describe('POST /api/ai/summarize integration', () => {
  let app: Express;
  let token: string;

  beforeEach(async () => {
    app = await ApiTestHelpers.createTestApp();
    token = await ApiTestHelpers.createTestToken({ accountUuid: 'summary-user-1' });
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).post('/api/ai/summarize').send({ text: 'Hello' }).expect(401);
    expect(res.body.success).toBe(false);
  });

  it('should validate input length', async () => {
    const res = await request(app)
      .post('/api/ai/summarize')
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '' })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  it('should summarize valid text (mock adapter may return raw JSON)', async () => {
    const text = 'Test '.repeat(200); // ~1000 chars
    const res = await request(app)
      .post('/api/ai/summarize')
      .set('Authorization', `Bearer ${token}`)
      .send({ text, language: 'en', includeActions: false })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.metadata).toBeDefined();
  });
});
