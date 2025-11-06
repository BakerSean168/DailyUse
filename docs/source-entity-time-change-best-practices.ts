/**
 * 源实体时间修改方法最佳实践
 * 
 * 设计原则：
 * 1. 在聚合根中提供专门的时间修改方法
 * 2. 方法内部发出领域事件
 * 3. 事件携带旧值和新值，便于 Schedule 模块判断变更
 * 4. 保持方法的语义化和单一职责
 */

// ============================================================================
// 1. Goal 聚合根 - 时间修改方法
// ============================================================================

export class Goal extends AggregateRoot {
  // ... 其他属性和方法
  
  /**
   * 修改目标的开始时间和结束时间
   * 
   * 业务规则：
   * - startDate 必须早于 targetDate
   * - 时间修改会触发调度任务的重新计算
   * - 发出 goal.schedule_time_changed 事件
   * 
   * @param newStartDate 新的开始时间
   * @param newTargetDate 新的结束时间
   */
  changeScheduleTime(newStartDate: number, newTargetDate: number): void {
    // 验证业务规则
    if (newStartDate >= newTargetDate) {
      throw new Error('Start date must be earlier than target date');
    }
    
    // 保存旧值
    const oldStartDate = this.startDate;
    const oldTargetDate = this.targetDate;
    
    // 更新值
    this.startDate = newStartDate;
    this.targetDate = newTargetDate;
    this.updatedAt = Date.now();
    
    // 发出领域事件（Schedule 模块会监听此事件）
    this.addDomainEvent({
      eventType: 'goal.schedule_time_changed',
      aggregateId: this.uuid,
      aggregateType: 'goal',
      accountUuid: this.accountUuid,
      payload: {
        goal: this.toServerDTO(),
        oldStartDate,
        oldTargetDate,
        newStartDate,
        newTargetDate,
        duration: newTargetDate - newStartDate,
      },
      occurredAt: Date.now(),
    });
    
    console.log(`⏰ Goal ${this.uuid} schedule time changed`);
  }
  
  /**
   * 延长目标时间
   * 
   * @param extensionDays 延长的天数
   */
  extendTargetDate(extensionDays: number): void {
    if (extensionDays <= 0) {
      throw new Error('Extension days must be positive');
    }
    
    const newTargetDate = this.targetDate + extensionDays * 24 * 60 * 60 * 1000;
    this.changeScheduleTime(this.startDate, newTargetDate);
  }
  
  /**
   * 缩短目标时间
   * 
   * @param shortenDays 缩短的天数
   */
  shortenTargetDate(shortenDays: number): void {
    if (shortenDays <= 0) {
      throw new Error('Shorten days must be positive');
    }
    
    const newTargetDate = this.targetDate - shortenDays * 24 * 60 * 60 * 1000;
    
    // 确保新的目标时间仍然晚于开始时间
    if (newTargetDate <= this.startDate) {
      throw new Error('Target date cannot be earlier than or equal to start date');
    }
    
    this.changeScheduleTime(this.startDate, newTargetDate);
  }
  
  /**
   * 修改提醒配置
   * 
   * @param reminderConfig 新的提醒配置
   */
  updateReminderConfig(reminderConfig: GoalContracts.ReminderConfigServerDTO): void {
    const oldConfig = this.reminderConfig;
    
    this.reminderConfig = reminderConfig;
    this.updatedAt = Date.now();
    
    // 发出事件
    this.addDomainEvent({
      eventType: 'goal.reminder_config_changed',
      aggregateId: this.uuid,
      aggregateType: 'goal',
      accountUuid: this.accountUuid,
      payload: {
        goal: this.toServerDTO(),
        oldConfig,
        newConfig: reminderConfig,
        isEnabled: reminderConfig?.enabled ?? false,
      },
      occurredAt: Date.now(),
    });
  }
}

// ============================================================================
// 2. TaskTemplate 聚合根 - 时间修改方法
// ============================================================================

