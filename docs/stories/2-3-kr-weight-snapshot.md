# Story 2-3: KR 权重快照管理

## 📋 Story 信息

- **Story ID**: 2-3
- **Story 名称**: KR 权重快照管理
- **Epic**: Epic 2 - Goal Module (目标管理)
- **优先级**: P0 (高优先级)
- **预估工作量**: 3 SP (主要是测试工作)
- **状态**: ⏸️ **测试暂停** (代码完成，测试待后续补充)
- **负责人**: Dev Team
- **创建日期**: 2025-10-30
- **暂停日期**: 2025-10-30
- **原因**: 代码已完成（4,590行），优先推进其他 Story，测试工作后续补充

---

## 🎯 业务价值

### 问题陈述
在目标管理中，用户经常需要调整关键结果（Key Result）的权重，但当前系统没有记录权重变更历史，导致：
- ❌ 无法追溯权重调整的原因和时机
- ❌ 难以分析权重调整对目标进度的影响
- ❌ 复盘时缺少权重变化的历史数据

### 解决方案
实现 KR 权重快照功能，自动记录权重变更历史，支持历史查看和对比分析。

### 用户价值
- ✅ 提供完整的权重调整历史，便于复盘
- ✅ 支持权重变化趋势分析
- ✅ 增强目标管理的透明度和可追溯性
- ✅ 为智能推荐权重分配提供数据基础

---

## ✅ 验收标准 (Acceptance Criteria)

### AC1: 自动创建权重快照
```gherkin
Given 用户是目标的所有者
When 用户调整某个 KR 的权重从 30% 改为 40%
Then 系统应自动创建一个权重快照
And 快照应记录：goalUuid, keyResultUuid, oldWeight=30, newWeight=40, snapshotTime, trigger='manual'
And 用户应看到"权重已更新，历史快照已保存"的提示
```

### AC2: 查看权重快照历史
```gherkin
Given 目标有多个权重快照记录
When 用户点击"查看权重历史"按钮
Then 系统应显示权重快照列表（按时间倒序）
And 每条记录应显示：时间、KR 名称、旧权重 → 新权重、变化量、触发方式
And 用户可以点击某条记录查看详情
```

### AC3: 权重变化趋势图
```gherkin
Given 目标有至少 2 个权重快照
When 用户打开"权重趋势"标签页
Then 系统应显示折线图，展示每个 KR 的权重随时间的变化
And 支持选择时间范围（7天/30天/90天/半年）
And 图表应支持缩放和交互
```

### AC4: 多时间点权重对比
```gherkin
Given 目标有多个历史快照
When 用户选择 2-5 个时间点进行对比
Then 系统应显示柱状图和雷达图对比
And 高亮显示权重增加/减少的 KR
And 显示权重变化的数据表格
```

### AC5: API 端点功能正常
```gherkin
Given API 服务正常运行
When 调用 POST /api/goals/:goalUuid/key-results/:krUuid/weight 更新权重
Then 应返回 200 状态码和新的快照记录
When 调用 GET /api/goals/:goalUuid/weight-snapshots 查询快照
Then 应返回快照列表和分页信息
```

---

## 📐 技术实现

### 已完成的实现（100%）

#### 1. Contracts 层 ✅
**文件**: `packages/contracts/src/modules/goal/value-objects/KeyResultWeightSnapshot.ts`

```typescript
interface KeyResultWeightSnapshotServerDTO {
  uuid: string;
  goalUuid: string;
  keyResultUuid: string;
  oldWeight: number;
  newWeight: number;
  weightDelta: number;
  snapshotTime: number; // timestamp
  trigger: SnapshotTrigger; // 'manual' | 'auto' | 'restore' | 'import'
  reason: string | null;
  operatorUuid: string;
  createdAt: number;
}

enum SnapshotTrigger {
  MANUAL = 'manual',
  AUTO = 'auto',
  RESTORE = 'restore',
  IMPORT = 'import'
}
```

#### 2. Domain 层 ✅
**文件**: `packages/domain-server/src/goal/value-objects/KeyResultWeightSnapshot.ts`
- ✅ 值对象定义
- ✅ `validateWeights()` 方法
- ✅ `toServerDTO()` / `fromServerDTO()`
- ✅ 自定义错误类

**文件**: `packages/domain-server/src/goal/repositories/IWeightSnapshotRepository.ts`
- ✅ Repository 接口定义

#### 3. Application 层 ✅
**文件**: `apps/api/src/modules/goal/application/services/WeightSnapshotApplicationService.ts`
- ✅ `createSnapshot()` - 创建快照
- ✅ `validateWeightSum()` - 校验权重总和
- ✅ `getSnapshotsByGoal()` - 查询 Goal 快照
- ✅ `getSnapshotsByKeyResult()` - 查询 KR 快照
- ✅ `getSnapshotsByTimeRange()` - 时间范围查询
- ✅ `getWeightDistribution()` - 获取权重分布
- ✅ `getWeightTrend()` - 获取趋势数据
- ✅ `getWeightComparison()` - 多时间点对比

