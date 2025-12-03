import type { Request, Response } from 'express';
import { RepositoryApplicationService } from '../../../application/services';
import { createResponseBuilder, ResponseCode } from '@dailyuse/contracts/response';
import { createLogger } from '@dailyuse/utils';
import type { AuthenticatedRequest } from '../../../../../shared/infrastructure/http/middlewares/authMiddleware';

const logger = createLogger('RepositoryController');

/**
 * Repository 控制器
 * 使用单例模式获取应用服务
 */
export class RepositoryController {
  private static responseBuilder = createResponseBuilder();

  /**
   * 获取应用服务单例
   */
  private static getRepositoryService(): RepositoryApplicationService {
    return RepositoryApplicationService.getInstance();
  }

  /**
   * 创建仓储
   * @route POST /api/repositories
   */
  static async createRepository(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = RepositoryController.getRepositoryService();
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      logger.info('Creating repository', { accountUuid });

      const repository = await service.createRepository({
        ...req.body,
        accountUuid,
      });

      logger.info('Repository created successfully', { repositoryUuid: repository.uuid });
      return RepositoryController.responseBuilder.sendSuccess(
        res,
        repository,
        'Repository created successfully',
        201,
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error creating repository', { error: error.message });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取仓储列表
   * @route GET /api/repositories
   */
  static async listRepositories(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = RepositoryController.getRepositoryService();
      const accountUuid = req.user?.accountUuid;

      if (!accountUuid) {
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.UNAUTHORIZED,
          message: 'Authentication required',
        });
      }

      const status = req.query.status as string | undefined;
      logger.info('Listing repositories', { accountUuid, status });

      const repositories = await service.listRepositories(accountUuid, status as any);

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        repositories,
        'Repositories retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error listing repositories', { error: error.message });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取仓储详情
   * @route GET /api/repositories/:uuid
   */
  static async getRepository(req: Request, res: Response): Promise<Response> {
    try {
      const service = RepositoryController.getRepositoryService();
      const { uuid } = req.params;

      logger.info('Getting repository', { uuid });

      const repository = await service.getRepository(uuid);

      if (!repository) {
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.NOT_FOUND,
          message: 'Repository not found',
        });
      }

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        repository,
        'Repository retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting repository', { error: error.message });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 更新仓储配置
   * @route PATCH /api/repositories/:uuid/config
   */
  static async updateConfig(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const service = RepositoryController.getRepositoryService();
      const { uuid } = req.params;

      logger.info('Updating repository config', { uuid });

      const repository = await service.updateRepositoryConfig(uuid, req.body);

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        repository,
        'Repository config updated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error updating repository config', { error: error.message });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 归档仓储
   * @route POST /api/repositories/:uuid/archive
   */
  static async archiveRepository(req: Request, res: Response): Promise<Response> {
    try {
      const service = RepositoryController.getRepositoryService();
      const { uuid } = req.params;

      logger.info('Archiving repository', { uuid });

      const repository = await service.archiveRepository(uuid);

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        repository,
        'Repository archived successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error archiving repository', { error: error.message });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 激活仓储
   * @route POST /api/repositories/:uuid/activate
   */
  static async activateRepository(req: Request, res: Response): Promise<Response> {
    try {
      const service = RepositoryController.getRepositoryService();
      const { uuid } = req.params;

      logger.info('Activating repository', { uuid });

      const repository = await service.activateRepository(uuid);

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        repository,
        'Repository activated successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error activating repository', { error: error.message });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 删除仓储
   * @route DELETE /api/repositories/:uuid
   */
  static async deleteRepository(req: Request, res: Response): Promise<Response> {
    try {
      const service = RepositoryController.getRepositoryService();
      const { uuid } = req.params;

      logger.info('Deleting repository', { uuid });

      await service.deleteRepository(uuid);

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        null,
        'Repository deleted successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error deleting repository', { error: error.message });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }

  /**
   * 获取文件树（文件夹 + 资源统一树形结构）
   * @route GET /api/repositories/:uuid/tree
   * Story 11.1: File Tree Unified Rendering
   */
  static async getFileTree(req: Request, res: Response): Promise<Response> {
    try {
      const { FolderApplicationService } = await import('../../../application/services');
      const { ResourceApplicationService } = await import('../../../application/services/ResourceApplicationService');
      
      const folderService = FolderApplicationService.getInstance();
      const resourceService = ResourceApplicationService.getInstance();
      const { uuid: repositoryUuid } = req.params;

      logger.info('Getting file tree', { repositoryUuid });

      // 1. 获取所有文件夹（已包含层级结构）
      const folders = await folderService.getFolderTree(repositoryUuid);

      // 2. 获取所有资源
      const resources = await resourceService.getResourcesByRepository(repositoryUuid);

      // 3. 合并成 TreeNode 结构
      const treeNodes: any[] = [];

      // 3.1 转换 Folders 为 TreeNode
      const folderMap = new Map<string, any>();
      const processFolder = (folder: any): any => {
        const node: any = {
          uuid: folder.uuid,
          name: folder.name,
          type: 'folder' as const,
          parentUuid: folder.parentUuid,
          repositoryUuid: folder.repositoryUuid,
          path: folder.path,
          isExpanded: false,
          children: [],
        };
        folderMap.set(folder.uuid, node);

        // 递归处理子文件夹
        if (folder.children && folder.children.length > 0) {
          node.children = folder.children.map(processFolder);
        }

        return node;
      };

      folders.forEach(folder => {
        treeNodes.push(processFolder(folder));
      });

      // 3.2 将 Resources 添加到对应的父节点
      resources.forEach(resource => {
        const fileNode: any = {
          uuid: resource.uuid,
          name: resource.name,
          type: 'file' as const,
          parentUuid: resource.folderUuid || null,
          repositoryUuid: resource.repositoryUuid,
          path: resource.path || `/${resource.name}`,
          extension: resource.type === 'MARKDOWN' ? '.md' : undefined,
          size: resource.size,
          updatedAt: resource.updatedAt,
        };

        // 如果有父文件夹，添加到父文件夹的 children
        if (resource.folderUuid && folderMap.has(resource.folderUuid)) {
          const parentFolder = folderMap.get(resource.folderUuid);
          if (!parentFolder.children) {
            parentFolder.children = [];
          }
          parentFolder.children.push(fileNode);
        } else {
          // 根级别文件
          treeNodes.push(fileNode);
        }
      });

      // 4. 排序：文件夹优先，然后按名称
      const sortNodes = (nodes: any[]): any[] => {
        return nodes.sort((a, b) => {
          // 文件夹优先
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          // 同类型按名称排序
          return a.name.localeCompare(b.name);
        }).map(node => {
          if (node.children && node.children.length > 0) {
            node.children = sortNodes(node.children);
          }
          return node;
        });
      };

      const sortedTree = sortNodes(treeNodes);

      return RepositoryController.responseBuilder.sendSuccess(
        res,
        {
          repositoryUuid,
          tree: sortedTree,
        },
        'File tree retrieved successfully',
      );
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Error getting file tree', { error: error.message });
        return RepositoryController.responseBuilder.sendError(res, {
          code: ResponseCode.INTERNAL_ERROR,
          message: error.message,
        });
      }
      return RepositoryController.responseBuilder.sendError(res, {
        code: ResponseCode.INTERNAL_ERROR,
        message: 'Unknown error occurred',
      });
    }
  }
}


