/**
 * Schedule Memory Repository
 *
 * In-memory implementation of IScheduleRepository for testing.
 */

import type { IScheduleRepository } from '../../ports/schedule-repository.port';

export class ScheduleMemoryRepository implements IScheduleRepository {
  private schedules = new Map<string, any>();

  async findById(uuid: string): Promise<any | null> {
    return this.schedules.get(uuid) || null;
  }

  async findByAccountUuid(accountUuid: string): Promise<any[]> {
    return Array.from(this.schedules.values()).filter((s) => s.accountUuid === accountUuid);
  }

  async findActiveSchedules(): Promise<any[]> {
    return Array.from(this.schedules.values()).filter((s) => s.isActive);
  }

  async save(schedule: any): Promise<void> {
    this.schedules.set(schedule.uuid, schedule);
  }

  async delete(uuid: string): Promise<void> {
    this.schedules.delete(uuid);
  }

  clear(): void {
    this.schedules.clear();
  }
}
