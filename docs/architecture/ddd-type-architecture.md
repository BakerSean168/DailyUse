# DDD 类型架构规范

> **更新日期**: 2025-12-03  
> **适用范围**: 全项目（Web、Desktop、API）

---

## 📋 概述

本文档定义了 DailyUse 项目中 **DDD 类型系统** 的标准规范，包括：
- DTO 类型层次结构
- 实体类与接口的关系
- Store 中的类型使用规范
- 持久化与序列化策略

---

## 🏗️ 类型层次结构

### 三层 DTO 体系

```
┌─────────────────────────────────────────────────────────────┐
│                    @dailyuse/contracts                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  ServerDTO      │  │  ClientDTO      │  │  Interface   │ │
│  │  (数据库字段)    │  │  (+ 计算属性)   │  │  (实体契约)   │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘ │
└───────────┼─────────────────────┼──────────────────┼─────────┘
            │                     │                  │
            ▼                     ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              @dailyuse/domain-client / domain-server         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Entity Class                          │ │
│  │  - implements Interface                                  │ │
│  │  - fromServerDTO() / fromClientDTO()                     │ │
│  │  - toServerDTO() / toClientDTO()                         │ │
│  │  - 业务方法                                               │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 类型定义示例

```typescript
// @dailyuse/contracts/goal/entities/KeyResultClient.ts

// 1. ServerDTO - 与数据库/API 完全对应的纯数据
export interface KeyResultServerDTO {
  uuid: string;
  goalUuid: string;
  title: string;
  currentValue: number;
  targetValue: number;
  createdAt: number;
  updatedAt: number;
}

// 2. ClientDTO - 包含 UI 所需的计算属性
export interface KeyResultClientDTO extends KeyResultServerDTO {
  // 计算属性
  progressPercentage: number;
  isCompleted: boolean;
  remainingValue: number;
  statusText: string;
}

// 3. Interface - 实体的公共 API 契约（包含方法签名）
export interface KeyResultClient extends KeyResultClientDTO {
  // 业务方法
  updateProgress(value: number): void;
  complete(): void;
  
  // DTO 转换
  toClientDTO(): KeyResultClientDTO;
  toServerDTO(): KeyResultServerDTO;
}

// 4. Static Interface - 工厂方法契约
export interface KeyResultClientStatic {
  fromServerDTO(dto: KeyResultServerDTO): KeyResultClient;
  fromClientDTO(dto: KeyResultClientDTO): KeyResultClient;
  forCreate(goalUuid: string): KeyResultClient;
}
```

---

## 🎯 Store 类型使用规范

### 核心原则

> **Store 类型声明使用 Interface，运行时存储 Entity 实例**

### 为什么？

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| TypeScript 展开类的私有字段 | Pinia state 类型推断会展开类结构 | 使用 Interface 类型声明 |
| 类型不匹配错误 | `_uuid`, `_name` 等私有字段出现在类型中 | Interface 只定义公共成员 |
| 运行时方法丢失 | 仅在 **持久化反序列化** 时发生 | 自定义 serializer 重建实例 |

### 正确示例

```typescript
// ✅ 正确做法
import { defineStore } from 'pinia';
import type { FolderClient } from '@dailyuse/contracts/repository';
import { Folder } from '@dailyuse/domain-client/repository';

// 类型声明使用 Interface（避免 TS 展开类的私有字段）
// 运行时实际存储的是 Folder 实体实例
type FolderData = FolderClient;

export const useFolderStore = defineStore('folder', {
  state: () => ({
    folders: [] as FolderData[],
    foldersByRepository: {} as Record<string, FolderData[]>,
  }),

  getters: {
    getFolderByUuid: (state) => (uuid: string): FolderData | null => {
      return state.folders.find((f) => f.uuid === uuid) || null;
    },
  },

  actions: {
    setFoldersForRepository(repositoryUuid: string, folders: FolderData[]) {
      // 实际传入的是 Folder 实例，类型声明为 FolderClient 接口
      this.foldersByRepository[repositoryUuid] = folders;
    },
  },

  persist: {
    serializer: {
      serialize: (value) => {
        // 序列化时调用实体的 toServerDTO() 方法
        return JSON.stringify({
          ...value,
          folders: value.folders?.map((f: any) => 
            f.toServerDTO ? f.toServerDTO() : f
          ),
        });
      },
      deserialize: (value) => {
        const parsed = JSON.parse(value);
        // 反序列化时重建实体实例
        return {
          ...parsed,
          folders: parsed.folders?.map((dto: any) => 
            Folder.fromServerDTO(dto)
          ),
        };
      },
    },
  },
});
```

### 错误示例

```typescript
// ❌ 错误做法 1: 直接使用类作为类型
state: () => ({
  folders: [] as Folder[],  // TS 会展开私有字段，导致类型错误
})

