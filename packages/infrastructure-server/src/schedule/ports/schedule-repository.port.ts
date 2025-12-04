/**
 * Schedule Repository Port Interface
 *
 * TODO: Move to domain-server when Schedule module is refactored
 */

export interface IScheduleRepository {
  findById(uuid: string): Promise<unknown | null>;
  findByAccountUuid(accountUuid: string): Promise<unknown[]>;
  findActiveSchedules(): Promise<unknown[]>;
  save(schedule: unknown): Promise<void>;
  delete(uuid: string): Promise<void>;
}
