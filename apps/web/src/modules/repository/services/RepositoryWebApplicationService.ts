// @ts-nocheck
/**
 * Repository Web Application Service
 * 仓储Web应用服务 - HTTP客户端实现
 */

import { RepositoryContracts } from '@dailyuse/contracts';

// 使用类型别名来简化类型引用
type IRepository = RepositoryContracts.IRepository;
type CreateRepositoryRequest = RepositoryContracts.CreateRepositoryRequestDTO;
type UpdateRepositoryRequest = RepositoryContracts.UpdateRepositoryRequestDTO;
type RepositoryQueryParams = RepositoryContracts.RepositoryQueryParamsDTO;
type RepositoryListResponse = RepositoryContracts.RepositoryListResponseDTO;
type RepositoryStats = RepositoryContracts.IRepositoryStats;
type IGitInitCommand = RepositoryContracts.IGitInitCommand;
type IGitAddCommand = RepositoryContracts.IGitAddCommand;
type IGitCommitCommand = RepositoryContracts.IGitCommitCommand;
type IGitStatus = RepositoryContracts.IGitStatus;
type IGitLogResponse = RepositoryContracts.IGitLogResponse;
type IGitCommit = RepositoryContracts.IGitCommit;

export class RepositoryWebApplicationService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * 获取API URL
   */
  private getApiUrl(path: string): string {
    return `${this.baseUrl}/repositories${path}`;
  }

  /**
   * 处理API响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'UNKNOWN_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new RepositoryContracts.RepositoryError(
        error.message || 'API request failed',
        error.error || 'API_ERROR',
        error.details,
      );
    }
    return response.json();
  }

  // ============ 仓储管理方法 ============

  /**
   * 创建仓储
   */
  async createRepository(command: CreateRepositoryRequest): Promise<IRepository> {
    try {
      const response = await fetch(this.getApiUrl(''), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      const result = await this.handleResponse<{ repository: IRepository }>(response);
      return result.repository;
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to create repository: ${(error as Error).message}`,
        'CREATE_REPOSITORY_FAILED',
        { command, error },
      );
    }
  }

  /**
   * 获取所有仓储
   */
  async getAllRepositories(): Promise<IRepository[]> {
    try {
      const response = await fetch(this.getApiUrl(''), {
        method: 'GET',
      });

      const result = await this.handleResponse<{ repositories: IRepository[] }>(response);
      return result.repositories;
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to get all repositories: ${(error as Error).message}`,
        'GET_ALL_REPOSITORIES_FAILED',
        { error },
      );
    }
  }

  /**
   * 根据ID获取仓储
   */
  async getRepository(uuid: string): Promise<IRepository | null> {
    try {
      const response = await fetch(this.getApiUrl(`/${uuid}`), {
        method: 'GET',
      });

      if (response.status === 404) {
        return null;
      }

      const result = await this.handleResponse<{ repository: IRepository }>(response);
      return result.repository;
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to get repository: ${(error as Error).message}`,
        'GET_REPOSITORY_FAILED',
        { uuid, error },
      );
    }
  }

  /**
   * 更新仓储
   */
  async updateRepository(command: UpdateRepositoryRequest): Promise<IRepository> {
    try {
      const response = await fetch(this.getApiUrl(`/${command.uuid}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      const result = await this.handleResponse<{ repository: IRepository }>(response);
      return result.repository;
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to update repository: ${(error as Error).message}`,
        'UPDATE_REPOSITORY_FAILED',
        { command, error },
      );
    }
  }

  /**
   * 删除仓储
   */
  async deleteRepository(uuid: string): Promise<void> {
    try {
      const url = this.getApiUrl(`/${uuid}`);
      const searchParams = new URLSearchParams();

      const response = await fetch(`${url}?${searchParams}`, {
        method: 'DELETE',
      });

      await this.handleResponse<void>(response);
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to delete repository: ${(error as Error).message}`,
        'DELETE_REPOSITORY_FAILED',
        { uuid, error },
      );
    }
  }

  /**
   * 查询仓储
   */
  async queryRepositories(query: RepositoryQueryParams): Promise<RepositoryListResponse> {
    try {
      const searchParams = new URLSearchParams();

      if (query.keyword) {
        searchParams.set('searchText', query.keyword);
      }
      if (query.status) {
        const statusValue = Array.isArray(query.status) ? query.status.join(',') : query.status;
        searchParams.set('status', statusValue);
      }
      if (query.type) {
        const typeValue = Array.isArray(query.type) ? query.type.join(',') : query.type;
        searchParams.set('type', typeValue);
      }
      if (query.enableGit !== undefined) {
        searchParams.set('enableGit', query.enableGit.toString());
      }
      if (query.sortBy) {
        searchParams.set('sortBy', query.sortBy);
      }
      if (query.sortOrder) {
        searchParams.set('sortDirection', query.sortOrder);
      }
      if (query.pagination?.page !== undefined) {
        searchParams.set('page', query.pagination.page.toString());
      }
      if (query.pagination?.limit !== undefined) {
        searchParams.set('limit', query.pagination.limit.toString());
      }

      const response = await fetch(this.getApiUrl(`/query?${searchParams}`), {
        method: 'GET',
      });

      return await this.handleResponse<RepositoryListResponse>(response);
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to query repositories: ${(error as Error).message}`,
        'QUERY_REPOSITORIES_FAILED',
        { query, error },
      );
    }
  }

  /**
   * 根据名称获取仓储
   */
  async getRepositoryByName(name: string): Promise<IRepository | null> {
    try {
      const response = await fetch(this.getApiUrl(`/by-name/${encodeURIComponent(name)}`), {
        method: 'GET',
      });

      if (response.status === 404) {
        return null;
      }

      const result = await this.handleResponse<{ repository: IRepository }>(response);
      return result.repository;
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to get repository by name: ${(error as Error).message}`,
        'GET_REPOSITORY_BY_NAME_FAILED',
        { name, error },
      );
    }
  }

  /**
   * 根据路径获取仓储
   */
  async getRepositoryByPath(path: string): Promise<IRepository | null> {
    try {
      const response = await fetch(this.getApiUrl('/by-path'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      if (response.status === 404) {
        return null;
      }

      const result = await this.handleResponse<{ repository: IRepository }>(response);
      return result.repository;
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to get repository by path: ${(error as Error).message}`,
        'GET_REPOSITORY_BY_PATH_FAILED',
        { path, error },
      );
    }
  }

  /**
   * 根据目标获取相关仓储
   */
  async getRepositoriesByGoal(goalId: string): Promise<IRepository[]> {
    try {
      const response = await fetch(this.getApiUrl(`/by-goal/${goalId}`), {
        method: 'GET',
      });

      const result = await this.handleResponse<{ repositories: IRepository[] }>(response);
      return result.repositories;
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to get repositories by goal: ${(error as Error).message}`,
        'GET_REPOSITORIES_BY_GOAL_FAILED',
        { goalId, error },
      );
    }
  }

  /**
   * 获取仓储统计
   */
  async getRepositoryStats(): Promise<RepositoryStats> {
    try {
      const response = await fetch(this.getApiUrl('/stats'), {
        method: 'GET',
      });

      return await this.handleResponse<RepositoryStats>(response);
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to get repository stats: ${(error as Error).message}`,
        'GET_REPOSITORY_STATS_FAILED',
        { error },
      );
    }
  }

  /**
   * 验证仓储路径
   */
  async validateRepositoryPath(path: string): Promise<boolean> {
    try {
      const response = await fetch(this.getApiUrl('/validate-path'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      const result = await this.handleResponse<{ isValid: boolean }>(response);
      return result.isValid;
    } catch (error) {
      console.warn('Failed to validate repository path:', error);
      return false;
    }
  }

  /**
   * 检查仓储是否存在
   */
  async repositoryExists(name: string): Promise<boolean> {
    try {
      const response = await fetch(this.getApiUrl(`/exists/${encodeURIComponent(name)}`), {
        method: 'GET',
      });

      const result = await this.handleResponse<{ exists: boolean }>(response);
      return result.exists;
    } catch (error) {
      if (error instanceof RepositoryContracts.RepositoryError) {
        throw error;
      }
      throw new RepositoryContracts.RepositoryError(
        `Failed to check repository existence: ${(error as Error).message}`,
        'CHECK_REPOSITORY_EXISTS_FAILED',
        { name, error },
      );
    }
  }

  // ============ Git 相关方法 ============

  /**
   * 初始化Git仓储
   */
  async initGitRepository(uuid: string): Promise<void> {
    try {
      const response = await fetch(this.getApiUrl(`/${uuid}/git/init`), {
        method: 'POST',
      });

      await this.handleResponse<void>(response);
    } catch (error) {
      if (error instanceof RepositoryContracts.GitOperationError) {
        throw error;
      }
      throw new RepositoryContracts.GitOperationError(
        `Failed to initialize Git repository: ${(error as Error).message}`,
        'INIT',
        uuid,
      );
    }
  }

  /**
   * 获取Git状态
   */
  async getGitStatus(uuid: string): Promise<IGitStatus | null> {
    try {
      const response = await fetch(this.getApiUrl(`/${uuid}/git/status`), {
        method: 'GET',
      });

      if (response.status === 404) {
        return null;
      }

      const result = await this.handleResponse<{ status: IGitStatus | null }>(response);
      return result.status;
    } catch (error) {
      if (error instanceof RepositoryContracts.GitOperationError) {
        throw error;
      }
      throw new RepositoryContracts.GitOperationError(
        `Failed to get Git status: ${(error as Error).message}`,
        'GET_STATUS',
        uuid,
      );
    }
  }

  /**
   * 添加文件到Git
   */
  async addFilesToGit(uuid: string, files?: string[]): Promise<void> {
    try {
      const response = await fetch(this.getApiUrl(`/${uuid}/git/add`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      });

      await this.handleResponse<void>(response);
    } catch (error) {
      if (error instanceof RepositoryContracts.GitOperationError) {
        throw error;
      }
      throw new RepositoryContracts.GitOperationError(
        `Failed to add files to Git: ${(error as Error).message}`,
        'ADD',
        uuid,
      );
    }
  }

  /**
   * Git提交
   */
  async commitToGit(uuid: string, message: string): Promise<IGitCommit> {
    try {
      const response = await fetch(this.getApiUrl(`/${uuid}/git/commit`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const result = await this.handleResponse<{ commit: IGitCommit }>(response);
      return result.commit;
    } catch (error) {
      if (error instanceof RepositoryContracts.GitOperationError) {
        throw error;
      }
      throw new RepositoryContracts.GitOperationError(
        `Failed to commit to Git: ${(error as Error).message}`,
        'COMMIT',
        uuid,
      );
    }
  }

  /**
   * 获取Git提交历史
   */
  async getGitLog(uuid: string, limit?: number): Promise<IGitLogResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (limit !== undefined) {
        searchParams.set('limit', limit.toString());
      }

      const response = await fetch(this.getApiUrl(`/${uuid}/git/log?${searchParams}`), {
        method: 'GET',
      });

      return await this.handleResponse<IGitLogResponse>(response);
    } catch (error) {
      if (error instanceof RepositoryContracts.GitOperationError) {
        throw error;
      }
      throw new RepositoryContracts.GitOperationError(
        `Failed to get Git log: ${(error as Error).message}`,
        'GET_LOG',
        uuid,
      );
    }
  }
}
