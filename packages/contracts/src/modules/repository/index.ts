/**
 * Repository Module Contracts
 * 导出所有契约定义
 */

// 枚举
export * from './enums';

// 值对象
export * from './value-objects';

// 实体
export * from './entities';

// 聚合根
export * from './aggregates';

// DTOs (Story 11.1 - 文件树)
export * from '../../repository/TreeNode';

// DTOs (Story 11.2 - 搜索)
export * from '../../repository/SearchContracts';

// DTOs (Story 11.4 - 书签)
export * from '../../repository/BookmarkContracts';

// DTOs (Story 11.5 - 标签)
export * from '../../repository/TagsContracts';

// 命名空间导出（参考 Goal 模块）
import * as RepositoryEnums from './enums';
import * as RepositoryValueObjects from './value-objects';
import * as RepositoryEntities from './entities';
import * as RepositoryAggregates from './aggregates';

export const RepositoryContracts = {
  ...RepositoryEnums,
  ...RepositoryValueObjects,
  ...RepositoryEntities,
  ...RepositoryAggregates,
};
