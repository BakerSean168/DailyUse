import { PrismaClient } from '@prisma/client';
import type { authCredential as PrismaAuthCredential } from '@prisma/client';
import type {
  IAuthCredentialRepository,
  AuthCredentialPrismaTransactionClient as PrismaTransactionClient,
} from '@dailyuse/domain-server';
import { AuthCredential } from '@dailyuse/domain-server';
import type { AuthenticationContracts } from '@dailyuse/contracts';

export class PrismaAuthCredentialRepository implements IAuthCredentialRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: PrismaAuthCredential): AuthCredential {
    const { data: jsonData, metadata, history, ...rest } = data;
    const parsedData = JSON.parse(jsonData);
    const parsedMetadata = JSON.parse(metadata);

    const persistenceDTO: AuthenticationContracts.AuthCredentialPersistenceDTO = {
      ...rest,
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      type: data.type as AuthenticationContracts.CredentialType,
      password_credential: parsedData.password_credential,
      api_key_credentials: parsedData.api_key_credentials,
      remember_me_tokens: parsedData.remember_me_tokens,
      two_factor: parsedData.two_factor,
      biometric: parsedData.biometric,
      status: parsedMetadata.status,
      security: parsedMetadata.security,
      history: history,
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
      expiresAt: data.expiresAt?.getTime(),
      lastUsedAt: data.lastUsedAt?.getTime(),
      revokedAt: data.revokedAt?.getTime(),
    };

    return AuthCredential.fromPersistenceDTO(persistenceDTO);
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(credential: AuthCredential, tx?: PrismaTransactionClient): Promise<void> {
    const client = tx || this.prisma;
    const persistence = credential.toPersistenceDTO();
    const {
      uuid,
      accountUuid,
      type,
      password_credential,
      api_key_credentials,
      remember_me_tokens,
      two_factor,
      biometric,
      status,
      security,
      history,
      createdAt,
      updatedAt,
      expiresAt,
      lastUsedAt,
      revokedAt,
    } = persistence;

    const jsonData = JSON.stringify({
      password_credential,
      api_key_credentials,
      remember_me_tokens,
      two_factor,
      biometric,
    });

    const metadata = JSON.stringify({
      status,
      security,
    });

    const dataForPrisma = {
      uuid,
      accountUuid: accountUuid,
      type,
      data: jsonData,
      metadata,
      history: history,
      createdAt: this.toDate(createdAt) ?? new Date(),
      updatedAt: this.toDate(updatedAt) ?? new Date(),
      expiresAt: this.toDate(expiresAt),
      lastUsedAt: this.toDate(lastUsedAt),
      revokedAt: this.toDate(revokedAt),
    };

    await client.authCredential.upsert({
      where: { uuid: persistence.uuid },
      create: dataForPrisma,
      update: {
        type: dataForPrisma.type,
        data: dataForPrisma.data,
        metadata: dataForPrisma.metadata,
        history: dataForPrisma.history,
        updatedAt: dataForPrisma.updatedAt,
        expiresAt: dataForPrisma.expiresAt,
        lastUsedAt: dataForPrisma.lastUsedAt,
        revokedAt: dataForPrisma.revokedAt,
      },
    });
  }

  async findByUuid(uuid: string, tx?: PrismaTransactionClient): Promise<AuthCredential | null> {
    const client = tx || this.prisma;
    const data = await client.authCredential.findUnique({
      where: { uuid },
    });

    if (!data) {
      return null;
    }

    return this.mapToEntity(data);
  }

  async findByAccountUuid(
    accountUuid: string,
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential | null> {
    const client = tx || this.prisma;
    const data = await client.authCredential.findFirst({
      where: { accountUuid },
    });

    if (!data) {
      return null;
    }

    return this.mapToEntity(data);
  }

  async findAll(
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]> {
    const client = tx || this.prisma;
    const data = await client.authCredential.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });

    return data.map((item: PrismaAuthCredential) => this.mapToEntity(item));
  }

  async findByStatus(
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'REVOKED',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]> {
    const client = tx || this.prisma;
    const data = await client.authCredential.findMany({
      where: { metadata: { contains: `"status":"${status}"` } },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
    return data.map((item: PrismaAuthCredential) => this.mapToEntity(item));
  }

  async findByType(
    type: 'PASSWORD' | 'API_KEY' | 'BIOMETRIC' | 'MAGIC_LINK' | 'HARDWARE_KEY',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthCredential[]> {
    const client = tx || this.prisma;
    const data = await client.authCredential.findMany({
      where: { type },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });

    return data.map((item: PrismaAuthCredential) => this.mapToEntity(item));
  }

  async existsByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<boolean> {
    const client = tx || this.prisma;
    const count = await client.authCredential.count({
      where: { accountUuid },
    });
    return count > 0;
  }

  async delete(uuid: string, tx?: PrismaTransactionClient): Promise<void> {
    const client = tx || this.prisma;
    await client.authCredential.delete({
      where: { uuid },
    });
  }

  async deleteExpired(tx?: PrismaTransactionClient): Promise<number> {
    const client = tx || this.prisma;
    const result = await client.authCredential.deleteMany({
      where: { metadata: { contains: '"status":"EXPIRED"' } },
    });
    return result.count;
  }
}
