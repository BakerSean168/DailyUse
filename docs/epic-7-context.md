# Epic 7: Repository Module - 知识仓库

**Epic 状态**: ⚠️ Requires Refactor (需要重构)  
**当前问题**: Document 模块已实现但架构不符合 contracts 定义  
**Story 数量**: 3 stories (1个重构 + 2个新增)  
**Story Points**: 21 points (重构: 13 + 新功能: 8)  
**预计时间**: 5.5天

---

## ⚠️ 架构问题诊断 (2025-10-31)

### 当前实现状态

**已完成** (在 Epic 8 实施时):
- ✅ Document CRUD (16 files, ~2,373 lines backend)
- ✅ Document Version 管理
- ✅ Document Link 双向链接
- ✅ Frontend 完整实现 (13 files, ~1,326 lines)

**架构问题**:
1. ❌ **Document 作为独立聚合根** - 应该是 Repository 下的 Resource 实体
2. ❌ **缺少 Repository 概念** - 没有顶层仓库管理
3. ❌ **资源类型单一** - 只支持 Markdown，不支持图片、视频、PDF 等
4. ❌ **与 Contracts 不匹配** - contracts 定义的是 `Repository → Resource[]` 架构

### Contracts 定义的正确架构

```typescript
Repository (聚合根)
├── uuid: string
├── name: string (如 "我的知识库")
├── type: LOCAL | REMOTE | SYNCHRONIZED
├── path: string (文件系统路径)
├── status: ACTIVE | INACTIVE | ARCHIVED | SYNCING
└── resources: Resource[]
      ├── MARKDOWN (Markdown 文档) ← 原 Document
      ├── IMAGE (图片: jpg, png, gif, webp)
      ├── VIDEO (视频: mp4, webm)
      ├── AUDIO (音频: mp3, wav)
      ├── PDF (PDF 文档)
      ├── LINK (外部链接)
      ├── CODE (代码文件)
      └── OTHER (其他类型)
```

### 重构计划

详细重构计划请查看: **`docs/epic-7-refactor-plan.md`**

**Phase 1**: 基础架构重构 (2天, 8 SP)
- 创建 Repository 聚合根
- 重构 Document → Resource
- 数据库 Schema 重构
- Repository Pattern 实现

**Phase 2**: 图片资源支持 (1天, 5 SP)
- 图片上传服务
- 缩略图生成
- 图片资源 API

**Phase 3**: Repository CRUD API (1天, 3 SP)
- Repository 应用服务
- Repository HTTP 控制器
- Resource HTTP 控制器

**Phase 4**: 数据迁移 (0.5天, 2 SP)
- Document → Resource 数据迁移
- API 兼容层

**Phase 5**: 前端适配 (1天, 3 SP)
- Repository/Resource API Client
- Composables 重构
- 组件重构（支持图片预览）

---

## 📋 Epic Overview

**Epic**: 重构知识仓库模块，使其符合 contracts 定义的架构，并扩展支持多种资源类型。

**业务价值**: 
- 🏗️ 架构规范化，符合 DDD 设计
- 📁 仓库级别管理，支持多个知识库
- 🖼️ 多资源类型支持（Markdown + 图片 + 视频等）
- 🔄 Git 版本控制集成
- 🔗 资源引用和关联关系

---

## 🎯 Stories (重构后)
