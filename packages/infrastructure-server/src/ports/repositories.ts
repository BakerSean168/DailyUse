/**
 * Repository Port Interfaces
 *
 * Re-exports repository interfaces from domain-server.
 * This provides a single import point for infrastructure consumers.
 */

// Re-export from domain-server (canonical definitions)
export type { IGoalRepository } from '@dailyuse/domain-server/goal';

// TODO: Add these when defined in domain-server
// export type { ITaskRepository } from '@dailyuse/domain-server/task';
// export type { IScheduleRepository } from '@dailyuse/domain-server/schedule';
// export type { IReminderRepository } from '@dailyuse/domain-server/reminder';
// export type { IAccountRepository } from '@dailyuse/domain-server/account';

/**
 * Generic Repository Interface (for reference)
 */
export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: unknown): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}

/**
 * Task Repository Interface
 * TODO: Move to domain-server when Task module is refactored
 */
export interface ITaskRepository {
  findById(uuid: string): Promise<unknown | null>;
  findByAccountUuid(accountUuid: string, options?: {
    status?: string;
    priority?: string;
    dueDate?: { start?: Date; end?: Date };
  }): Promise<unknown[]>;
  findByGoalUuid(goalUuid: string): Promise<unknown[]>;
  save(task: unknown): Promise<void>;
  delete(uuid: string): Promise<void>;
}

/**
 * Schedule Repository Interface
 * TODO: Move to domain-server when Schedule module is refactored
 */
export interface IScheduleRepository {
  findById(uuid: string): Promise<unknown | null>;
  findByAccountUuid(accountUuid: string): Promise<unknown[]>;
  findActiveSchedules(): Promise<unknown[]>;
  save(schedule: unknown): Promise<void>;
  delete(uuid: string): Promise<void>;
}

/**
 * Reminder Repository Interface
 * TODO: Move to domain-server when Reminder module is refactored
 */
export interface IReminderRepository {
  findById(uuid: string): Promise<unknown | null>;
  findByAccountUuid(accountUuid: string): Promise<unknown[]>;
  findPendingReminders(before: Date): Promise<unknown[]>;
  save(reminder: unknown): Promise<void>;
  delete(uuid: string): Promise<void>;
  markAsSent(uuid: string): Promise<void>;
}

/**
 * Account Repository Interface
 * TODO: Move to domain-server when Account module is refactored
 */
export interface IAccountRepository {
  findById(uuid: string): Promise<unknown | null>;
  findByEmail(email: string): Promise<unknown | null>;
  save(account: unknown): Promise<void>;
  delete(uuid: string): Promise<void>;
}
