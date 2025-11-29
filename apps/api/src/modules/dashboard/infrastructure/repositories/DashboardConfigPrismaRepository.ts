import type { PrismaClient } from '@prisma/client';
import { DashboardConfig } from '@dailyuse/domain-server/dashboard';
import type { IDashboardConfigRepository } from '@dailyuse/domain-server/dashboard';
import type { DashboardConfigServerDTO, WidgetConfig, DashboardConfigPersistenceDTO } from '@dailyuse/contracts/dashboard';


/**
 * Dashboard 配置仓储 Prisma 实现
 */
export class DashboardConfigPrismaRepository implements IDashboardConfigRepository {
  constructor(private prisma: PrismaClient) {}

  async findByAccountUuid(accountUuid: string): Promise<DashboardConfig | null> {
    const config = await this.prisma.dashboardConfig.findUnique({
      where: { accountUuid },
    });

    if (!config) {
      return null;
    }

    // 转换为 Persistence DTO，然后创建聚合根
    const persistenceDTO: DashboardConfigPersistenceDTO = {
      id: config.id,
      accountUuid: config.accountUuid,
      widgetConfig: JSON.stringify(config.widgetConfig),
      createdAt: config.createdAt.getTime(),
      updatedAt: config.updatedAt.getTime(),
    };

    return DashboardConfig.fromPersistence(persistenceDTO);
  }

  async save(config: DashboardConfig): Promise<DashboardConfig> {
    const persistenceDTO = config.toPersistence();

    // 尝试更新，如果不存在则创建
    const result = await this.prisma.dashboardConfig.upsert({
      where: { accountUuid: config.accountUuid },
      create: {
        accountUuid: persistenceDTO.accountUuid,
        widgetConfig: JSON.parse(persistenceDTO.widgetConfig),
      },
      update: {
        widgetConfig: JSON.parse(persistenceDTO.widgetConfig),
      },
    });

    // 重新从数据库加载以获取最新状态
    const updatedPersistenceDTO: DashboardConfigPersistenceDTO = {
      id: result.id,
      accountUuid: result.accountUuid,
      widgetConfig: JSON.stringify(result.widgetConfig),
      createdAt: result.createdAt.getTime(),
      updatedAt: result.updatedAt.getTime(),
    };

    return DashboardConfig.fromPersistence(updatedPersistenceDTO);
  }

  async delete(accountUuid: string): Promise<void> {
    await this.prisma.dashboardConfig.delete({
      where: { accountUuid },
    });
  }

  async exists(accountUuid: string): Promise<boolean> {
    const count = await this.prisma.dashboardConfig.count({
      where: { accountUuid },
    });
    return count > 0;
  }
}


