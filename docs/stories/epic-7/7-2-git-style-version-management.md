# Story 7-2: Git-style Version Management
## Git 风格版本管理

**Epic**: 7 - Repository Module (知识仓库)  
**Story ID**: 7-2  
**Story Points**: 8  
**Priority**: P0  
**Status**: 📋 Ready for Development  
**Created**: 2025-10-31  
**Assigned**: Backend + Frontend Team

---

## 📋 Story 概述

### User Story

```
As a 知识仓库用户
I want 文档支持 Git 风格的版本管理
So that 我可以查看历史、对比差异、恢复到任意版本
```

### 业务价值

- ✅ **安全性**: 永远不会丢失重要内容，所有修改可追溯
- ✅ **可追溯**: 完整的变更历史，知道谁在何时改了什么
- ✅ **可恢复**: 一键恢复到任意历史版本
- ✅ **可对比**: 清晰查看版本之间的差异

### 功能范围

#### In-Scope (包含)
- ✅ 自动版本快照 (每次保存创建版本)
- ✅ 版本历史时间线展示
- ✅ 查看历史版本快照
- ✅ 版本 Diff 对比 (行级对比)
- ✅ 版本回滚恢复

#### Out-of-Scope (不包含)
- ❌ 版本标签/里程碑 (Future)
- ❌ 版本分支 (Future)
- ❌ 字符级/词级 Diff (MVP 仅支持行级)
- ❌ 版本合并 (Future)
- ❌ 冲突解决 (Future)

---

## 🎯 验收标准 (Gherkin)

### Scenario 1: 自动创建版本快照

```gherkin
Feature: 自动版本快照
  文档每次保存时自动创建版本快照，无需用户手动操作

  Scenario: 首次创建文档自动创建 v1
    Given 用户创建新文档 "产品需求文档"
    And 填写标题 "PRD v1.0" 和内容 "# 需求概述"
    When 用户点击保存按钮
    Then 系统应创建文档实体
    And 系统应自动创建版本 v1
    And 版本内容应为 "# 需求概述"
    And 版本类型应为 "initial"

  Scenario: 编辑文档自动创建新版本
    Given 文档 "产品需求文档" 当前版本为 v1
    And 版本 v1 内容为 "# 需求概述"
    When 用户修改内容为 "# 需求概述\n\n## 用户故事"
    And 用户点击保存按钮
    Then 系统应创建版本 v2
    And 版本 v2 内容应为 "# 需求概述\n\n## 用户故事"
    And 版本类型应根据修改量自动判断 (major/minor/patch)
    And 文档的 currentVersion 应更新为 2

  Scenario: 版本类型自动判断
    Given 文档当前版本内容长度为 100 字符
    When 用户新增 150 字符内容 (总长 250)
    Then 版本类型应为 "major" (主要修改)

    Given 文档当前版本内容长度为 100 字符
    When 用户新增 30 字符内容 (总长 130)
    Then 版本类型应为 "minor" (次要修改)

    Given 文档当前版本内容长度为 100 字符
    When 用户新增 10 字符内容 (总长 110)
    Then 版本类型应为 "patch" (小修改)
```

### Scenario 2: 查看版本历史

```gherkin
Feature: 版本历史时间线
  用户可以查看文档的完整版本历史，包括版本号、时间、作者、变更描述

  Scenario: 查看版本列表
    Given 文档 "产品需求文档" 有 5 个历史版本
    When 用户点击 "查看历史版本" 按钮
    Then 应显示版本时间线界面
    And 应按时间倒序显示所有版本 (v5, v4, v3, v2, v1)
    And 每个版本应显示:
      | 字段 | 示例 |
      | 版本号 | v5 |
      | 创建时间 | 2025-10-31 14:30 |
      | 作者 | 张三 |
      | 变更类型 | major/minor/patch |
      | 变更描述 | "添加用户故事 3 个" |
      | 是否当前版本 | 当前版本/历史版本 |
    And 当前版本应有特殊标识 (高亮/图标)

  Scenario: 查看历史版本快照
    Given 文档有版本 v3 (内容为 "# 旧版本内容")
    When 用户点击版本 v3 的 "查看" 按钮
    Then 应弹出版本快照对话框
    And 应显示版本详细信息:
      | 字段 | 值 |
      | 版本号 | v3 |
      | 创建时间 | 2025-10-30 10:15 |
      | 作者 | 张三 |
      | 变更类型 | minor |
      | 变更描述 | "补充技术方案" |
    And 应显示该版本的完整内容 "# 旧版本内容"
    And 内容应为只读模式
    And 应提供 "恢复此版本" 和 "对比" 按钮
```

