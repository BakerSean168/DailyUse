/**
 * Knowledge Generation Application Service
 * 知识文档生成应用服务 - 使用 AI 生成知识文档
 *
 * DDD Application Service 职责：
 * - 协调 AI 服务和 Repository 模块
 * - 管理知识文档生成流程
 * - 处理错误和异常
 * - 提供统一的接口给 Presentation 层
 *
 * 依赖：
 * - aiService（AI 流式聊天服务）
 * - repositoryApiClient（仓储 API）
 * - folderStore / resourceStore（状态管理）
 */

import { aiService } from '@/shared/services/aiService';
import { repositoryApiClient } from '@/modules/repository/infrastructure/api/repositoryApiClient';
import { useRepositoryStore } from '@/modules/repository/presentation/stores/repositoryStore';
import { useFolderStore } from '@/modules/repository/presentation/stores/folderStore';
import { useResourceStore } from '@/modules/repository/presentation/stores/resourceStore';
import { useFileTreeStore } from '@/modules/repository/presentation/stores/fileTreeStore';
import { Folder, Resource, Repository } from '@dailyuse/domain-client/repository';
import { useMessage } from '@dailyuse/ui';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('KnowledgeGenerationApplicationService');

/**
 * 知识文档生成请求
 */
export interface GenerateKnowledgeRequest {
  /** 主题/标题 */
  topic: string;
  /** 仓储 UUID */
  repositoryUuid: string;
  /** 父文件夹 UUID（可选，null 表示根目录） */
  parentFolderUuid?: string | null;
  /** 是否创建子文件夹（默认 true） */
  createFolder?: boolean;
  /** 自定义文件夹名称（可选） */
  folderName?: string;
}

/**
 * 知识文档生成响应
 */
export interface GenerateKnowledgeResponse {
  /** 生成的资源 UUID */
  resourceUuid: string;
  /** 生成的文件夹 UUID（如果创建了文件夹） */
  folderUuid?: string;
  /** 文件名 */
  fileName: string;
  /** 文件路径 */
  filePath: string;
}

/**
 * 目标关联知识生成请求
 */
export interface GenerateGoalKnowledgeRequest {
  /** 目标 UUID */
  goalUuid: string;
  /** 目标标题 */
  goalTitle: string;
  /** 目标描述 */
  goalDescription?: string;
  /** 目标分类 */
  goalCategory?: string;
  /** 仓储 UUID（可选，不传则使用或创建默认仓储） */
  repositoryUuid?: string;
}

/**
 * Knowledge Generation Application Service
 * AI 知识文档生成应用服务
 *
 * 职责边界：
 * - 从主题生成知识文档
 * - 从目标生成关联知识文档
 * - 管理生成状态和错误处理
 * - 协调仓储模块（创建文件夹、资源）
 */
export class KnowledgeGenerationApplicationService {
  private static instance: KnowledgeGenerationApplicationService;

  /** 当前生成状态 */
  private _isGenerating = false;
  private _lastError: Error | null = null;
  private _generatedContent = '';
  private _progress = 0;

  private constructor() {}

  /**
   * 延迟获取 Snackbar（避免在 Pinia 初始化前访问）
   */
  private get snackbar() {
    return useMessage();
  }

  /**
   * 获取服务单例
   */
  static getInstance(): KnowledgeGenerationApplicationService {
    if (!KnowledgeGenerationApplicationService.instance) {
      KnowledgeGenerationApplicationService.instance = new KnowledgeGenerationApplicationService();
    }
    return KnowledgeGenerationApplicationService.instance;
  }

  // ===== Getters =====

  /** 是否正在生成 */
  get isGenerating(): boolean {
    return this._isGenerating;
  }

  /** 最近一次错误 */
  get lastError(): Error | null {
    return this._lastError;
  }

  /** 生成的内容 */
  get generatedContent(): string {
    return this._generatedContent;
  }

  /** 生成进度 (0-100) */
  get progress(): number {
    return this._progress;
  }

  // ===== API 方法 =====

