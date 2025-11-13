# Sprint 1 开发指南

**面向**: Backend Developers  
**Sprint**: Sprint 1 (2025-11-12 → 2025-12-08)  
**目标**: Dashboard 统计聚合层 + 缓存层 + API

---

## 🚀 快速开始

### 1. 环境准备

```bash
# 1. 切换到开发分支
cd /workspaces/DailyUse
git checkout -b feature/dashboard-sprint-1

# 2. 启动 Redis
docker-compose up -d redis

# 3. 验证 Redis 连接
docker exec -it dailyuse_redis redis-cli ping
# 应返回: PONG

# 4. 安装依赖
pnpm install

# 5. 验证构建
pnpm nx build shared-contracts
pnpm nx build api
```

### 2. 开发流程

```bash
# 1. 创建功能分支
git checkout -b task/1.1.1-dashboard-dto

# 2. 开发（参考 Sprint 1 Kickoff 文档）
# ...编写代码...

# 3. 运行测试
pnpm nx test shared-contracts
pnpm nx test api

# 4. 提交代码
git add .
git commit -m "feat(dashboard): implement DashboardStatisticsDTO [TASK-1.1.1]"

# 5. 推送并创建 PR
git push -u origin task/1.1.1-dashboard-dto
```

---

## 📋 任务列表

### Backend Dev 1 - 统计聚合层

#### ✅ TASK-1.1.1: 定义 DashboardStatisticsDTO（2 SP）

**状态**: ✅ 已完成  
**文件**: `/workspaces/DailyUse/packages/shared-contracts/src/dashboard/DashboardStatisticsDTO.ts`

**已完成**:

- ✅ 创建 `DashboardStatisticsDTO` 接口
- ✅ 创建 `DashboardSummary` 接口
- ✅ 添加类型守卫 `isDashboardStatisticsDTO()`
- ✅ 添加工具函数 `createEmptyDashboardStatistics()`
- ✅ 完善 JSDoc 注释
- ✅ 导出到 `shared-contracts/dashboard/index.ts`

**验证**:

```bash
# TypeScript 类型检查
pnpm nx build shared-contracts

# 应无错误输出
```

---

#### ⏳ TASK-1.1.2: 实现 DashboardStatisticsAggregateService（8 SP）

**状态**: ⏳ 待开始  
**文件**: `apps/api/src/dashboard/services/DashboardStatisticsAggregateService.ts`

**实现步骤**:

1. **创建目录结构**

```bash
mkdir -p apps/api/src/dashboard/services
mkdir -p apps/api/src/dashboard/services/__tests__
```

2. **实现核心服务**

```typescript
// apps/api/src/dashboard/services/DashboardStatisticsAggregateService.ts
import { Injectable, Logger } from '@nestjs/common';
import { DashboardStatisticsDTO } from '@contracts/dashboard';

@Injectable()
export class DashboardStatisticsAggregateService {
  private readonly logger = new Logger(DashboardStatisticsAggregateService.name);

  constructor() // TODO: 注入 4 个 Statistics Repository
  {}

  async aggregateStatistics(accountUuid: string): Promise<DashboardStatisticsDTO> {
    // TODO: 实现聚合逻辑
    // 1. 并行查询 4 个模块 Statistics
    // 2. 转换为 ClientDTO
    // 3. 计算汇总数据
    // 4. 返回 DashboardStatisticsDTO
  }
}
```

3. **关键实现点**:
   - ✅ 使用 `Promise.all()` 并行查询
   - ✅ 处理空数据情况（兜底）
   - ✅ 计算总体完成率（Task 60% + Goal 40%）
   - ✅ 日志记录（debug + error）
   - ✅ 错误处理

4. **验收标准**:
   - ✅ 并行查询 4 个模块
   - ✅ 正确转换为 ClientDTO
   - ✅ 总体完成率计算正确
   - ✅ 错误处理完善
   - ✅ 单元测试覆盖率 ≥ 90%

**参考代码**: 查看 `SPRINT_1_KICKOFF.md` 中的完整示例

**预估时间**: 16 小时  
**截止日期**: 2025-11-18 18:00

---

#### ⏳ TASK-1.1.3: 单元测试（2 SP）

**状态**: ⏳ 待开始  
**文件**: `apps/api/src/dashboard/services/__tests__/DashboardStatisticsAggregateService.test.ts`

**测试用例**:

```typescript
describe('DashboardStatisticsAggregateService', () => {
  describe('aggregateStatistics', () => {
    it('should aggregate statistics from 4 modules', async () => {
      // TODO: Mock 4 个 Repository
      // TODO: 调用 aggregateStatistics()
      // TODO: 验证返回数据正确
    });

    it('should handle empty data gracefully', async () => {
      // TODO: Mock Repository 返回 null
      // TODO: 验证返回空数据
    });

    it('should calculate overall completion rate correctly', async () => {
      // TODO: Mock Task 80%, Goal 60%
      // TODO: 验证总体完成率 = 80% * 0.6 + 60% * 0.4 = 72%
    });

    it('should complete within 500ms', async () => {
      // TODO: 性能测试
      // TODO: 验证耗时 ≤ 500ms
    });

    it('should handle repository errors', async () => {
      // TODO: Mock Repository 抛出异常
      // TODO: 验证错误处理
    });
  });
});
```

**验收标准**:

- ✅ 覆盖所有核心功能
- ✅ 测试覆盖率 ≥ 90%
- ✅ 所有测试通过

**运行测试**:

```bash
pnpm nx test api --testPathPattern=DashboardStatisticsAggregateService
```

---

### Backend Dev 2 - 缓存层 + API

#### ⏳ TASK-1.2.1: 实现 StatisticsCacheService（5 SP）

**状态**: ⏳ 待开始  
**文件**: `apps/api/src/dashboard/services/StatisticsCacheService.ts`

**实现步骤**:

1. **创建服务文件**

```bash
# 文件已在 TASK-1.1.2 步骤 1 中创建
```

2. **核心方法**:
   - `get(accountUuid)` - 从 Redis 读取
   - `set(accountUuid, data, ttl)` - 写入 Redis
   - `invalidate(accountUuid)` - 主动失效
   - `exists(accountUuid)` - 检查缓存是否存在
   - `getTTL(accountUuid)` - 获取剩余 TTL

3. **关键实现点**:
   - ✅ TTL 随机化（4-6分钟，避免缓存雪崩）
   - ✅ 缓存命中标记（`cacheHit = true`）
   - ✅ 错误处理（Redis 失败不影响业务）
   - ✅ 日志记录

**参考代码**: 查看 `SPRINT_1_KICKOFF.md`

**预估时间**: 10 小时  
**截止日期**: 2025-11-20 18:00

---

#### ⏳ TASK-1.2.2: 实现事件驱动缓存失效（2 SP）

**状态**: ⏳ 待开始  
**文件**: `apps/api/src/dashboard/listeners/DashboardCacheInvalidationListener.ts`

**实现步骤**:

1. **创建监听器**

```bash
mkdir -p apps/api/src/dashboard/listeners
```

2. **监听事件**:
   - `task.statistics.updated`
   - `goal.statistics.updated`
   - `reminder.statistics.updated`
   - `schedule.statistics.updated`

3. **验收标准**:
   - ✅ 监听 4 个模块的事件
   - ✅ 自动失效对应用户的缓存
   - ✅ 集成测试通过

**参考代码**: 查看 `SPRINT_1_KICKOFF.md`

**预估时间**: 4 小时  
**截止日期**: 2025-11-21 18:00

---

#### ⏳ TASK-1.3.1: 实现 Dashboard API（2 SP）

**状态**: ⏳ 待开始  
**文件**: `apps/api/src/dashboard/controllers/DashboardController.ts`

**实现步骤**:

1. **创建 Controller**

```bash
mkdir -p apps/api/src/dashboard/controllers
```

2. **核心逻辑**:

```typescript
@Get('statistics')
async getStatistics(@Req() req): Promise<DashboardStatisticsDTO> {
  const accountUuid = req.user.accountUuid;

  // 1. 尝试从缓存读取
  const cached = await this.cacheService.get(accountUuid);
  if (cached) return cached;

  // 2. 缓存未命中，查询并缓存
  const stats = await this.aggregateService.aggregateStatistics(accountUuid);
  await this.cacheService.set(accountUuid, stats);

  return stats;
}
```

3. **验收标准**:
   - ✅ API 端点可用
   - ✅ JWT 鉴权生效
   - ✅ 缓存优先策略
   - ✅ Swagger 文档完整

**测试**:

```bash
# 启动 API 服务
pnpm nx serve api

# 测试 API
curl -X GET http://localhost:3000/api/dashboard/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

#### ⏳ TASK-1.3.2: E2E 测试（2 SP）

**文件**: `apps/api/src/dashboard/__tests__/dashboard.e2e.test.ts`

**测试用例**:

1. ✅ 成功返回统计数据（有效 Token）
2. ✅ 401 未授权（无 Token）
3. ✅ 缓存命中（第二次请求 ≤ 50ms）
4. ✅ 缓存失效后重新计算
5. ✅ 并发请求（100 个请求）

---

#### ⏳ TASK-1.3.3: API 文档（2 SP）

**文件**: `apps/api/src/dashboard/dashboard.swagger.ts`

**内容包括**:

- ✅ API 端点说明
- ✅ 请求示例（curl）
- ✅ 响应示例（200/401/500）
- ✅ 错误码说明

---

## 🧪 测试指南

### 单元测试

```bash
# 运行所有单元测试
pnpm nx test api