export class TaskTemplate extends AggregateRoot {
  // ... 其他属性和方法
  
  /**
   * 修改任务的时间配置
   * 
   * @param newTimeConfig 新的时间配置（timePoint 或 timeRange）
   */
  changeTimeConfig(newTimeConfig: TaskContracts.TaskTimeConfigServerDTO): void {
    const oldTimeConfig = this.timeConfig;
    
    // 验证业务规则
    if (newTimeConfig.timeType === 'TIME_POINT' && !newTimeConfig.timePoint) {
      throw new Error('Time point is required for TIME_POINT type');
    }
    
    if (newTimeConfig.timeType === 'TIME_RANGE' && !newTimeConfig.timeRange) {
      throw new Error('Time range is required for TIME_RANGE type');
    }
    
    // 更新值
    this.timeConfig = newTimeConfig;
    this.updatedAt = Date.now();
    
    // 发出领域事件
    this.addDomainEvent({
      eventType: 'task.schedule_time_changed',
      aggregateId: this.uuid,
      aggregateType: 'task',
      accountUuid: this.accountUuid,
      payload: {
        task: this.toServerDTO(),
        oldTimeConfig,
        newTimeConfig,
      },
      occurredAt: Date.now(),
    });
    
    console.log(`⏰ Task ${this.uuid} time config changed`);
  }
  
  /**
   * 修改任务的重复规则
   * 
   * @param newRecurrenceRule 新的重复规则
   */
  changeRecurrenceRule(newRecurrenceRule: TaskContracts.RecurrenceRuleServerDTO): void {
    const oldRecurrenceRule = this.recurrenceRule;
    
    // 只有 RECURRING 类型的任务才能修改重复规则
    if (this.taskType !== 'RECURRING') {
      throw new Error('Only RECURRING tasks can have recurrence rules');
    }
    
    // 更新值
    this.recurrenceRule = newRecurrenceRule;
    this.updatedAt = Date.now();
    
    // 发出领域事件
    this.addDomainEvent({
      eventType: 'task.recurrence_changed',
      aggregateId: this.uuid,
      aggregateType: 'task',
      accountUuid: this.accountUuid,
      payload: {
        task: this.toServerDTO(),
        oldRecurrenceRule,
        newRecurrenceRule,
      },
      occurredAt: Date.now(),
    });
    
    console.log(`🔄 Task ${this.uuid} recurrence rule changed`);
  }
  
  /**
   * 修改提醒配置
   * 
   * @param newReminderConfig 新的提醒配置
   */
  updateReminderConfig(newReminderConfig: TaskContracts.ReminderConfigServerDTO): void {
    const oldConfig = this.reminderConfig;
    
    this.reminderConfig = newReminderConfig;
    this.updatedAt = Date.now();
    
    // 发出事件
    this.addDomainEvent({
      eventType: 'task.reminder_config_changed',
      aggregateId: this.uuid,
      aggregateType: 'task',
      accountUuid: this.accountUuid,
      payload: {
        task: this.toServerDTO(),
        oldConfig,
        newConfig: newReminderConfig,
        isEnabled: newReminderConfig?.enabled ?? false,
      },
      occurredAt: Date.now(),
    });
  }
}

// ============================================================================
// 3. ReminderTemplate 聚合根 - 时间修改方法
// ============================================================================

export class ReminderTemplate extends AggregateRoot {
  // ... 其他属性和方法
  
