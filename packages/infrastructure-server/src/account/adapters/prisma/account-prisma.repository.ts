/**
 * Account Prisma Repository
 *
 * Prisma implementation of IAccountRepository.
 */

import type { IAccountRepository } from '../../ports/account-repository.port';

export class AccountPrismaRepository implements IAccountRepository {
  constructor(private readonly prisma: any) {}

  async findById(uuid: string): Promise<any | null> {
    return this.prisma.account.findUnique({ where: { uuid } });
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.prisma.account.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<any | null> {
    return this.prisma.account.findUnique({ where: { username } });
  }

  async save(account: any): Promise<void> {
    throw new Error('Not implemented - extract from apps/api');
  }

  async delete(uuid: string): Promise<void> {
    await this.prisma.account.delete({ where: { uuid } });
  }
}
