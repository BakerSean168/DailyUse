# Story 10-1 实施进度

## ✅ 已完成

### 1. Contracts 层 (100%)
- [x] 枚举定义（RepositoryType, RepositoryStatus）
- [x] 值对象接口（RepositoryConfig, RepositoryStats, FolderMetadata - Server & Client - 已拆分为独立文件）
- [x] RepositoryServer 接口 + ServerDTO + PersistenceDTO
- [x] RepositoryClient 接口 + ClientDTO（含UI计算字段）
- [x] FolderServer 接口 + ServerDTO + PersistenceDTO
- [x] FolderClient 接口 + ClientDTO（含UI计算字段）
- [x] 命名空间导出（RepositoryContracts）

### 2. Domain-Server 层 (100%)
- [x] 值对象实现（RepositoryConfig, RepositoryStats, FolderMetadata - Server classes）
- [x] Repository 聚合根实现
  - [x] 私有构造函数 + 静态工厂方法
  - [x] 使用值对象类（RepositoryConfig, RepositoryStats）
  - [x] toServerDTO() / toPersistenceDTO()
  - [x] fromServerDTO() / fromPersistenceDTO()
  - [x] 业务方法（updateConfig, updateStats, archive, activate, delete）
- [x] Folder 实体实现
  - [x] 私有构造函数 + 静态工厂方法
  - [x] 使用值对象类（FolderMetadata）
  - [x] toServerDTO() / toPersistenceDTO()
  - [x] fromServerDTO() / fromPersistenceDTO()
  - [x] 业务方法（rename, moveTo, updatePath, updateMetadata, setExpanded）
- [x] FolderHierarchyService 领域服务
  - [x] detectCycle() - 循环引用检测
  - [x] updateChildrenPaths() - 级联更新路径
  - [x] buildTree() - 构建树形结构
- [x] IRepositoryRepository 接口
- [x] IFolderRepository 接口

### 3. Domain-Client 层 (100%)
- [x] 值对象实现（RepositoryConfig, RepositoryStats, FolderMetadata - Client classes with UI properties）
- [x] Repository 聚合根实现（Client）
  - [x] 私有构造函数 + 静态工厂方法（fromServerDTO, fromClientDTO）
  - [x] 使用值对象类（RepositoryConfig, RepositoryStats）
  - [x] UI 计算属性（isDeleted, isArchived, isActive, statusText, typeText, formattedSize, createdAtText, updatedAtText）
  - [x] toClientDTO() / toServerDTO()
  - [x] 业务方法（updateConfig, updateStats, archive, activate）
- [x] Folder 实体实现（Client）
  - [x] 私有构造函数 + 静态工厂方法（fromServerDTO, fromClientDTO）
  - [x] 使用值对象类（FolderMetadata）
  - [x] UI 计算属性（depth, isRoot, hasChildren, pathParts, displayName, createdAtText, updatedAtText）
  - [x] toClientDTO() / toServerDTO()
  - [x] 业务方法（rename, moveTo, updateMetadata, setExpanded）

## ⏸️ 待实现

### 4. API 层 - Infrastructure (0%)
- [ ] Prisma Schema 更新（repositories 表扩展, folders 表）
- [ ] PrismaRepositoryRepository 实现
- [ ] PrismaFolderRepository 实现

### 5. API 层 - Application (0%)
- [ ] RepositoryApplicationService
- [ ] FolderApplicationService

### 6. API 层 - Presentation (0%)
- [ ] RepositoryController
- [ ] FolderController
- [ ] DTO 验证（class-validator）

### 7. Web 层 (0%)
- [ ] Pinia Store
- [ ] API Clients
- [ ] Vue 组件（RepositoryView, FileExplorer）

### 8. 测试 (0%)
- [ ] 单元测试（Domain 层）
- [ ] 集成测试（API 端点）
- [ ] E2E 测试

## 架构决策记录

### ADR-1: 采用方案 A（严格 Client/Server 分离）
- **决定**: 使用 Goal 模块的架构模式
- **原因**: 
  1. 前端需要额外的 UI 计算字段（statusText, isDeleted, formattedSize 等）
  2. 客户端和服务端的同一实体属性可能不同
  3. PersistenceDTO 扁平化，直接映射数据库
- **影响**: 
  - Contracts 包含 Server 和 Client 两套接口
  - Domain-Server 和 Domain-Client 分别实现
  - PersistenceDTO 中 JSONB 字段为 string 类型

### ADR-2: 使用 Prisma 而非 TypeORM
- **决定**: 不创建 TypeORM Entity，直接使用 Prisma + PersistenceDTO
- **原因**: 
  1. 项目已使用 Prisma
  2. PersistenceDTO 直接映射数据库，避免双重映射
  3. Prisma 自动处理 camelCase ↔ snake_case
- **影响**: 
  - 删除之前创建的 TypeORM Entity 文件
  - Repository 实现直接使用 toPersistenceDTO()

### ADR-3: 时间使用 epoch milliseconds
- **决定**: 所有时间字段使用 number (epoch ms) 而非 Date 对象
- **原因**: 
  1. 前后端传输统一
  2. 易于序列化/反序列化
  3. 与 Goal 模块保持一致
- **影响**: 
  - DTO 中时间字段类型为 number
  - 数据库存储为 timestamp，Repository 层转换

## 下一步行动

请选择下一步要实现的模块：

1. **继续 Domain-Client 层** - 实现前端领域模型
2. **跳到 API Infrastructure 层** - 实现 Prisma Repository
3. **跳到 API Application 层** - 实现 Application Service
4. **跳到 Web 层** - 实现前端组件和 Store

推荐顺序：Domain-Client → API Infrastructure → API Application → API Presentation → Web