  /**
   * 修改提醒的触发配置
   * 
   * @param newTrigger 新的触发配置（FIXED_TIME 或 INTERVAL）
   */
  changeTrigger(newTrigger: ReminderContracts.TriggerConfigServerDTO): void {
    const oldTrigger = this.trigger;
    
    // 验证业务规则
    if (newTrigger.type === 'FIXED_TIME' && !newTrigger.fixedTime) {
      throw new Error('Fixed time is required for FIXED_TIME type');
    }
    
    if (newTrigger.type === 'INTERVAL' && !newTrigger.interval) {
      throw new Error('Interval is required for INTERVAL type');
    }
    
    // 更新值
    this.trigger = newTrigger;
    this.updatedAt = Date.now();
    
    // 发出领域事件
    this.addDomainEvent({
      eventType: 'reminder.trigger_changed',
      aggregateId: this.uuid,
      aggregateType: 'reminder',
      accountUuid: this.accountUuid,
      payload: {
        reminder: this.toServerDTO(),
        oldTrigger,
        newTrigger,
      },
      occurredAt: Date.now(),
    });
    
    console.log(`⏰ Reminder ${this.uuid} trigger changed`);
  }
  
  /**
   * 修改提醒的重复配置
   * 
   * @param newRecurrence 新的重复配置
   */
  changeRecurrence(newRecurrence: ReminderContracts.RecurrenceConfigServerDTO): void {
    const oldRecurrence = this.recurrence;
    
    // 只有 RECURRING 类型的提醒才能修改重复配置
    if (this.type !== 'RECURRING') {
      throw new Error('Only RECURRING reminders can have recurrence config');
    }
    
    // 更新值
    this.recurrence = newRecurrence;
    this.updatedAt = Date.now();
    
    // 发出领域事件
    this.addDomainEvent({
      eventType: 'reminder.recurrence_changed',
      aggregateId: this.uuid,
      aggregateType: 'reminder',
      accountUuid: this.accountUuid,
      payload: {
        reminder: this.toServerDTO(),
        oldRecurrence,
        newRecurrence,
      },
      occurredAt: Date.now(),
    });
    
    console.log(`🔄 Reminder ${this.uuid} recurrence changed`);
  }
  
  /**
   * 启用提醒
   */
  enable(): void {
    if (this.selfEnabled) {
      console.log(`ℹ️  Reminder ${this.uuid} is already enabled`);
      return;
    }
    
    this.selfEnabled = true;
    this.updatedAt = Date.now();
    
    // 发出领域事件
    this.addDomainEvent({
      eventType: 'reminder.enabled',
      aggregateId: this.uuid,
      aggregateType: 'reminder',
      accountUuid: this.accountUuid,
      payload: {
        reminder: this.toServerDTO(),
      },
      occurredAt: Date.now(),
    });
    
    console.log(`✅ Reminder ${this.uuid} enabled`);
  }
  
  /**
   * 禁用提醒
   */
  disable(): void {
    if (!this.selfEnabled) {
      console.log(`ℹ️  Reminder ${this.uuid} is already disabled`);
      return;
    }
    
    this.selfEnabled = false;
    this.updatedAt = Date.now();
    
    // 发出领域事件
    this.addDomainEvent({
      eventType: 'reminder.disabled',
      aggregateId: this.uuid,
      aggregateType: 'reminder',
      accountUuid: this.accountUuid,
      payload: {
        reminder: this.toServerDTO(),
      },
      occurredAt: Date.now(),
    });
    
    console.log(`⏸️  Reminder ${this.uuid} disabled`);
  }
  
  /**
   * 修改活跃时间范围
   * 
   * @param newActiveTime 新的活跃时间配置
   */
  changeActiveTime(newActiveTime: ReminderContracts.ActiveTimeConfigServerDTO): void {
    const oldActiveTime = this.activeTime;
    
    this.activeTime = newActiveTime;
    this.updatedAt = Date.now();
    
    // 发出领域事件
    this.addDomainEvent({
      eventType: 'reminder.active_time_changed',
      aggregateId: this.uuid,
      aggregateType: 'reminder',
      accountUuid: this.accountUuid,
      payload: {
        reminder: this.toServerDTO(),
        oldActiveTime,
        newActiveTime,
      },
      occurredAt: Date.now(),
    });
  }
}

// ============================================================================
// 4. 应用服务层 - 统一的更新入口
// ============================================================================

