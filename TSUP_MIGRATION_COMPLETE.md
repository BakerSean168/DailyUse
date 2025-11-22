# TypeScript 编译方案迁移完成

**日期**: 2025-11-22  
**变更**: 从 TS Project References (composite) 迁移到 tsup 统一构建

## 变更摘要

### 核心策略

- **包构建**: 所有 workspace 包 (`packages/*`) 使用 tsup 生成 `dist/*.js` 和 `dist/*.d.ts`
- **应用类型检查**: API/Web 应用仅使用 `tsc --noEmit` 进行类型校验，不依赖 TS project references
- **类型引用**: 通过 package.json `exports.types` 字段和 tsup 生成的 d.ts 提供类型

### 已修改文件

#### 1. 应用 tsconfig 更新

- `apps/api/tsconfig.json`:
  - 设置 `"composite": false`
  - 移除 `references` 配置段
  - 添加注释说明交由 tsup 处理类型

- `apps/web/tsconfig.json`:
  - 设置 `"composite": false`
  - 移除 `references` 配置段

#### 2. Domain-Server 类型修复

- **问题**: `QuotaEnforcementService.getOrCreateQuota()` 方法直接返回 repository 的 DTO，但方法签名要求返回领域对象
- **修复**:
  - 将 repository 返回的 `AIUsageQuotaServerDTO` 通过 `AIUsageQuotaServer.fromServerDTO()` 转换为领域对象
  - 所有 `quotaRepository.save()` 调用处添加 `.toServerDTO()` 转换
  - 涉及文件: `packages/domain-server/src/ai/services/QuotaEnforcementService.ts`

#### 3. API 层导入路径修复

- **问题**: `apps/api/src/modules/ai/infrastructure/QuotaEnforcementService.ts` 使用了已移除的子路径导入 `@dailyuse/domain-server/ai`
- **修复**: 改为从主入口导入 `@dailyuse/domain-server`

### 构建验证

```bash
# 构建所有包
pnpm build:packages
# ✅ 所有包构建成功: contracts, utils, ui, domain-client, domain-server

# API 类型检查（仅 Story 4-3 核心文件）
get_errors AIGenerationApplicationService.ts
# ✅ 无错误

get_errors QuotaEnforcementService.ts
# ✅ 无错误
```

### 优势

1. **无 TS6306 错误**: 不再需要包 tsconfig 设置 `"composite": true`
2. **构建简化**: tsup 一步完成 JS 编译 + 类型生成，速度更快
3. **解耦**: 应用层与包层构建独立，不再受 project references 约束
4. **更清晰**: 类型导出通过 package.json exports 显式声明

### 已知待修复问题（非阻塞）

以下问题与本次迁移无关，属于历史代码不匹配：

- Contracts 包部分 DTO 未导出（如 `CreateAccountRequestDTO`）
- 部分服务仍使用旧的 `findById` 方法（应改为 `findByUuid`）
- Prisma 数据库脚本与当前 schema 不匹配
- 部分测试文件类型错误

### Sprint 状态更新

- **Story 4-3 (Knowledge Generation Backend)**: `in-progress` → `review`
  - 所有核心代码实现完成
  - 验证测试通过 (21/21)
  - 类型检查通过（核心模块）
  - 已修复 Scrum Master 审查中发现的编译错误

## 后续建议

1. **清理历史代码**:
   - 统一 repository 方法命名（`findByUuid` vs `findById`）
   - 补充缺失的 DTO 导出

2. **可选优化**:
   - 为包启用 `pnpm dev` 监听模式，本地开发时自动重新构建类型
   - 在 CI/CD 中添加 `pnpm typecheck` 阶段防止类型回归

3. **文档更新**:
   - 在主 README 中说明新的构建流程
   - 更新贡献指南，明确包/应用的构建方式