### Scenario 3: 版本 Diff 对比

```gherkin
Feature: 版本差异对比
  用户可以对比任意两个版本的差异，清晰看到新增、删除、修改的内容

  Scenario: 对比相邻版本
    Given 文档有版本 v4 (内容为 "# 标题\n段落 A")
    And 文档有版本 v5 (内容为 "# 标题\n段落 A\n段落 B")
    When 用户选择对比 v4 和 v5
    Then 应显示 Diff 对比界面
    And 左侧应显示 v4 内容
    And 右侧应显示 v5 内容
    And 应高亮差异部分:
      | 类型 | 内容 | 颜色 |
      | 新增 | "段落 B" | 绿色背景 |
      | 删除 | 无 | - |
      | 修改 | 无 | - |
    And 应显示统计信息:
      """
      新增: 1 行
      删除: 0 行
      修改: 0 处
      """

  Scenario: 对比跨版本
    Given 文档有版本 v2 (内容为 "A\nB\nC")
    And 文档有版本 v5 (内容为 "A\nC\nD")
    When 用户选择对比 v2 和 v5
    Then 应显示 Diff 界面
    And 应高亮差异:
      | 类型 | 内容 | 颜色 |
      | 保持 | "A" | 白色 |
      | 删除 | "B" | 红色背景 |
      | 保持 | "C" | 白色 |
      | 新增 | "D" | 绿色背景 |

  Scenario: 对比当前版本与历史版本
    Given 文档当前版本为 v8
    And 文档有历史版本 v5
    When 用户在版本 v5 点击 "与当前版本对比"
    Then 应显示 v5 和 v8 的 Diff
    And 左侧标题应为 "v5 (历史版本)"
    And 右侧标题应为 "v8 (当前版本)"
```

### Scenario 4: 版本回滚恢复

```gherkin
Feature: 版本回滚
  用户可以将文档恢复到任意历史版本，系统会创建新版本而不是覆盖历史

  Scenario: 恢复到历史版本
    Given 文档当前版本为 v5 (内容为 "最新内容")
    And 文档有历史版本 v3 (内容为 "旧版本内容")
    When 用户在版本 v3 点击 "恢复此版本"
    Then 应弹出确认对话框
    And 对话框应显示警告信息:
      """
      ⚠️ 恢复版本确认
      
      你确定要恢复到 v3 吗？
      
      当前版本 v5 的内容将被覆盖
      但 v5 会保留在历史中，可再次恢复
      恢复后会创建新版本 v6
      """
    And 应提供 "恢复原因" 可选输入框

  Scenario: 确认恢复创建新版本
    Given 文档当前版本为 v5
    And 用户确认恢复到 v3
    And 用户填写恢复原因 "误删重要内容"
    When 用户点击 "确认恢复" 按钮
    Then 系统应执行以下操作:
      | 步骤 | 动作 |
      | 1 | 保存当前 v5 为历史版本 (防止误操作) |
      | 2 | 将文档内容恢复为 v3 的内容 |
      | 3 | 创建新版本 v6 |
      | 4 | v6 的 changeType 为 "restore" |
      | 5 | v6 的 changeDescription 为 "恢复到版本 v3: 误删重要内容" |
      | 6 | v6 的 restoredFrom 指向 v3 |
    And 文档 currentVersion 应更新为 6
    And 应显示成功提示 "已从 v3 恢复，创建新版本 v6"
    And 应自动跳转回文档编辑页

  Scenario: 取消恢复操作
    Given 用户打开恢复确认对话框
    When 用户点击 "取消" 按钮
    Then 应关闭对话框
    And 不应执行任何恢复操作
    And 文档内容保持不变
```

### Scenario 5: 版本列表分页

