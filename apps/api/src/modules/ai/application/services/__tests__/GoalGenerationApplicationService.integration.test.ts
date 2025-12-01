/**
 * GoalGenerationApplicationService Integration Tests
 * 目标生成应用服务集成测试（真实 AI API 调用）
 *
 * 使用青牛云 DeepSeek-V3 进行真实 AI 生成测试
 * 
 * 注意：这些测试会消耗 API 配额
 * 运行命令：pnpm vitest run --reporter=verbose src/modules/ai/application/services/__tests__/GoalGenerationApplicationService.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GoalGenerationApplicationService } from '../GoalGenerationApplicationService';
import { AIGenerationValidationService } from '@dailyuse/domain-server/ai';
import { CustomOpenAICompatibleAdapter } from '../../../infrastructure/adapters/CustomOpenAICompatibleAdapter';
import type { IAIUsageQuotaRepository } from '@dailyuse/domain-server/ai';
import type { GeneratedGoalDraft, KeyResultPreview } from '@dailyuse/contracts/ai';
import { GoalCategory } from '@dailyuse/contracts/ai';
import dotenv from 'dotenv';
import path from 'path';

// 加载 .env 配置
dotenv.config({ path: path.resolve(__dirname, '../../../../../../.env') });

describe('GoalGenerationApplicationService Integration Tests', () => {
  let service: GoalGenerationApplicationService;
  let qiNiuAdapter: CustomOpenAICompatibleAdapter;
  let validationService: AIGenerationValidationService;
  let mockQuotaRepository: IAIUsageQuotaRepository;

  // 存储测试期间的配额
  const quotaStore: Map<string, any> = new Map();

  beforeAll(() => {
    // 验证环境变量
    const apiKey = process.env.QI_NIU_YUN_API_KEY;
    const baseUrl = process.env.QI_NIU_YUN_BASE_URL;
    const modelId = process.env.QI_NIU_YUN_MODEL_ID;

    if (!apiKey || !baseUrl || !modelId) {
      throw new Error(
        '青牛云环境变量未配置。请确保 .env 文件包含：\n' +
        '- QI_NIU_YUN_API_KEY\n' +
        '- QI_NIU_YUN_BASE_URL\n' +
        '- QI_NIU_YUN_MODEL_ID'
      );
    }

    console.log('🚀 初始化青牛云 AI 适配器...');
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Model: ${modelId}`);

    // 创建青牛云适配器
    qiNiuAdapter = new CustomOpenAICompatibleAdapter({
      providerName: '青牛云 AI',
      baseUrl,
      apiKey,
      defaultModel: modelId,
      timeoutMs: 60000, // 60 秒超时（AI 生成需要时间）
    });

    // 创建验证服务
    validationService = new AIGenerationValidationService();

    // Mock 配额仓储（内存存储）
    mockQuotaRepository = {
      findByAccountUuid: async (accountUuid: string) => {
        return quotaStore.get(accountUuid) || null;
      },
      findByUuid: async (uuid: string) => {
        for (const quota of quotaStore.values()) {
          if (quota.uuid === uuid) return quota;
        }
        return null;
      },
      save: async (quota: any) => {
        quotaStore.set(quota.accountUuid, quota);
      },
    } as any;

    // 创建服务实例
    service = new GoalGenerationApplicationService(
      validationService,
      qiNiuAdapter,
      mockQuotaRepository,
    );

    console.log('✅ 服务初始化完成');
  });

  afterAll(() => {
    console.log('🧹 清理测试资源...');
    quotaStore.clear();
  });

  describe('generateGoal - Real AI', () => {
    it('should generate a learning goal from idea using real AI', async () => {
      const accountUuid = 'integration-test-user-001';

      console.log('\n📝 测试用例：生成学习类目标');
      console.log('   输入想法：我想在三个月内学会弹吉他');

      const result = await service.generateGoal({
        accountUuid,
        idea: '我想在三个月内学会弹吉他，能够独立弹奏几首简单的歌曲',
        category: GoalCategory.LEARNING,
      });

      console.log('\n✅ 生成结果：');
      console.log(`   标题: ${result.goal.title}`);
      console.log(`   描述: ${result.goal.description}`);
      console.log(`   类别: ${result.goal.category}`);
      console.log(`   重要性: ${result.goal.importance}`);
      console.log(`   紧急性: ${result.goal.urgency}`);
      console.log(`   标签: ${result.goal.tags.join(', ')}`);
      console.log(`   Token 使用: ${result.tokenUsage.totalTokens}`);

      // 验证返回结构
      expect(result.goal).toBeDefined();
      expect(result.goal.title).toBeTruthy();
      expect(result.goal.title.length).toBeGreaterThanOrEqual(2);
      expect(result.goal.description).toBeTruthy();
      expect(result.goal.description.length).toBeGreaterThanOrEqual(10);
      // 验证 importance 和 urgency 是有效的枚举值
      const validImportance = ['vital', 'important', 'moderate', 'minor', 'trivial'];
      const validUrgency = ['critical', 'high', 'medium', 'low', 'none'];
      expect(validImportance).toContain(result.goal.importance);
      expect(validUrgency).toContain(result.goal.urgency);
      expect(Array.isArray(result.goal.tags)).toBe(true);
      expect(result.tokenUsage.totalTokens).toBeGreaterThan(0);
      expect(result.providerUsed).toBe('青牛云 AI');
    }, 90000); // 90 秒超时

    it('should generate a health goal from idea using real AI', async () => {
      const accountUuid = 'integration-test-user-002';

      console.log('\n📝 测试用例：生成健康类目标');
      console.log('   输入想法：我想减重10公斤，恢复健康的体型');

      const result = await service.generateGoal({
        accountUuid,
        idea: '我想减重10公斤，恢复健康的体型，提高身体素质',
        category: GoalCategory.HEALTH,
        context: '我是一名久坐的程序员，每天工作10小时，缺乏运动',
      });

      console.log('\n✅ 生成结果：');
      console.log(`   标题: ${result.goal.title}`);
      console.log(`   描述: ${result.goal.description}`);
      console.log(`   动机: ${result.goal.motivation || '无'}`);
      console.log(`   可行性分析: ${result.goal.feasibilityAnalysis || '无'}`);
      console.log(`   AI 洞察: ${result.goal.aiInsights || '无'}`);

      expect(result.goal).toBeDefined();
      expect(result.goal.title).toBeTruthy();
      expect(result.goal.description).toBeTruthy();
      expect(result.tokenUsage.totalTokens).toBeGreaterThan(0);
    }, 90000);

    it('should generate a work goal from idea using real AI', async () => {
      const accountUuid = 'integration-test-user-003';

      console.log('\n📝 测试用例：生成工作类目标');
      console.log('   输入想法：我想在今年升职为技术经理');

      const result = await service.generateGoal({
        accountUuid,
        idea: '我想在今年年底前升职为技术经理，带领一个10人的开发团队',
        category: GoalCategory.WORK,
        timeframe: {
          startDate: Date.now(),
          endDate: Date.now() + 180 * 24 * 60 * 60 * 1000, // 6个月
        },
      });

      console.log('\n✅ 生成结果：');
      console.log(`   标题: ${result.goal.title}`);
      console.log(`   建议开始日期: ${new Date(result.goal.suggestedStartDate).toLocaleDateString()}`);
      console.log(`   建议结束日期: ${new Date(result.goal.suggestedEndDate).toLocaleDateString()}`);

      expect(result.goal).toBeDefined();
      expect(result.goal.title).toBeTruthy();
      expect(result.goal.suggestedStartDate).toBeDefined();
      expect(result.goal.suggestedEndDate).toBeDefined();
    }, 90000);
  });

  describe('generateKeyResults - Real AI', () => {
    it('should generate key results for a learning goal using real AI', async () => {
      const accountUuid = 'integration-test-user-004';

      console.log('\n📝 测试用例：为学习目标生成关键结果');
      console.log('   目标标题：三个月内掌握吉他入门演奏');

      const result = await service.generateKeyResults({
        accountUuid,
        goalTitle: '三个月内掌握吉他入门演奏',
        goalDescription: '能够独立弹奏 5 首简单的流行歌曲，掌握基本和弦转换',
        startDate: Date.now(),
        endDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
        goalContext: '零基础，每天有 1 小时练习时间',
      });

      console.log('\n✅ 生成的关键结果：');
      result.keyResults.forEach((kr, index) => {
        console.log(`\n   KR${index + 1}: ${kr.title}`);
        console.log(`      描述: ${kr.description || '无'}`);
        console.log(`      目标值: ${kr.targetValue} ${kr.unit || ''}`);
        console.log(`      权重: ${kr.weight}%`);
      });
      console.log(`\n   Token 使用: ${result.tokenUsage.totalTokens}`);

      // 验证返回结构
      expect(result.keyResults).toBeDefined();
      expect(Array.isArray(result.keyResults)).toBe(true);
      expect(result.keyResults.length).toBeGreaterThanOrEqual(2);
      expect(result.keyResults.length).toBeLessThanOrEqual(5);

      // 验证每个 KR 的结构
      for (const kr of result.keyResults) {
        expect(kr.title).toBeTruthy();
        expect(typeof kr.targetValue).toBe('number');
        expect(kr.targetValue).toBeGreaterThan(0);
        expect(typeof kr.weight).toBe('number');
        expect(kr.weight).toBeGreaterThan(0);
        expect(kr.weight).toBeLessThanOrEqual(100);
      }

      // 验证权重总和接近 100
      const totalWeight = result.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
      console.log(`   权重总和: ${totalWeight}%`);
      expect(totalWeight).toBeGreaterThanOrEqual(90);
      expect(totalWeight).toBeLessThanOrEqual(110);
    }, 90000);

    it('should generate key results for a health goal using real AI', async () => {
      const accountUuid = 'integration-test-user-005';

      console.log('\n📝 测试用例：为健康目标生成关键结果');
      console.log('   目标标题：减重10公斤恢复健康');

      const result = await service.generateKeyResults({
        accountUuid,
        goalTitle: '减重10公斤恢复健康',
        goalDescription: '通过健康饮食和规律运动，在6个月内减重10公斤',
        startDate: Date.now(),
        endDate: Date.now() + 180 * 24 * 60 * 60 * 1000,
      });

      console.log('\n✅ 生成的关键结果：');
      result.keyResults.forEach((kr, index) => {
        console.log(`   KR${index + 1}: ${kr.title} (目标: ${kr.targetValue} ${kr.unit || ''}, 权重: ${kr.weight}%)`);
      });

      expect(result.keyResults).toBeDefined();
      expect(result.keyResults.length).toBeGreaterThanOrEqual(2);
    }, 90000);
  });

  describe('Quota Management - Real AI', () => {
    it('should consume quota after successful generation', async () => {
      const accountUuid = 'integration-test-user-quota';

      // 生成前检查配额
      const quotaBefore = quotaStore.get(accountUuid);
      console.log(`\n📊 生成前配额: ${quotaBefore ? quotaBefore.currentUsage : '未创建'}`);

      await service.generateGoal({
        accountUuid,
        idea: '我想学习一门新的编程语言',
      });

      // 生成后检查配额
      const quotaAfter = quotaStore.get(accountUuid);
      console.log(`   生成后配额: ${quotaAfter.currentUsage}`);

      expect(quotaAfter).toBeDefined();
      expect(quotaAfter.currentUsage).toBeGreaterThan(0);
    }, 90000);
  });
});
