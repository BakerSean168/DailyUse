/**
 * Task Repository Port Interface
 *
 * TODO: Move to domain-server when Task module is refactored
 */

/**
 * Task Repository Interface
 */
export interface ITaskRepository {
  findById(uuid: string): Promise<unknown | null>;
  findByAccountUuid(
    accountUuid: string,
    options?: {
      status?: string;
      priority?: string;
      dueDate?: { start?: Date; end?: Date };
    },
  ): Promise<unknown[]>;
  findByGoalUuid(goalUuid: string): Promise<unknown[]>;
  save(task: unknown): Promise<void>;
  delete(uuid: string): Promise<void>;
}