```gherkin
Feature: 版本列表分页
  当文档有大量版本时，支持分页加载提升性能

  Scenario: 分页加载版本
    Given 文档有 100 个历史版本
    When 用户打开版本历史
    Then 应默认显示最近 20 个版本 (v100 - v81)
    And 应显示分页组件
    And 应显示总版本数 "共 100 个版本"
    When 用户点击 "下一页"
    Then 应加载 v80 - v61
    When 用户点击 "最后一页"
    Then 应加载 v20 - v1
```

---

## 🗄️ Database Schema

### 新增表: document_version

```prisma
model document_version {
  uuid               String   @id @default(uuid())
  documentUuid       String   @map("document_uuid")
  versionNumber      Int      @map("version_number")
  title              String
  content            String   @db.Text
  changeType         String   @map("change_type")  // initial | major | minor | patch | restore
  changeDescription  String?  @map("change_description")
  changedBy          String   @map("changed_by")
  restoredFrom       String?  @map("restored_from")  // UUID of source version if restore
  metadata           Json?    // { addedChars, deletedChars, modifiedSections }
  createdAt          Int      @map("created_at")
  
  document           document @relation(fields: [documentUuid], references: [uuid], onDelete: Cascade)
  account            account  @relation(fields: [changedBy], references: [uuid])
  
  @@index([documentUuid, versionNumber])
  @@index([documentUuid, createdAt])
  @@index([changedBy])
  @@map("document_versions")
}
```

### 更新表: document

```prisma
model document {
  // ...existing fields...
  currentVersion     Int      @default(0) @map("current_version")
  lastVersionedAt    Int?     @map("last_versioned_at")
  
  versions           document_version[]  // 关联版本历史
  
  // ...existing indexes and relations...
}
```

---

## 🏗️ Architecture Design

### Backend Architecture (DDD)

```
document/
├── domain/
│   ├── Document.ts                    # 聚合根 (新增版本管理方法)
│   ├── DocumentVersion.ts             # NEW - 版本聚合根
│   ├── DocumentRepository.interface.ts # 更新接口
│   └── DocumentVersionRepository.interface.ts # NEW
├── infrastructure/
│   ├── PrismaDocumentRepository.ts    # 更新实现
│   └── PrismaDocumentVersionRepository.ts # NEW
├── application/
│   ├── DocumentApplicationService.ts  # 更新服务
│   └── DocumentVersionApplicationService.ts # NEW
└── presentation/
    ├── document.controller.ts         # 更新控制器
    └── document-version.controller.ts # NEW
```

### Frontend Architecture

```
document/
├── api/
│   ├── DocumentApiClient.ts           # 更新 API
│   └── DocumentVersionApiClient.ts    # NEW
├── composables/
│   ├── useDocument.ts                 # 更新 Composable
│   └── useDocumentVersion.ts          # NEW
├── components/
│   ├── VersionTimeline.vue            # NEW - 版本时间线
│   ├── VersionSnapshotDialog.vue      # NEW - 版本快照对话框
│   ├── VersionDiffViewer.vue          # NEW - Diff 对比查看器
│   ├── VersionRestoreDialog.vue       # NEW - 恢复确认对话框
│   └── index.ts                       # 更新导出
└── views/
    └── RepositoryPage.vue             # 更新主页 (添加版本历史入口)
```

---

## 📦 Implementation Plan

### Phase 1: Backend Foundation (Day 1-2)

#### 1.1 Domain Layer
- [ ] 创建 `DocumentVersion` 聚合根
  - `uuid`, `documentUuid`, `versionNumber`, `content`, `title`
  - `changeType`, `changeDescription`, `changedBy`, `restoredFrom`
  - `metadata`, `createdAt`
  - Business methods: `create()`, `toDTO()`, `toPersistence()`
- [ ] 创建 `DocumentVersionRepository` 接口
  - `save(version)`, `findByDocumentUuid(docUuid, options)`
  - `findByUuid(uuid)`, `findByVersionNumber(docUuid, versionNum)`
  - `countByDocumentUuid(docUuid)`
- [ ] 更新 `Document` 聚合根
  - 添加 `currentVersion`, `lastVersionedAt` 字段
  - 新增方法: `createVersion()`, `getCurrentVersionNumber()`

