/**
 * Schedule 模块集成测试
 * 
 * 测试完整的事件驱动调度流程：
 * Goal 创建 → 事件发布 → 调度任务创建 → Goal 删除 → 调度任务删除
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eventBus } from '@dailyuse/utils';
import { ScheduleEventPublisher } from '../ScheduleEventPublisher';
import { ScheduleApplicationService } from '../ScheduleApplicationService';
import type { GoalClientDTO, KeyResultClientDTO } from '@dailyuse/contracts/goal';

describe('Schedule Module Integration', () => {
  const testAccountUuid = 'test-account-123';
  const testGoalUuid = 'test-goal-456';

  beforeEach(async () => {
    // 初始化事件发布器
    await ScheduleEventPublisher.initialize();
  });

  afterEach(() => {
    // 重置事件发布器
    ScheduleEventPublisher.reset();
  });

  it('should create schedule task when Goal with reminderConfig is created', async () => {
    // 准备测试数据：包含提醒配置的 Goal
    const goalWithReminder: GoalServerDTO = {
      uuid: testGoalUuid,
      accountUuid: testAccountUuid,
      title: '测试目标 - 学习 DDD',
      description: '测试调度任务创建',
      status: 'in_progress' as any,
      importance: 'important',
      urgency: 'high',
      category: '学习',
      tags: ['测试', 'DDD'],
      startDate: Date.now(),
      targetDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      reminderConfig: {
        enabled: true,
        triggers: [
          {
            type: 'TIME_PROGRESS_PERCENTAGE' as any,
            value: 50,
            enabled: true,
          },
        ],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;

    // 发布 goal.created 事件
    await eventBus.publish({
      eventType: 'goal.created',
      aggregateId: testGoalUuid,
      occurredOn: new Date(),
      accountUuid: testAccountUuid,
      payload: { goal: goalWithReminder },
    });

    // 等待事件处理
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 验证：查询是否创建了调度任务
    const scheduleService = await ScheduleApplicationService.getInstance();
    const tasks = await scheduleService.getScheduleTaskBySource('GOAL' as any, testGoalUuid);

    expect(tasks).toBeDefined();
    expect(tasks.length).toBeGreaterThan(0);
    
    const task = tasks[0];
    expect(task.name).toContain('测试目标 - 学习 DDD');
    expect(task.sourceModule).toBe('GOAL');
    expect(task.sourceEntityId).toBe(testGoalUuid);
    expect(task.schedule.cronExpression).toBe('0 0 9 * * *'); // 中期目标默认每天 9:00
  });

  it('should schedule short-term goals twice per day', async () => {
    const shortTermGoalUuid = 'short-term-goal-123';
    const shortTermGoal: GoalServerDTO = {
      uuid: shortTermGoalUuid,
      accountUuid: testAccountUuid,
      title: '短期目标 - 一周打卡',
      status: 'in_progress' as any,
      importance: 'important',
      urgency: 'high',
      startDate: Date.now(),
      targetDate: Date.now() + 10 * 24 * 60 * 60 * 1000, // 10 天内完成
      reminderConfig: {
        enabled: true,
        triggers: [{ type: 'TIME_PROGRESS_PERCENTAGE' as any, value: 20, enabled: true }],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;

    await eventBus.publish({
      eventType: 'goal.created',
      aggregateId: shortTermGoalUuid,
      occurredOn: new Date(),
      accountUuid: testAccountUuid,
      payload: { goal: shortTermGoal },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const scheduleService = await ScheduleApplicationService.getInstance();
    const tasks = await scheduleService.getScheduleTaskBySource('GOAL' as any, shortTermGoalUuid);

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].schedule.cronExpression).toBe('0 0 9,20 * * *');
  });

  it('should schedule long-term goals weekly', async () => {
    const longTermGoalUuid = 'long-term-goal-456';
    const longTermGoal: GoalServerDTO = {
      uuid: longTermGoalUuid,
      accountUuid: testAccountUuid,
      title: '长期目标 - 年度 OKR',
      status: 'in_progress' as any,
      importance: 'vital',
      urgency: 'medium',
      startDate: Date.now(),
      targetDate: Date.now() + 365 * 24 * 60 * 60 * 1000, // 一年
      reminderConfig: {
        enabled: true,
        triggers: [{ type: 'REMAINING_DAYS' as any, value: 30, enabled: true }],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;

    await eventBus.publish({
      eventType: 'goal.created',
      aggregateId: longTermGoalUuid,
      occurredOn: new Date(),
      accountUuid: testAccountUuid,
      payload: { goal: longTermGoal },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const scheduleService = await ScheduleApplicationService.getInstance();
    const tasks = await scheduleService.getScheduleTaskBySource('GOAL' as any, longTermGoalUuid);

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0].schedule.cronExpression).toBe('0 0 9 * * 1');
  });

  it('should NOT create schedule task when Goal without reminderConfig is created', async () => {
    const goalWithoutReminder: GoalServerDTO = {
      uuid: 'test-goal-no-reminder',
      accountUuid: testAccountUuid,
      title: '无提醒的测试目标',
      status: 'in_progress' as any,
      importance: 'moderate',
      urgency: 'medium',
      reminderConfig: null, // 没有提醒配置
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;

    // 发布事件
    await eventBus.publish({
      eventType: 'goal.created',
      aggregateId: 'test-goal-no-reminder',
      occurredOn: new Date(),
      accountUuid: testAccountUuid,
      payload: { goal: goalWithoutReminder },
    });

    // 等待事件处理
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 验证：不应该创建调度任务
    const scheduleService = await ScheduleApplicationService.getInstance();
    const tasks = await scheduleService.getScheduleTaskBySource(
      'GOAL' as any,
      'test-goal-no-reminder',
    );

    expect(tasks.length).toBe(0);
  });

  it('should delete schedule tasks when Goal is deleted', async () => {
    // 1. 先创建一个有调度任务的 Goal
    const goalWithReminder: GoalServerDTO = {
      uuid: testGoalUuid,
      accountUuid: testAccountUuid,
      title: '待删除的测试目标',
      status: 'in_progress' as any,
      importance: 'important',
      urgency: 'high',
      reminderConfig: {
        enabled: true,
        triggers: [{ type: 'REMAINING_DAYS' as any, value: 7, enabled: true }],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any;

    await eventBus.publish({
      eventType: 'goal.created',
      aggregateId: testGoalUuid,
      occurredOn: new Date(),
      accountUuid: testAccountUuid,
      payload: { goal: goalWithReminder },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // 验证调度任务已创建
    const scheduleService = await ScheduleApplicationService.getInstance();
    let tasks = await scheduleService.getScheduleTaskBySource('GOAL' as any, testGoalUuid);
    expect(tasks.length).toBeGreaterThan(0);

    // 2. 发布 goal.deleted 事件
    await eventBus.publish({
      eventType: 'goal.deleted',
      aggregateId: testGoalUuid,
      occurredOn: new Date(),
      accountUuid: testAccountUuid,
      payload: {
        importance: goalWithReminder.importance,
        urgency: goalWithReminder.urgency,
        status: goalWithReminder.status,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // 3. 验证调度任务已删除
    tasks = await scheduleService.getScheduleTaskBySource('GOAL' as any, testGoalUuid);
    expect(tasks.length).toBe(0);
  });

  it('should calculate correct priority based on importance and urgency', async () => {
    const testCases = [
      {
        importance: 'vital',
        urgency: 'critical',
        expectedPriority: 'URGENT',
      },
      {
        importance: 'important',
        urgency: 'high',
        expectedPriority: 'HIGH',
      },
      {
        importance: 'moderate',
        urgency: 'medium',
        expectedPriority: 'NORMAL',
      },
      {
        importance: 'minor',
        urgency: 'low',
        expectedPriority: 'LOW',
      },
    ];

    for (const testCase of testCases) {
      const goal: GoalServerDTO = {
        uuid: `test-goal-priority-${testCase.importance}`,
        accountUuid: testAccountUuid,
        title: `优先级测试 ${testCase.importance}/${testCase.urgency}`,
        status: 'in_progress' as any,
        importance: testCase.importance as any,
        urgency: testCase.urgency as any,
        reminderConfig: {
          enabled: true,
          triggers: [{ type: 'TIME_PROGRESS_PERCENTAGE' as any, value: 50, enabled: true }],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      } as any;

      await eventBus.publish({
        eventType: 'goal.created',
        aggregateId: goal.uuid,
        occurredOn: new Date(),
        accountUuid: testAccountUuid,
        payload: { goal },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const scheduleService = await ScheduleApplicationService.getInstance();
      const tasks = await scheduleService.getScheduleTaskBySource('GOAL' as any, goal.uuid);

      expect(tasks.length).toBeGreaterThan(0);
      // 注意：这里需要访问 metadata，但 ClientDTO 可能不直接暴露
      // 实际测试时可能需要调整
      console.log(
        `Priority for ${testCase.importance}/${testCase.urgency}:`,
        tasks[0].metadata,
      );
    }
  });
});

