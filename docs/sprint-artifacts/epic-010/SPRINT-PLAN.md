# EPIC-010 Sprint 规划

> **EPIC**: Desktop 全面 DDD 模块化重构  
> **总预估**: 112 小时  
> **Sprint 数量**: 4 个 Sprint

---

## Story 文件索引

| Story | 文件 | 工时 | 优先级 |
|-------|------|------|--------|
| STORY-001 | [STORY-001-infrastructure-setup.md](./stories/STORY-001-infrastructure-setup.md) | 4h | P0 |
| STORY-002 | [STORY-002-goal-module.md](./stories/STORY-002-goal-module.md) | 8h | P0 |
| STORY-003 | [STORY-003-task-module.md](./stories/STORY-003-task-module.md) | 16h | P0 |
| STORY-004 | [STORY-004-schedule-module.md](./stories/STORY-004-schedule-module.md) | 12h | P0 |
| STORY-005 | [STORY-005-reminder-module.md](./stories/STORY-005-reminder-module.md) | 12h | P0 |
| STORY-006 | [STORY-006-notification-module.md](./stories/STORY-006-notification-module.md) | 8h | P0 |
| STORY-007 | [STORY-007-dashboard-module.md](./stories/STORY-007-dashboard-module.md) | 6h | P1 |
| STORY-008 | [STORY-008-ai-module.md](./stories/STORY-008-ai-module.md) | 10h | P1 |
| STORY-009 | [STORY-009-account-auth-module.md](./stories/STORY-009-account-auth-module.md) | 6h | P1 |
| STORY-010 | [STORY-010-repository-module.md](./stories/STORY-010-repository-module.md) | 8h | P1 |
| STORY-011 | [STORY-011-setting-module.md](./stories/STORY-011-setting-module.md) | 4h | P2 |
| STORY-012 | [STORY-012-editor-module.md](./stories/STORY-012-editor-module.md) | 6h | P2 |
| STORY-013 | [STORY-013-initialization.md](./stories/STORY-013-initialization.md) | 4h | P1 |
| STORY-014 | [STORY-014-cleanup-testing.md](./stories/STORY-014-cleanup-testing.md) | 8h | P1 |

---

## Sprint 概览

| Sprint | 主题 | Stories | 预估工时 | 目标 |
|--------|------|---------|----------|------|
| Sprint 1 | 基础设施 + 核心模块 | Story 1, 2, 3 | 28h | 完成基础架构和最复杂的 Task 模块 |
| Sprint 2 | 时间相关模块 | Story 4, 5, 6 | 32h | 完成 Schedule、Reminder、Notification |
| Sprint 3 | 辅助模块 | Story 7, 8, 9, 10 | 30h | 完成 Dashboard、AI、Account、Repository |
| Sprint 4 | 收尾 | Story 11, 12, 13, 14 | 22h | 完成 Setting、Editor、初始化、清理测试 |

---

## Sprint 1: 基础设施 + 核心模块

**周期**: Week 1-2  
**目标**: 建立基础架构，完成最复杂的 Task 模块作为模板

### Stories
| ID | 标题 | 预估 | 优先级 | 依赖 |
|----|------|------|--------|------|
| STORY-001 | 基础设施准备 | 4h | P0 | - |
| STORY-002 | Goal 模块完善 | 8h | P0 | STORY-001 |
| STORY-003 | Task 模块完整实现 | 16h | P0 | STORY-001 |

### 里程碑
- [ ] `@dailyuse/application-server` 正确引用
- [ ] `modules/` 目录结构建立
- [ ] Task 模块 36+ IPC channels 全部实现
- [ ] Goal 模块 ApplicationService 重构完成

### 验收标准
1. Task 模块所有 IPC channels 返回真实数据
2. Goal 模块复用 ApplicationService
3. 模块化目录结构符合规范

---

## Sprint 2: 时间相关模块

**周期**: Week 3-4  
**目标**: 完成所有时间相关功能模块

### Stories
| ID | 标题 | 预估 | 优先级 | 依赖 |
|----|------|------|--------|------|
| STORY-004 | Schedule 模块完整实现 | 12h | P0 | STORY-001 |
| STORY-005 | Reminder 模块完整实现 | 12h | P0 | STORY-001 |
| STORY-006 | Notification 模块重构 | 8h | P1 | STORY-005 |

### 里程碑
- [ ] Schedule 22 IPC channels 实现
- [ ] Reminder 20 IPC channels 实现
- [ ] Notification 模块 DDD 重构
- [ ] 原生通知服务迁移

### 验收标准
1. 日程、提醒功能完整可用
2. 系统通知正常工作
3. DND 功能保留

---

## Sprint 3: 辅助模块

**周期**: Week 5-6  
**目标**: 完成所有辅助功能模块

### Stories
| ID | 标题 | 预估 | 优先级 | 依赖 |
|----|------|------|--------|------|
| STORY-007 | Dashboard 模块完善 | 6h | P1 | STORY-003, 004, 005 |
| STORY-008 | AI 模块完整实现 | 10h | P1 | STORY-001 |
| STORY-009 | Account & Auth 模块完善 | 6h | P1 | STORY-001 |
| STORY-010 | Repository 模块完善 | 8h | P1 | STORY-001 |

### 里程碑
- [ ] Dashboard 聚合数据正确
- [ ] AI 对话功能可用
- [ ] 账户认证流程完整
- [ ] 文件仓库管理可用

### 验收标准
1. Dashboard 显示所有模块统计
2. AI 功能端到端可用
3. 登录注册流程正常

---

## Sprint 4: 收尾

**周期**: Week 7-8  
**目标**: 完成剩余模块，统一初始化，清理测试

### Stories
| ID | 标题 | 预估 | 优先级 | 依赖 |
|----|------|------|--------|------|
| STORY-011 | Setting 模块完整实现 | 4h | P1 | STORY-001 |
| STORY-012 | Editor 模块新增 | 6h | P2 | STORY-001 |
| STORY-013 | 初始化流程统一 | 4h | P1 | 所有模块 |
| STORY-014 | 清理与测试 | 8h | P0 | 所有模块 |

### 里程碑
- [ ] Setting 功能完整
- [ ] Editor 基础功能可用
- [ ] InitializationManager 集成
- [ ] 旧代码清理完成
- [ ] 测试覆盖达标

### 验收标准
1. 所有模块功能完整
2. 无 TODO 占位符
3. 启动性能不退化
4. 测试通过率 100%

---

## 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| application-server 包 API 不完整 | 高 | 中 | 提前检查，必要时扩展包 |
| IPC channel 命名与 Renderer 不一致 | 中 | 高 | 参考现有 preload 定义 |
| SQLite 适配器与 ApplicationService 类型不匹配 | 高 | 中 | 添加适配层转换 |
| 启动性能下降 | 中 | 低 | 保持懒加载策略 |

---

## 技术债务清单

完成 EPIC 后需要处理的技术债务：

1. [ ] Renderer 层 hooks 模块化（后续 EPIC）
2. [ ] 统一错误处理机制
3. [ ] IPC 类型安全增强
4. [ ] E2E 测试补充

---

## 相关文档

- [EPIC-010 主文档](./EPIC-010-DESKTOP-FULL-DDD-REFACTOR.md)
- [Story 文件目录](./epic-010/stories/)