#### 4. Infrastructure 层 ✅
**文件**: `apps/api/src/modules/goal/infrastructure/repositories/PrismaWeightSnapshotRepository.ts`
- ✅ 完整的 CRUD 操作
- ✅ 分页支持
- ✅ 批量操作
- ✅ Prisma 映射器

**Prisma Schema**:
```prisma
model KeyResultWeightSnapshot {
  uuid            String   @id
  goalUuid        String
  keyResultUuid   String
  oldWeight       Int
  newWeight       Int
  weightDelta     Int
  snapshotTime    BigInt
  trigger         String
  reason          String?
  operatorUuid    String
  createdAt       BigInt
  
  goal            Goal     @relation(fields: [goalUuid], references: [uuid], onDelete: Cascade)
  keyResult       KeyResult @relation(fields: [keyResultUuid], references: [uuid], onDelete: Cascade)
  
  @@index([goalUuid])
  @@index([keyResultUuid])
  @@index([snapshotTime])
}
```

#### 5. API 层 ✅
**文件**: `apps/api/src/modules/goal/interface/http/WeightSnapshotController.ts`
**文件**: `apps/api/src/modules/goal/interface/http/weightSnapshotRoutes.ts`

**端点列表**:
1. `POST /api/goals/:goalUuid/key-results/:krUuid/weight` - 更新权重并创建快照
2. `GET /api/goals/:goalUuid/weight-snapshots` - 查询 Goal 快照
3. `GET /api/key-results/:krUuid/weight-snapshots` - 查询 KR 快照
4. `GET /api/goals/:goalUuid/weight-trend` - 获取趋势数据（ECharts）
5. `GET /api/goals/:goalUuid/weight-comparison` - 多时间点对比

#### 6. 前端实现 ✅

**API Client**:
- ✅ `apps/web/src/modules/goal/infrastructure/api/weightSnapshotApiClient.ts`

**Application Service**:
- ✅ `apps/web/src/modules/goal/application/services/WeightSnapshotWebApplicationService.ts`

**Composable**:
- ✅ `apps/web/src/modules/goal/application/composables/useWeightSnapshot.ts` (530 行)
  - 8 个业务方法
  - 8 个计算属性
  - Vue 3 Composition API

**UI 组件**:
- ✅ `WeightSnapshotList.vue` (318 行) - 变更历史列表
- ✅ `WeightTrendChart.vue` (227 行) - ECharts 折线图
- ✅ `WeightComparison.vue` (400+ 行) - 多时间点对比
- ✅ `WeightSnapshotView.vue` (78 行) - 标签页布局

---

## 🧪 测试计划

### Phase 1: 后端集成测试 (优先级：高)

#### 测试文件 1: `WeightSnapshotApplicationService.test.ts`

**测试场景**:
1. ✅ 创建权重快照
   - 成功创建快照
   - 权重总和验证失败（不为 100%）
   - KeyResult 不存在

2. ✅ 查询快照
   - 按 Goal UUID 查询
   - 按 KeyResult UUID 查询
   - 按时间范围查询
   - 空结果处理

3. ✅ 获取趋势数据
   - 7天/30天/90天趋势
   - 数据格式验证
   - 边界情况

4. ✅ 权重对比
   - 2-5 个时间点对比
   - 数据准确性验证

#### 测试文件 2: `PrismaWeightSnapshotRepository.test.ts`

**测试场景**:
1. ✅ CRUD 操作
   - create, findById, findMany
   - update, delete
   - 批量操作

2. ✅ 分页功能
   - 正确的分页数据
   - 总数计算
   - 边界情况

3. ✅ 查询过滤
   - 按 Goal 过滤
   - 按 KR 过滤
   - 按时间范围过滤
   - 组合条件

#### 测试文件 3: API 端点集成测试

**测试场景**:
1. ✅ `POST /api/goals/:goalUuid/key-results/:krUuid/weight`
   - 成功更新权重
   - 权限验证（非所有者）
   - 权重验证失败
   - 400/401/403/404 错误处理

2. ✅ `GET /api/goals/:goalUuid/weight-snapshots`
   - 成功查询快照列表
   - 分页参数验证
   - 权限验证

3. ✅ `GET /api/goals/:goalUuid/weight-trend`
   - 成功获取趋势数据
   - 时间范围参数验证

4. ✅ `GET /api/goals/:goalUuid/weight-comparison`
   - 成功获取对比数据
   - 时间点参数验证

### Phase 2: 前端单元测试

#### 测试文件 4: `useWeightSnapshot.test.ts`

**测试场景**:
1. ✅ 状态管理
   - 初始状态
   - loading 状态
   - error 状态

