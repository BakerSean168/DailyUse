/**
 * Reminder to Schedule Integration Test
 * 测试从创建 Reminder 到 Schedule 监听事件并创建 ScheduleTask 的完整流程
 * 
 * 测试流程:
 * 1. 创建 ReminderTemplate
 * 2. ReminderTemplate 发布领域事件 (reminder.template.created)
 * 3. ScheduleEventPublisher 监听事件
 * 4. 使用 ScheduleTaskFactory 创建 ScheduleTask
 * 5. 保存 ScheduleTask 到数据库
 * 
 * 错误处理测试:
 * - ScheduleStrategyNotFoundError: 找不到对应的调度策略
 * - ScheduleTaskCreationError: 创建调度任务失败
 * - ScheduleTaskSaveError: 保存调度任务失败
 * 
 * ⚠️ 注意: 此测试文件禁用了全局的 beforeEach cleanDatabase()
 * 因为我们需要保留 account 数据，避免每次测试前都重新创建
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { ReminderApplicationService } from '../../../../reminder/application/services/ReminderApplicationService';
import { ScheduleApplicationService } from '../ScheduleApplicationService';
import { ScheduleEventPublisher } from '../ScheduleEventPublisher';
import { ReminderContainer } from '../../../../reminder/infrastructure/di/ReminderContainer';
import { ScheduleContainer } from '../../../infrastructure/di/ScheduleContainer';
import { eventBus, createLogger } from '@dailyuse/utils';
import type { ReminderContracts } from '@dailyuse/contracts';
import { 
  ScheduleStrategyNotFoundError,
  SourceEntityNoScheduleRequiredError,
  ScheduleTaskCreationError,
} from '@dailyuse/domain-server';

const logger = createLogger('ReminderToScheduleIntegrationTest');

describe('Reminder to Schedule Integration Test', () => {
  let prisma: PrismaClient;
  let reminderService: ReminderApplicationService;
  let scheduleService: ScheduleApplicationService;
  let testAccountUuid: string;
  let createdReminderUuid: string | null = null;
  let createdScheduleTaskUuid: string | null = null;

  // 测试数据
  const TEST_ACCOUNT_UUID = 'test-account-integration-001';

  beforeAll(async () => {
    // 禁用全局的 beforeEach cleanDatabase()
    process.env.SKIP_DB_CLEAN = 'true';

    // 使用全局 Prisma 实例（与 Repository 相同的实例）
    prisma = ReminderContainer.getInstance().getPrismaClient();

    // 确保测试账户存在
    testAccountUuid = TEST_ACCOUNT_UUID;
    
    let account = await prisma.account.findUnique({
      where: { uuid: testAccountUuid },
    });
    
    if (!account) {
      logger.warn('⚠️  测试账户不存在，正在创建...');
      // 测试数据库被 db push 清空了，重新创建账户
      await prisma.account.create({
        data: {
          uuid: testAccountUuid,
          username: 'integration_test_user',
          email: 'integration_test@example.com',
          profile: JSON.stringify({
            displayName: 'Integration Test User',
            avatar: null,
          }),
          preferences: JSON.stringify({}),
          subscription: null,
          storage: JSON.stringify({}),
          security: JSON.stringify({}),
          stats: JSON.stringify({}),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      logger.info('✅ 测试账户已创建');
    }

    // 初始化服务
    reminderService = await ReminderApplicationService.getInstance();
    scheduleService = await ScheduleApplicationService.getInstance();

    // 初始化 ScheduleEventPublisher（注册事件监听器）
    ScheduleEventPublisher.initialize();

    logger.info('✅ Test environment initialized');
  });

  afterAll(async () => {
    // 恢复环境变量
    delete process.env.SKIP_DB_CLEAN;

    // 清理测试数据
    if (createdScheduleTaskUuid) {
      try {
        await prisma.scheduleTask.delete({
          where: { uuid: createdScheduleTaskUuid },
        });
        logger.info('🗑️  Cleaned up schedule task', { uuid: createdScheduleTaskUuid });
      } catch (error) {
        logger.warn('Failed to cleanup schedule task', { error });
      }
    }

    if (createdReminderUuid) {
      try {
        await prisma.reminderHistory.deleteMany({
          where: { templateUuid: createdReminderUuid },
        });
        await prisma.reminderTemplate.delete({
          where: { uuid: createdReminderUuid },
        });
        logger.info('🗑️  Cleaned up reminder template', { uuid: createdReminderUuid });
      } catch (error) {
        logger.warn('Failed to cleanup reminder template', { error });
      }
    }

    await prisma.$disconnect();
    logger.info('✅ Test environment cleaned up');
  });

  beforeEach(() => {
    // 只重置测试状态，不清理数据库
    // account 在 beforeAll 中创建一次后会一直保留
    createdReminderUuid = null;
    createdScheduleTaskUuid = null;
  });

  describe('成功流程：Reminder 创建触发 Schedule 任务创建', () => {
    it('应该成功创建 Reminder 并自动创建对应的 ScheduleTask', async () => {
      logger.info('🧪 Test: 创建 Reminder 并验证 ScheduleTask 自动创建');

      // Step 1: 创建 ReminderTemplate
      logger.info('📝 Step 1: 创建 ReminderTemplate');
      
      const reminderParams = {
        accountUuid: testAccountUuid,
        title: '集成测试提醒',
        description: '这是一个用于测试 Reminder → Schedule 集成流程的提醒',
        type: 'GENERAL' as ReminderContracts.ReminderType,
        trigger: {
          type: 'TIME' as ReminderContracts.TriggerType,
          timeConfig: {
            scheduleTime: Date.now() + 3600000, // 1小时后
          },
        } as ReminderContracts.TriggerConfigServerDTO,
        recurrence: {
          pattern: 'DAILY' as ReminderContracts.RecurrencePattern,
          interval: 1,
        } as ReminderContracts.RecurrenceConfigServerDTO,
        activeTime: {
          enabled: true,
          timeRanges: [
            {
              startTime: '09:00',
              endTime: '18:00',
            },
          ],
        } as ReminderContracts.ActiveTimeConfigServerDTO,
        notificationConfig: {
          channels: ['DESKTOP' as ReminderContracts.NotificationChannel],
          priority: 'NORMAL' as ReminderContracts.NotificationPriority,
        } as ReminderContracts.NotificationConfigServerDTO,
        importanceLevel: 'NORMAL' as any,
        tags: ['integration-test', 'schedule-test'],
      };

      const createdReminder = await reminderService.createReminderTemplate(reminderParams);
      createdReminderUuid = createdReminder.uuid;

      logger.info('✅ Reminder 创建成功', {
        uuid: createdReminder.uuid,
        title: createdReminder.title,
      });

      expect(createdReminder).toBeDefined();
      expect(createdReminder.uuid).toBeTruthy();
      expect(createdReminder.title).toBe('集成测试提醒');

      // Step 2: 等待事件处理（事件总线是异步的）
      logger.info('⏳ Step 2: 等待事件总线处理事件...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // 增加到 3 秒

      // Step 3: 验证 ScheduleTask 是否已创建
      logger.info('🔍 Step 3: 验证 ScheduleTask 是否已创建');
      
      //先查所有任务看看
      const allTasks = await prisma.scheduleTask.findMany();
      logger.info('📊 数据库中所有 ScheduleTask', {
        count: allTasks.length,
      });
      
      const scheduleTasks = await prisma.scheduleTask.findMany({
        where: {
          accountUuid: testAccountUuid,
          sourceModule: 'reminder', // 改为小写
          sourceEntityId: createdReminder.uuid,
        },
      });

      logger.info('📊 查询到的 ScheduleTask', {
        count: scheduleTasks.length,
        tasks: scheduleTasks.map(t => ({
          uuid: t.uuid,
          name: t.name,
          sourceModule: t.sourceModule,
          sourceEntityId: t.sourceEntityId,
          status: t.status,
        })),
      });

      expect(scheduleTasks.length).toBeGreaterThan(0);
      
      const scheduleTask = scheduleTasks[0];
      createdScheduleTaskUuid = scheduleTask.uuid;

      expect(scheduleTask.sourceModule).toBe('reminder'); // 小写
      expect(scheduleTask.sourceEntityId).toBe(createdReminder.uuid);
      expect(scheduleTask.accountUuid).toBe(testAccountUuid);
      expect(scheduleTask.name).toContain('集成测试提醒');

      logger.info('✅ 集成测试成功：Reminder → ScheduleTask 创建流程正常', {
        reminderUuid: createdReminder.uuid,
        scheduleTaskUuid: scheduleTask.uuid,
      });
    }, 10000); // 设置 10 秒超时，因为涉及异步事件处理
  });

  describe('错误处理：调度策略不存在', () => {
    it('应该正确处理找不到调度策略的错误', async () => {
      logger.info('🧪 Test: 模拟调度策略不存在的错误');

      // 验证错误处理逻辑
      // ScheduleStrategyNotFoundError 构造函数签名:
      // constructor(sourceModule, context?: { availableModules?, operationId? })
      
      const strategyNotFoundError = new ScheduleStrategyNotFoundError(
        'UNKNOWN_MODULE' as any,
        {
          availableModules: ['REMINDER', 'TASK', 'GOAL'] as any[],
          operationId: 'test-operation-001',
        }
      );

      expect(strategyNotFoundError).toBeInstanceOf(ScheduleStrategyNotFoundError);
      expect(strategyNotFoundError.message).toContain('No schedule strategy found');
      expect(strategyNotFoundError.operationId).toBe('test-operation-001');
      expect(strategyNotFoundError.context).toBeDefined();
      expect(strategyNotFoundError.context?.sourceModule).toBe('UNKNOWN_MODULE');

      logger.info('✅ ScheduleStrategyNotFoundError 错误类定义正确');
    });
  });

  describe('错误处理：调度任务创建失败', () => {
    it('应该正确处理调度任务创建失败的错误', async () => {
      logger.info('🧪 Test: 模拟调度任务创建失败的错误');

      // ScheduleTaskCreationError 构造函数签名:
      // constructor(sourceModule, sourceEntityId, reason, context?)
      const taskCreationError = new ScheduleTaskCreationError(
        'REMINDER' as any,
        'test-reminder-uuid',
        'Invalid schedule configuration',
        {
          scheduleConfig: { invalid: true },
          operationId: 'test-operation-002',
          step: 'validate_schedule_config',
        }
      );

      expect(taskCreationError).toBeInstanceOf(ScheduleTaskCreationError);
      expect(taskCreationError.message).toContain('Failed to create schedule task');
      expect(taskCreationError.operationId).toBe('test-operation-002');
      expect(taskCreationError.step).toBe('validate_schedule_config');
      expect(taskCreationError.context).toBeDefined();
      expect(taskCreationError.context?.reason).toBe('Invalid schedule configuration');

      logger.info('✅ ScheduleTaskCreationError 错误类定义正确');
    });
  });

  describe('错误处理：调度任务保存失败', () => {
    it('应该正确处理调度任务保存失败的错误', async () => {
      logger.info('🧪 Test: 模拟调度任务保存失败的错误');

      // 使用 ScheduleTaskCreationError 模拟保存失败场景
      const taskSaveError = new ScheduleTaskCreationError(
        'REMINDER' as any,
        'test-reminder-uuid',
        'Database connection error during save',
        {
          operationId: 'test-operation-003',
          step: 'save_to_database',
          originalError: new Error('Connection timeout'),
        }
      );

      expect(taskSaveError).toBeInstanceOf(ScheduleTaskCreationError);
      expect(taskSaveError.message).toContain('Failed to create schedule task');
      expect(taskSaveError.operationId).toBe('test-operation-003');
      expect(taskSaveError.step).toBe('save_to_database');
      expect(taskSaveError.context).toBeDefined();
      expect(taskSaveError.context?.reason).toBe('Database connection error during save');
      expect(taskSaveError.originalError).toBeDefined();
      expect(taskSaveError.originalError?.message).toBe('Connection timeout');

      logger.info('✅ ScheduleTaskCreationError (save scenario) 错误类定义正确');
    });
  });

  describe('详细日志验证', () => {
    it('应该在创建流程中输出详细的日志信息', async () => {
      logger.info('🧪 Test: 验证详细日志输出');

      // 捕获 console.log 输出
      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        consoleLogs.push(args.join(' '));
        originalLog(...args);
      };

      try {
        // 创建 Reminder
        const reminderParams = {
          accountUuid: testAccountUuid,
          title: '日志测试提醒',
          type: 'GENERAL' as ReminderContracts.ReminderType,
          trigger: {
            type: 'TIME' as ReminderContracts.TriggerType,
            timeConfig: {
              scheduleTime: Date.now() + 7200000, // 2小时后
            },
          } as ReminderContracts.TriggerConfigServerDTO,
          activeTime: {
            enabled: true,
            timeRanges: [
              {
                startTime: '00:00',
                endTime: '23:59',
              },
            ],
          } as ReminderContracts.ActiveTimeConfigServerDTO,
          notificationConfig: {
            channels: ['DESKTOP' as ReminderContracts.NotificationChannel],
            priority: 'NORMAL' as ReminderContracts.NotificationPriority,
          } as ReminderContracts.NotificationConfigServerDTO,
        };

        const reminder = await reminderService.createReminderTemplate(reminderParams);
        createdReminderUuid = reminder.uuid;

        // 等待事件处理
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 验证日志中包含关键信息
        const relevantLogs = consoleLogs.filter(log => 
          log.includes('ReminderApplicationService') || 
          log.includes('ScheduleEventPublisher') ||
          log.includes('ScheduleTaskFactory')
        );

        logger.info('📋 捕获的相关日志', {
          count: relevantLogs.length,
          logs: relevantLogs,
        });

        // 验证日志内容
        expect(relevantLogs.some(log => log.includes('Publishing domain events'))).toBe(true);
        expect(relevantLogs.some(log => log.includes('Publishing event'))).toBe(true);

        // 清理
        const tasks = await prisma.scheduleTask.findMany({
          where: {
            accountUuid: testAccountUuid,
            sourceEntityId: reminder.uuid,
          },
        });
        
        if (tasks.length > 0) {
          createdScheduleTaskUuid = tasks[0].uuid;
        }

        logger.info('✅ 日志输出验证成功');
      } finally {
        // 恢复 console.log
        console.log = originalLog;
      }
    }, 10000);
  });

  describe('端到端流程验证', () => {
    it('应该完整验证 Reminder → Event → ScheduleTask 的数据一致性', async () => {
      logger.info('🧪 Test: 端到端流程验证');

      // 1. 创建具有特定配置的 Reminder
      const reminderParams = {
        accountUuid: testAccountUuid,
        title: '端到端测试提醒',
        description: '用于验证数据一致性',
        type: 'HABIT' as ReminderContracts.ReminderType,
        trigger: {
          type: 'TIME' as ReminderContracts.TriggerType,
          timeConfig: {
            scheduleTime: Date.now() + 86400000, // 24小时后
          },
        } as ReminderContracts.TriggerConfigServerDTO,
        recurrence: {
          pattern: 'WEEKLY' as ReminderContracts.RecurrencePattern,
          interval: 1,
          daysOfWeek: [1, 3, 5], // 周一、周三、周五
        } as ReminderContracts.RecurrenceConfigServerDTO,
        activeTime: {
          enabled: true,
          timeRanges: [
            {
              startTime: '08:00',
              endTime: '20:00',
            },
          ],
        } as ReminderContracts.ActiveTimeConfigServerDTO,
        notificationConfig: {
          channels: ['DESKTOP' as ReminderContracts.NotificationChannel, 'EMAIL' as ReminderContracts.NotificationChannel],
          priority: 'HIGH' as ReminderContracts.NotificationPriority,
        } as ReminderContracts.NotificationConfigServerDTO,
        importanceLevel: 'HIGH' as any,
        tags: ['e2e-test', 'habit', 'schedule'],
        color: '#FF5733',
      };

      const reminder = await reminderService.createReminderTemplate(reminderParams);
      createdReminderUuid = reminder.uuid;

      logger.info('✅ Reminder 创建完成', { uuid: reminder.uuid });

      // 2. 等待事件处理
      await new Promise(resolve => setTimeout(resolve, 3000)); // 增加到 3 秒

      // 3. 查询生成的 ScheduleTask
      const scheduleTasks = await prisma.scheduleTask.findMany({
        where: {
          accountUuid: testAccountUuid,
          sourceModule: 'reminder', // 改为小写
          sourceEntityId: reminder.uuid,
        },
      });

      expect(scheduleTasks.length).toBeGreaterThan(0);
      
      const scheduleTask = scheduleTasks[0];
      createdScheduleTaskUuid = scheduleTask.uuid;

      logger.info('✅ ScheduleTask 查询成功', {
        uuid: scheduleTask.uuid,
        name: scheduleTask.name,
      });

      // 4. 验证数据一致性
      expect(scheduleTask.sourceModule).toBe('reminder'); // 小写
      expect(scheduleTask.sourceEntityId).toBe(reminder.uuid);
      expect(scheduleTask.accountUuid).toBe(testAccountUuid);
      expect(scheduleTask.name).toContain('端到端测试提醒');

      // 验证扁平化后的调度配置字段
      expect(scheduleTask.cronExpression).toBeDefined();
      expect(scheduleTask.timezone).toBe('Asia/Shanghai');
      expect(scheduleTask.enabled).toBe(true);
      expect(scheduleTask.status).toBe('active');
      
      // 验证 payload 包含正确的 Reminder 信息
      const payload = JSON.parse(scheduleTask.payload as string);
      expect(payload.reminderUuid).toBe(reminder.uuid);
      expect(payload.reminderTitle).toBe('端到端测试提醒');
      expect(payload.reminderType).toBe('HABIT');
      
      // 验证 tags 包含正确的标签
      const tags = JSON.parse(scheduleTask.tags as string);
      expect(tags).toContain('reminder');
      expect(tags).toContain('type:HABIT');

      logger.info('✅ 数据一致性验证成功', {
        reminderUuid: reminder.uuid,
        scheduleTaskUuid: scheduleTask.uuid,
        cronExpression: scheduleTask.cronExpression,
        payload,
        tags,
      });
    }, 10000);
  });
});