/**
 * Goal 应用服务 - 提供统一的时间修改接口
 */
export class GoalApplicationService {
  /**
   * 修改目标的时间范围
   */
  async changeGoalScheduleTime(
    goalId: string,
    accountUuid: string,
    newStartDate: number,
    newTargetDate: number
  ): Promise<void> {
    // 加载聚合根
    const goal = await this.goalRepository.findById(goalId, accountUuid);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }
    
    // 调用聚合根方法（会发出领域事件）
    goal.changeScheduleTime(newStartDate, newTargetDate);
    
    // 保存聚合根
    await this.goalRepository.save(goal);
    
    // 发布领域事件（事件总线会传播给 Schedule 模块）
    await this.publishDomainEvents(goal);
  }
  
  /**
   * 延长目标时间
   */
  async extendGoalTargetDate(
    goalId: string,
    accountUuid: string,
    extensionDays: number
  ): Promise<void> {
    const goal = await this.goalRepository.findById(goalId, accountUuid);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }
    
    goal.extendTargetDate(extensionDays);
    await this.goalRepository.save(goal);
    await this.publishDomainEvents(goal);
  }
  
  /**
   * 修改提醒配置
   */
  async updateGoalReminderConfig(
    goalId: string,
    accountUuid: string,
    reminderConfig: GoalContracts.ReminderConfigServerDTO
  ): Promise<void> {
    const goal = await this.goalRepository.findById(goalId, accountUuid);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }
    
    goal.updateReminderConfig(reminderConfig);
    await this.goalRepository.save(goal);
    await this.publishDomainEvents(goal);
  }
}

/**
 * Task 应用服务 - 提供统一的时间修改接口
 */
export class TaskApplicationService {
  /**
   * 修改任务的时间配置
   */
  async changeTaskTimeConfig(
    taskId: string,
    accountUuid: string,
    newTimeConfig: TaskContracts.TaskTimeConfigServerDTO
  ): Promise<void> {
    const task = await this.taskRepository.findById(taskId, accountUuid);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    task.changeTimeConfig(newTimeConfig);
    await this.taskRepository.save(task);
    await this.publishDomainEvents(task);
  }
  
  /**
   * 修改任务的重复规则
   */
  async changeTaskRecurrenceRule(
    taskId: string,
    accountUuid: string,
    newRecurrenceRule: TaskContracts.RecurrenceRuleServerDTO
  ): Promise<void> {
    const task = await this.taskRepository.findById(taskId, accountUuid);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    task.changeRecurrenceRule(newRecurrenceRule);
    await this.taskRepository.save(task);
    await this.publishDomainEvents(task);
  }
}

/**
 * Reminder 应用服务 - 提供统一的时间修改接口
 */
export class ReminderApplicationService {
  /**
   * 修改提醒的触发配置
   */
  async changeReminderTrigger(
    reminderId: string,
    accountUuid: string,
    newTrigger: ReminderContracts.TriggerConfigServerDTO
  ): Promise<void> {
    const reminder = await this.reminderRepository.findById(reminderId, accountUuid);
    if (!reminder) {
      throw new Error(`Reminder ${reminderId} not found`);
    }
    
    reminder.changeTrigger(newTrigger);
    await this.reminderRepository.save(reminder);
    await this.publishDomainEvents(reminder);
  }
  
  /**
   * 启用/禁用提醒
   */
  async toggleReminderEnabled(
    reminderId: string,
    accountUuid: string,
    enabled: boolean
  ): Promise<void> {
    const reminder = await this.reminderRepository.findById(reminderId, accountUuid);
    if (!reminder) {
      throw new Error(`Reminder ${reminderId} not found`);
    }
    
    if (enabled) {
      reminder.enable();
    } else {
      reminder.disable();
    }
    
    await this.reminderRepository.save(reminder);
    await this.publishDomainEvents(reminder);
  }
}