#### 1.2 Infrastructure Layer
- [ ] 实现 `PrismaDocumentVersionRepository`
  - 实现所有 Repository 接口方法
  - 支持分页查询
  - 支持排序 (按版本号/时间)
- [ ] 更新 `PrismaDocumentRepository`
  - 更新保存逻辑，同时创建版本
  - 添加版本关联查询

#### 1.3 Database Migration
- [ ] 创建 Prisma migration
  - 新增 `document_version` 表
  - 更新 `document` 表 (添加 currentVersion, lastVersionedAt)
  - 创建索引

### Phase 2: Backend Application & API (Day 2-3)

#### 2.1 Application Service
- [ ] 创建 `DocumentVersionApplicationService`
  - `getVersionHistory(documentUuid, page, pageSize)` - 获取版本列表
  - `getVersionByUuid(uuid)` - 获取单个版本
  - `getVersionByNumber(documentUuid, versionNumber)` - 按版本号获取
  - `compareVersions(versionUuid1, versionUuid2)` - 版本对比
  - `restoreVersion(documentUuid, versionUuid, reason?)` - 版本恢复
- [ ] 更新 `DocumentApplicationService`
  - 修改 `updateDocument()` - 自动创建版本
  - 修改 `createDocument()` - 创建初始版本 v1

#### 2.2 Presentation Layer
- [ ] 创建 `DocumentVersionController`
  - `GET /api/documents/:uuid/versions` - 获取版本列表 (分页)
  - `GET /api/documents/:uuid/versions/:versionNumber` - 获取指定版本
  - `GET /api/documents/:uuid/versions/:versionUuid/snapshot` - 查看快照
  - `POST /api/documents/:uuid/versions/compare` - 对比版本 (Body: {version1Uuid, version2Uuid})
  - `POST /api/documents/:uuid/versions/:versionUuid/restore` - 恢复版本
- [ ] 更新 `DocumentController`
  - 保持现有 API 不变

#### 2.3 Contracts
- [ ] 更新 `packages/contracts/src/document.contracts.ts`
  - 添加 `DocumentVersionServerDTO`
  - 添加 `DocumentVersionClientDTO`
  - 添加 `VersionCompareRequestDTO`
  - 添加 `VersionDiffResultDTO`
  - 添加 `RestoreVersionRequestDTO`
  - 更新 `DocumentServerDTO` (添加 currentVersion, lastVersionedAt)

### Phase 3: Frontend Implementation (Day 4-5)

#### 3.1 API Client
- [ ] 创建 `DocumentVersionApiClient.ts`
  - `getVersionHistory(documentUuid, page, pageSize)`
  - `getVersionByUuid(uuid)`
  - `getVersionSnapshot(versionUuid)`
  - `compareVersions(version1Uuid, version2Uuid)`
  - `restoreVersion(documentUuid, versionUuid, reason?)`

#### 3.2 Composables
- [ ] 创建 `useDocumentVersion.ts`
  - State: `versions`, `currentVersion`, `loading`, `error`, `pagination`
  - Methods: `loadVersions()`, `loadVersion()`, `compareTwoVersions()`, `restoreToVersion()`

#### 3.3 Components
- [ ] 创建 `VersionTimeline.vue` (版本时间线)
  - Props: `documentUuid`, `versions`, `loading`, `pagination`
  - Events: `@view`, `@compare`, `@restore`, `@page-change`
  - UI: v-timeline 显示版本列表
- [ ] 创建 `VersionSnapshotDialog.vue` (版本快照对话框)
  - Props: `version`, `visible`
  - Events: `@close`, `@restore`, `@compare`
  - UI: v-dialog 展示版本详情和内容
- [ ] 创建 `VersionDiffViewer.vue` (Diff 对比)
  - Props: `version1`, `version2`, `diffResult`
  - UI: 左右并排显示 Diff (vue-diff 或 diff2html)
  - Features: 高亮新增/删除/修改
- [ ] 创建 `VersionRestoreDialog.vue` (恢复确认)
  - Props: `version`, `visible`
  - Events: `@confirm`, `@cancel`
  - UI: v-dialog 显示警告和原因输入框

#### 3.4 Views
- [ ] 更新 `RepositoryPage.vue`
  - 添加 "查看历史版本" 按钮 (在文档卡片)
  - 集成版本历史对话框
  - 集成版本对比对话框
  - 集成恢复确认对话框

