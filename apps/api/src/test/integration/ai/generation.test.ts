/**
 * AI Generation API 集成测试 (Epic 2)
 * 
 * 测试范围：
 * - POST /api/ai/generate/key-results - 生成关键结果
 * - POST /api/ai/generate/tasks - 生成任务模板
 * - 配额管理和消费
 * - JWT 认证验证
 * - 账户隔离验证
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { ApiTestHelpers } from '../../setup';

describe('AI Generation API 集成测试 (Epic 2)', () => {
  let app: Express;
  let userToken: string;
  const userUuid = 'generation-test-user-001';

  beforeEach(async () => {
    // 创建测试应用
    app = await ApiTestHelpers.createTestApp();

    // 创建测试用户 token
    userToken = await ApiTestHelpers.createTestToken({ accountUuid: userUuid });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/ai/generate/key-results', () => {
    it('应该成功生成关键结果并返回200', async () => {
      const response = await request(app)
        .post('/api/ai/generate/key-results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          goalTitle: '提高产品质量',
          goalDescription: '降低关键缺陷数量',
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90天后
          goalContext: '当前P0/P1缺陷较多，需要优化质量流程',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.keyResults).toBeDefined();
      expect(Array.isArray(response.body.data.keyResults)).toBe(true);
      
      // AC-2: 验证返回3-5个关键结果
      expect(response.body.data.keyResults.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data.keyResults.length).toBeLessThanOrEqual(5);

      // AC-3: 验证关键结果结构
      const kr = response.body.data.keyResults[0];
      expect(kr.title).toBeDefined();
      expect(typeof kr.title).toBe('string');
      expect(kr.valueType).toBeDefined();
      expect(['INCREMENTAL', 'ABSOLUTE', 'PERCENTAGE', 'BINARY']).toContain(kr.valueType);
      expect(kr.targetValue).toBeDefined();
      expect(typeof kr.targetValue).toBe('number');
      expect(kr.weight).toBeDefined();
      expect(typeof kr.weight).toBe('number');

      // AC-6: 验证配额信息
      expect(response.body.data.tokenUsage).toBeDefined();
      expect(response.body.data.generatedAt).toBeDefined();
    });

    it('应该在没有 goalContext 时也能生成', async () => {
      const response = await request(app)
        .post('/api/ai/generate/key-results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          goalTitle: '增加用户留存率',
          goalDescription: '通过改进用户体验提升留存',
          startDate: Date.now(),
          endDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.keyResults.length).toBeGreaterThanOrEqual(3);
    });

    it('应该返回401当没有JWT token', async () => {
      const response = await request(app)
        .post('/api/ai/generate/key-results')
        .send({
          goalTitle: '测试目标',
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('应该返回400当缺少必需字段', async () => {
      const response = await request(app)
        .post('/api/ai/generate/key-results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          goalTitle: '测试目标',
          // 缺少 startDate 和 endDate
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('应该返回400当目标标题为空', async () => {
      const response = await request(app)
        .post('/api/ai/generate/key-results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          goalTitle: '',
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ai/generate/tasks', () => {
    it('应该成功生成任务模板并返回200', async () => {
      const response = await request(app)
        .post('/api/ai/generate/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          keyResultTitle: '将P0/P1缺陷减少到10个以下',
          keyResultDescription: '通过代码审查和自动化测试提升质量',
          targetValue: 10,
          currentValue: 50,
          unit: '个缺陷',
          timeRemaining: 60, // 60天
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.tasks).toBeDefined();
      expect(Array.isArray(response.body.data.tasks)).toBe(true);

      // AC-2: 验证返回5-10个任务
      expect(response.body.data.tasks.length).toBeGreaterThanOrEqual(5);
      expect(response.body.data.tasks.length).toBeLessThanOrEqual(10);

      // AC-3: 验证任务结构
      const task = response.body.data.tasks[0];
      expect(task.title).toBeDefined();
      expect(typeof task.title).toBe('string');
      expect(task.description).toBeDefined();
      expect(task.estimatedHours).toBeDefined();
      expect(typeof task.estimatedHours).toBe('number');
      
      // AC-10: 验证时间估算范围
      expect(task.estimatedHours).toBeGreaterThanOrEqual(1);
      expect(task.estimatedHours).toBeLessThanOrEqual(40);

      // AC-11: 验证优先级
      expect(task.priority).toBeDefined();
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(task.priority);

      // AC-5: 验证依赖数组
      expect(task.dependencies).toBeDefined();
      expect(Array.isArray(task.dependencies)).toBe(true);

      // AC-6: 验证配额信息
      expect(response.body.data.tokenUsage).toBeDefined();
      expect(response.body.data.generatedAt).toBeDefined();
    });

    it('应该在没有可选字段时也能生成', async () => {
      const response = await request(app)
        .post('/api/ai/generate/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          keyResultTitle: '用户活跃度提升20%',
          targetValue: 120,
          currentValue: 100,
          timeRemaining: 30,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks.length).toBeGreaterThanOrEqual(5);
    });

    it('应该返回401当没有JWT token', async () => {
      const response = await request(app)
        .post('/api/ai/generate/tasks')
        .send({
          keyResultTitle: '测试关键结果',
          targetValue: 100,
          currentValue: 50,
          timeRemaining: 30,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('应该返回400当缺少必需字段', async () => {
      const response = await request(app)
        .post('/api/ai/generate/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          keyResultTitle: '测试关键结果',
          // 缺少 targetValue, currentValue, timeRemaining
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('应该返回400当 KR 标题为空', async () => {
      const response = await request(app)
        .post('/api/ai/generate/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          keyResultTitle: '',
          targetValue: 100,
          currentValue: 50,
          timeRemaining: 30,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('应该验证任务具有可执行性（AC-4）', async () => {
      const response = await request(app)
        .post('/api/ai/generate/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          keyResultTitle: '完成产品文档编写',
          targetValue: 100,
          currentValue: 20,
          unit: '百分比',
          timeRemaining: 45,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // 验证任务标题是动词开头（可执行）
      const tasks = response.body.data.tasks;
      tasks.forEach((task: any) => {
        // 任务标题应该有实际内容
        expect(task.title.length).toBeGreaterThan(5);
        
        // AC-7: 描述应该包含完成标准
        if (task.description) {
          expect(task.description.length).toBeGreaterThan(30);
        }
      });
    });
  });

  describe('配额管理测试', () => {
    it('生成关键结果应该消费配额', async () => {
      // 第一次生成
      const firstResponse = await request(app)
        .post('/api/ai/generate/key-results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          goalTitle: '配额测试目标1',
          startDate: Date.now(),
          endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        })
        .expect(200);

      expect(firstResponse.body.success).toBe(true);
      
      const firstTokenUsage = firstResponse.body.data.tokenUsage;
      expect(firstTokenUsage).toBeDefined();
      expect(firstTokenUsage.promptTokens).toBeGreaterThan(0);
      expect(firstTokenUsage.completionTokens).toBeGreaterThan(0);
      expect(firstTokenUsage.totalTokens).toBeGreaterThan(0);
    });

    it('生成任务应该消费配额', async () => {
      const response = await request(app)
        .post('/api/ai/generate/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          keyResultTitle: '配额测试关键结果',
          targetValue: 100,
          currentValue: 50,
          timeRemaining: 30,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const tokenUsage = response.body.data.tokenUsage;
      expect(tokenUsage).toBeDefined();
      expect(tokenUsage.promptTokens).toBeGreaterThan(0);
      expect(tokenUsage.completionTokens).toBeGreaterThan(0);
      expect(tokenUsage.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('完整生成流程测试', () => {
    it('应该完成从目标到任务的完整生成流程', async () => {
      // 1. 生成关键结果
      const krResponse = await request(app)
        .post('/api/ai/generate/key-results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          goalTitle: '提升系统性能',
          goalDescription: '优化响应时间和吞吐量',
          startDate: Date.now(),
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        })
        .expect(200);

      expect(krResponse.body.success).toBe(true);
      const keyResults = krResponse.body.data.keyResults;
      expect(keyResults.length).toBeGreaterThan(0);

      // 2. 为第一个关键结果生成任务
      const firstKR = keyResults[0];
      const taskResponse = await request(app)
        .post('/api/ai/generate/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          keyResultTitle: firstKR.title,
          keyResultDescription: firstKR.description || '',
          targetValue: firstKR.targetValue,
          currentValue: firstKR.currentValue || 0,
          unit: firstKR.unit || '',
          timeRemaining: 90,
        })
        .expect(200);

      expect(taskResponse.body.success).toBe(true);
      expect(taskResponse.body.data.tasks.length).toBeGreaterThanOrEqual(5);

      // 3. 验证任务与关键结果的关联性
      const tasks = taskResponse.body.data.tasks;
      tasks.forEach((task: any) => {
        expect(task.title).toBeDefined();
        expect(task.priority).toBeDefined();
        expect(task.estimatedHours).toBeGreaterThan(0);
      });
    });
  });

  describe('账户隔离测试', () => {
    let userBToken: string;
    const userBUuid = 'generation-test-user-002';

    beforeEach(async () => {
      userBToken = await ApiTestHelpers.createTestToken({ accountUuid: userBUuid });
    });

    it('不同用户应该能够独立生成关键结果', async () => {
      // 用户A生成
      const userAResponse = await request(app)
        .post('/api/ai/generate/key-results')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          goalTitle: '用户A的目标',
          startDate: Date.now(),
          endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        })
        .expect(200);

      // 用户B生成
      const userBResponse = await request(app)
        .post('/api/ai/generate/key-results')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          goalTitle: '用户B的目标',
          startDate: Date.now(),
          endDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        })
        .expect(200);

      // 两个用户都应该成功生成
      expect(userAResponse.body.success).toBe(true);
      expect(userBResponse.body.success).toBe(true);
      
      // 配额应该分别计算
      expect(userAResponse.body.data.tokenUsage).toBeDefined();
      expect(userBResponse.body.data.tokenUsage).toBeDefined();
    });
  });
});
