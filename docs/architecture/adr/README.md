---
tags:
  - adr
  - index
description: 架构决策记录(ADR)索引
created: 2025-11-23T15:00:00
updated: 2025-11-23T15:00:00
---

# Architecture Decision Records (ADR)

> 记录项目中重要的架构决策及其背景和理由

## 📖 什么是 ADR？

ADR (Architecture Decision Record) 是一种记录软件架构决策的轻量级文档格式。每个 ADR 描述：

- **决策背景** - 为什么需要做这个决定？
- **可选方案** - 考虑了哪些选项？
- **最终决策** - 选择了什么方案？
- **决策理由** - 为什么这么选？
- **影响分析** - 这个决策的影响是什么？

## 📋 ADR 列表

### 已采纳 (Accepted)

| ID | 标题 | 日期 | 状态 |
|----|------|------|------|
| [[001-use-nx-monorepo|ADR-001]] | 使用 Nx Monorepo | 2024-08-15 | ✅ 已采纳 |
| [[002-ddd-pattern|ADR-002]] | 采用 DDD 架构模式 | 2024-08-20 | ✅ 已采纳 |
| [[003-event-driven-architecture|ADR-003]] | 事件驱动架构 | 2024-09-01 | ✅ 已采纳 |
| [[004-electron-desktop-architecture|ADR-004]] | Electron 桌面应用架构与包提取策略 | 2025-12-03 | ✅ 已采纳 |

### 提议中 (Proposed)

| ID | 标题 | 日期 | 状态 |
|----|------|------|------|
| - | - | - | - |

### 已废弃 (Deprecated)

| ID | 标题 | 日期 | 原因 |
|----|------|------|------|
| - | - | - | - |

## 🎯 ADR 原则

### 何时创建 ADR？

✅ **应该创建 ADR 的情况**:
- 选择核心技术栈（框架、数据库、语言）
- 架构模式决策（微服务 vs 单体、事件驱动等）
- 重要的设计模式选择
- 影响多个模块的决策
- 有争议或需要权衡的决策

❌ **不需要 ADR 的情况**:
- 日常代码实现细节
- 临时解决方案
- 明显的最佳实践
- 局部重构

### ADR 模板

创建新 ADR 时，使用以下模板：

```markdown
---
tags:
  - adr
  - architecture
  - decision
description: ADR-XXX - [决策简短描述]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# ADR-XXX: [决策标题]

**状态**: 🔄 提议中 / ✅ 已采纳 / ❌ 已废弃  
**日期**: YYYY-MM-DD  
**决策者**: @username  

## 背景

[描述决策背景和问题]

### 可选方案

1. **方案 A**: [描述]
2. **方案 B**: [描述]
3. **方案 C**: [描述]

## 决策

选择 **[方案名称]**

## 理由

### 为什么选择这个方案？

[列出选择理由]

### 为什么不选其他方案？

[说明放弃其他方案的原因]

## 实施

[如何实施这个决策]

## 影响

### 正面影响
[列出好处]

### 负面影响
[列出代价或风险]

## 相关决策

- [[xxx|ADR-XXX: 相关决策]]

## 参考资料

- [相关文档或资源]

---

**教训**: [从这个决策中学到了什么]
```

## 📝 如何贡献 ADR

1. **识别需要决策的架构问题**
2. **收集信息和可选方案**
3. **创建新的 ADR 文档** (使用模板)
4. **与团队讨论** (通过 PR 或会议)
5. **达成共识后标记为"已采纳"**
6. **更新本索引文件**

## 🔍 相关文档

- [[../system-overview|系统架构概览]]
- [[../../concepts/ddd-patterns|DDD 模式指南]]
- [[../../concepts/event-driven|事件驱动架构]]
- [[../../contributing/documentation-guide|文档贡献指南]]

## 📚 延伸阅读

- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)
- [Architecture Decision Records in Action](https://www.thoughtworks.com/insights/blog/architecture/architecture-decision-records-in-action)

---

**注意**: ADR 一旦采纳，应该保持不变。如果决策需要修改，应创建新的 ADR 并标记旧的为"已废弃"。
