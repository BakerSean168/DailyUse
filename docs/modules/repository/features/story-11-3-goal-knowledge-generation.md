# Story 11-3: 目标创建时自动生成关联知识文档

## 概述
当用户通过 AI 创建目标时，自动在知识库中生成与该目标相关的知识文档，帮助用户快速了解目标相关的背景知识。

## 用户故事
作为一个目标管理用户，我希望在创建目标时自动生成相关的知识文档，以便我能更好地了解和完成目标。

## 验收标准

### AC1: 集成到 Goal AI 生成流程
- [x] 在 AI 生成目标对话框中添加「同时生成知识文档」选项（默认关闭）
- [x] 目标创建成功后，自动触发知识文档生成

### AC2: 知识文档生成
- [x] 根据目标名称和描述，生成相关的知识文档
- [x] 文档结构包含：目标概述、核心概念、学习路径、资源推荐、常见问题、最佳实践
- [x] 生成的文档自动关联目标（通过 tags 和 frontmatter goalUuid）

### AC3: 仓库和文件夹管理
- [x] 如果用户没有知识库，自动创建默认知识库「我的知识库」
- [x] 知识文档保存在 `/{目标名称}/` 文件夹下
- [x] 自动创建必要的文件夹结构

### AC4: 用户体验
- [x] 生成完成后显示成功提示
- [ ] 支持取消生成（可选，后续迭代）

## 实现细节

### 修改的文件
1. `AIGoalGenerateDialog.vue` - 添加「同时生成知识文档」开关
2. `GoalDialog.vue` - 添加 `onCreated` 回调支持
3. `App.vue` - 实现知识文档生成逻辑

### 技术要点
- `aiService.generateGoalKnowledge()` - 流式生成目标相关知识
- `repositoryApiClient.createRepository/createFolder/createResource` - 创建仓库结构
- GoalDialog `openForCreate` 支持回调函数，在目标创建成功后触发

## UI 设计

### Goal AI 生成对话框增强
```
┌─ AI 生成目标 ─────────────────────────────┐
│                                            │
│  描述你的目标：                            │
│  ┌──────────────────────────────────────┐  │
│  │ 我想学习 Kubernetes 容器编排技术     │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ☑ 同时生成关联知识文档                    │  ← 新增
│    └ 保存至: 我的知识库/Kubernetes学习     │
│                                            │
│             [ 取消 ]  [ 🚀 生成 ]           │
└────────────────────────────────────────────┘
```

### 生成进度
```
┌─ 生成中... ────────────────────────────────┐
│                                            │
│  ✅ 目标创建成功                           │
│  ⏳ 正在生成知识文档...                    │
│                                            │
│  📄 Kubernetes 核心概念                    │
│  ━━━━━━━━━━━━━━━━━━━━ 45%                  │
│                                            │
└────────────────────────────────────────────┘
```

### 完成提示
```
┌─ 生成完成 ─────────────────────────────────┐
│                                            │
│  ✅ 目标「学习 Kubernetes」创建成功        │
│  ✅ 知识文档已生成                         │
│                                            │
│  📁 我的知识库/Kubernetes学习/             │
│     ├── 概述.md                            │
│     ├── 核心概念.md                        │
│     └── 学习路径.md                        │
│                                            │
│     [ 查看文档 ]  [ 完成 ]                  │
└────────────────────────────────────────────┘
```

## 技术实现

### 修改文件
- `apps/web/src/modules/goal/presentation/components/GoalAIAssistant.vue` - 添加知识生成选项
- `apps/web/src/modules/goal/application/services/goalAIService.ts` - 集成知识生成逻辑
- `apps/api/src/modules/repository/` - 新增知识文档生成 API

### 知识文档 Prompt
```
你是一个学习规划专家。用户刚刚设定了一个目标，请为该目标生成相关的知识文档。

目标名称：{goalName}
目标描述：{goalDescription}

请生成以下内容：
1. **概述**：该领域的基本介绍
2. **核心概念**：需要掌握的关键概念
3. **学习路径**：建议的学习顺序和阶段
4. **资源推荐**：推荐的学习资源（书籍、课程、网站等）
5. **常见问题**：初学者常见的问题和解答

使用 Markdown 格式，结构清晰。
```

### API 接口
```typescript
// POST /api/v1/repositories/knowledge/generate
interface GenerateKnowledgeRequest {
  repositoryUuid?: string; // 可选，不传则创建默认仓库
  folderName: string;      // 目标名称作为文件夹名
  topic: string;           // 主题
  description: string;     // 详细描述
}

interface GenerateKnowledgeResponse {
  repositoryUuid: string;
  folderUuid: string;
  resources: Array<{
    uuid: string;
    name: string;
    path: string;
  }>;
}
```

## 优先级
🔥 高 - 核心功能，提升目标模块价值

## 预估工时
3 小时

## 依赖
- Story 11-2 AI 知识文档生成基础能力
- 现有的 Goal AI 生成流程
