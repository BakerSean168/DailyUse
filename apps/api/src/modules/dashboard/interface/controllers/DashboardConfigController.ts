import type { Request, Response } from 'express';
import { DashboardContainer } from '../../infrastructure/di/DashboardContainer';
import { DashboardConfigApplicationService } from '../../application/services/DashboardConfigApplicationService';
import type { DashboardConfigServerDTO, WidgetConfig } from '@dailyuse/contracts/dashboard';


/**
 * Dashboard 配置控制器
 *
 * 处理 Widget 配置的 CRUD 操作
 */
export class DashboardConfigController {
  /**
   * GET /api/dashboard/widget-config
   * 获取用户的 Widget 配置
   */
  static async getWidgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = (req as any).accountUuid;

      if (!accountUuid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const container = DashboardContainer.getInstance();
      const service = new DashboardConfigApplicationService(container);

      const config = await service.getWidgetConfig(accountUuid);

      res.status(200).json(config);
    } catch (error) {
      console.error('[DashboardConfigController] Error getting widget config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/dashboard/widget-config
   * 更新用户的 Widget 配置（部分更新）
   */
  static async updateWidgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = (req as any).accountUuid;

      if (!accountUuid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { configs } = req.body;

      if (!configs || typeof configs !== 'object') {
        res.status(400).json({ error: 'Invalid request body: configs is required' });
        return;
      }

      const container = DashboardContainer.getInstance();
      const service = new DashboardConfigApplicationService(container);

      const updatedConfig = await service.updateWidgetConfig(accountUuid, configs);

      res.status(200).json(updatedConfig);
    } catch (error) {
      console.error('[DashboardConfigController] Error updating widget config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/dashboard/widget-config/reset
   * 重置为默认配置
   */
  static async resetWidgetConfig(req: Request, res: Response): Promise<void> {
    try {
      const accountUuid = (req as any).accountUuid;

      if (!accountUuid) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const container = DashboardContainer.getInstance();
      const service = new DashboardConfigApplicationService(container);

      const defaultConfig = await service.resetWidgetConfig(accountUuid);

      res.status(200).json(defaultConfig);
    } catch (error) {
      console.error('[DashboardConfigController] Error resetting widget config:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


