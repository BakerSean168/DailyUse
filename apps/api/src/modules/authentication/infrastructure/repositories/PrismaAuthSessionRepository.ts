import { PrismaClient } from '@prisma/client';
import type { AuthSession as PrismaAuthSession } from '@prisma/client';
import type {
  IAuthSessionRepository,
  AuthSessionPrismaTransactionClient as PrismaTransactionClient,
} from '@dailyuse/domain-server';
import { AuthSession } from '@dailyuse/domain-server';
import type { AuthenticationContracts } from '@dailyuse/contracts';

export class PrismaAuthSessionRepository implements IAuthSessionRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToEntity(data: PrismaAuthSession): AuthSession {
    const device = JSON.parse(data.device);
    const location = data.userAgent ? JSON.parse(data.userAgent) : null;

    const persistenceDTO: AuthenticationContracts.AuthSessionPersistenceDTO = {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      accessToken: data.accessToken,
      accessTokenExpiresAt: data.accessTokenExpiresAt.getTime(),
      refreshToken: data.refreshToken,
      refreshTokenExpiresAt: data.refreshTokenExpiresAt.getTime(),
      deviceId: device.deviceId,
      deviceType: device.deviceType,
      deviceOs: device.os,
      deviceBrowser: device.browser,
      status: data.status as AuthenticationContracts.SessionStatus,
      ipAddress: data.ipAddress ?? '',
      locationCountry: location?.country,
      locationRegion: location?.region,
      locationCity: location?.city,
      locationTimezone: location?.timezone,
      lastActivityAt: data.lastAccessedAt.getTime(),
      history: data.history,
      createdAt: data.createdAt.getTime(),
      expiresAt: data.accessTokenExpiresAt.getTime(), // Using accessTokenExpiresAt as the session expiry
      revokedAt: data.revokedAt?.getTime(),
    };
    return AuthSession.fromPersistenceDTO(persistenceDTO);
  }

  private toDate(timestamp: number | null | undefined): Date | null | undefined {
    if (timestamp == null) return timestamp as null | undefined;
    return new Date(timestamp);
  }

  async save(session: AuthSession, tx?: PrismaTransactionClient): Promise<void> {
    const client = tx || this.prisma;
    const persistence = session.toPersistenceDTO();
    const {
      uuid,
      accountUuid,
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      refreshTokenExpiresAt,
      status,
      ipAddress,
      history,
      lastActivityAt,
      revokedAt,
    } = persistence;

    const device = JSON.stringify({
      deviceId: persistence.deviceId,
      deviceType: persistence.deviceType,
      os: persistence.deviceOs,
      browser: persistence.deviceBrowser,
    });

    const userAgent = JSON.stringify({
      country: persistence.locationCountry,
      region: persistence.locationRegion,
      city: persistence.locationCity,
      timezone: persistence.locationTimezone,
    });

    const dataForPrisma = {
      uuid,
      accountUuid,
      status,
      accessToken,
      accessTokenExpiresAt: new Date(accessTokenExpiresAt),
      refreshToken,
      refreshTokenExpiresAt: new Date(refreshTokenExpiresAt),
      device,
      ipAddress,
      userAgent,
      history,
      lastAccessedAt: new Date(lastActivityAt),
      revokedAt: this.toDate(revokedAt),
    };

    await client.authSession.upsert({
      where: { uuid },
      create: {
        ...dataForPrisma,
        createdAt: new Date(persistence.createdAt),
        updatedAt: new Date(),
      },
      update: {
        ...dataForPrisma,
        updatedAt: new Date(),
      },
    });
  }

  async findByUuid(uuid: string, tx?: PrismaTransactionClient): Promise<AuthSession | null> {
    const client = tx || this.prisma;
    const data = await client.authSession.findUnique({ where: { uuid } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByAccountUuid(
    accountUuid: string,
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession[]> {
    const client = tx || this.prisma;
    const sessions = await client.authSession.findMany({
      where: { accountUuid },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s: PrismaAuthSession) => this.mapToEntity(s));
  }

  async findByAccessToken(
    accessToken: string,
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession | null> {
    const client = tx || this.prisma;
    const data = await client.authSession.findUnique({ where: { accessToken } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByRefreshToken(
    refreshToken: string,
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession | null> {
    const client = tx || this.prisma;
    const data = await client.authSession.findUnique({ where: { refreshToken } });
    return data ? this.mapToEntity(data) : null;
  }

  async findByDeviceId(deviceId: string, tx?: PrismaTransactionClient): Promise<AuthSession[]> {
    const client = tx || this.prisma;
    const sessions = await client.authSession.findMany({
      where: { device: { contains: `"deviceId":"${deviceId}"` } },
    });
    return sessions.map((s: PrismaAuthSession) => this.mapToEntity(s));
  }

  async findActiveSessions(
    accountUuid: string,
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession[]> {
    const client = tx || this.prisma;
    const sessions = await client.authSession.findMany({
      where: {
        accountUuid,
        status: 'ACTIVE',
        accessTokenExpiresAt: { gt: new Date() },
      },
      orderBy: { lastAccessedAt: 'desc' },
    });
    return sessions.map((s: PrismaAuthSession) => this.mapToEntity(s));
  }

  async findAll(
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession[]> {
    const client = tx || this.prisma;
    const sessions = await client.authSession.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s: PrismaAuthSession) => this.mapToEntity(s));
  }

  async findByStatus(
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'LOCKED',
    params?: { skip?: number; take?: number },
    tx?: PrismaTransactionClient,
  ): Promise<AuthSession[]> {
    const client = tx || this.prisma;
    const sessions = await client.authSession.findMany({
      where: { status },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((s: PrismaAuthSession) => this.mapToEntity(s));
  }

  async delete(uuid: string, tx?: PrismaTransactionClient): Promise<void> {
    const client = tx || this.prisma;
    await client.authSession.delete({ where: { uuid } });
  }

  async deleteByAccountUuid(accountUuid: string, tx?: PrismaTransactionClient): Promise<number> {
    const client = tx || this.prisma;
    const result = await client.authSession.deleteMany({ where: { accountUuid } });
    return result.count;
  }

  async deleteExpired(tx?: PrismaTransactionClient): Promise<number> {
    const client = tx || this.prisma;
    const result = await client.authSession.deleteMany({
      where: {
        OR: [{ status: 'EXPIRED' }, { accessTokenExpiresAt: { lt: new Date() } }],
      },
    });
    return result.count;
  }
}
