/**
 * Memory Adapters
 *
 * In-memory repository implementations for testing.
 */

import type {
  IGoalRepository,
  ITaskRepository,
  IAccountRepository,
} from '../../ports/repositories';

/**
 * Goal Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class GoalMemoryRepository implements IGoalRepository {
  private goals = new Map<string, any>();

  async findById(uuid: string, options?: { includeChildren?: boolean }): Promise<any | null> {
    return this.goals.get(uuid) || null;
  }

  async findByAccountUuid(accountUuid: string, options?: any): Promise<any[]> {
    return Array.from(this.goals.values())
      .filter(g => g.accountUuid === accountUuid);
  }

  async findByFolderUuid(folderUuid: string): Promise<any[]> {
    return Array.from(this.goals.values())
      .filter(g => g.folderUuid === folderUuid);
  }

  async save(goal: any): Promise<void> {
    this.goals.set(goal.uuid, goal);
  }

  async delete(uuid: string): Promise<void> {
    this.goals.delete(uuid);
  }

  async softDelete(uuid: string): Promise<void> {
    const goal = this.goals.get(uuid);
    if (goal) {
      goal.deletedAt = new Date();
      this.goals.set(uuid, goal);
    }
  }

  async exists(uuid: string): Promise<boolean> {
    return this.goals.has(uuid);
  }

  async batchUpdateStatus(uuids: string[], status: string): Promise<void> {
    uuids.forEach(uuid => {
      const goal = this.goals.get(uuid);
      if (goal) {
        goal.status = status;
        this.goals.set(uuid, goal);
      }
    });
  }

  async batchMoveToFolder(uuids: string[], folderUuid: string | null): Promise<void> {
    uuids.forEach(uuid => {
      const goal = this.goals.get(uuid);
      if (goal) {
        goal.folderUuid = folderUuid;
        this.goals.set(uuid, goal);
      }
    });
  }

  // Test helpers
  clear(): void {
    this.goals.clear();
  }

  seed(goals: any[]): void {
    goals.forEach(g => this.goals.set(g.uuid, g));
  }
}

/**
 * Task Memory Repository
 */
export class TaskMemoryRepository implements ITaskRepository {
  private tasks = new Map<string, any>();

  async findById(uuid: string): Promise<any | null> {
    return this.tasks.get(uuid) || null;
  }

  async findByAccountUuid(accountUuid: string, options?: any): Promise<any[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.accountUuid === accountUuid);
  }

  async findByGoalUuid(goalUuid: string): Promise<any[]> {
    return Array.from(this.tasks.values())
      .filter(t => t.goalUuid === goalUuid);
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

/**
 * Account Memory Repository
 */
export class AccountMemoryRepository implements IAccountRepository {
  private accounts = new Map<string, any>();
  private emailIndex = new Map<string, string>(); // email -> uuid

  async findById(uuid: string): Promise<any | null> {
    return this.accounts.get(uuid) || null;
  }

  async findByEmail(email: string): Promise<any | null> {
    const uuid = this.emailIndex.get(email);
    return uuid ? this.accounts.get(uuid) : null;
  }

  async save(account: any): Promise<void> {
    this.accounts.set(account.uuid, account);
    if (account.email) {
      this.emailIndex.set(account.email, account.uuid);
    }
  }

  async delete(uuid: string): Promise<void> {
    const account = this.accounts.get(uuid);
    if (account?.email) {
      this.emailIndex.delete(account.email);
    }
    this.accounts.delete(uuid);
  }

  clear(): void {
    this.accounts.clear();
    this.emailIndex.clear();
  }
}