  /**
   * 生成知识文档
   * 
   * 流程：
   * 1. 验证输入
   * 2. （可选）创建文件夹
   * 3. 流式生成内容
   * 4. 构建 frontmatter
   * 5. 创建资源
   * 6. 刷新文件树
   *
   * @param request - 生成请求
   * @param onChunk - 内容块回调（用于实时预览）
   * @returns 生成结果
   */
  async generateKnowledge(
    request: GenerateKnowledgeRequest,
    onChunk?: (chunk: string) => void,
  ): Promise<GenerateKnowledgeResponse> {
    this.validateRequest(request);

    const folderStore = useFolderStore();
    const resourceStore = useResourceStore();
    const fileTreeStore = useFileTreeStore();

    try {
      this._isGenerating = true;
      this._lastError = null;
      this._generatedContent = '';
      this._progress = 0;

      logger.info('Generating knowledge document', {
        topic: request.topic,
        repositoryUuid: request.repositoryUuid,
        parentFolderUuid: request.parentFolderUuid,
        createFolder: request.createFolder,
      });

      // 1. 确定文件夹
      let targetFolderUuid: string | null = request.parentFolderUuid || null;
      let folderPath = '';

      if (request.createFolder !== false) {
        // 创建子文件夹
        const folderName = this.sanitizeName(request.folderName || request.topic);
        const folderDTO = await repositoryApiClient.createFolder(request.repositoryUuid, {
          name: folderName,
          parentUuid: request.parentFolderUuid || null,
        });
        const folder = Folder.fromClientDTO(folderDTO);
        folderStore.addFolder(folder);
        targetFolderUuid = folder.uuid;
        folderPath = `/${folderName}`;
        this._progress = 10;
      }

      // 2. 流式生成内容
      this._progress = 20;
      const content = await aiService.generateKnowledge(
        request.topic,
        (chunk) => {
          this._generatedContent += chunk;
          this._progress = Math.min(20 + (this._generatedContent.length / 50), 80);
          onChunk?.(chunk);
        }
      );

      // 3. 构建 frontmatter
      const now = new Date().toISOString();
      const fileName = this.sanitizeName(request.topic) + '.md';
      const fullContent = this.buildFrontmatter({
        title: request.topic,
        created: now,
        updated: now,
        tags: ['知识文档', 'AI生成'],
      }) + content;

      this._progress = 85;

      // 4. 创建资源
      const resourceDTO = await resourceStore.createResource({
        name: fileName,
        repositoryUuid: request.repositoryUuid,
        folderUuid: targetFolderUuid || undefined,
        type: 'text/markdown',
        path: `${folderPath}/${fileName}`,
        content: fullContent,
      });

      this._progress = 95;

      // 5. 刷新文件树
      await fileTreeStore.loadTree(request.repositoryUuid);

      this._progress = 100;

      logger.info('Knowledge document generated successfully', {
        resourceUuid: resourceDTO.uuid,
        folderUuid: targetFolderUuid,
        fileName,
      });

      this.message.success(`知识文档「${request.topic}」已生成`);

      return {
        resourceUuid: resourceDTO.uuid,
        folderUuid: targetFolderUuid || undefined,
        fileName,
        filePath: `${folderPath}/${fileName}`,
      };
    } catch (error) {
      const errorMessage = this.handleError(error, '生成知识文档失败');
      throw new Error(errorMessage);
    } finally {
      this._isGenerating = false;
    }
  }

