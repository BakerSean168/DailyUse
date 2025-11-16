import type { ITaskInstanceRepository, ITaskTemplateRepository, TaskFilters } from '@dailyuse/domain-server';
import {
  TaskTemplate,
  TaskInstanceGenerationService,
  TaskTimeConfig,
  RecurrenceRule,
  TaskReminderConfig,
} from '@dailyuse/domain-server';
import { TaskContainer } from '../../infrastructure/di/TaskContainer';
import { TaskContracts } from '@dailyuse/contracts';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts';

/**
 * TaskTemplate 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class TaskTemplateApplicationService {
  private static instance: TaskTemplateApplicationService;
  private generationService: TaskInstanceGenerationService;
  private templateRepository: ITaskTemplateRepository;
  private instanceRepository: ITaskInstanceRepository;

  private constructor(
    templateRepository: ITaskTemplateRepository,
    instanceRepository: ITaskInstanceRepository,
  ) {
    this.generationService = new TaskInstanceGenerationService(
      templateRepository,
      instanceRepository,
    );
    this.templateRepository = templateRepository;
    this.instanceRepository = instanceRepository;
  }

  /**
   * 创建应用服务实例（支持依赖注入）
   */
  static async createInstance(
    templateRepository?: ITaskTemplateRepository,
    instanceRepository?: ITaskInstanceRepository,
  ): Promise<TaskTemplateApplicationService> {
    const container = TaskContainer.getInstance();
    const templateRepo = templateRepository || container.getTaskTemplateRepository();
    const instanceRepo = instanceRepository || container.getTaskInstanceRepository();

    TaskTemplateApplicationService.instance = new TaskTemplateApplicationService(
      templateRepo,
      instanceRepo,
    );
    return TaskTemplateApplicationService.instance;
  }

  /**
   * 获取应用服务单例
   */
  static async getInstance(): Promise<TaskTemplateApplicationService> {
    if (!TaskTemplateApplicationService.instance) {
      TaskTemplateApplicationService.instance =
        await TaskTemplateApplicationService.createInstance();
    }
    return TaskTemplateApplicationService.instance;
  }

  // ===== TaskTemplate 管理 =====

  /**
   * 创建任务模板
   * 创建后自动生成初始实例（100天/最多100个）
   */
  async createTaskTemplate(params: {
    accountUuid: string;
    title: string;
    description?: string;
    taskType: TaskContracts.TaskType;
    timeConfig: TaskContracts.TaskTimeConfigServerDTO;
    recurrenceRule?: TaskContracts.RecurrenceRuleServerDTO;
    reminderConfig?: TaskContracts.TaskReminderConfigServerDTO;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    folderUuid?: string;
    tags?: string[];
    color?: string;
  }): Promise<TaskContracts.TaskTemplateServerDTO> {
    // Note: Account existence is implicitly validated by the database foreign key constraint.
    // If account doesn't exist, Prisma will throw a foreign key constraint error.
    // For more explicit validation, check account in a separate repository if needed.
    
    // 转换值对象
    const timeConfig = TaskTimeConfig.fromServerDTO(params.timeConfig);
    const recurrenceRule = params.recurrenceRule
      ? RecurrenceRule.fromServerDTO(params.recurrenceRule)
      : undefined;
    const reminderConfig = params.reminderConfig
      ? TaskReminderConfig.fromServerDTO(params.reminderConfig)
      : undefined;

    // 使用领域模型的工厂方法创建
    const template = TaskTemplate.create({
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      taskType: params.taskType,
      timeConfig,
      recurrenceRule,
      reminderConfig,
      importance: params.importance,
      urgency: params.urgency,
      folderUuid: params.folderUuid,
      tags: params.tags,
      color: params.color,
    });

    // 保存到仓储
    await this.templateRepository.save(template);

    // 🔥 如果状态是 ACTIVE，立即生成初始实例
    if (template.status === TaskContracts.TaskTemplateStatus.ACTIVE) {
      console.log(`[TaskTemplateApplicationService] 模板 "${template.title}" 已创建，开始生成初始实例...`);
      await this.generateInitialInstances(template);
    }

    return template.toClientDTO();
  }

  /**
   * 生成初始实例（私有方法）
   * 
   * 实施策略（方案 C - 混合方案）：
   * 1. 生成未来100天内的TaskInstance（用于前端展示和允许用户修改）
   * 2. 创建1个循环ScheduleTask（用于提醒）
   * 3. ScheduleTask触发时，检查当天Instance的实际时间，发送提醒
   * 
   * 收益：
   * - 用户体验好（可修改单天时间）
   * - 性能合理（只有1个ScheduleTask）
   * - 提醒准确（使用Instance的实际时间）
   */
  private async generateInitialInstances(template: TaskTemplate): Promise<void> {
    try {
      // 1. 生成 100 天的 TaskInstance（用于展示和修改）
      const instances = await this.generationService.generateInstancesForTemplate(template);
      console.log(`✅ [TaskTemplateApplicationService] 模板 "${template.title}" 生成了 ${instances.length} 个实例（未来100天）`);
      
      // 2. 🔥 如果配置了提醒，创建循环 ScheduleTask（只创建1个）
      if (template.reminderConfig?.enabled) {
        await this.createScheduleTaskForTemplate(template);
      }
      
      console.log(`✅ [TaskTemplateApplicationService] 模板 "${template.title}" 初始化完成`);
    } catch (error) {
      console.error(
        `❌ [TaskTemplateApplicationService] 模板 "${template.title}" 初始化失败:`,
        error,
      );
      // 不抛出错误，模板已经创建成功，实例生成失败不影响模板创建
    }
  }

  /**
   * 为TaskTemplate创建循环ScheduleTask（用于提醒）
   * 
   * 策略：
   * - 只创建1个ScheduleTask（不是100个）
   * - 使用cron表达式循环触发
   * - 触发时检查当天的TaskInstance，使用其实际时间
   */
  private async createScheduleTaskForTemplate(template: TaskTemplate): Promise<void> {
    try {
      const { ScheduleTaskFactory } = await import('@dailyuse/domain-server');
      const { SourceModule } = await import('@dailyuse/contracts');
      const { ScheduleContainer } = await import('../../../schedule/infrastructure/di/ScheduleContainer');
      
      // 创建 ScheduleTaskFactory
      const factory = new ScheduleTaskFactory();
      const templateDTO = template.toServerDTO();
      
      // 使用 TaskScheduleStrategy 创建 ScheduleTask
      const scheduleTask = factory.createFromSourceEntity({
        accountUuid: template.accountUuid,
        sourceModule: SourceModule.TASK,
        sourceEntityId: template.uuid,
        sourceEntity: templateDTO,
      });
      
      // 保存到仓储
      const container = ScheduleContainer.getInstance();
      const repository = container.getScheduleTaskRepository();
      await repository.save(scheduleTask);
      
      console.log(`✅ [TaskTemplateApplicationService] 为模板 "${template.title}" 创建了循环 ScheduleTask: ${scheduleTask.uuid}`);
    } catch (error: any) {
      // 如果是"不需要调度"错误，不报错
      if (error?.name === 'SourceEntityNoScheduleRequiredError') {
        console.log(`ℹ️  [TaskTemplateApplicationService] 模板 "${template.title}" 不需要创建 ScheduleTask（未配置提醒或不满足条件）`);
        return;
      }
      
      console.error(
        `❌ [TaskTemplateApplicationService] 为模板 "${template.title}" 创建 ScheduleTask 失败:`,
        error,
      );
      // 不抛出错误，ScheduleTask 创建失败不影响 TaskTemplate 创建
    }
  }

  /**
   * 获取任务模板详情
   */
  async getTaskTemplate(
    uuid: string,
    includeChildren: boolean = false,
  ): Promise<TaskContracts.TaskTemplateServerDTO | null> {
    const template = includeChildren
      ? await this.templateRepository.findByUuidWithChildren(uuid)
      : await this.templateRepository.findByUuid(uuid);

    return template ? template.toClientDTO(includeChildren) : null;
  }

  /**
   * 根据账户获取任务模板列表
   * 获取时自动检查并补充实例
   */
  async getTaskTemplatesByAccount(
    accountUuid: string,
  ): Promise<TaskContracts.TaskTemplateServerDTO[]> {
    const templates = await this.templateRepository.findByAccount(accountUuid);
    
    // 🔥 自动检查并补充每个 ACTIVE 模板的实例
    for (const template of templates) {
      if (template.status === TaskContracts.TaskTemplateStatus.ACTIVE) {
        this.checkAndRefillInstances(template.uuid).catch((error) => {
          console.error(`❌ 补充模板 "${template.title}" 实例失败:`, error);
        });
      }
    }
    
    return templates.map((t) => t.toClientDTO());
  }

  /**
   * 检查并补充模板实例（异步执行，不阻塞返回）
   */
  private async checkAndRefillInstances(templateUuid: string): Promise<void> {
    try {
      await this.generationService.checkAndRefillInstances(templateUuid);
    } catch (error) {
      console.error(`❌ [TaskTemplateApplicationService] 补充实例失败:`, error);
    }
  }

  /**
   * 根据状态获取任务模板
   */
  async getTaskTemplatesByStatus(
    accountUuid: string,
    status: TaskContracts.TaskTemplateStatus,
  ): Promise<TaskContracts.TaskTemplateServerDTO[]> {
    const templates = await this.templateRepository.findByStatus(accountUuid, status);
    return templates.map((t) => t.toClientDTO());
  }

  /**
   * 获取活跃的任务模板
   * 获取时自动检查并补充实例
   */
  async getActiveTaskTemplates(
    accountUuid: string,
  ): Promise<TaskContracts.TaskTemplateServerDTO[]> {
    const templates = await this.templateRepository.findActiveTemplates(accountUuid);
    
    // 🔥 自动检查并补充每个模板的实例
    for (const template of templates) {
      this.checkAndRefillInstances(template.uuid).catch((error) => {
        console.error(`❌ 补充模板 "${template.title}" 实例失败:`, error);
      });
    }
    
    return templates.map((t) => t.toClientDTO());
  }

  /**
   * 根据文件夹获取任务模板
   */
  async getTaskTemplatesByFolder(
    folderUuid: string,
  ): Promise<TaskContracts.TaskTemplateServerDTO[]> {
    const templates = await this.templateRepository.findByFolder(folderUuid);
    return templates.map((t) => t.toClientDTO());
  }

  /**
   * 根据目标获取任务模板
   */
  async getTaskTemplatesByGoal(goalUuid: string): Promise<TaskContracts.TaskTemplateServerDTO[]> {
    const templates = await this.templateRepository.findByGoal(goalUuid);
    return templates.map((t) => t.toClientDTO());
  }

  /**
   * 根据标签获取任务模板
   */
  async getTaskTemplatesByTags(
    accountUuid: string,
    tags: string[],
  ): Promise<TaskContracts.TaskTemplateServerDTO[]> {
    const templates = await this.templateRepository.findByTags(accountUuid, tags);
    return templates.map((t) => t.toClientDTO());
  }

  /**
   * 更新任务模板
   */
  async updateTaskTemplate(
    uuid: string,
    params: {
      title?: string;
      description?: string;
      timeConfig?: TaskContracts.TaskTimeConfigServerDTO;
      recurrenceRule?: TaskContracts.RecurrenceRuleServerDTO;
      reminderConfig?: TaskContracts.TaskReminderConfigServerDTO;
      importance?: ImportanceLevel;
      urgency?: UrgencyLevel;
      folderUuid?: string;
      tags?: string[];
      color?: string;
    },
  ): Promise<TaskContracts.TaskTemplateServerDTO> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    // 注意：这里简化了更新逻辑，实际应该在聚合根中添加更新方法
    // 由于时间关系，这里直接修改私有字段（不推荐，应该添加公开的更新方法）
    // TODO: 在 TaskTemplate 聚合根中添加 update() 方法

    await this.templateRepository.save(template);
    return template.toClientDTO();
  }

  /**
   * 激活任务模板
   */
  async activateTaskTemplate(uuid: string): Promise<TaskContracts.TaskTemplateServerDTO> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    template.activate();
    await this.templateRepository.save(template);

    // 🔥 激活后立即生成实例
    console.log(`[TaskTemplateApplicationService] 模板 "${template.title}" 已激活，开始生成实例...`);
    await this.generateInitialInstances(template);

    return template.toClientDTO();
  }

  /**
   * 暂停任务模板
   */
  async pauseTaskTemplate(uuid: string): Promise<TaskContracts.TaskTemplateServerDTO> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    template.pause();
    await this.templateRepository.save(template);

    return template.toClientDTO();
  }

  /**
   * 归档任务模板
   */
  async archiveTaskTemplate(uuid: string): Promise<TaskContracts.TaskTemplateServerDTO> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    template.archive();
    await this.templateRepository.save(template);

    return template.toClientDTO();
  }

  /**
   * 软删除任务模板
   */
  async softDeleteTaskTemplate(uuid: string): Promise<void> {
    await this.templateRepository.softDelete(uuid);
  }

  /**
   * 恢复任务模板
   */
  async restoreTaskTemplate(uuid: string): Promise<TaskContracts.TaskTemplateServerDTO> {
    await this.templateRepository.restore(uuid);

    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found after restore`);
    }

    return template.toClientDTO();
  }

  /**
   * 删除任务模板
   */
  async deleteTaskTemplate(uuid: string): Promise<void> {
    await this.templateRepository.delete(uuid);
  }

  /**
   * 绑定到目标
   */
  async bindToGoal(
    uuid: string,
    params: {
      goalUuid: string;
      keyResultUuid: string;
      incrementValue: number;
    },
  ): Promise<TaskContracts.TaskTemplateServerDTO> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    template.bindToGoal(params.goalUuid, params.keyResultUuid, params.incrementValue);
    await this.templateRepository.save(template);

    return template.toClientDTO();
  }

  /**
   * 解除目标绑定
   */
  async unbindFromGoal(uuid: string): Promise<TaskContracts.TaskTemplateServerDTO> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    template.unbindFromGoal();
    await this.templateRepository.save(template);

    return template.toClientDTO();
  }

  /**
   * 为模板生成实例
   * @deprecated 使用新的自动维护机制，不再需要手动指定 toDate
   */
  async generateInstances(
    uuid: string,
    toDate?: number,
  ): Promise<TaskContracts.TaskInstanceServerDTO[]> {
    const template = await this.templateRepository.findByUuid(uuid);
    if (!template) {
      throw new Error(`TaskTemplate ${uuid} not found`);
    }

    // 使用强制生成模式，重新生成实例
    const instances = await this.generationService.generateInstancesForTemplate(template, true);
    return instances.map((i) => i.toClientDTO());
  }

  /**
   * 检查并生成待生成的实例
   */
  async checkAndGenerateInstances(): Promise<void> {
    await this.generationService.checkAndGenerateInstances();
  }

  // ===== ONE_TIME 任务管理 =====

  /**
   * 创建一次性任务
   */
  async createOneTimeTask(params: {
    accountUuid: string;
    title: string;
    description?: string;
    importance?: ImportanceLevel;
    urgency?: UrgencyLevel;
    startDate?: number;
    dueDate?: number;
    estimatedMinutes?: number;
    note?: string;
    goalUuid?: string;
    keyResultUuid?: string;
    parentTaskUuid?: string;
    folderUuid?: string;
    tags?: string[];
    color?: string;
  }): Promise<TaskContracts.TaskTemplateClientDTO> {
    // 使用领域模型的工厂方法创建一次性任务
    const task = TaskTemplate.createOneTimeTask({
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      importance: params.importance,
      urgency: params.urgency,
      startDate: params.startDate,
      dueDate: params.dueDate,
      estimatedMinutes: params.estimatedMinutes,
      note: params.note,
      goalUuid: params.goalUuid,
      keyResultUuid: params.keyResultUuid,
      parentTaskUuid: params.parentTaskUuid,
      folderUuid: params.folderUuid,
      tags: params.tags,
      color: params.color,
    });

    // 保存到仓储
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 阻塞任务模板
   */
  async blockTask(uuid: string, reason: string): Promise<TaskContracts.TaskTemplateClientDTO> {
    const task = await this.templateRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsBlocked(reason);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 解除阻塞任务模板
   */
  async unblockTask(uuid: string): Promise<TaskContracts.TaskTemplateClientDTO> {
    const task = await this.templateRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsReady();
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 更新截止时间
   */
  async updateDueDate(uuid: string, newDueDate: number | null): Promise<TaskContracts.TaskTemplateClientDTO> {
    const task = await this.templateRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.updateDueDate(newDueDate);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 更新预估时间
   */
  async updateEstimatedTime(uuid: string, estimatedMinutes: number): Promise<TaskContracts.TaskTemplateClientDTO> {
    const task = await this.templateRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.updateEstimatedTime(estimatedMinutes);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 更新一次性任务（通用更新方法）
   * 支持更新标题、描述、日期、优先级、标签等属性
   */
  async updateOneTimeTask(
    uuid: string,
    updates: {
      title?: string;
      description?: string;
      startDate?: number;
      dueDate?: number;
      importance?: ImportanceLevel;
      urgency?: UrgencyLevel;
      estimatedMinutes?: number;
      tags?: string[];
      color?: string;
      note?: string;
    },
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    const task = await this.templateRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    // 更新各个属性
    if (updates.title !== undefined) {
      task.updateTitle(updates.title);
    }
    if (updates.description !== undefined) {
      task.updateDescription(updates.description);
    }
    if (updates.startDate !== undefined) {
      task.updateStartDate(updates.startDate);
    }
    if (updates.dueDate !== undefined) {
      task.updateDueDate(updates.dueDate);
    }
    if (updates.importance !== undefined || updates.urgency !== undefined) {
      task.updatePriority(
        updates.importance ?? task.importance,
        updates.urgency ?? task.urgency,
      );
    }
    if (updates.estimatedMinutes !== undefined) {
      task.updateEstimatedTime(updates.estimatedMinutes);
    }
    if (updates.tags !== undefined) {
      task.updateTags(updates.tags);
    }
    if (updates.color !== undefined) {
      task.updateColor(updates.color);
    }
    if (updates.note !== undefined) {
      task.updateNote(updates.note);
    }

    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 获取任务历史记录
   */
  async getTaskHistory(uuid: string): Promise<TaskContracts.TaskTemplateHistoryServerDTO[]> {
    const task = await this.templateRepository.findByUuidWithChildren(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    return task.history.map((h) => h.toServerDTO());
  }

  // ===== ONE_TIME 任务查询 =====

  /**
   * 查找一次性任务
   */
  async findOneTimeTasks(
    accountUuid: string,
    filters?: TaskFilters,
  ): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findOneTimeTasks(accountUuid, filters);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 查找循环任务
   */
  async findRecurringTasks(
    accountUuid: string,
    filters?: TaskFilters,
  ): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findRecurringTasks(accountUuid, filters);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 查找逾期任务
   */
  async getOverdueTasks(accountUuid: string): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findOverdueTasks(accountUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 查找今日任务
   */
  async getTodayTasks(accountUuid: string): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTodayTasks(accountUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 查找即将到期的任务
   */
  async getUpcomingTasks(
    accountUuid: string,
    daysAhead: number,
  ): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findUpcomingTasks(accountUuid, daysAhead);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 按优先级排序查找任务
   */
  async getTasksSortedByPriority(
    accountUuid: string,
    limit?: number,
  ): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTasksSortedByPriority(accountUuid, limit);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 根据 Goal 查找任务（新版本，支持 ONE_TIME）
   */
  async getTasksByGoal(goalUuid: string): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTasksByGoal(goalUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 根据 KeyResult 查找任务
   */
  async getTasksByKeyResult(keyResultUuid: string): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findTasksByKeyResult(keyResultUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 查找被阻塞的任务
   */
  async getBlockedTasks(accountUuid: string): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const tasks = await this.templateRepository.findBlockedTasks(accountUuid);
    return tasks.map((t) => t.toClientDTO());
  }

  /**
   * 统计任务数量
   */
  async countTasks(accountUuid: string, filters?: TaskFilters): Promise<number> {
    return await this.templateRepository.countTasks(accountUuid, filters);
  }

  // ===== 子任务管理 =====

  /**
   * 创建子任务
   */
  async createSubtask(
    parentUuid: string,
    params: {
      accountUuid: string;
      title: string;
      description?: string;
      importance?: ImportanceLevel;
      urgency?: UrgencyLevel;
      dueDate?: number;
      estimatedMinutes?: number;
    },
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    // 验证父任务存在
    const parentTask = await this.templateRepository.findByUuid(parentUuid);
    if (!parentTask) {
      throw new Error(`Parent task ${parentUuid} not found`);
    }

    // 创建子任务
    const subtask = TaskTemplate.createOneTimeTask({
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      importance: params.importance,
      urgency: params.urgency,
      dueDate: params.dueDate,
      estimatedMinutes: params.estimatedMinutes,
      parentTaskUuid: parentUuid,
    });

    await this.templateRepository.save(subtask);

    // 记录父任务添加子任务
    parentTask.addSubtask(subtask.uuid);
    await this.templateRepository.save(parentTask);

    return subtask.toClientDTO();
  }

  /**
   * 获取子任务列表
   */
  async getSubtasks(parentUuid: string): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const subtasks = await this.templateRepository.findSubtasks(parentUuid);
    return subtasks.map((t) => t.toClientDTO());
  }

  /**
   * 移除子任务
   */
  async removeSubtask(parentUuid: string, subtaskUuid: string): Promise<void> {
    const parentTask = await this.templateRepository.findByUuid(parentUuid);
    if (!parentTask) {
      throw new Error(`Parent task ${parentUuid} not found`);
    }

    parentTask.removeSubtask(subtaskUuid);
    await this.templateRepository.save(parentTask);
  }

  // ===== Goal/KR 关联管理 (ONE_TIME 任务新版本) =====

  /**
   * 链接到目标
   */
  async linkToGoal(
    uuid: string,
    goalUuid: string,
    keyResultUuid?: string,
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    const task = await this.templateRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.linkToGoal(goalUuid, keyResultUuid);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 解除目标链接
   */
  async unlinkFromGoal(uuid: string): Promise<TaskContracts.TaskTemplateClientDTO> {
    const task = await this.templateRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.unlinkFromGoal();
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  // ===== 依赖管理 =====

  /**
   * 标记为被阻塞
   */
  async markAsBlocked(
    uuid: string,
    reason: string,
    dependencyTaskUuid?: string,
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    const task = await this.templateRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsBlocked(reason, dependencyTaskUuid);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 标记为就绪
   */
  async markAsReady(uuid: string): Promise<TaskContracts.TaskTemplateClientDTO> {
    const task = await this.templateRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.markAsReady();
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  /**
   * 更新依赖状态
   */
  async updateDependencyStatus(
    uuid: string,
    status: 'PENDING' | 'READY' | 'BLOCKED',
  ): Promise<TaskContracts.TaskTemplateClientDTO> {
    const task = await this.templateRepository.findByUuid(uuid);
    if (!task) {
      throw new Error(`Task ${uuid} not found`);
    }

    task.updateDependencyStatus(status);
    await this.templateRepository.save(task);

    return task.toClientDTO();
  }

  // ===== 批量操作 =====

  /**
   * 批量创建任务
   */
  async createTasksBatch(
    tasks: Array<{
      accountUuid: string;
      title: string;
      description?: string;
      importance?: ImportanceLevel;
      urgency?: UrgencyLevel;
      dueDate?: number;
      estimatedMinutes?: number;
      goalUuid?: string;
      keyResultUuid?: string;
    }>,
  ): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    const taskEntities = tasks.map((params) =>
      TaskTemplate.createOneTimeTask({
        accountUuid: params.accountUuid,
        title: params.title,
        description: params.description,
        importance: params.importance,
        urgency: params.urgency,
        dueDate: params.dueDate,
        estimatedMinutes: params.estimatedMinutes,
        goalUuid: params.goalUuid,
        keyResultUuid: params.keyResultUuid,
      }),
    );

    await this.templateRepository.saveBatch(taskEntities);

    return taskEntities.map((t) => t.toClientDTO());
  }

  /**
   * 批量删除任务
   */
  async deleteTasksBatch(uuids: string[]): Promise<void> {
    await this.templateRepository.deleteBatch(uuids);
  }

  // ===== 仪表板/统计查询 =====

  /**
   * 获取最近完成的任务
   */
  async getRecentCompletedTasks(
    accountUuid: string,
    limit: number = 10,
  ): Promise<TaskContracts.TaskTemplateClientDTO[]> {
    // 获取最近7天完成的任务
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const tasks = await this.templateRepository.findOneTimeTasks(accountUuid, {
      taskType: TaskContracts.TaskType.ONE_TIME,
      status: 'COMPLETED' as any,
    });

    // 筛选并排序：最近完成的任务（按更新时间倒序）
    return tasks
      .filter((t) => t.updatedAt && t.updatedAt >= sevenDaysAgo)
      .sort((a, b) => {
        const timeA = a.updatedAt || 0;
        const timeB = b.updatedAt || 0;
        return timeB - timeA;
      })
      .slice(0, limit)
      .map((t) => t.toClientDTO());
  }

  /**
   * 获取任务仪表板数据
   */
  async getTaskDashboard(accountUuid: string): Promise<{
    todayTasks: TaskContracts.TaskTemplateClientDTO[];
    overdueTasks: TaskContracts.TaskTemplateClientDTO[];
    blockedTasks: TaskContracts.TaskTemplateClientDTO[];
    upcomingTasks: TaskContracts.TaskTemplateClientDTO[];
    highPriorityTasks: TaskContracts.TaskTemplateClientDTO[];
    recentCompleted: TaskContracts.TaskTemplateClientDTO[];
    statistics: {
      totalActive: number;
      totalCompleted: number;
      totalOverdue: number;
      totalBlocked: number;
      completionRate: number;
    };
  }> {
    // 并行查询所有数据
    const [
      today,
      overdue,
      blocked,
      upcoming,
      highPriority,
      recentCompleted,
      totalActive,
      totalCompleted,
    ] = await Promise.all([
      this.getTodayTasks(accountUuid),
      this.getOverdueTasks(accountUuid),
      this.getBlockedTasks(accountUuid),
      this.getUpcomingTasks(accountUuid, 7), // 未来7天
      this.getTasksSortedByPriority(accountUuid, 5), // 前5个高优先级任务
      this.getRecentCompletedTasks(accountUuid, 10), // 最近10个完成的任务
      this.countTasks(accountUuid, {
        taskType: TaskContracts.TaskType.ONE_TIME,
        status: 'TODO' as any,
      }),
      this.countTasks(accountUuid, {
        taskType: TaskContracts.TaskType.ONE_TIME,
        status: 'COMPLETED' as any,
      }),
    ]);

    const completionRate =
      totalActive + totalCompleted > 0
        ? Math.round((totalCompleted / (totalActive + totalCompleted)) * 100)
        : 0;

    return {
      todayTasks: today,
      overdueTasks: overdue,
      blockedTasks: blocked,
      upcomingTasks: upcoming,
      highPriorityTasks: highPriority,
      recentCompleted,
      statistics: {
        totalActive,
        totalCompleted,
        totalOverdue: overdue.length,
        totalBlocked: blocked.length,
        completionRate,
      },
    };
  }

  /**
   * 根据日期范围获取模板实例
   * 用于前端按需加载任务实例
   */
  async getInstancesByDateRange(
    templateUuid: string,
    fromDate: number,
    toDate: number,
  ): Promise<TaskContracts.TaskInstanceClientDTO[]> {
    // 验证模板是否存在
    const template = await this.templateRepository.findByUuid(templateUuid);
    if (!template) {
      throw new Error(`Task template not found: ${templateUuid}`);
    }

    // 从仓储中获取该模板的所有实例
    const allInstances = await this.instanceRepository.findByTemplate(templateUuid);

    // 在内存中按日期范围过滤
    const filteredInstances = allInstances.filter(instance => {
      const instanceDate = (instance.instanceDate as any);
      const timestamp = typeof instanceDate === 'number' 
        ? instanceDate 
        : instanceDate.getTime?.() || instanceDate;
      return timestamp >= fromDate && timestamp <= toDate;
    });

    // 转换为客户端 DTO
    return filteredInstances.map(instance => instance.toClientDTO());
  }
}
