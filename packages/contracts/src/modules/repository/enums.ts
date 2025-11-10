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

/**
 * 资源类型
 */
export enum ResourceType {
  MARKDOWN = 'MARKDOWN',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  PDF = 'PDF',
  LINK = 'LINK',
  CODE = 'CODE',
  OTHER = 'OTHER',
}

/**
 * 资源状态
 */
export enum ResourceStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  DRAFT = 'DRAFT',
}
