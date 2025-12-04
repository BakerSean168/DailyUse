/**
 * Task Memory Repository
 *
 * In-memory implementation of ITaskRepository for testing.
 */

import type { ITaskRepository } from '../../ports/task-repository.port';

export class TaskMemoryRepository implements ITaskRepository {
  private tasks = new Map<string, any>();

  async findById(uuid: string): Promise<any | null> {
    return this.tasks.get(uuid) || null;
  }

  async findByAccountUuid(accountUuid: string, options?: any): Promise<any[]> {
    return Array.from(this.tasks.values()).filter((t) => t.accountUuid === accountUuid);
  }

  async findByGoalUuid(goalUuid: string): Promise<any[]> {
    return Array.from(this.tasks.values()).filter((t) => t.goalUuid === goalUuid);
  }

  async save(task: any): Promise<void> {
    this.tasks.set(task.uuid, task);
  }

  async delete(uuid: string): Promise<void> {
    this.tasks.delete(uuid);
  }

  clear(): void {
    this.tasks.clear();
  }
}
