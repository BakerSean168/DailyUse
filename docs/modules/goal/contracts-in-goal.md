---
tags: [introduction, contract, dailyuse]
description: 讲讲我在 dailyuse 中的 contract 包中的具体实现
created: 2025-10-02T23:46:33
updated: 2025-10-02T23:47:12
---

# contracts-in-dailyuse

## 前置知识

- contract first
- DDD

_以[[「Goal」模块]]为例_

```
src
├── modules // 模块的类型定义
├── shared  // 共享的类型定义
├── response // api响应的类型定义
└── index.ts
```

## modules 的类型定义

```
modules
└── goal
    ├── dtos.ts
    ├── enums.ts
    ├── events.ts
    ├── index.ts
    ├── persistence-dtos.ts
    └── types.ts

```

### types.ts

该文件是一个模块的开始：

1. 实体的接口定义（服务端的+客户端的，是不是可以加个 core？）
2. 实体属性类型定义
3. 常量定义

```ts
/**
 * 目标接口 实体的接口定义
 */
export interface IGoal {
  uuid: string;
  dirUuid?: string;

  name: string;

  metadata: {
    tags: string[];
    category: string;
  };
}

/**
 * 目标统计接口 实体属性类型定义
 */
export interface IGoalStats {
  totalGoals: number;
  activeGoals: number;
}

/**
 * 系统默认文件夹配置 常量定义
 */
export const SYSTEM_GOAL_DIRS = {
  ALL: {
    uuid: 'system_all',
    name: '全部目标',
    icon: 'mdi-folder-multiple',
    color: '#2196f3',
  },
  DELETED: {
    uuid: 'system_deleted',
    name: '已删除',
    icon: 'mdi-delete',
    color: '#f44336',
  },
  ARCHIVED: {
    uuid: 'system_archived',
    name: '已归档',
    icon: 'mdi-archive',
    color: '#9e9e9e',
  },
} as const;
```

#### enums.ts

枚举类型

```ts
/**
 * 目标状态枚举
 */
export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}
```

#### persistence-dto.ts

仓储层的类型定义，将实体对象存储到数据库中（toPersistence）使用

- 扁平化
- 类型转换

```ts
/**
 * 目标持久化 DTO
 */
export interface GoalPersistenceDTO {
  uuid: string;
  accountUuid: string;

  // 基本信息
  name: string;
  description?: string;
  color: string;
  dirUuid?: string;
  startTime: Date; // PostgreSQL TIMESTAMP WITH TIME ZONE
  endTime: Date; // PostgreSQL TIMESTAMP WITH TIME ZONE
  note?: string;

  // 分析信息 - 扁平化
  motive: string;
  feasibility: string;
  importanceLevel: ImportanceLevel;
  urgencyLevel: UrgencyLevel;

  // 生命周期
  createdAt: Date;
  updatedAt: Date;
  status: GoalStatus;

  // 元数据 - JSON 存储
  tags: string; // JSON string
  category: string;

  // 版本控制
  version: number;
}
```

#### dtos.ts

- 实体（服务端）的DTO形态（感觉也可以提取出去）
- 前后端请求响应的类型定义
  crud 接口中也一般是和实体DTO相关，直接扩展
- 实体（客户端）的DTO形态
  一般是服务端DTO加几个计算属性，所以直接扩展

```ts
/** 实体（服务端）的DTO形态（感觉也可以提取出去）
 * 目标 DTO - 服务端数据传输对象
 * 用于服务端内部传输（Repository <-> Application <-> Domain）
 */
export interface GoalDTO {
  uuid: string;
  name: string;
  description?: string;
  color: string;
  dirUuid?: string;
  startTime: number;
  endTime: number;
  note?: string;
  analysis: {
    motive: string;
    feasibility: string;
    importanceLevel: ImportanceLevel;
    urgencyLevel: UrgencyLevel;
  };
  lifecycle: {
    createdAt: number;
    updatedAt: number;
    status: GoalStatus;
  };
  metadata: {
    tags: string[];
    category: string;
  };
  version: number;

  // 关联的子实体
  keyResults?: KeyResultDTO[];
  records?: GoalRecordDTO[];
  reviews?: GoalReviewDTO[];
}

/** 前后端请求响应的类型定义
 * 创建目标请求 - POST /api/v1/goals
 * 前端生成 uuid，后端直接转为实体持久化
 */
export type CreateGoalRequest = Pick<
  GoalDTO,
  'uuid' | 'name' | 'color' | 'startTime' | 'endTime' | 'analysis' | 'metadata'
> & {
  description?: string;
  dirUuid?: string;
  note?: string;
  // 创建时可以一起创建子实体
  keyResults?: CreateKeyResultRequest[];
  records?: CreateGoalRecordRequest[];
  reviews?: CreateGoalReviewRequest[];
};

/** 实体（客户端）的DTO形态
 * 目标目录客户端 DTO - 前端渲染对象
 */
export interface GoalFolderClientDTO extends GoalFolderDTO {
  // 计算属性
  goalsCount: number; // 目录下的目标数量
  subDirs?: GoalFolderClientDTO[]; // 子目录列表
}
```

## 实战经验

## 经验总结

## 信息参考
