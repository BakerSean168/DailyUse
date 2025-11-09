/**
 * Repository 模块枚举定义
 */

/**
 * 仓储类型
 */
export enum RepositoryType {
  MARKDOWN = 'MARKDOWN',
  CODE = 'CODE',
  MIXED = 'MIXED',
}

/**
 * 仓储状态
 */
export enum RepositoryStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}
