/**
 * Schedule 策略模式演示
 * 
 * 这个文件展示了如何使用策略工厂创建调度任务
 */

import { ScheduleTaskFactory, GoalScheduleStrategy } from '@dailyuse/domain-server';
import type { GoalContracts } from '@dailyuse/contracts';

// ============ 演示 1：从 Goal 创建调度任务 ============

console.log('='.repeat(60));
console.log('演示 1：从 Goal 创建调度任务');
console.log('='.repeat(60));

// 模拟一个包含提醒配置的 Goal
const goalWithReminder: GoalContracts.GoalServerDTO = {
  uuid: 'goal-123',
  accountUuid: 'account-456',
  title: '学习领域驱动设计',
  description: '系统学习 DDD 理论和实践',
  status: 'in_progress' as any,
  importance: 'important',
  urgency: 'high',
  category: '学习',
  tags: ['技术', 'DDD'],
  startDate: Date.now(),
  targetDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天后
  reminderConfig: {
    enabled: true,
    triggers: [
      {
        type: 'TIME_PROGRESS_PERCENTAGE' as any,
        value: 50,
        enabled: true,
      },
      {
        type: 'REMAINING_DAYS' as any,
        value: 7,
        enabled: true,
      },
    ],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
} as any;

try {
  const factory = new ScheduleTaskFactory();
  
  console.log('\n1. 输入数据：');
  console.log('Goal 标题:', goalWithReminder.title);
  console.log('重要性:', goalWithReminder.importance);
  console.log('紧急程度:', goalWithReminder.urgency);
  console.log('提醒触发器:', goalWithReminder.reminderConfig?.triggers);
  
  const scheduleTask = factory.createFromSourceEntity({
    accountUuid: goalWithReminder.accountUuid,
    sourceModule: 'GOAL' as any,
    sourceEntityId: goalWithReminder.uuid,
    sourceEntity: goalWithReminder,
  });
  
  console.log('\n2. 生成的调度任务：');
  console.log('任务名称:', scheduleTask.name);
  console.log('Cron 表达式:', scheduleTask.schedule.cronExpression);
  console.log('下次执行时间:', new Date(scheduleTask.execution.nextRunAt || 0).toLocaleString());
  console.log('任务优先级:', scheduleTask.metadata.toDTO().priority);
  console.log('任务标签:', scheduleTask.metadata.toDTO().tags);
  console.log('任务 Payload:', scheduleTask.metadata.toDTO().payload);
  
  console.log('\n✅ 成功创建调度任务！');
} catch (error: any) {
  console.error('\n❌ 创建失败:', error.message);
}

// ============ 演示 2：Goal 没有提醒配置 ============

console.log('\n' + '='.repeat(60));
console.log('演示 2：Goal 没有提醒配置（不创建调度）');
console.log('='.repeat(60));

const goalWithoutReminder: GoalContracts.GoalServerDTO = {
  ...goalWithReminder,
  uuid: 'goal-789',
  title: '没有提醒的目标',
  reminderConfig: null, // 没有提醒配置
};

try {
  const factory = new ScheduleTaskFactory();
  
  console.log('\n1. 输入数据：');
  console.log('Goal 标题:', goalWithoutReminder.title);
  console.log('提醒配置:', goalWithoutReminder.reminderConfig);
  
  const scheduleTask = factory.createFromSourceEntity({
    accountUuid: goalWithoutReminder.accountUuid,
    sourceModule: 'GOAL' as any,
    sourceEntityId: goalWithoutReminder.uuid,
    sourceEntity: goalWithoutReminder,
  });
  
  console.log('\n2. 生成的调度任务:', scheduleTask);
} catch (error: any) {
  console.log('\n✅ 正常情况：', error.message);
  console.log('说明：Goal 没有启用提醒配置，不需要创建调度任务');
}

// ============ 演示 3：策略模式的扩展性 ============

console.log('\n' + '='.repeat(60));
console.log('演示 3：策略模式的扩展性');
console.log('='.repeat(60));

console.log('\n当前支持的策略：');
console.log('- GoalScheduleStrategy: 处理 Goal 的提醒触发器');
console.log('\n待扩展的策略：');
console.log('- TaskScheduleStrategy: 处理 Task 的重复配置');
console.log('- ReminderScheduleStrategy: 处理 Reminder 的时间配置');
console.log('\n扩展方法：');
console.log('1. 实现 IScheduleStrategy 接口');
console.log('2. 在 ScheduleStrategyFactory 中注册');
console.log('3. 无需修改现有代码！');

console.log('\n' + '='.repeat(60));
console.log('演示完成！');
console.log('='.repeat(60));