### Phase 4: Testing & Documentation (Day 5-6)

#### 4.1 Backend Tests
- [ ] Domain Layer Tests
  - `DocumentVersion.spec.ts` - 聚合根业务逻辑测试
  - `Document.spec.ts` - 更新测试 (版本管理方法)
- [ ] Application Layer Tests
  - `DocumentVersionApplicationService.spec.ts` - 服务测试
- [ ] Integration Tests
  - API 端点测试 (Supertest)

#### 4.2 Frontend Tests
- [ ] Component Tests
  - `VersionTimeline.spec.ts`
  - `VersionDiffViewer.spec.ts`
  - `VersionRestoreDialog.spec.ts`
- [ ] E2E Tests
  - 完整版本管理流程测试 (Playwright)

#### 4.3 Documentation
- [ ] Backend README 更新 (添加版本管理 API)
- [ ] Frontend README 更新 (添加版本组件说明)
- [ ] Story 完成报告

---

## 🧪 Testing Strategy

### Unit Tests (80% Coverage)
- Domain Layer: DocumentVersion 聚合根
- Application Layer: DocumentVersionApplicationService
- Composables: useDocumentVersion

### Integration Tests (70% Coverage)
- API Endpoints: 5 个版本管理 API
- Database: 版本创建、查询、恢复
- Repository: PrismaDocumentVersionRepository

### E2E Tests (100% Critical Path)
- 创建文档自动创建版本
- 查看版本历史列表
- 版本 Diff 对比
- 版本恢复流程

---

## 📊 Success Metrics

| 指标 | 目标值 |
|------|--------|
| 版本保存成功率 | 100% |
| 版本历史加载时间 | < 300ms (20 条) |
| Diff 对比渲染时间 | < 500ms |
| 版本恢复成功率 | 100% |
| 测试覆盖率 | Backend >80%, Frontend >70% |

---

## 🚧 Technical Risks & Mitigation

### Risk 1: Diff 算法性能问题 (大文档)
**Impact**: 高  
**Probability**: 中  
**Mitigation**:
- 使用成熟的 diff 库 (`diff` npm package)
- 仅对比前 10,000 字符 (大文档截断)
- 后端计算 Diff，前端仅渲染

### Risk 2: 版本存储空间增长
**Impact**: 中  
**Probability**: 高  
**Mitigation**:
- MVP 阶段接受存储成本
- Future: 版本压缩策略 (相似版本合并)
- Future: 旧版本归档/删除策略

### Risk 3: 并发编辑版本冲突
**Impact**: 低 (MVP 单用户)  
**Probability**: 低  
**Mitigation**:
- MVP 不支持多用户并发编辑
- Future: 乐观锁 + 版本号校验

---

## 🔗 Dependencies

### Story Dependencies
- ✅ **STORY-7.1**: Document CRUD Basics (必须先完成)
- ⏸️ **STORY-1.2**: User Login & Token Management (依赖认证)

### External Dependencies
- `diff` npm package (Diff 算法)
- `vue-diff` or `diff2html` (Frontend Diff 渲染)
- Prisma 5.20+ (Database ORM)

---

## 📝 Notes

### Design Decisions
1. **版本不可删除**: 保证历史完整性，只允许软删除文档（级联删除版本）
2. **恢复创建新版本**: 不覆盖历史，可再次恢复
3. **行级 Diff**: MVP 仅支持行级对比，字符级留给 Future
4. **自动版本**: 每次保存必创建版本，不支持手动跳过
5. **版本类型自动判断**: 基于字符数变化量，无需用户选择

### Future Enhancements
- [ ] 版本标签/里程碑 (v1.0, v2.0)
- [ ] 版本分支 (实验性修改)
- [ ] 字符级/词级 Diff
- [ ] 版本合并
- [ ] 版本压缩 (合并相似版本)
- [ ] 版本导出 (导出特定版本为文件)

---

**Story Status**: 📋 Ready for Development  
**Estimated Time**: 6-8 hours (1 Sprint)  
**Created**: 2025-10-31  
**Next Steps**: 开始 Backend Domain Layer 实施
