/**
 * AuthCredential Prisma Repository
 *
 * Prisma implementation of IAuthCredentialRepository.
 * Supports both PostgreSQL (API) and SQLite (Desktop).
 */

import type { IAuthCredentialRepository, PrismaTransactionClient } from '../../ports/auth-credential-repository.port';
import type { AuthCredential } from '@dailyuse/domain-server/authentication';

/**
 * AuthCredential Prisma Repository
 *
 * Skeleton implementation - to be completed when extracting from apps/api.
 */
export class AuthCredentialPrismaRepository implements IAuthCredentialRepository {
  constructor(private readonly prisma: any) {}

  async save(credential: AuthCredential, tx?: PrismaTransactionClient): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByUuid(uuid: string, tx?: PrismaTransactionClient): Promise<AuthCredential | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<AuthCredential | null> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findAll(params?: { skip?: number; take?: number }, tx?: PrismaTransactionClient): Promise<AuthCredential[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByStatus(
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async findByType(
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async existsByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<boolean> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string, tx?: PrismaTransactionClient): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async deleteExpired(tx?: PrismaTransactionClient): Promise<number> {
    throw new Error('Not implemented - extract from apps/api');
  }
}