  /**
   * 为目标生成关联知识文档
   * 
   * 流程：
   * 1. 获取或创建默认仓储
   * 2. 创建目标文件夹
   * 3. 生成目标相关知识内容
   * 4. 创建资源并关联目标
   *
   * @param request - 目标知识生成请求
   * @param onChunk - 内容块回调
   * @returns 生成结果
   */
  async generateGoalKnowledge(
    request: GenerateGoalKnowledgeRequest,
    onChunk?: (chunk: string) => void,
  ): Promise<GenerateKnowledgeResponse> {
    const repositoryStore = useRepositoryStore();
    const folderStore = useFolderStore();
    const resourceStore = useResourceStore();
    const fileTreeStore = useFileTreeStore();

    try {
      this._isGenerating = true;
      this._lastError = null;
      this._generatedContent = '';
      this._progress = 0;

      logger.info('Generating goal knowledge document', {
        goalUuid: request.goalUuid,
        goalTitle: request.goalTitle,
      });

      // 1. 获取或创建仓储
      let repositoryUuid = request.repositoryUuid;
      if (!repositoryUuid) {
        let targetRepository = repositoryStore.repositories[0];
        if (!targetRepository) {
          // 创建默认仓储
          const repoDTO = await repositoryApiClient.createRepository({
            name: '我的知识库',
            description: 'AI 生成的知识文档存储位置',
          });
          const newRepo = Repository.fromClientDTO(repoDTO);
          repositoryStore.addRepository(newRepo);
          repositoryUuid = newRepo.uuid;
          logger.info('Created default repository', { uuid: repositoryUuid });
        } else {
          repositoryUuid = targetRepository.uuid;
        }
      }

      this._progress = 10;

      // 2. 创建目标文件夹
      const folderName = this.sanitizeName(request.goalTitle);
      const folderDTO = await repositoryApiClient.createFolder(repositoryUuid, {
        name: folderName,
        parentUuid: null,
      });
      const folder = Folder.fromClientDTO(folderDTO);
      folderStore.addFolder(folder);

      this._progress = 20;

      // 3. 生成知识内容
      const content = await aiService.generateGoalKnowledge(
        request.goalTitle,
        request.goalDescription || '',
        (chunk) => {
          this._generatedContent += chunk;
          this._progress = Math.min(20 + (this._generatedContent.length / 50), 80);
          onChunk?.(chunk);
        }
      );

      // 4. 构建 frontmatter（包含目标关联）
      const now = new Date().toISOString();
      const fileName = `${folderName}-学习指南.md`;
      const fullContent = this.buildFrontmatter({
        title: `${request.goalTitle} - 学习指南`,
        created: now,
        updated: now,
        tags: ['目标关联', request.goalCategory || '学习', 'AI生成'],
        goalUuid: request.goalUuid,
      }) + content;

      this._progress = 85;

      // 5. 创建资源
      const resourceDTO = await resourceStore.createResource({
        name: fileName,
        repositoryUuid,
        folderUuid: folder.uuid,
        type: 'text/markdown',
        path: `/${folderName}/${fileName}`,
        content: fullContent,
      });

      this._progress = 95;

      // 6. 刷新文件树
      await fileTreeStore.loadTree(repositoryUuid);

      this._progress = 100;

      logger.info('Goal knowledge document generated successfully', {
        goalUuid: request.goalUuid,
        resourceUuid: resourceDTO.uuid,
        folderUuid: folder.uuid,
      });

      this.message.success(`已为目标「${request.goalTitle}」生成知识文档`);

      return {
        resourceUuid: resourceDTO.uuid,
        folderUuid: folder.uuid,
        fileName,
        filePath: `/${folderName}/${fileName}`,
      };
    } catch (error) {
      const errorMessage = this.handleError(error, '生成目标知识文档失败');
      throw new Error(errorMessage);
    } finally {
      this._isGenerating = false;
    }
  }

  // ===== 工具方法 =====

  /**
   * 清除状态
   */
  clearState(): void {
    this._generatedContent = '';
    this._lastError = null;
    this._progress = 0;
    logger.debug('Cleared generation state');
  }

  /**
   * 验证请求
   */
  private validateRequest(request: GenerateKnowledgeRequest): void {
    if (!request.topic || request.topic.trim().length < 2) {
      throw new Error('请输入主题（至少 2 个字符）');
    }

    if (request.topic.length > 200) {
      throw new Error('主题不能超过 200 个字符');
    }

    if (!request.repositoryUuid) {
      throw new Error('请选择仓储');
    }
  }

  /**
   * 清理文件/文件夹名称
   */
  private sanitizeName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50);
  }

  /**
   * 构建 frontmatter
   */
  private buildFrontmatter(meta: Record<string, unknown>): string {
    const lines = ['---'];
    for (const [key, value] of Object.entries(meta)) {
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        value.forEach(v => lines.push(`  - ${v}`));
      } else if (value !== undefined && value !== null) {
        lines.push(`${key}: ${value}`);
      }
    }
    lines.push('---', '', '');
    return lines.join('\n');
  }

  /**
   * 统一错误处理
   */
  private handleError(error: unknown, defaultMessage: string): string {
    let errorMessage: string;

    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        errorMessage = 'AI 配额已用尽，请升级或等待配额重置';
      } else if (error.message.includes('network') || error.message.includes('Network')) {
        errorMessage = '网络连接失败，请检查网络后重试';
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'AI 生成超时，请稍后重试';
      } else {
        errorMessage = error.message || defaultMessage;
      }
      this._lastError = error;
    } else {
      errorMessage = defaultMessage;
      this._lastError = new Error(defaultMessage);
    }

    logger.error('Knowledge generation failed', {
      error: errorMessage,
      originalError: error,
    });

    this.message.error(errorMessage);
    return errorMessage;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    logger.info('KnowledgeGenerationApplicationService initialized');
  }
}

/**
 * 导出单例实例获取函数
 */
export const knowledgeGenerationApplicationService = KnowledgeGenerationApplicationService.getInstance();
