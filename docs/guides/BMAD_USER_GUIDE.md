# BMad Agent 使用指南：优雅地构建与维护

**版本**: 1.0
**日期**: 2025-11-19

---

## 1. 核心理念：结构化工作流 (The BMad Method)

BMad 的核心优势在于**结构化**。虽然你可以直接命令 Agent "写代码"，但最优雅、最高质量的方式是遵循 **BMad Method (BMM)** 工作流。这确保了从需求到实现的每一步都有据可依，减少幻觉和返工。

### 1.1 如何优雅地生成新功能

不要直接对 Developer 说 "做个登录功能"。请遵循以下 "接力棒" 流程：

1.  **需求分析 (Analyst/PM)**:
    - 呼叫 `@bmm-analyst` 或 `@bmm-pm`。
    - 运行 `*workflow-init` 开始新项目，或 `*create-prd` 定义新功能。
    - **产出**: PRD 文档 (明确 "做什么" 和 "为什么")。

2.  **故事拆解 (PM)**:
    - 呼叫 `@bmm-pm`。
    - 运行 `*create-epics-and-stories`。
    - **产出**: Epics 和 User Stories (将大需求拆解为可执行的小任务)。

3.  **设计与架构 (UX/Architect)**:
    - 呼叫 `@bmm-ux-designer` 运行 `*create-design` (如果涉及 UI)。
    - 呼叫 `@bmm-architect` 运行 `*create-architecture` (定义数据结构、API、技术栈)。
    - **产出**: 设计规范和架构文档 (明确 "怎么做")。

4.  **任务准备 (Scrum Master)**:
    - 呼叫 `@bmm-sm`。
    - 运行 `*create-story` 为特定功能生成详细的开发任务书。
    - 运行 `*story-context` 组装开发所需的上下文 (代码片段、文档引用)。
    - **产出**: 准备就绪的 Story 文件 (Developer 的行动指南)。

5.  **代码实现 (Developer)**:
    - 呼叫 `@bmm-dev`。
    - 运行 `*develop-story`。
    - **产出**: 高质量、经过测试的代码。

**优雅的秘诀**: 让每个 Agent 做它擅长的事。PM 定义目标，Architect 定义结构，Dev 填补细节。

### 1.2 如何优雅地维护与优化代码

维护不是 "打补丁"，而是 "改进"。

1.  **代码审查 (Developer)**:
    - 呼叫 `@bmm-dev`。
    - 运行 `*code-review` 对现有代码进行深度审查，发现潜在问题。

2.  **架构重构 (Architect)**:
    - 如果系统变得难以维护，呼叫 `@bmm-architect`。
    - 运行 `*create-architecture` (或手动咨询) 来规划重构方案。

3.  **Bug 修复 (Scrum Master + Developer)**:
    - 对于复杂 Bug：呼叫 `@bmm-sm` 创建一个 "Bug Fix Story"，然后由 `@bmm-dev` 执行。
    - 这确保了 Bug 被复现、修复并添加了回归测试。

---

## 2. 常用命令速查

| 目标                     | 推荐 Agent     | 核心命令                            |
| :----------------------- | :------------- | :---------------------------------- |
| **我想做一个新项目**     | Analyst        | `*workflow-init`                    |
| **我想加一个大功能**     | PM             | `*create-prd`                       |
| **我想细化需求**         | PM             | `*create-epics-and-stories`         |
| **我想设计界面**         | UX Designer    | `*create-design`                    |
| **我想设计数据库/API**   | Architect      | `*create-architecture`              |
| **我想开始写代码**       | Scrum Master   | `*create-story` -> `*story-context` |
| **我是开发者，我要干活** | Developer      | `*develop-story`                    |
| **我想修 Bug/重构**      | Developer      | `*code-review` (或直接对话)         |
| **我想补全测试**         | Test Architect | `*automate`                         |
| **我想写文档**           | Tech Writer    | `*document-project`                 |

---

**总结**: 优雅的使用方式是 **"各司其职，文档驱动"**。不要让 Developer 猜需求，也不要让 PM 写代码。
