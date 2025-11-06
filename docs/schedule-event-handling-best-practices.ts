/**
 * Schedule 模块事件监听最佳实践
 * 
 * 设计原则：
 * 1. 监听所有影响调度的源实体变更事件
 * 2. 根据变更类型决定更新、删除或重新创建调度任务
 * 3. 支持幂等性和最终一致性
 * 
 * 事件类型：
 * - created: 创建调度任务
 * - updated: 更新或重新创建调度任务
 * - deleted: 删除调度任务
 * - enabled/disabled: 激活/暂停调度任务
 * - schedule_changed: 时间配置变更
 */

// ============================================================================
// 1. Goal 模块事件
// ============================================================================

/**
 * Goal 创建事件
 * - 如果有 reminderConfig，创建调度任务
 */
eventBus.on('goal.created', async (event) => {
  // ✅ 已实现
  await handleGoalCreated(event);
});

/**
 * Goal 更新事件
 * - 检查是否影响调度（startDate/targetDate/reminderConfig 变更）
 * - 重新创建调度任务（删除旧的，创建新的）
 */
eventBus.on('goal.updated', async (event) => {
  const { goal, changes } = event.payload;
  
  // 检查是否影响调度的字段
  const scheduleAffectingFields = ['startDate', 'targetDate', 'reminderConfig'];
  const hasScheduleChanges = changes.some(change => 
    scheduleAffectingFields.includes(change.field)
  );
  
  if (!hasScheduleChanges) {
    console.log(`ℹ️  Goal ${goal.uuid} updated, but schedule not affected`);
    return;
  }
  
  // 删除旧的调度任务
  await deleteScheduleTasksBySource('GOAL', goal.uuid, event.accountUuid);
  
  // 如果 reminderConfig 仍然启用，创建新的调度任务
  if (goal.reminderConfig?.enabled) {
    await handleGoalCreated({ ...event, payload: { goal } });
  }
  
  console.log(`✅ Goal ${goal.uuid} schedule updated`);
});

/**
 * Goal 时间变更事件（专门的时间修改事件）
 * - 更精确地处理时间变更
 * - 支持时间延长/缩短
 */
eventBus.on('goal.schedule_time_changed', async (event) => {
  const { goal, oldStartDate, oldTargetDate, newStartDate, newTargetDate } = event.payload;
  
  console.log(`⏰ Goal ${goal.uuid} time changed:`);
  console.log(`   Old: ${new Date(oldStartDate)} -> ${new Date(oldTargetDate)}`);
  console.log(`   New: ${new Date(newStartDate)} -> ${new Date(newTargetDate)}`);
  
  // 重新计算调度策略
  await deleteScheduleTasksBySource('GOAL', goal.uuid, event.accountUuid);
  
  if (goal.reminderConfig?.enabled) {
    await handleGoalCreated({ ...event, payload: { goal } });
  }
});

/**
 * Goal 删除事件
 * - 删除所有关联的调度任务
 */
eventBus.on('goal.deleted', async (event) => {
  // ✅ 已实现
  await handleGoalDeleted(event);
});

// ============================================================================
// 2. Task 模块事件
// ============================================================================

/**
 * Task 创建事件
 * - 如果是 RECURRING 任务且有 reminderConfig，创建调度任务
 */
eventBus.on('task.created', async (event) => {
  // ✅ 已实现
  await handleTaskCreated(event);
});

/**
 * Task 更新事件
 * - 检查是否影响调度（timeConfig/recurrenceRule/reminderConfig 变更）
 * - 重新创建调度任务
 */
eventBus.on('task.updated', async (event) => {
  const { task, changes } = event.payload;
  
  // 检查是否影响调度的字段
  const scheduleAffectingFields = [
    'timeConfig',
    'recurrenceRule',
    'reminderConfig',
    'taskType',
    'status'
  ];
  
  const hasScheduleChanges = changes.some(change => 
    scheduleAffectingFields.includes(change.field)
  );
  
  if (!hasScheduleChanges) {
    console.log(`ℹ️  Task ${task.uuid} updated, but schedule not affected`);
    return;
  }
  
  // 删除旧的调度任务
  await deleteScheduleTasksBySource('TASK', task.uuid, event.accountUuid);
  
  // 如果任务仍然需要调度，创建新的调度任务
  if (task.taskType === 'RECURRING' && task.reminderConfig?.enabled) {
    await handleTaskCreated({ ...event, payload: { task } });
  }
  
  console.log(`✅ Task ${task.uuid} schedule updated`);
});

/**
 * Task 时间变更事件
 * - 处理任务时间点或时间范围的变更
 */
eventBus.on('task.schedule_time_changed', async (event) => {
  const { task, oldTimeConfig, newTimeConfig } = event.payload;
  
  console.log(`⏰ Task ${task.uuid} time changed`);
  
  // 重新创建调度任务
  await deleteScheduleTasksBySource('TASK', task.uuid, event.accountUuid);
  
  if (task.taskType === 'RECURRING' && task.reminderConfig?.enabled) {
    await handleTaskCreated({ ...event, payload: { task } });
  }
});

/**
 * Task 重复规则变更事件
 * - 处理 DAILY/WEEKLY/MONTHLY 等重复规则的变更
 */
eventBus.on('task.recurrence_changed', async (event) => {
  const { task, oldRecurrenceRule, newRecurrenceRule } = event.payload;
  
  console.log(`🔄 Task ${task.uuid} recurrence changed`);
  console.log(`   Old: ${oldRecurrenceRule.frequency}`);
  console.log(`   New: ${newRecurrenceRule.frequency}`);
  
  // 重新创建调度任务
  await deleteScheduleTasksBySource('TASK', task.uuid, event.accountUuid);
  
  if (task.taskType === 'RECURRING' && task.reminderConfig?.enabled) {
    await handleTaskCreated({ ...event, payload: { task } });
  }
});

