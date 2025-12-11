/**
 * Resource Controller
 * Resource HTTP 控制器 - Story 10-2
 * 使用单例模式获取应用服务
 */
import type { Request, Response, NextFunction } from 'express';
import { ResourceApplicationService } from '../../../application/services/ResourceApplicationService';
import { RepositoryApplicationService } from '../../../application/services/RepositoryApplicationService';
import { ResourceType, RESOURCE_UPLOAD_CONFIG } from '@dailyuse/contracts/repository';
import type { ResourceUploadResult } from '@dailyuse/contracts/repository';
import path from 'path';
import fs from 'fs/promises';

// Multer 文件类型定义
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// 扩展 Express Request 类型以支持 multer
type MulterRequest = Request & {
  file?: MulterFile;
  files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
};

export class ResourceController {
  /**
   * 获取应用服务单例
   */
  private static getResourceService(): ResourceApplicationService {
    return ResourceApplicationService.getInstance();
  }

  /**
   * 获取仓储应用服务单例
   */
  private static getRepositoryService(): RepositoryApplicationService {
    return RepositoryApplicationService.getInstance();
  }

  /**
   * 获取仓储的资源存储目录
   */
  private static async getRepositoryAssetsDir(repositoryUuid: string): Promise<string> {
    try {
      const repoService = ResourceController.getRepositoryService();
      const repository = await repoService.getRepository(repositoryUuid);
      
      if (repository?.path) {
        // 使用仓储的实际路径
        return path.join(repository.path, RESOURCE_UPLOAD_CONFIG.ASSETS_DIR);
      }
    } catch (error) {
      console.warn(`[ResourceController] 无法获取仓储路径，使用默认目录:`, error);
    }
    
    // 回退到默认路径
    return path.join(
      process.cwd(), 
      RESOURCE_UPLOAD_CONFIG.DEFAULT_UPLOAD_DIR, 
      repositoryUuid, 
      RESOURCE_UPLOAD_CONFIG.ASSETS_DIR
    );
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

  /**
   * 上传资源文件
   * POST /api/repositories/:repositoryUuid/resources/upload
   */
  static uploadResource = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { repositoryUuid } = req.params;
      const { folderPath } = req.body;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No file provided',
        });
        return;
      }

      const service = ResourceController.getResourceService();
      
      // 获取仓储的资源存储目录
      const assetsDir = await ResourceController.getRepositoryAssetsDir(repositoryUuid);
      await fs.mkdir(assetsDir, { recursive: true });

      // 生成唯一文件名
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      const uniqueName = `${baseName}-${Date.now()}${ext}`;
      const filePath = folderPath 
        ? path.join(assetsDir, folderPath, uniqueName)
        : path.join(assetsDir, uniqueName);

      // 确保目录存在
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // 保存文件
      await fs.writeFile(filePath, file.buffer);

      // 确定资源类型
      const resourceType = ResourceController.getResourceTypeFromMime(file.mimetype);

      // 创建资源记录
      const resource = await service.createResource({
        repositoryUuid,
        folderUuid: undefined,
        name: uniqueName,
        type: resourceType,
        path: filePath,
        content: undefined,
      });

      const result: ResourceUploadResult = {
        uuid: resource.uuid,
        name: uniqueName,
        path: `assets/${folderPath ? `${folderPath}/` : ''}${uniqueName}`,
        type: file.mimetype,
        size: file.size,
        url: `/api/repositories/${repositoryUuid}/assets/${encodeURIComponent(uniqueName)}`,
      };

      res.status(201).json({
        success: true,
        data: result,
        message: 'Resource uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 批量上传资源（并行处理）
   * POST /api/repositories/:repositoryUuid/resources/upload-batch
   */
  static uploadResources = async (req: MulterRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { repositoryUuid } = req.params;
      const { folderPath } = req.body;
      const files = req.files as MulterFile[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files provided',
        });
        return;
      }

      const service = ResourceController.getResourceService();

      // 获取存储目录
      const assetsDir = await ResourceController.getRepositoryAssetsDir(repositoryUuid);
      await fs.mkdir(assetsDir, { recursive: true });

      /**
       * 处理单个文件上传
       */
      const processFile = async (file: MulterFile, index: number): Promise<{
        success: true;
        result: ResourceUploadResult;
      } | {
        success: false;
        error: { filename: string; error: string };
      }> => {
        try {
          const ext = path.extname(file.originalname);
          const baseName = path.basename(file.originalname, ext);
          // 使用 index 确保文件名唯一
          const uniqueName = `${baseName}-${Date.now()}-${index}${ext}`;
          const filePath = folderPath
            ? path.join(assetsDir, folderPath, uniqueName)
            : path.join(assetsDir, uniqueName);

          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, file.buffer);

          const resourceType = ResourceController.getResourceTypeFromMime(file.mimetype);
          const resource = await service.createResource({
            repositoryUuid,
            folderUuid: undefined,
            name: uniqueName,
            type: resourceType,
            path: filePath,
            content: undefined,
          });

          return {
            success: true,
            result: {
              uuid: resource.uuid,
              name: uniqueName,
              path: `assets/${folderPath ? `${folderPath}/` : ''}${uniqueName}`,
              type: file.mimetype,
              size: file.size,
              url: `/api/repositories/${repositoryUuid}/assets/${encodeURIComponent(uniqueName)}`,
            },
          };
        } catch (error) {
          return {
            success: false,
            error: {
              filename: file.originalname,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      };

      // 并行上传（使用并发限制）
      const results: ResourceUploadResult[] = [];
      const failed: Array<{ filename: string; error: string }> = [];
      
      // 分批并行处理
      for (let i = 0; i < files.length; i += RESOURCE_UPLOAD_CONFIG.SERVER_MAX_CONCURRENT) {
        const batch = files.slice(i, i + RESOURCE_UPLOAD_CONFIG.SERVER_MAX_CONCURRENT);
        const batchResults = await Promise.all(
          batch.map((file, batchIndex) => processFile(file, i + batchIndex))
        );

        for (const result of batchResults) {
          if (result.success) {
            results.push(result.result);
          } else {
            failed.push(result.error);
          }
        }
      }

      res.status(201).json({
        success: true,
        data: {
          successful: results,
          failed,
          total: files.length,
          successCount: results.length,
          failCount: failed.length,
        },
        message: `Uploaded ${results.length}/${files.length} files`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取资源文件内容
   * GET /api/repositories/:repositoryUuid/assets/:filename
   */
  static getAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { repositoryUuid, filename } = req.params;
      const decodedFilename = decodeURIComponent(filename);
      
      // 获取仓储的资源存储目录
      const assetsDir = await ResourceController.getRepositoryAssetsDir(repositoryUuid);
      const filePath = path.join(assetsDir, decodedFilename);

      // 安全检查 - 防止路径遍历
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(path.normalize(assetsDir))) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      try {
        await fs.access(filePath);
        res.sendFile(filePath);
      } catch {
        res.status(404).json({
          success: false,
          message: 'Asset not found',
        });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * 根据 MIME 类型判断资源类型
   */
  private static getResourceTypeFromMime(mimeType: string): ResourceType {
    if (mimeType.startsWith('image/')) return ResourceType.IMAGE;
    if (mimeType.startsWith('video/')) return ResourceType.VIDEO;
    if (mimeType.startsWith('audio/')) return ResourceType.AUDIO;
    if (mimeType === 'application/pdf') return ResourceType.PDF;
    if (mimeType.startsWith('text/')) return ResourceType.CODE;
    return ResourceType.OTHER;
  }
}
