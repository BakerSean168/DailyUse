/**
 * Account Repository Port Interface
 *
 * TODO: Move to domain-server when Account module is refactored
 */

export interface IAccountRepository {
  findById(uuid: string): Promise<unknown | null>;
  findByEmail(email: string): Promise<unknown | null>;
  findByUsername(username: string): Promise<unknown | null>;
  save(account: unknown): Promise<void>;
  delete(uuid: string): Promise<void>;
}