// ❌ 错误做法 2: 使用 DTO 类型但期望有方法
type FolderData = FolderClientDTO;  // DTO 没有方法定义
// 运行时调用 folder.rename() 会失败（如果只是 DTO）
```

---

## 🔄 数据流转规范

### API → Store → Component 流程

```
┌──────────────┐     ┌───────────────────┐     ┌─────────────┐
│   API 响应    │ ──▶ │  Application      │ ──▶ │   Store     │
│  ServerDTO   │     │    Service        │     │  (Entity)   │
└──────────────┘     │                   │     └──────┬──────┘
                     │ DTO → Entity 转换  │            │
                     │ Folder.fromDTO()  │            ▼
                     └───────────────────┘     ┌─────────────┐
                                               │  Component  │
                                               │  (Entity)   │
                                               └─────────────┘
```

### 代码示例

```typescript
// FileExplorer.vue
import { Folder } from '@dailyuse/domain-client/repository';

async function loadFolderTree() {
  // 1. API 返回 ServerDTO
  const dtos = await repositoryApiClient.getFolderTree(repoUuid);
  
  // 2. 转换为 Entity 实例（在组件或 Application Service 中）
  const folders = dtos.map((dto) => Folder.fromServerDTO(dto));
  
  // 3. 存入 Store（存储的是 Entity 实例）
  folderStore.setFoldersForRepository(repoUuid, folders);
}

// 4. 组件使用时，从 Store 获取的是 Entity 实例
const selectedFolder = computed(() => folderStore.getSelectedFolder);
// selectedFolder 有完整的方法：rename(), moveTo(), etc.
```

---

## 📦 包职责划分

### @dailyuse/contracts

**职责**：类型契约定义

```
contracts/src/modules/{module}/
├── entities/
│   ├── {Entity}Server.ts      # ServerDTO + Server 接口
│   └── {Entity}Client.ts      # ClientDTO + Client 接口
├── aggregates/
│   ├── {Aggregate}Server.ts   # 聚合根 Server 类型
│   └── {Aggregate}Client.ts   # 聚合根 Client 类型
├── value-objects/
│   └── {ValueObject}.ts       # 值对象 DTO + 接口
├── enums.ts                   # 枚举定义
├── api-requests.ts            # API 请求/响应类型
└── index.ts                   # 模块导出
```

### @dailyuse/domain-client

**职责**：客户端领域实现

```
domain-client/src/{module}/
├── entities/
│   └── {Entity}.ts            # 实体类 implements {Entity}Client
├── aggregates/
│   └── {Aggregate}.ts         # 聚合根类 implements {Aggregate}Client
├── value-objects/
│   └── {ValueObject}.ts       # 值对象类
└── index.ts                   # 模块导出
```

### @dailyuse/domain-server

**职责**：服务端领域实现

```
domain-server/src/{module}/
├── entities/
│   └── {Entity}.ts            # 实体类 implements {Entity}Server
├── aggregates/
│   └── {Aggregate}.ts         # 聚合根类 implements {Aggregate}Server
├── value-objects/
│   └── {ValueObject}.ts       # 值对象类
└── index.ts                   # 模块导出
```

---

## 🏷️ 命名规范

### 类型命名

| 类型 | 命名模式 | 示例 |
|------|----------|------|
| Server DTO | `{Name}ServerDTO` | `GoalServerDTO` |
| Client DTO | `{Name}ClientDTO` | `GoalClientDTO` |
| Persistence DTO | `{Name}PersistenceDTO` | `GoalPersistenceDTO` |
| Server Interface | `{Name}Server` | `GoalServer` |
| Client Interface | `{Name}Client` | `GoalClient` |
| Static Interface | `{Name}ClientStatic` | `GoalClientStatic` |

### 实体类命名

| 包 | 类命名 | 示例 |
|-----|--------|------|
| domain-client | `{Name}` | `Goal`, `KeyResult`, `Folder` |
| domain-server | `{Name}` | `Goal`, `KeyResult`, `Folder` |

> **注意**：实体类不带 `Client`/`Server` 后缀，包路径已表明上下文。

---

## 🔧 实体类模板

```typescript
// domain-client/src/goal/entities/KeyResult.ts
import type {
  KeyResultClient,
  KeyResultClientDTO,
  KeyResultServerDTO,
} from '@dailyuse/contracts/goal';
import { Entity } from '@dailyuse/utils';