# 运行特定测试文件
pnpm nx test api --testPathPattern=DashboardStatisticsAggregateService

# 测试覆盖率
pnpm nx test api --coverage
```

### 集成测试

```bash
# 启动测试数据库
docker-compose -f docker-compose.test.yml up -d

# 运行集成测试
pnpm nx test api --testPathPattern=e2e
```

### E2E 测试

```bash
# 启动完整服务
docker-compose up -d

# 运行 E2E 测试
pnpm nx e2e api-e2e
```

---

## 📊 代码质量

### ESLint

```bash
# 检查代码规范
pnpm nx lint api
pnpm nx lint shared-contracts

# 自动修复
pnpm nx lint api --fix
```

### TypeScript

```bash
# 类型检查
pnpm nx build api
pnpm nx build shared-contracts
```

---

## 🐛 调试技巧

### 1. 查看 Redis 数据

```bash
# 进入 Redis CLI
docker exec -it dailyuse_redis redis-cli

# 查看所有 Dashboard 缓存 key
KEYS dashboard:stats:*

# 查看特定用户的缓存
GET dashboard:stats:user-123

# 查看 TTL
TTL dashboard:stats:user-123
```

### 2. 日志调试

```typescript
// 在代码中添加日志
this.logger.debug(`Aggregating statistics for ${accountUuid}`);
this.logger.error(`Failed to aggregate statistics`, error.stack);
```

### 3. VS Code 调试配置

`.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug API",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["nx", "serve", "api"],
  "console": "integratedTerminal"
}
```

---

## 📚 参考资源

### 项目文档

- [Sprint 1 Kickoff](./SPRINT_1_KICKOFF.md) - 任务详细说明
- [Product Requirements V2](./DASHBOARD_PRODUCT_REQUIREMENTS_V2.md) - 产品需求
- [Technical Design V2](./DASHBOARD_TECHNICAL_DESIGN_V2.md) - 技术设计

### 现有代码参考

- Task Statistics: `packages/domain-server/src/task/aggregates/TaskStatistics.ts`
- Goal Statistics: `packages/domain-server/src/goal/aggregates/GoalStatistics.ts`
- Reminder Statistics: `packages/domain-server/src/reminder/aggregates/ReminderStatistics.ts`
- Schedule Statistics: `packages/domain-server/src/schedule/aggregates/ScheduleStatistics.ts`

### 技术文档

- [NestJS Documentation](https://docs.nestjs.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Nx Documentation](https://nx.dev/)

---

## 🤝 协作规范

### Git Commit 规范

```bash
# 格式：<type>(<scope>): <subject> [<task-id>]

# 示例
git commit -m "feat(dashboard): implement DashboardStatisticsDTO [TASK-1.1.1]"
git commit -m "feat(dashboard): add aggregation service [TASK-1.1.2]"
git commit -m "test(dashboard): add unit tests [TASK-1.1.3]"
git commit -m "fix(dashboard): handle null statistics [TASK-1.1.2]"
```

**Type 类型**:

- `feat`: 新功能
- `fix`: Bug 修复
- `test`: 测试
- `refactor`: 重构
- `docs`: 文档
- `chore`: 构建/工具

### Code Review 清单

PR 提交前检查：

- ✅ 所有测试通过
- ✅ 测试覆盖率 ≥ 90%
- ✅ ESLint 无错误
- ✅ TypeScript 类型检查通过
- ✅ 添加了必要的注释
- ✅ 更新了相关文档

---

## ❓ 常见问题（FAQ）

### Q1: Redis 连接失败怎么办？

**A**: 检查 Docker 容器状态：

```bash
docker ps | grep redis

# 如果未运行，启动 Redis
docker-compose up -d redis
```

### Q2: 测试失败怎么办？

**A**:

1. 检查测试数据库是否运行
2. 查看错误日志
3. 清理测试数据库

```bash
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
```

### Q3: 如何查看 API 文档？

**A**: 启动服务后访问：

```
http://localhost:3000/api/docs
```

---

## 🎯 下一步

完成 Sprint 1 后：

- Sprint 2: Widget 系统
- Sprint 3: 用户体验优化
- Sprint 4: 测试与发布

---

**文档状态**: ✅ 已完成  
**最后更新**: 2025-11-12  
**维护人**: Bmad Master Agent

需要帮助？联系 Tech Lead 或查看项目文档。

🚀 Happy Coding!
