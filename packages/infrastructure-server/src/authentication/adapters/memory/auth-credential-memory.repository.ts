/**
 * AuthCredential Memory Repository
 *
 * In-memory implementation of IAuthCredentialRepository for testing.
 */

import type { IAuthCredentialRepository, PrismaTransactionClient } from '../../ports/auth-credential-repository.port';
import type { AuthCredential } from '@dailyuse/domain-server/authentication';

/**
 * AuthCredential Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AuthCredentialMemoryRepository implements IAuthCredentialRepository {
  private credentials = new Map<string, AuthCredential>();

  async save(credential: AuthCredential, _tx?: PrismaTransactionClient): Promise<void> {
    this.credentials.set((credential as any).uuid, credential);
  }

  async findByUuid(uuid: string, _tx?: PrismaTransactionClient): Promise<AuthCredential | null> {
    return this.credentials.get(uuid) ?? null;
  }

  async findByAccountUuid(accountUuid: string, _tx?: PrismaTransactionClient): Promise<AuthCredential | null> {
    return Array.from(this.credentials.values()).find((c: any) => c.accountUuid === accountUuid) ?? null;
  }

  async findAll(params?: { skip?: number; take?: number }, _tx?: PrismaTransactionClient): Promise<AuthCredential[]> {
    const all = Array.from(this.credentials.values());
    const skip = params?.skip ?? 0;
    const take = params?.take ?? all.length;
    return all.slice(skip, skip + take);
  }

  async findByStatus(
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
    params?: { skip?: number; take?: number },
    _tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]> {
    const filtered = Array.from(this.credentials.values()).filter((c: any) => c.status === status);
    const skip = params?.skip ?? 0;
    const take = params?.take ?? filtered.length;
    return filtered.slice(skip, skip + take);
  }

  async findByType(
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY',
    params?: { skip?: number; take?: number },
    _tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]> {
    const filtered = Array.from(this.credentials.values()).filter((c: any) => c.type === type);
    const skip = params?.skip ?? 0;
    const take = params?.take ?? filtered.length;
    return filtered.slice(skip, skip + take);
  }

  async existsByAccountUuid(accountUuid: string, _tx?: PrismaTransactionClient): Promise<boolean> {
    return Array.from(this.credentials.values()).some((c: any) => c.accountUuid === accountUuid);
  }

  async delete(uuid: string, _tx?: PrismaTransactionClient): Promise<void> {
    this.credentials.delete(uuid);
  }

  async deleteExpired(_tx?: PrismaTransactionClient): Promise<number> {
    const now = new Date();
    let count = 0;
    this.credentials.forEach((c: any, uuid) => {
      if (c.expiresAt && c.expiresAt < now) {
        this.credentials.delete(uuid);
        count++;
      }
    });
    return count;
  }

  // Test helpers
  clear(): void {
    this.credentials.clear();
  }

  seed(credentials: AuthCredential[]): void {
    credentials.forEach((c: any) => this.credentials.set(c.uuid, c));
  }
}
