/**
 * Simple route test to verify AI routes are mounted correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { ApiTestHelpers } from '../../setup';
import { getPrismaClient } from '../../setup-database';
import type { Express } from 'express';

describe('AI Routes Mount Test', () => {
  let app: Express;
  let userToken: string;
  const testUserUuid = 'test-user-001';

  beforeEach(async () => {
    app = await ApiTestHelpers.createTestApp();
    
    // 创建测试账户
    const prisma = getPrismaClient();
    await prisma.account.create({
      data: {
        uuid: testUserUuid,
        username: `testuser_${testUserUuid}`,
        email: `${testUserUuid}@test.com`,
        profile: JSON.stringify({}),
        preferences: JSON.stringify({}),
        storage: JSON.stringify({}),
        security: JSON.stringify({}),
        stats: JSON.stringify({}),
        updatedAt: new Date(),
      },
    });
    
    userToken = await ApiTestHelpers.createTestToken({ accountUuid: testUserUuid });
  });

  it('should return 401 without auth on /api/ai/generate/key-results', async () => {
    const response = await request(app)
      .post('/api/ai/generate/key-results')
      .send({ goalTitle: 'Test' });

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
    
    expect([401, 400]).toContain(response.status); // 401 unauthorized or 400 validation error
  });

  it('should reach the route with auth on /api/ai/generate/key-results', async () => {
    const response = await request(app)
      .post('/api/ai/generate/key-results')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ goalTitle: 'Test Goal' });

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
    
    // Should NOT be 404
    expect(response.status).not.toBe(404);
  });
});
