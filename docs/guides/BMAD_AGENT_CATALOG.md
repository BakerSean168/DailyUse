# BMad Agent 能力与菜单手册

**版本**: 1.0
**日期**: 2025-11-19

本文档详细列出了 BMad 体系中各位 Agent 的专长及其核心菜单命令。

---

## 🧙 BMad Master (总管)

**角色**: 编排者、知识保管人、任务执行引擎。
**擅长**: 协调其他 Agent，回答通用问题，管理全局状态。
**核心菜单**:

- `*help`: 显示菜单。
- `*list-tasks`: 列出所有可用任务。
- `*list-workflows`: 列出所有工作流。
- `*party-mode`: 开启多 Agent 群聊模式 (咨询专家团)。

---

## 📊 Analyst - Mary (业务分析师)

**角色**: 需求挖掘、市场分析。
**擅长**: 将模糊的想法转化为清晰的商业需求，进行头脑风暴。
**核心菜单**:

- `*workflow-init`: **项目启动入口** (推荐)。
- `*brainstorm-project`: 引导头脑风暴。
- `*product-brief`: 生成项目简报。
- `*research`: 引导市场调研。

---

## 📋 Product Manager - John (产品经理)

**角色**: 产品战略、需求定义。
**擅长**: 编写 PRD，拆解 Epics/Stories，定义 MVP。
**核心菜单**:

- `*create-prd`: 创建产品需求文档 (PRD)。
- `*create-epics-and-stories`: 将 PRD 拆解为 Epics 和 Stories。
- `*tech-spec`: 创建技术规格说明书 (针对小型项目)。
- `*validate-prd`: 验证 PRD 质量。

---

## 🎨 UX Designer - Sally (用户体验设计师)

**角色**: 交互设计、用户体验。
**擅长**: 设计用户旅程，定义 UI 规范，提升易用性。
**核心菜单**:

- `*create-design`: 进行设计思维研讨，生成 UX 设计规范。
- `*validate-design`: 验证设计产物。

---

## 🏗️ Architect - Winston (架构师)

**角色**: 系统架构、技术决策。
**擅长**: 数据库设计，API 定义，技术选型，解决扩展性问题。
**核心菜单**:

- `*create-architecture`: 生成架构设计文档 (包含数据模型、API、组件图)。
- `*validate-architecture`: 验证架构合理性。
- `*solutioning-gate-check`: 方案阶段验收。

---

## 🏃 Scrum Master - Bob (敏捷教练)

**角色**: 流程管理、任务准备。
**擅长**: 将需求转化为开发者可执行的 Story，管理 Sprint。
**核心菜单**:

- `*create-story`: 创建详细的 User Story (开发任务)。
- `*story-context`: **关键步骤** - 为 Story 组装代码上下文，准备开发。
- `*sprint-planning`: Sprint 规划。
- `*epic-retrospective`: Epic 回顾。

---

## 💻 Developer - Amelia (开发者)

**角色**: 代码实现、工程落地。
**擅长**: 编写高质量代码，执行测试，代码审查。
**核心菜单**:

- `*develop-story`: **核心开发命令** - 执行 Story 开发流程。
- `*story-done`: 完成 Story (DoD 检查)。
- `*code-review`: 代码审查。

---

## 🧪 Test Architect - Murat (测试架构师)

**角色**: 质量保证、自动化测试。
**擅长**: 设计测试框架，编写自动化测试脚本 (E2E/Integration)。
**核心菜单**:

- `*framework`: 初始化测试框架。
- `*automate`: 生成自动化测试。
- `*test-design`: 设计测试用例。
- `*atdd`: 验收测试驱动开发。

---

## 📚 Tech Writer - Paige (技术文档专家)

**角色**: 文档编写、知识沉淀。
**擅长**: 编写 README，API 文档，用户手册，解释复杂概念。
**核心菜单**:

- `*document-project`: 全面生成项目文档。
- `*improve-readme`: 优化 README。
- `*explain-concept`: 解释技术概念。
- `*generate-diagram`: 生成 Mermaid 图表。
- `*validate-doc`: 验证文档标准。

---
