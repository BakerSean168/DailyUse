/**
 * GitInfoClient 值对象
 * Git 信息 - 客户端值对象
 * 实现 IGitInfoClient 接口
 */

import type { RepositoryContracts } from '@dailyuse/contracts';
import { ValueObject } from '@dailyuse/utils';

type IGitInfoClient = RepositoryContracts.IGitInfoClient;
type GitInfoServerDTO = RepositoryContracts.GitInfoServerDTO;
type GitInfoClientDTO = RepositoryContracts.GitInfoClientDTO;

/**
 * GitInfoClient 值对象
 */
export class GitInfo extends ValueObject implements IGitInfoClient {
  public readonly isGitRepo: boolean;
  public readonly currentBranch?: string | null;
  public readonly hasChanges?: boolean | null;

  constructor(params: {
    isGitRepo: boolean;
    currentBranch?: string | null;
    hasChanges?: boolean | null;
  }) {
    super();
    this.isGitRepo = params.isGitRepo;
    this.currentBranch = params.currentBranch ?? null;
    this.hasChanges = params.hasChanges ?? null;
    Object.freeze(this);
  }

  // UI 辅助属性
  public get branchIcon(): string {
    return this.isGitRepo ? '🌿' : '📁';
  }

  public get statusText(): string {
    if (!this.isGitRepo) return '非 Git 仓库';
    if (this.hasChanges) return '有变更';
    return '干净';
  }

  public get statusColor(): string {
    if (!this.isGitRepo) return 'gray';
    if (this.hasChanges) return 'orange';
    return 'green';
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
      this.hasChanges === other.hasChanges
    );
  }

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): GitInfoServerDTO {
    return {
      isGitRepo: this.isGitRepo,
      currentBranch: this.currentBranch,
      hasChanges: this.hasChanges,
      remoteUrl: null, // 客户端不需要
    };
  }

  /**
   * 从 Server DTO 创建值对象
   */
  public static fromServerDTO(dto: GitInfoServerDTO): GitInfo {
    return new GitInfo({
      isGitRepo: dto.isGitRepo,
      currentBranch: dto.currentBranch,
      hasChanges: dto.hasChanges,
    });
  }

  /**
   * 从 Client DTO 创建值对象
   */
  public static fromClientDTO(dto: GitInfoClientDTO): GitInfo {
    return new GitInfo({
      isGitRepo: dto.isGitRepo,
      currentBranch: dto.currentBranch,
      hasChanges: dto.hasChanges,
    });
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): GitInfoClientDTO {
    return {
      isGitRepo: this.isGitRepo,
      currentBranch: this.currentBranch,
      hasChanges: this.hasChanges,
      branchIcon: this.branchIcon,
      statusText: this.statusText,
      statusColor: this.statusColor,
    };
  }
}
