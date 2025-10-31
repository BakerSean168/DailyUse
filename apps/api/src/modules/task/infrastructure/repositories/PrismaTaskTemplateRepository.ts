import { PrismaClient } from '@prisma/client';
import type { ITaskTemplateRepository } from '@dailyuse/domain-server';
import { TaskTemplate, TaskTemplateHistory } from '@dailyuse/domain-server';
import type { TaskContracts } from '@dailyuse/contracts';

type TaskTemplateStatus = TaskContracts.TaskTemplateStatus;

/**
 * TaskTemplate Prisma 仓库
 *
 */
export class PrismaTaskTemplateRepository implements ITaskTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: any, includeChildren = false): TaskTemplate {
    const template = TaskTemplate.fromPersistenceDTO({
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      title: data.title,
      description: data.description,
      taskType: data.taskType,
      // Flattened timeConfig fields (RECURRING 任务)
      timeConfigType: data.timeConfigType,
      timeConfigStartTime: data.timeConfigStartTime?.getTime() ?? null,
      timeConfigEndTime: data.timeConfigEndTime?.getTime() ?? null,
      timeConfigDurationMinutes: data.timeConfigDurationMinutes,
      // Flattened recurrenceRule fields (RECURRING 任务)
      recurrenceRuleType: data.recurrenceRuleType,
      recurrenceRuleInterval: data.recurrenceRuleInterval,
      recurrenceRuleDaysOfWeek: data.recurrenceRuleDaysOfWeek,
      recurrenceRuleDayOfMonth: data.recurrenceRuleDayOfMonth,
      recurrenceRuleMonthOfYear: data.recurrenceRuleMonthOfYear,
      recurrenceRuleEndDate: data.recurrenceRuleEndDate?.getTime() ?? null,
      recurrenceRuleCount: data.recurrenceRuleCount,
      // Flattened reminderConfig fields (RECURRING 任务)
      reminderConfigEnabled: data.reminderConfigEnabled,
      reminderConfigTimeOffsetMinutes: data.reminderConfigTimeOffsetMinutes,
      reminderConfigUnit: data.reminderConfigUnit,
      reminderConfigChannel: data.reminderConfigChannel,
      importance: data.importance,
      urgency: data.urgency,
      // Flattened goalBinding fields (RECURRING 任务 - 旧版本)
      goalBindingGoalUuid: data.goalBindingGoalUuid,
      goalBindingKeyResultUuid: data.goalBindingKeyResultUuid,
      goalBindingIncrementValue: data.goalBindingIncrementValue,
      folderUuid: data.folderUuid,
      tags: data.tags,
      color: data.color,
      status: data.status,
      lastGeneratedDate: data.lastGeneratedDate?.getTime() ?? null,
      generateAheadDays: data.generateAheadDays,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      deletedAt: data.deletedAt?.getTime() ?? null,
      // ONE_TIME 任务新字段
      goalUuid: data.goalUuid,
      keyResultUuid: data.keyResultUuid,
      parentTaskUuid: data.parentTaskUuid,
      startDate: data.startDate?.getTime() ?? null,
      dueDate: data.dueDate?.getTime() ?? null,
      completedAt: data.completedAt?.getTime() ?? null,
      estimatedMinutes: data.estimatedMinutes,
      actualMinutes: data.actualMinutes,
      note: data.note,
      dependencyStatus: data.dependencyStatus,
      isBlocked: data.isBlocked,
      blockingReason: data.blockingReason,
    });

    // 处理 TaskTemplateHistory 记录
    if (includeChildren && data.history) {
      data.history.forEach((hist: any) => {
        template.addHistory(hist.action, hist.changes ? JSON.parse(hist.changes) : null);
      });
    }

    return template;
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  private toTimestamp(date: Date | null | undefined): number | null | undefined {
    if (date == null) return date as null | undefined;
    return date.getTime();
  }

  private importanceToNumber(importance: string): number {
    const map: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    return map[importance] ?? 2;
  }

  private urgencyToNumber(urgency: string): number {
    const map: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
    return map[urgency] ?? 2;
  }

