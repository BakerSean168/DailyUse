# 测试失败问题分析与修复方案

## 测试结果概览

- **总测试数**: 148 个
- **通过**: 84 个 (56.8%)
- **失败**: 53 个 (35.8%)  
- **跳过**: 11 个 (7.4%)
- **改善**: 从 79 个失败降到 53 个失败 ✅

---

## 核心问题分类

### 1. KeyResult 加载问题 (最严重) 🔴

**表现**: KeyResultNotFoundError: KeyResult not found

**根本原因**: addKeyResult 后，Goal 重新加载时 KeyResult 丢失

**需要检查**:
1. Mock 的 upsert 是否正确保存 KeyResult 到 keyResult 表
2. findById 的 include 参数是否正确传递
3. mapToEntity 是否正确加载 keyResult 数据

**建议修复**: 添加调试日志跟踪数据流

---

### 2. Repository Mock 缺失 🔴

**表现**: Cannot read properties of undefined (reading 'findMany')

**根本原因**: mockPrismaClient 没有 repository 表

**修复**: 在 prismaMock.ts 添加
\\\	ypescript
repository: new Map(),
repository: createMockModel('repository'),
\\\

---

### 3. 统计服务逻辑问题 🟡

**表现**: 
- xpected false to be true (recalculate 失败)
- 删除后仍能查询到数据

**原因**: 
1. recalculateStatistics 可能需要 repository 数据
2. delete 方法可能只是软删除，而非真删除

---

### 4. 缺失的 Contracts DTO 🟡

**表现**: xpected to have property 'RepositoryStatisticsServerDTO'

**原因**: @dailyuse/contracts 中缺少这些DTO定义

---

## 立即修复项

### 优先级 P0 (立即修复)

1. 添加 repository Mock
2. 修复 KeyResult 持久化逻辑
3. 添加调试日志

### 优先级 P1 (短期修复)

4. 修复统计服务的逻辑问题
5. 添加缺失的 Contracts DTO

### 优先级 P2 (长期优化)

6. 重构测试架构，减少 Mock 复杂度
7. 考虑使用 Docker + 真实数据库

---

## 下一步行动

\\\ash
# 1. 添加 repository Mock
# 2. 添加调试日志到 PrismaGoalRepository.save()
# 3. 重新运行测试
pnpm nx test api --run
\\\

