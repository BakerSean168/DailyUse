/**
 * AuthSession Prisma Repository
 *
 * Prisma implementation of IAuthSessionRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IAuthSessionRepository } from '../../ports/auth-session-repository.port';
import type { AuthSession } from '@dailyuse/domain-server/authentication';

type PrismaTransactionClient = any;

/**
 * AuthSession Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class AuthSessionPrismaRepository implements IAuthSessionRepository {
  constructor(private readonly prisma: any) {}

  async save(session: AuthSession, tx?: PrismaTransactionClient): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByUuid(uuid: string, tx?: PrismaTransactionClient): Promise<AuthSession | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccessToken(accessToken: string, tx?: PrismaTransactionClient): Promise<AuthSession | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByRefreshToken(refreshToken: string, tx?: PrismaTransactionClient): Promise<AuthSession | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByDeviceId(deviceId: string, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findActiveSessions(accountUuid: string, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findActiveSessionsByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findAll(params?: { skip?: number; take?: number }, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByStatus(
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string, tx?: PrismaTransactionClient): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async deleteByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async deleteExpired(tx?: PrismaTransactionClient): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
