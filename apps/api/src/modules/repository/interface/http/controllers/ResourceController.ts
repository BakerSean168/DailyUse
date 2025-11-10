/**
 * Resource Controller
 * Resource HTTP 控制器 - Story 10-2
 */
import { Request, Response, NextFunction } from 'express';
import { ResourceApplicationService } from '../../../application/services/ResourceApplicationService';
import { ResourceType } from '@dailyuse/contracts';

export class ResourceController {
  constructor(private resourceService: ResourceApplicationService) {}

  createResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { repositoryUuid, folderUuid, name, type, path, content } = req.body;

      const resource = await this.resourceService.createResource({
        repositoryUuid,
        folderUuid,
        name,
        type: type as ResourceType,
        path,
        content,
      });

      res.status(201).json(resource);
    } catch (error) {
      next(error);
    }
  };

  getResourceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uuid } = req.params;
      const resource = await this.resourceService.getResourceById(uuid);

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      res.json(resource);
    } catch (error) {
      next(error);
    }
  };

  getResourcesByRepository = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { repositoryUuid } = req.params;
      const resources = await this.resourceService.getResourcesByRepository(repositoryUuid);
      res.json(resources);
    } catch (error) {
      next(error);
    }
  };

  updateMarkdownContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uuid } = req.params;
      const { content } = req.body;

      const resource = await this.resourceService.updateMarkdownContent(uuid, content);
      res.json(resource);
    } catch (error) {
      next(error);
    }
  };

  deleteResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uuid } = req.params;
      await this.resourceService.deleteResource(uuid);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
