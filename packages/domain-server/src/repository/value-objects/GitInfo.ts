/**
 * GitInfo 值对象
 * Git 信息 - 不可变值对象
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IGitInfo = RepositoryContracts.GitInfoServerDTO;
type GitInfoClientDTO = RepositoryContracts.GitInfoClientDTO;
type GitInfoPersistenceDTO = RepositoryContracts.GitInfoPersistenceDTO;

/**
 * GitInfo 值对象
 *
 * DDD 值对象特点：
 * - 不可变（Immutable）
 * - 基于值的相等性
 * - 无标识符
 * - 可以自由复制和替换
 */
export class GitInfo extends ValueObject implements IGitInfo {
  public readonly isGitRepo: boolean;
  public readonly currentBranch: string | null;
  public readonly hasChanges: boolean | null;
  public readonly remoteUrl: string | null;

  constructor(params: {
    isGitRepo: boolean;
    currentBranch?: string | null;
    hasChanges?: boolean | null;
    remoteUrl?: string | null;
  }) {
    super(); // 调用基类构造函数

    this.isGitRepo = params.isGitRepo;
    this.currentBranch = params.currentBranch ?? null;
    this.hasChanges = params.hasChanges ?? null;
    this.remoteUrl = params.remoteUrl ?? null;

    // 确保不可变
    Object.freeze(this);
  }

  /**
   * 值相等性比较
   */
  public equals(other: ValueObject): boolean {
    if (!(other instanceof GitInfo)) {
      return false;
    }

    return (
      this.isGitRepo === other.isGitRepo &&
      this.currentBranch === other.currentBranch &&
      this.hasChanges === other.hasChanges &&
      this.remoteUrl === other.remoteUrl
    );
  }

  /**
   * 创建修改后的新实例（值对象不可变，修改时创建新实例）
   */
  public with(
    changes: Partial<{
      isGitRepo: boolean;
      currentBranch: string | null;
      hasChanges: boolean | null;
      remoteUrl: string | null;
    }>,
  ): GitInfo {
    return new GitInfo({
      isGitRepo: changes.isGitRepo ?? this.isGitRepo,
      currentBranch: changes.currentBranch ?? this.currentBranch,
      hasChanges: changes.hasChanges ?? this.hasChanges,
      remoteUrl: changes.remoteUrl ?? this.remoteUrl,
    });
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): IGitInfo {
    return {
      isGitRepo: this.isGitRepo,
      currentBranch: this.currentBranch,
      hasChanges: this.hasChanges,
      remoteUrl: this.remoteUrl,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): GitInfoClientDTO {
    let statusText = 'Not a Git repository';
    let statusColor = 'gray';
    let branchIcon = '📁';

    if (this.isGitRepo) {
      branchIcon = '🌿';
      if (this.hasChanges === true) {
        statusText = 'Has uncommitted changes';
        statusColor = 'orange';
      } else if (this.hasChanges === false) {
        statusText = 'Clean working directory';
        statusColor = 'green';
      } else {
        statusText = 'Unknown status';
        statusColor = 'yellow';
      }
    }

    return {
      isGitRepo: this.isGitRepo,
      currentBranch: this.currentBranch,
      hasChanges: this.hasChanges,
      branchIcon,
      statusText,
      statusColor,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): GitInfoPersistenceDTO {
    return {
      is_git_repo: this.isGitRepo,
      current_branch: this.currentBranch,
      has_changes: this.hasChanges,
      remote_url: this.remoteUrl,
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(data: IGitInfo): GitInfo {
    return new GitInfo(data);
  }

  /**
   * 转换为 Contract 接口 (兼容旧代码)
   */
  public toContract(): IGitInfo {
    return this.toServerDTO();
  }

  /**
   * 从 Contract 接口创建值对象 (兼容旧代码)
   */
  public static fromContract(data: IGitInfo): GitInfo {
    return GitInfo.fromServerDTO(data);
  }

  /**
   * 创建非 Git 仓库状态
   */
  public static createNonGit(): GitInfo {
    return new GitInfo({
      isGitRepo: false,
      currentBranch: null,
      hasChanges: null,
      remoteUrl: null,
    });
  }

  /**
   * 创建已初始化的 Git 仓库状态
   */
  public static createInitializedGit(params: {
    currentBranch?: string;
    remoteUrl?: string;
  }): GitInfo {
    return new GitInfo({
      isGitRepo: true,
      currentBranch: params.currentBranch ?? 'main',
      hasChanges: false,
      remoteUrl: params.remoteUrl ?? null,
    });
  }

  /**
   * 业务查询方法：是否有未提交的变更
   */
  public hasUncommittedChanges(): boolean {
    return this.isGitRepo && this.hasChanges === true;
  }

  /**
   * 业务查询方法：是否配置了远程仓库
   */
  public hasRemote(): boolean {
    return this.isGitRepo && this.remoteUrl !== null && this.remoteUrl.length > 0;
  }

  /**
   * 业务查询方法：是否可以推送
   */
  public canPush(): boolean {
    return this.isGitRepo && this.hasRemote() && !this.hasUncommittedChanges();
  }

  /**
   * 业务查询方法：获取仓库状态描述
   */
  public getStatusDescription(): string {
    if (!this.isGitRepo) {
      return 'Not a Git repository';
    }

    if (this.hasChanges === true) {
      return 'Has uncommitted changes';
    }

    if (this.hasChanges === false) {
      return 'Clean working directory';
    }

    return 'Unknown status';
  }
}