2. ✅ 业务方法
   - updateKRWeight
   - fetchGoalSnapshots
   - fetchKRSnapshots
   - fetchWeightTrend
   - fetchWeightComparison

3. ✅ 计算属性
   - hasGoalSnapshots
   - canLoadMore
   - totalPages

### Phase 3: E2E 测试（Playwright）

#### 测试场景 E2E-1: 权重快照创建流程
```typescript
test('用户更新 KR 权重时自动创建快照', async ({ page }) => {
  // 1. 登录并进入目标详情页
  // 2. 找到某个 KR，点击编辑
  // 3. 修改权重从 30% 改为 40%
  // 4. 保存
  // 5. 验证提示消息"权重已更新，历史快照已保存"
  // 6. 打开权重历史
  // 7. 验证新快照出现在列表顶部
});
```

#### 测试场景 E2E-2: 查看权重历史
```typescript
test('用户可以查看权重快照历史列表', async ({ page }) => {
  // 1. 进入目标详情页
  // 2. 点击"查看权重历史"按钮
  // 3. 验证快照列表显示
  // 4. 验证列表包含：时间、KR 名称、权重变化
  // 5. 点击某条记录查看详情
  // 6. 验证详情对话框显示完整信息
});
```

#### 测试场景 E2E-3: 权重趋势图
```typescript
test('用户可以查看权重趋势图', async ({ page }) => {
  // 1. 进入权重快照视图
  // 2. 切换到"权重趋势"标签
  // 3. 验证 ECharts 图表渲染
  // 4. 切换时间范围（7天/30天）
  // 5. 验证图表数据更新
});
```

#### 测试场景 E2E-4: 权重对比
```typescript
test('用户可以对比不同时间点的权重分布', async ({ page }) => {
  // 1. 进入权重快照视图
  // 2. 切换到"权重对比"标签
  // 3. 选择 2 个时间点
  // 4. 验证柱状图和雷达图显示
  // 5. 验证数据表格显示权重变化
});
```

### Phase 4: 手动测试

使用测试指南: `/docs/stories/2-3-manual-test-guide.md`

---

## 📦 Implementation Phases

### Phase 1: 测试环境准备 ✅
- [x] 确认代码已存在（后端 ~2,600 行 + 前端 ~1,990 行）
- [x] 检查 Prisma Schema 是否已迁移
- [x] 准备测试数据

### Phase 2: 后端测试 🔄
- [ ] 编写 `WeightSnapshotApplicationService.test.ts`
- [ ] 编写 `PrismaWeightSnapshotRepository.test.ts`
- [ ] 编写 API 端点集成测试
- [ ] 运行测试并修复问题
- [ ] 目标：>=80% 代码覆盖率

### Phase 3: 前端测试 🔄
- [ ] 编写 `useWeightSnapshot.test.ts`
- [ ] 编写组件单元测试（可选）
- [ ] 运行测试并修复问题

### Phase 4: E2E 测试 🔄
- [ ] 编写 Playwright 测试用例（4 个场景）
- [ ] 运行 E2E 测试
- [ ] 修复问题

### Phase 5: 手动测试 & 验收 🔄
- [ ] 执行手动测试指南
- [ ] 验收所有 AC
- [ ] 更新 sprint-status.yaml 为 `done`

---

## 📊 Definition of Done

- [ ] 所有后端单元测试通过（>=80% 覆盖率）
- [ ] 所有前端单元测试通过
- [ ] 所有 API 端点集成测试通过
- [ ] 所有 E2E 测试通过
- [ ] 手动测试所有验收标准通过
- [ ] 代码审查通过
- [ ] 文档更新完成
- [ ] 无 Critical/High 级别 Bug
- [ ] Sprint Status 更新为 `done`

---

## 📝 Notes

### 已知问题
- ⏸️ 历史恢复功能（架构已支持，UI 待实现）- 可作为 MMP 功能
- ⏸️ 导出对比报告（PNG/PDF）- 可作为 MMP 功能

### 依赖关系
- ✅ Story 2-1 (Goal CRUD) - 已完成
- ✅ Story 2-2 (Key Result Management) - 已完成
- 🔄 Story 2-4 (Goal Progress Auto Calculation) - 并行开发

### 参考文档
- Feature Spec: `/docs/modules/goal/features/02-kr-weight-snapshot.md`
- Epic Context: `/docs/epic-2-context.md`
- 代码位置：
  - 后端: `apps/api/src/modules/goal/`
  - 前端: `apps/web/src/modules/goal/`
  - Contracts: `packages/contracts/src/modules/goal/`
  - Domain: `packages/domain-server/src/goal/`

---

**Story 创建者**: Dev Agent  
**创建日期**: 2025-10-30  
**最后更新**: 2025-10-30  
**Story Points**: 3 SP
