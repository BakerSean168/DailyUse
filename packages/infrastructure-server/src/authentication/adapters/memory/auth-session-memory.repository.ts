/**
 * AuthSession Memory Repository
 *
 * In-memory implementation of IAuthSessionRepository for testing.
 */

import type { IAuthSessionRepository } from '../../ports/auth-session-repository.port';
import type { AuthSession } from '@dailyuse/domain-server/authentication';

type PrismaTransactionClient = any;

/**
 * AuthSession Memory Repository
 *
 * In-memory implementation for testing purposes.
 */
export class AuthSessionMemoryRepository implements IAuthSessionRepository {
  private sessions = new Map<string, AuthSession>();

  async save(session: AuthSession, _tx?: PrismaTransactionClient): Promise<void> {
    this.sessions.set((session as any).uuid, session);
  }

  async findByUuid(uuid: string, _tx?: PrismaTransactionClient): Promise<AuthSession | null> {
    return this.sessions.get(uuid) ?? null;
  }

  async findByAccountUuid(accountUuid: string, _tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    return Array.from(this.sessions.values()).filter((s: any) => s.accountUuid === accountUuid);
  }

  async findByAccessToken(accessToken: string, _tx?: PrismaTransactionClient): Promise<AuthSession | null> {
    return Array.from(this.sessions.values()).find((s: any) => s.accessToken === accessToken) ?? null;
  }

  async findByRefreshToken(refreshToken: string, _tx?: PrismaTransactionClient): Promise<AuthSession | null> {
    return Array.from(this.sessions.values()).find((s: any) => s.refreshToken === refreshToken) ?? null;
  }

  async findByDeviceId(deviceId: string, _tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    return Array.from(this.sessions.values()).filter((s: any) => s.deviceInfo?.deviceId === deviceId);
  }

  async findActiveSessions(accountUuid: string, _tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    return Array.from(this.sessions.values()).filter(
      (s: any) => s.accountUuid === accountUuid && s.status === 'ACTIVE',
    );
  }

  async findActiveSessionsByAccountUuid(accountUuid: string, _tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    return this.findActiveSessions(accountUuid, _tx);
  }

  async findAll(params?: { skip?: number; take?: number }, _tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    const all = Array.from(this.sessions.values());
    const skip = params?.skip ?? 0;
    const take = params?.take ?? all.length;
    return all.slice(skip, skip + take);
  }

  async findByStatus(
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED',
    params?: { skip?: number; take?: number },
    _tx?: PrismaTransactionClient,
  ): Promise<AuthSession[]> {
    const filtered = Array.from(this.sessions.values()).filter((s: any) => s.status === status);
    const skip = params?.skip ?? 0;
    const take = params?.take ?? filtered.length;
    return filtered.slice(skip, skip + take);
  }

  async delete(uuid: string, _tx?: PrismaTransactionClient): Promise<void> {
    this.sessions.delete(uuid);
  }

  async deleteByAccountUuid(accountUuid: string, _tx?: PrismaTransactionClient): Promise<number> {
    let count = 0;
    this.sessions.forEach((s: any, uuid) => {
      if (s.accountUuid === accountUuid) {
        this.sessions.delete(uuid);
        count++;
      }
    });
    return count;
  }

  async deleteExpired(_tx?: PrismaTransactionClient): Promise<number> {
    const now = new Date();
    let count = 0;
    this.sessions.forEach((s: any, uuid) => {
      if (s.expiresAt && s.expiresAt < now) {
        this.sessions.delete(uuid);
        count++;
      }
    });
    return count;
  }

  // Test helpers
  clear(): void {
    this.sessions.clear();
  }

  seed(sessions: AuthSession[]): void {
    sessions.forEach((s: any) => this.sessions.set(s.uuid, s));
  }
}