/**
 * Task 删除事件
 * - 删除所有关联的调度任务
 */
eventBus.on('task.deleted', async (event) => {
  // ✅ 已实现
  await handleTaskDeleted(event);
});

// ============================================================================
// 3. Reminder 模块事件
// ============================================================================

/**
 * Reminder 创建事件
 * - 如果 selfEnabled=true 且 status=ACTIVE，创建调度任务
 */
eventBus.on('reminder.created', async (event) => {
  // ✅ 已实现
  await handleReminderCreated(event);
});

/**
 * Reminder 更新事件
 * - 检查是否影响调度（trigger/recurrence/activeTime 变更）
 * - 重新创建调度任务
 */
eventBus.on('reminder.updated', async (event) => {
  const { reminder, changes } = event.payload;
  
  // 检查是否影响调度的字段
  const scheduleAffectingFields = [
    'trigger',
    'recurrence',
    'activeTime',
    'activeHours',
    'selfEnabled',
    'status'
  ];
  
  const hasScheduleChanges = changes.some(change => 
    scheduleAffectingFields.includes(change.field)
  );
  
  if (!hasScheduleChanges) {
    console.log(`ℹ️  Reminder ${reminder.uuid} updated, but schedule not affected`);
    return;
  }
  
  // 删除旧的调度任务
  await deleteScheduleTasksBySource('REMINDER', reminder.uuid, event.accountUuid);
  
  // 如果 Reminder 仍然需要调度，创建新的调度任务
  if (reminder.selfEnabled && reminder.status === 'ACTIVE') {
    await handleReminderCreated({ ...event, payload: { reminder } });
  }
  
  console.log(`✅ Reminder ${reminder.uuid} schedule updated`);
});

/**
 * Reminder 启用/禁用事件
 * - 专门处理 Reminder 的启用和禁用
 */
eventBus.on('reminder.enabled', async (event) => {
  const { reminder } = event.payload;
  
  console.log(`✅ Reminder ${reminder.uuid} enabled`);
  
  // 创建调度任务
  if (reminder.status === 'ACTIVE') {
    await handleReminderCreated({ ...event, payload: { reminder } });
  }
});

eventBus.on('reminder.disabled', async (event) => {
  const { reminder } = event.payload;
  
  console.log(`⏸️  Reminder ${reminder.uuid} disabled`);
  
  // 删除调度任务
  await deleteScheduleTasksBySource('REMINDER', reminder.uuid, event.accountUuid);
});

/**
 * Reminder 触发配置变更事件
 * - 处理 FIXED_TIME/INTERVAL 触发配置的变更
 */
eventBus.on('reminder.trigger_changed', async (event) => {
  const { reminder, oldTrigger, newTrigger } = event.payload;
  
  console.log(`⏰ Reminder ${reminder.uuid} trigger changed`);
  console.log(`   Old: ${oldTrigger.type}`);
  console.log(`   New: ${newTrigger.type}`);
  
  // 重新创建调度任务
  await deleteScheduleTasksBySource('REMINDER', reminder.uuid, event.accountUuid);
  
  if (reminder.selfEnabled && reminder.status === 'ACTIVE') {
    await handleReminderCreated({ ...event, payload: { reminder } });
  }
});

/**
 * Reminder 删除事件
 * - 删除所有关联的调度任务
 */
eventBus.on('reminder.deleted', async (event) => {
  // ✅ 已实现
  await handleReminderDeleted(event);
});

// ============================================================================
// 4. 通用的调度任务管理助手函数
// ============================================================================

/**
 * 删除源实体关联的调度任务
 */
async function deleteScheduleTasksBySource(
  sourceModule: string,
  sourceEntityId: string,
  accountUuid: string
): Promise<void> {
  const scheduleService = await ScheduleApplicationService.getInstance();
  await scheduleService.deleteScheduleTasksBySource(
    sourceModule as any,
    sourceEntityId,
    accountUuid
  );
}

/**
 * 检查变更是否影响调度
 * 
 * @param changes 变更字段列表
 * @param scheduleAffectingFields 影响调度的字段
 */
function hasScheduleAffectingChanges(
  changes: Array<{ field: string; oldValue: any; newValue: any }>,
  scheduleAffectingFields: string[]
): boolean {
  return changes.some(change => scheduleAffectingFields.includes(change.field));
}

/**
 * 通用的调度任务更新处理器
 * 
 * @param event 领域事件
 * @param shouldCreateSchedule 判断是否应该创建调度的函数
 * @param createHandler 创建调度任务的处理器
 */
async function handleScheduleUpdate(
  event: any,
  shouldCreateSchedule: (entity: any) => boolean,
  createHandler: (event: any) => Promise<void>
): Promise<void> {
  const { entity, changes } = event.payload;
  const sourceModule = event.aggregateType.toUpperCase();
  
  // 删除旧的调度任务
  await deleteScheduleTasksBySource(
    sourceModule,
    entity.uuid,
    event.accountUuid
  );
  
  // 如果实体仍然需要调度，创建新的调度任务
  if (shouldCreateSchedule(entity)) {
    await createHandler({ ...event, payload: { [event.aggregateType]: entity } });
  }
  
  console.log(`✅ ${sourceModule} ${entity.uuid} schedule updated`);
}
