/**
 * Resource Controller
 * Resource HTTP 控制器 - Story 10-2
 * 使用单例模式获取应用服务
 */
import type { Request, Response, NextFunction } from 'express';
import { ResourceApplicationService } from '../../../application/services/ResourceApplicationService';
import { ResourceType } from '@dailyuse/contracts/repository';

export class ResourceController {
  /**
   * 获取应用服务单例
   */
  private static getResourceService(): ResourceApplicationService {
    return ResourceApplicationService.getInstance();
  }

  static createResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const service = ResourceController.getResourceService();
      const { repositoryUuid, folderUuid, name, type, path, content } = req.body;

      const resource = await service.createResource({
        repositoryUuid,
        folderUuid,
        name,
        type: type as ResourceType,
        path,
        content,
      });

      res.status(201).json({
        success: true,
        data: resource,
        message: 'Resource created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  static getResourceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const service = ResourceController.getResourceService();
      const { uuid } = req.params;
      const resource = await service.getResourceById(uuid);

      if (!resource) {
        res.status(404).json({ 
          success: false, 
          message: 'Resource not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  };

  static getResourcesByRepository = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const service = ResourceController.getResourceService();
      const { repositoryUuid } = req.params;
      const resources = await service.getResourcesByRepository(repositoryUuid);
      
      res.json({
        success: true,
        data: resources,
      });
    } catch (error) {
      next(error);
    }
  };

  static updateMarkdownContent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const service = ResourceController.getResourceService();
      const { uuid } = req.params;
      const { content } = req.body;

      const resource = await service.updateMarkdownContent(uuid, content);
      
      res.json({
        success: true,
        data: resource,
        message: 'Content updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  static deleteResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const service = ResourceController.getResourceService();
      const { uuid } = req.params;
      await service.deleteResource(uuid);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}


