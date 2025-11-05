/**
 * 调度策略测试脚本
 * 
 * 验证三个策略（Goal/Task/Reminder）是否能正确生成调度配置
 */

import { TaskContracts, ReminderContracts, GoalContracts } from '@dailyuse/contracts';
import { 
  ScheduleTaskFactory,
  ScheduleStrategyFactory,
  GoalScheduleStrategy,
  TaskScheduleStrategy,
  ReminderScheduleStrategy,
} from '../packages/domain-server/src/schedule/services';

console.log('🧪 Schedule Strategy Integration Test\n');
console.log('='.repeat(70));

// ============ 测试 1: GoalScheduleStrategy ============
console.log('\n📋 Test 1: GoalScheduleStrategy');
console.log('-'.repeat(70));

const testGoal: GoalContracts.GoalServerDTO = {
  uuid: 'goal-test-123',
  accountUuid: 'account-123',
  title: '学习 DDD 架构',
  status: 'in_progress' as any,
  importance: 'important',
  urgency: 'high',
  startDate: Date.now(),
  targetDate: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60天后
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
  const goalStrategy = new GoalScheduleStrategy();
  const shouldCreate = goalStrategy.shouldCreateSchedule(testGoal);
  console.log(`✅ Should create schedule: ${shouldCreate}`);

  if (shouldCreate) {
    const result = goalStrategy.createSchedule({
      accountUuid: testGoal.accountUuid,
      sourceModule: 'GOAL' as any,
      sourceEntityId: testGoal.uuid,
      sourceEntity: testGoal,
    });

    console.log(`📌 Task Name: ${result.name}`);
    console.log(`📅 Cron Expression: ${result.scheduleConfig.toDTO().cronExpression}`);
    console.log(`⚡ Priority: ${result.metadata.toDTO().priority}`);
    console.log(`🏷️  Tags: ${result.metadata.toDTO().tags.join(', ')}`);
  }
} catch (error) {
  console.error('❌ GoalScheduleStrategy test failed:', error);
}

// ============ 测试 2: TaskScheduleStrategy ============
console.log('\n📋 Test 2: TaskScheduleStrategy');
console.log('-'.repeat(70));

