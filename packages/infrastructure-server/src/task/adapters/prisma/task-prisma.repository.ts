/**
 * Task Prisma Repository
 *
 * Prisma implementation of ITaskRepository.
 */

import type { ITaskRepository } from '../../ports/task-repository.port';

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
