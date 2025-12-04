/**
 * Schedule Prisma Repository
 *
 * Prisma implementation of IScheduleRepository.
 */

import type { IScheduleRepository } from '../../ports/schedule-repository.port';

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