const testTask: TaskContracts.TaskTemplateServerDTO = {
  uuid: 'task-test-456',
  accountUuid: 'account-123',
  title: '每日站立会议',
  taskType: 'RECURRING',
  status: 'ACTIVE' as any,
  importance: 'moderate',
  urgency: 'medium',
  tags: ['会议', '团队'],
  timeConfig: {
    timeType: 'TIME_POINT',
    timePoint: new Date('2025-11-05T09:30:00').getTime(),
    startDate: Date.now(),
    endDate: null,
    timeRange: null,
  },
  recurrenceRule: {
    frequency: 'WEEKLY',
    interval: 1,
    daysOfWeek: [1, 2, 3, 4, 5], // 周一到周五
    endDate: null,
    occurrences: null,
  },
  reminderConfig: {
    enabled: true,
    triggers: [
      {
        type: 'RELATIVE',
        relativeValue: 10,
        relativeUnit: 'MINUTES',
        absoluteTime: null,
      },
    ],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
} as any;

try {
  const taskStrategy = new TaskScheduleStrategy();
  const shouldCreate = taskStrategy.shouldCreateSchedule(testTask);
  console.log(`✅ Should create schedule: ${shouldCreate}`);

  if (shouldCreate) {
    const result = taskStrategy.createSchedule({
      accountUuid: testTask.accountUuid,
      sourceModule: 'TASK' as any,
      sourceEntityId: testTask.uuid,
      sourceEntity: testTask,
    });

    console.log(`📌 Task Name: ${result.name}`);
    console.log(`📅 Cron Expression: ${result.scheduleConfig.toDTO().cronExpression}`);
    console.log(`⚡ Priority: ${result.metadata.toDTO().priority}`);
    console.log(`🏷️  Tags: ${result.metadata.toDTO().tags.join(', ')}`);
  }
} catch (error) {
  console.error('❌ TaskScheduleStrategy test failed:', error);
}

// ============ 测试 3: ReminderScheduleStrategy ============
console.log('\n📋 Test 3: ReminderScheduleStrategy');
console.log('-'.repeat(70));

const testReminder: ReminderContracts.ReminderTemplateServerDTO = {
  uuid: 'reminder-test-789',
  accountUuid: 'account-123',
  title: '喝水提醒',
  type: 'RECURRING',
  status: 'ACTIVE',
  selfEnabled: true,
  importanceLevel: 'moderate',
  tags: ['健康'],
  trigger: {
    type: 'INTERVAL',
    fixedTime: null,
    interval: {
      minutes: 30,
      startTime: null,
    },
  },
  recurrence: {
    type: 'DAILY',
    daily: {
      interval: 1,
    },
    weekly: null,
    customDays: null,
  },
  activeTime: {
    startDate: Date.now(),
    endDate: null,
  },
  activeHours: null,
  notificationConfig: {
    channels: ['IN_APP', 'PUSH'],
    title: '该喝水了',
    body: '记得每30分钟喝一次水',
    sound: null,
    vibration: null,
    actions: null,
  },
  stats: {
    totalTriggers: 0,
    successfulTriggers: 0,
    failedTriggers: 0,
    lastTriggeredAt: null,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null,
} as any;

try {
  const reminderStrategy = new ReminderScheduleStrategy();
  const shouldCreate = reminderStrategy.shouldCreateSchedule(testReminder);
  console.log(`✅ Should create schedule: ${shouldCreate}`);

  if (shouldCreate) {
    const result = reminderStrategy.createSchedule({
      accountUuid: testReminder.accountUuid,
      sourceModule: 'REMINDER' as any,
      sourceEntityId: testReminder.uuid,
      sourceEntity: testReminder,
    });

    console.log(`📌 Task Name: ${result.name}`);
    console.log(`📅 Cron Expression: ${result.scheduleConfig.toDTO().cronExpression}`);
    console.log(`⚡ Priority: ${result.metadata.toDTO().priority}`);
    console.log(`🏷️  Tags: ${result.metadata.toDTO().tags.join(', ')}`);
  }
} catch (error) {
  console.error('❌ ReminderScheduleStrategy test failed:', error);
}

// ============ 测试 4: ScheduleTaskFactory 集成测试 ============
console.log('\n📋 Test 4: ScheduleTaskFactory Integration');
console.log('-'.repeat(70));

try {
  // 获取策略工厂单例并注册所有策略
  const strategyFactory = ScheduleStrategyFactory.getInstance();
  strategyFactory.registerStrategy('GOAL' as any, new GoalScheduleStrategy());
  strategyFactory.registerStrategy('TASK' as any, new TaskScheduleStrategy());
  strategyFactory.registerStrategy('REMINDER' as any, new ReminderScheduleStrategy());
  console.log('✅ All strategies registered');
  
  // 创建任务工厂
  const factory = new ScheduleTaskFactory();

  // 测试 Goal
  console.log('\n🎯 Testing Goal via Factory:');
  const goalTask = factory.createFromSourceEntity({
    accountUuid: testGoal.accountUuid,
    sourceModule: 'GOAL' as any,
    sourceEntityId: testGoal.uuid,
    sourceEntity: testGoal,
  });
  console.log(`✅ Created ScheduleTask: ${goalTask.name}`);
  console.log(`   UUID: ${goalTask.uuid}`);
  console.log(`   Status: ${goalTask.status}`);

  // 测试 Task
  console.log('\n📝 Testing Task via Factory:');
  const taskTask = factory.createFromSourceEntity({
    accountUuid: testTask.accountUuid,
    sourceModule: 'TASK' as any,
    sourceEntityId: testTask.uuid,
    sourceEntity: testTask,
  });
  console.log(`✅ Created ScheduleTask: ${taskTask.name}`);
  console.log(`   UUID: ${taskTask.uuid}`);
  console.log(`   Status: ${taskTask.status}`);

  // 测试 Reminder
  console.log('\n🔔 Testing Reminder via Factory:');
  const reminderTask = factory.createFromSourceEntity({
    accountUuid: testReminder.accountUuid,
    sourceModule: 'REMINDER' as any,
    sourceEntityId: testReminder.uuid,
    sourceEntity: testReminder,
  });
  console.log(`✅ Created ScheduleTask: ${reminderTask.name}`);
  console.log(`   UUID: ${reminderTask.uuid}`);
  console.log(`   Status: ${reminderTask.status}`);

} catch (error) {
  console.error('❌ Factory integration test failed:', error);
}

console.log('\n' + '='.repeat(70));
console.log('✅ All strategy tests completed!\n');
