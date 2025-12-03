/**
 * Prisma Adapters
 *
 * Repository implementations using Prisma ORM.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type {
  IGoalRepository,
  ITaskRepository,
  IScheduleRepository,
  IReminderRepository,
  IAccountRepository,
} from '../../ports/repositories';

/**
 * Prisma Client Factory
 *
 * Creates and manages PrismaClient instances.
 */
export type DatabaseProvider = 'postgresql' | 'sqlite';

export interface PrismaClientConfig {
  provider: DatabaseProvider;
  url?: string;
}

// Note: Actual PrismaClient will be injected from the app
// that has the @prisma/client dependency

/**
 * Goal Prisma Repository
 *
 * To be extracted from:
 * apps/api/src/modules/goal/infrastructure/repositories/GoalRepository.ts
 */
export class GoalPrismaRepository implements IGoalRepository {
  constructor(private readonly prisma: any) {}

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<any | null> {
    return this.prisma.goal.findUnique({
      where: { uuid },
      include: options?.includeChildren ? {
        keyResults: true,
        reviews: true,
      } : undefined,
    });
  }

  async findByAccountUuid(accountUuid: string, options?: any): Promise<any[]> {
    return this.prisma.goal.findMany({
      where: {
        accountUuid,
        ...(options?.status && { status: options.status }),
        ...(options?.folderUuid && { folderUuid: options.folderUuid }),
      },
      include: options?.includeChildren ? {
        keyResults: true,
      } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByFolderUuid(folderUuid: string): Promise<any[]> {
    return this.prisma.goal.findMany({
      where: { folderUuid },
      orderBy: { createdAt: 'desc' },
    });
  }

  async save(goal: any): Promise<void> {
    // TODO: Extract upsert logic from existing repository
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.goal.delete({ where: { uuid } });
  }

  async softDelete(uuid: string): Promise<void> {
    await this.prisma.goal.update({
      where: { uuid },
      data: { deletedAt: new Date() },
    });
  }

  async exists(uuid: string): Promise<boolean> {
    const count = await this.prisma.goal.count({ where: { uuid } });
    return count > 0;
  }

  async batchUpdateStatus(uuids: string[], status: string): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { uuid: { in: uuids } },
      data: { status },
    });
  }

  async batchMoveToFolder(uuids: string[], folderUuid: string | null): Promise<void> {
    await this.prisma.goal.updateMany({
      where: { uuid: { in: uuids } },
      data: { folderUuid },
    });
  }
}

/**
 * Task Prisma Repository
 */
export class TaskPrismaRepository implements ITaskRepository {
  constructor(private readonly prisma: any) {}

  async findById(uuid: string): Promise<any | null> {
    return this.prisma.task.findUnique({ where: { uuid } });
  }

  async findByAccountUuid(accountUuid: string, options?: any): Promise<any[]> {
    return this.prisma.task.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByGoalUuid(goalUuid: string): Promise<any[]> {
    return this.prisma.task.findMany({
      where: { goalUuid },
    });
  }

  async save(task: any): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.task.delete({ where: { uuid } });
  }
}

/**
 * Schedule Prisma Repository
 */
export class SchedulePrismaRepository implements IScheduleRepository {
  constructor(private readonly prisma: any) {}

  async findById(uuid: string): Promise<any | null> {
    return this.prisma.schedule.findUnique({ where: { uuid } });
  }

  async findByAccountUuid(accountUuid: string): Promise<any[]> {
    return this.prisma.schedule.findMany({ where: { accountUuid } });
  }

  async findActiveSchedules(): Promise<any[]> {
    return this.prisma.schedule.findMany({
      where: { isActive: true },
    });
  }

  async save(schedule: any): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.schedule.delete({ where: { uuid } });
  }
}

/**
 * Reminder Prisma Repository
 */
export class ReminderPrismaRepository implements IReminderRepository {
  constructor(private readonly prisma: any) {}

  async findById(uuid: string): Promise<any | null> {
    return this.prisma.reminder.findUnique({ where: { uuid } });
  }

  async findByAccountUuid(accountUuid: string): Promise<any[]> {
    return this.prisma.reminder.findMany({ where: { accountUuid } });
  }

  async findPendingReminders(before: Date): Promise<any[]> {
    return this.prisma.reminder.findMany({
      where: {
        scheduledAt: { lte: before },
        sentAt: null,
      },
    });
  }

  async save(reminder: any): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.reminder.delete({ where: { uuid } });
  }

  async markAsSent(uuid: string): Promise<void> {
    await this.prisma.reminder.update({
      where: { uuid },
      data: { sentAt: new Date() },
    });
  }
}

/**
 * Account Prisma Repository
 */
export class AccountPrismaRepository implements IAccountRepository {
  constructor(private readonly prisma: any) {}

  async findById(uuid: string): Promise<any | null> {
    return this.prisma.account.findUnique({ where: { uuid } });
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.prisma.account.findUnique({ where: { email } });
  }

  async save(account: any): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.account.delete({ where: { uuid } });
  }
}