  async save(template: TaskTemplate): Promise<void> {
    const persistence = template.toPersistenceDTO();

    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert TaskTemplate with flattened fields
      await tx.taskTemplate.upsert({
        where: { uuid: persistence.uuid },
        create: {
          uuid: persistence.uuid,
          accountUuid: persistence.accountUuid,
          title: persistence.title,
          description: persistence.description,
          taskType: persistence.taskType,
          // Flattened timeConfig fields (RECURRING)
          timeConfigType: persistence.timeConfigType,
          timeConfigStartTime: this.toDate(persistence.timeConfigStartTime),
          timeConfigEndTime: this.toDate(persistence.timeConfigEndTime),
          timeConfigDurationMinutes: persistence.timeConfigDurationMinutes,
          // Flattened recurrenceRule fields (RECURRING)
          recurrenceRuleType: persistence.recurrenceRuleType,
          recurrenceRuleInterval: persistence.recurrenceRuleInterval,
          recurrenceRuleDaysOfWeek: persistence.recurrenceRuleDaysOfWeek,
          recurrenceRuleDayOfMonth: persistence.recurrenceRuleDayOfMonth,
          recurrenceRuleMonthOfYear: persistence.recurrenceRuleMonthOfYear,
          recurrenceRuleEndDate: this.toDate(persistence.recurrenceRuleEndDate),
          recurrenceRuleCount: persistence.recurrenceRuleCount,
          // Flattened reminderConfig fields (RECURRING)
          reminderConfigEnabled: persistence.reminderConfigEnabled,
          reminderConfigTimeOffsetMinutes: persistence.reminderConfigTimeOffsetMinutes,
          reminderConfigUnit: persistence.reminderConfigUnit,
          reminderConfigChannel: persistence.reminderConfigChannel,
          importance: this.importanceToNumber(persistence.importance),
          urgency: this.urgencyToNumber(persistence.urgency),
          // Flattened goalBinding fields (RECURRING - 旧版本)
          goalBindingGoalUuid: persistence.goalBindingGoalUuid,
          goalBindingKeyResultUuid: persistence.goalBindingKeyResultUuid,
          goalBindingIncrementValue: persistence.goalBindingIncrementValue,
          folderUuid: persistence.folderUuid,
          tags: persistence.tags,
          color: persistence.color,
          status: persistence.status,
          lastGeneratedDate: this.toDate(persistence.lastGeneratedDate) ?? undefined,
          generateAheadDays: persistence.generateAheadDays,
          createdAt: this.toDate(persistence.createdAt) ?? new Date(),
          updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
          deletedAt: this.toDate(persistence.deletedAt) ?? undefined,
          // ONE_TIME 任务新字段
          goalUuid: persistence.goalUuid,
          keyResultUuid: persistence.keyResultUuid,
          parentTaskUuid: persistence.parentTaskUuid,
          startDate: persistence.startDate,
          dueDate: persistence.dueDate,
          completedAt: persistence.completedAt,
          estimatedMinutes: persistence.estimatedMinutes,
          actualMinutes: persistence.actualMinutes,
          note: persistence.note,
          dependencyStatus: persistence.dependencyStatus,
          isBlocked: persistence.isBlocked,
          blockingReason: persistence.blockingReason,
        },
        update: {
          title: persistence.title,
          description: persistence.description,
          taskType: persistence.taskType,
          // Flattened timeConfig fields (RECURRING)
          timeConfigType: persistence.timeConfigType,
          timeConfigStartTime: this.toDate(persistence.timeConfigStartTime),
          timeConfigEndTime: this.toDate(persistence.timeConfigEndTime),
          timeConfigDurationMinutes: persistence.timeConfigDurationMinutes,
          // Flattened recurrenceRule fields (RECURRING)
          recurrenceRuleType: persistence.recurrenceRuleType,
          recurrenceRuleInterval: persistence.recurrenceRuleInterval,
          recurrenceRuleDaysOfWeek: persistence.recurrenceRuleDaysOfWeek,
          recurrenceRuleDayOfMonth: persistence.recurrenceRuleDayOfMonth,
          recurrenceRuleMonthOfYear: persistence.recurrenceRuleMonthOfYear,
          recurrenceRuleEndDate: this.toDate(persistence.recurrenceRuleEndDate),
          recurrenceRuleCount: persistence.recurrenceRuleCount,
          // Flattened reminderConfig fields (RECURRING)
          reminderConfigEnabled: persistence.reminderConfigEnabled,
          reminderConfigTimeOffsetMinutes: persistence.reminderConfigTimeOffsetMinutes,
          reminderConfigUnit: persistence.reminderConfigUnit,
          reminderConfigChannel: persistence.reminderConfigChannel,
          importance: this.importanceToNumber(persistence.importance),
          urgency: this.urgencyToNumber(persistence.urgency),
          // Flattened goalBinding fields (RECURRING - 旧版本)
          goalBindingGoalUuid: persistence.goalBindingGoalUuid,
          goalBindingKeyResultUuid: persistence.goalBindingKeyResultUuid,
          goalBindingIncrementValue: persistence.goalBindingIncrementValue,
          folderUuid: persistence.folderUuid,
          tags: persistence.tags,
          color: persistence.color,
          status: persistence.status,
          lastGeneratedDate: this.toDate(persistence.lastGeneratedDate) ?? undefined,
          generateAheadDays: persistence.generateAheadDays,
          updatedAt: this.toDate(persistence.updatedAt) ?? new Date(),
          deletedAt: this.toDate(persistence.deletedAt) ?? undefined,
          // ONE_TIME 任务新字段
          goalUuid: persistence.goalUuid,
          keyResultUuid: persistence.keyResultUuid,
          parentTaskUuid: persistence.parentTaskUuid,
          startDate: persistence.startDate,
          dueDate: persistence.dueDate,
          completedAt: persistence.completedAt,
          estimatedMinutes: persistence.estimatedMinutes,
          actualMinutes: persistence.actualMinutes,
          note: persistence.note,
          dependencyStatus: persistence.dependencyStatus,
          isBlocked: persistence.isBlocked,
          blockingReason: persistence.blockingReason,
        },
      });

      // 2. Upsert TaskTemplateHistory records
      const history = template.history;
      for (const hist of history) {
        const histPersistence = hist.toPersistenceDTO();
        await tx.taskTemplateHistory.upsert({
          where: { uuid: histPersistence.uuid },
          create: {
            uuid: histPersistence.uuid,
            templateUuid: persistence.uuid,
            action: histPersistence.action,
            changes: histPersistence.changes,
            createdAt: this.toDate(histPersistence.createdAt) ?? new Date(),
          },
          update: {
            action: histPersistence.action,
            changes: histPersistence.changes,
          },
        });
      }
    });
  }

  async findByUuid(uuid: string): Promise<TaskTemplate | null> {
    const data = await this.prisma.taskTemplate.findUnique({ where: { uuid } });
    return data ? this.mapToEntity(data, false) : null;
  }

  async findByUuidWithChildren(uuid: string): Promise<TaskTemplate | null> {
    const data = await this.prisma.taskTemplate.findUnique({
      where: { uuid },
      // Note: history relation not defined in Prisma schema
    });
    return data ? this.mapToEntity(data, true) : null;
  }

  async findByAccount(accountUuid: string): Promise<TaskTemplate[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { accountUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findByStatus(accountUuid: string, status: TaskTemplateStatus): Promise<TaskTemplate[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { accountUuid, status, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findActiveTemplates(accountUuid: string): Promise<TaskTemplate[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { accountUuid, status: 'ACTIVE', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findByFolder(folderUuid: string): Promise<TaskTemplate[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { folderUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async findByGoal(goalUuid: string): Promise<TaskTemplate[]> {
    // Use flattened goalBinding fields
    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        deletedAt: null,
        goalBindingGoalUuid: goalUuid, // Flattened field
      },
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((t) => this.mapToEntity(t));
  }

  async findByTags(accountUuid: string, tags: string[]): Promise<TaskTemplate[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: { accountUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return templates
      .filter((t) => {
        const templateTags = t.tags ? JSON.parse(t.tags as string) : [];
        return tags.some((tag) => templateTags.includes(tag));
      })
      .map((t) => this.mapToEntity(t));
  }

  async findNeedGenerateInstances(toDate: number): Promise<TaskTemplate[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        lastGeneratedDate: { lte: new Date(toDate) }, // Use lastGeneratedDate instead of nextGenerationDate
      },
      orderBy: { lastGeneratedDate: 'asc' },
    });
    return templates.map((t) => this.mapToEntity(t));
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.taskTemplateHistory.deleteMany({ where: { templateUuid: uuid } });
      await tx.taskTemplate.delete({ where: { uuid } });
    });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.taskTemplate.update({
      where: { uuid },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });
  }

  async restore(uuid: string): Promise<void> {
    await this.prisma.taskTemplate.update({
      where: { uuid },
      data: { deletedAt: null, status: 'ACTIVE' },
    });
  }

  // ===== ONE_TIME 任务查询方法实现 =====

  async findOneTimeTasks(
    accountUuid: string,
    filters?: import('@dailyuse/domain-server').TaskFilters,
  ): Promise<TaskTemplate[]> {
    const where: any = {
      accountUuid,
      taskType: 'ONE_TIME',
      deletedAt: null,
    };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.goalUuid) where.goalUuid = filters.goalUuid;
      if (filters.parentTaskUuid) where.parentTaskUuid = filters.parentTaskUuid;
      if (filters.isBlocked !== undefined) where.isBlocked = filters.isBlocked;
      if (filters.folderUuid) where.folderUuid = filters.folderUuid;
      if (filters.dueDateFrom || filters.dueDateTo) {
        where.dueDate = {};
        if (filters.dueDateFrom) where.dueDate.gte = new Date(filters.dueDateFrom);
        if (filters.dueDateTo) where.dueDate.lte = new Date(filters.dueDateTo);
      }
    }

    const templates = await this.prisma.taskTemplate.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return templates.map((t) => this.mapToEntity(t));
  }

  async findRecurringTasks(
    accountUuid: string,
    filters?: import('@dailyuse/domain-server').TaskFilters,
  ): Promise<TaskTemplate[]> {
    const where: any = {
      accountUuid,
      taskType: 'RECURRING',
      deletedAt: null,
    };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.folderUuid) where.folderUuid = filters.folderUuid;
    }

    const templates = await this.prisma.taskTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    return templates.map((t) => this.mapToEntity(t));
  }

  async findOverdueTasks(accountUuid: string): Promise<TaskTemplate[]> {
    const now = Date.now();
    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        accountUuid,
        taskType: 'ONE_TIME',
        dueDate: { lt: now },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        deletedAt: null,
      },
      orderBy: { dueDate: 'asc' },
    });

    return templates.map((t) => this.mapToEntity(t));
  }

  async findTasksByGoal(goalUuid: string): Promise<TaskTemplate[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        taskType: 'ONE_TIME',
        goalUuid, // 新字段
        deletedAt: null,
      },
      orderBy: { dueDate: 'asc' },
    });

    return templates.map((t) => this.mapToEntity(t));
  }

  async findTasksByKeyResult(keyResultUuid: string): Promise<TaskTemplate[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        taskType: 'ONE_TIME',
        keyResultUuid,
        deletedAt: null,
      },
      orderBy: { dueDate: 'asc' },
    });

    return templates.map((t) => this.mapToEntity(t));
  }

  async findSubtasks(parentTaskUuid: string): Promise<TaskTemplate[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        taskType: 'ONE_TIME',
        parentTaskUuid,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return templates.map((t) => this.mapToEntity(t));
  }

  async findBlockedTasks(accountUuid: string): Promise<TaskTemplate[]> {
    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        accountUuid,
        taskType: 'ONE_TIME',
        isBlocked: true,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return templates.map((t) => this.mapToEntity(t));
  }

  async findTasksSortedByPriority(accountUuid: string, limit?: number): Promise<TaskTemplate[]> {
    // 获取所有 ONE_TIME 任务
    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        accountUuid,
        taskType: 'ONE_TIME',
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        deletedAt: null,
      },
    });

    // 转换为实体并计算优先级
    const tasksWithPriority = templates.map((t) => {
      const task = this.mapToEntity(t);
      const priority = task.getPriority();
      return { task, priority };
    });

    // 按优先级排序（分数从高到低）
    tasksWithPriority.sort((a, b) => b.priority.score - a.priority.score);

    // 返回任务（可选限制数量）
    const sortedTasks = tasksWithPriority.map((item) => item.task);
    return limit ? sortedTasks.slice(0, limit) : sortedTasks;
  }

  async findUpcomingTasks(accountUuid: string, daysAhead: number): Promise<TaskTemplate[]> {
    const now = Date.now();
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;

    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        accountUuid,
        taskType: 'ONE_TIME',
        dueDate: {
          gte: now,
          lte: futureDate,
        },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        deletedAt: null,
      },
      orderBy: { dueDate: 'asc' },
    });

    return templates.map((t) => this.mapToEntity(t));
  }

  async findTodayTasks(accountUuid: string): Promise<TaskTemplate[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startTimestamp = startOfDay.getTime();

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const endTimestamp = endOfDay.getTime();

    const templates = await this.prisma.taskTemplate.findMany({
      where: {
        accountUuid,
        taskType: 'ONE_TIME',
        dueDate: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
        deletedAt: null,
      },
      orderBy: { dueDate: 'asc' },
    });

    return templates.map((t) => this.mapToEntity(t));
  }

  async countTasks(
    accountUuid: string,
    filters?: import('@dailyuse/domain-server').TaskFilters,
  ): Promise<number> {
    const where: any = {
      accountUuid,
      deletedAt: null,
    };

    if (filters) {
      if (filters.taskType) where.taskType = filters.taskType;
      if (filters.status) where.status = filters.status;
      if (filters.goalUuid) where.goalUuid = filters.goalUuid;
      if (filters.parentTaskUuid) where.parentTaskUuid = filters.parentTaskUuid;
      if (filters.isBlocked !== undefined) where.isBlocked = filters.isBlocked;
      if (filters.folderUuid) where.folderUuid = filters.folderUuid;
    }

    return await this.prisma.taskTemplate.count({ where });
  }

  async saveBatch(templates: TaskTemplate[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const template of templates) {
        await this.save(template);
      }
    });
  }

  async deleteBatch(uuids: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.taskTemplateHistory.deleteMany({
        where: { templateUuid: { in: uuids } },
      });
      await tx.taskTemplate.deleteMany({
        where: { uuid: { in: uuids } },
      });
    });
  }
}
