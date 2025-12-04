/**
 * Account Memory Repository
 *
 * In-memory implementation of IAccountRepository for testing.
 */

import type { IAccountRepository } from '../../ports/account-repository.port';

export class AccountMemoryRepository implements IAccountRepository {
  private accounts = new Map<string, any>();

  async findById(uuid: string): Promise<any | null> {
    return this.accounts.get(uuid) || null;
  }

  async findByEmail(email: string): Promise<any | null> {
    return Array.from(this.accounts.values()).find((a) => a.email === email) || null;
  }

  async findByUsername(username: string): Promise<any | null> {
    return Array.from(this.accounts.values()).find((a) => a.username === username) || null;
  }

  async save(account: any): Promise<void> {
    this.accounts.set(account.uuid, account);
  }

  async delete(uuid: string): Promise<void> {
    this.accounts.delete(uuid);
  }

  clear(): void {
    this.accounts.clear();
  }
}