export class KeyResult extends Entity implements KeyResultClient {
  // ===== 私有字段 =====
  private _goalUuid: string;
  private _title: string;
  private _currentValue: number;
  private _targetValue: number;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 私有构造函数 =====
  private constructor(params: KeyResultParams) {
    super(params.uuid);
    this._goalUuid = params.goalUuid;
    this._title = params.title;
    this._currentValue = params.currentValue;
    this._targetValue = params.targetValue;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getters (实现 Interface) =====
  get goalUuid(): string { return this._goalUuid; }
  get title(): string { return this._title; }
  get currentValue(): number { return this._currentValue; }
  get targetValue(): number { return this._targetValue; }
  get createdAt(): number { return this._createdAt; }
  get updatedAt(): number { return this._updatedAt; }

  // ===== 计算属性 (ClientDTO 增强) =====
  get progressPercentage(): number {
    if (this._targetValue === 0) return 0;
    return Math.round((this._currentValue / this._targetValue) * 100);
  }

  get isCompleted(): boolean {
    return this._currentValue >= this._targetValue;
  }

  get remainingValue(): number {
    return Math.max(0, this._targetValue - this._currentValue);
  }

  get statusText(): string {
    if (this.isCompleted) return '已完成';
    return `${this.progressPercentage}%`;
  }

  // ===== 业务方法 =====
  updateProgress(value: number): void {
    if (value < 0) throw new Error('Progress cannot be negative');
    this._currentValue = value;
    this._updatedAt = Date.now();
  }

  complete(): void {
    this._currentValue = this._targetValue;
    this._updatedAt = Date.now();
  }

  // ===== DTO 转换 =====
  toClientDTO(): KeyResultClientDTO {
    return {
      uuid: this._uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      currentValue: this._currentValue,
      targetValue: this._targetValue,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      // 计算属性
      progressPercentage: this.progressPercentage,
      isCompleted: this.isCompleted,
      remainingValue: this.remainingValue,
      statusText: this.statusText,
    };
  }

  toServerDTO(): KeyResultServerDTO {
    return {
      uuid: this._uuid,
      goalUuid: this._goalUuid,
      title: this._title,
      currentValue: this._currentValue,
      targetValue: this._targetValue,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== 静态工厂方法 =====
  static fromServerDTO(dto: KeyResultServerDTO): KeyResult {
    return new KeyResult({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      currentValue: dto.currentValue,
      targetValue: dto.targetValue,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  static fromClientDTO(dto: KeyResultClientDTO): KeyResult {
    return new KeyResult({
      uuid: dto.uuid,
      goalUuid: dto.goalUuid,
      title: dto.title,
      currentValue: dto.currentValue,
      targetValue: dto.targetValue,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  static forCreate(goalUuid: string): KeyResult {
    const now = Date.now();
    return new KeyResult({
      uuid: Entity.generateUUID(),
      goalUuid,
      title: '',
      currentValue: 0,
      targetValue: 100,
      createdAt: now,
      updatedAt: now,
    });
  }
}
```

---

## 📚 相关文档

- [packages-contracts.md](../packages-contracts.md) - 契约包详细文档
- [packages-domain-client.md](../packages-domain-client.md) - 客户端领域包文档
- [packages-domain-server.md](../packages-domain-server.md) - 服务端领域包文档

---

**文档维护**: BMAD Agent  
**最后更新**: 2025-12-03
