---
tags:
  - contributing
  - guide
  - collaboration
description: 如何为DailyUse项目做贡献
created: 2025-11-23T15:00:00
updated: 2025-11-23T15:00:00
---

# 🤝 Contributing Guide

感谢你考虑为 DailyUse 做贡献！本指南将帮助你顺利开始。

## 🎯 贡献方式

你可以通过多种方式为项目做贡献：

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 💻 提交代码
- 🎨 优化 UI/UX
- 🧪 编写测试
- 📊 性能优化

## 🚀 快速开始

### 1. Fork 并克隆项目

```bash
# Fork 项目到你的 GitHub 账号
# 然后克隆你的 Fork
git clone https://github.com/YOUR_USERNAME/DailyUse.git
cd DailyUse

# 添加上游仓库
git remote add upstream https://github.com/BakerSean168/DailyUse.git
```

### 2. 创建分支

```bash
# 从 main 分支创建新分支
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

### 3. 进行修改

```bash
# 安装依赖
pnpm install

# 进行你的修改
# ...

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 格式化代码
pnpm format
```

### 4. 提交变更

```bash
# 添加文件
git add .

# 提交（遵循 Conventional Commits）
git commit -m "feat: add awesome feature"

# 推送到你的 Fork
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

1. 访问你的 Fork 仓库
2. 点击 "New Pull Request"
3. 选择 base: `main` ← compare: `feature/your-feature-name`
4. 填写 PR 描述（使用模板）
5. 提交 PR

## 📝 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不新增功能也不修复 Bug）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建工具或辅助工具的变动

### Scope 范围（可选）

模块名称，如：`goal`、`task`、`reminder`、`api`、`web`

### 示例

```bash
# 好的提交信息
git commit -m "feat(goal): add goal progress visualization"
git commit -m "fix(api): resolve authentication token expiry issue"
git commit -m "docs: update quick start guide"

# 不好的提交信息
git commit -m "update code"
git commit -m "fix bug"
git commit -m "changes"
```

## 🐛 报告 Bug

### 提交 Bug 前请检查

1. 搜索是否已有类似的 Issue
2. 确认是最新版本的 Bug
3. 尝试最小化重现步骤

### Bug 报告模板

```markdown
## Bug 描述
简要描述遇到的问题

## 重现步骤
1. 进入 '...'
2. 点击 '...'
3. 看到错误

## 预期行为
描述你期望发生什么

## 实际行为
描述实际发生了什么

## 环境信息
- OS: [e.g. Windows 11]
- Node.js: [e.g. 22.20.0]
- DailyUse 版本: [e.g. 1.2.0]

## 截图
如果适用，添加截图

## 附加信息
其他相关信息
```

## 💡 功能建议

### 提交建议前请检查

1. 搜索是否已有类似的建议
2. 确认符合项目定位
3. 考虑实现的可行性

### 功能建议模板

```markdown
## 功能描述
简要描述建议的功能

## 用户故事
作为 [角色]，我希望 [功能]，以便 [价值]

## 详细设计
描述功能的详细设计

## 可选方案
描述其他可行的实现方案

## 影响范围
这个功能会影响哪些模块

## 附加信息
其他相关信息
```

## 💻 代码规范

### TypeScript 规范

- 使用 TypeScript 严格模式
- 为所有函数添加类型注解
- 避免使用 `any` 类型
- 使用接口定义数据结构

```typescript
// ✅ 好的代码
interface Goal {
  uuid: string;
  title: string;
  deadline: Date;
}

async function createGoal(data: Goal): Promise<Goal> {
  // ...
}

// ❌ 不好的代码
function createGoal(data: any): any {
  // ...
}
```

### Vue 组件规范

- 使用 Composition API
- 使用 `<script setup>` 语法
- Props 和 Emits 明确类型定义
- 组件名使用 PascalCase

```vue
<!-- ✅ 好的组件 -->
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
}

interface Emits {
  (e: 'update', value: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
});

const emit = defineEmits<Emits>();
</script>
```

### 命名规范

- **文件名**: `kebab-case.ts`
- **类名**: `PascalCase`
- **函数名**: `camelCase`
- **常量**: `UPPER_SNAKE_CASE`
- **私有成员**: `_camelCase`

### 目录结构

遵循项目现有的目录结构：

```
apps/web/src/modules/{module}/
├── domain/          # 领域层
├── application/     # 应用层
├── infrastructure/  # 基础设施层
└── presentation/    # 表示层
    ├── components/  # 组件
    ├── views/       # 视图
    └── composables/ # 组合式函数
```

## 🧪 测试要求

### 必须编写测试的情况

- ✅ 新功能必须有单元测试
- ✅ Bug 修复必须有回归测试
- ✅ 公共 API 必须有测试
- ✅ 复杂业务逻辑必须有测试

### 测试指南

```typescript
// 使用 Vitest
import { describe, it, expect } from 'vitest';

describe('GoalService', () => {
  it('should create a new goal', async () => {
    // Arrange
    const data = { title: 'Learn TypeScript', deadline: new Date() };
    
    // Act
    const goal = await goalService.create(data);
    
    // Assert
    expect(goal.uuid).toBeDefined();
    expect(goal.title).toBe(data.title);
  });
});
```

## 📖 文档要求

### 代码注释

- 复杂逻辑必须添加注释
- 使用 JSDoc 注释公共 API
- 注释解释"为什么"而非"是什么"

```typescript
/**
 * 计算目标的加权进度
 * 
 * 使用关键结果的权重和完成度计算目标整体进度
 * 权重总和必须等于 100
 * 
 * @param goal - 目标对象
 * @returns 加权进度百分比 (0-100)
 */
function calculateWeightedProgress(goal: Goal): number {
  // ...
}
```

### 更新文档

如果你的修改影响了文档，请同时更新：

- README.md
- 相关模块文档
- API 文档
- 用户指南

## 🔍 Code Review

### 提交 PR 时

- PR 描述清晰，说明"为什么"而非"是什么"
- 链接相关的 Issue
- 截图或 GIF 展示 UI 变化
- 通过所有 CI 检查
- 自我 review 一遍代码

### Review 他人 PR 时

- 礼貌、建设性的反馈
- 解释"为什么"需要修改
- 区分"必须修改"和"建议修改"
- 认可好的实践

## ⚡ 性能指南

- 避免不必要的重新渲染
- 使用 `useMemo`、`useCallback` 优化
- 大列表使用虚拟滚动
- 图片使用懒加载
- 避免阻塞主线程

## 🔐 安全指南

- 永远验证用户输入
- 使用参数化查询防止 SQL 注入
- 敏感信息不提交到代码仓库
- 使用环境变量管理配置

## 📚 相关文档

- [[code-of-conduct|Code of Conduct]] - 行为准则
- [[pull-request-template|PR Template]] - PR 模板
- [[documentation-guide|Documentation Guide]] - 文档指南
- [[../guides/development/coding-standards|Coding Standards]] - 代码规范
- [[../guides/development/testing|Testing Guide]] - 测试指南

## 🎉 贡献者

感谢所有贡献者！

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

## 📞 获取帮助

- 💬 [GitHub Discussions](https://github.com/BakerSean168/DailyUse/discussions)
- 🐛 [GitHub Issues](https://github.com/BakerSean168/DailyUse/issues)
- 📧 Email: baker.sean168@gmail.com

---

**感谢你的贡献！** 🙏

每一个贡献，无论大小，都让 DailyUse 变得更好！
