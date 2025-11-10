# AI 功能快速实施指南

**基于**: AI_FEATURE_DESIGN.md  
**目标**: 6 周内完成 MVP  
**开发者**: 1-2 人

---

## 🚀 第一周任务清单

### Day 1-2: 项目准备

- [ ] **创建 ai-core 包**
  ```bash
  pnpm nx g @nx/js:library ai-core --directory=packages --bundler=tsup
  ```

- [ ] **安装依赖**
  ```bash
  cd packages/ai-core
  pnpm add ai @ai-sdk/openai @ai-sdk/anthropic zod
  pnpm add -D @types/node
  ```

- [ ] **数据库 Schema 扩展**
  - 编辑 `apps/api/prisma/schema.prisma`
  - 添加 AI 配置字段到 user_settings
  - 运行 `pnpm prisma db push`

### Day 3-4: AI 配置界面

- [ ] **前端: 设置面板**
  - 创建 `apps/web/src/modules/setting/presentation/components/AISettings.vue`
  - 表单字段: provider, apiKey, model
  - API Key 输入框（密码型，带验证按钮）

- [ ] **Store: AI 配置管理**
  - 扩展 `userSettingStore.ts`
  - 添加 `updateAIConfig()` 方法
  - 实现 API Key 加密（crypto-js AES-256）

### Day 5: AI Core 基础

- [ ] **创建 BaseAIAdapter**
  ```typescript
  // packages/ai-core/src/adapters/BaseAIAdapter.ts
  export abstract class BaseAIAdapter {
    abstract generate(prompt: string, options?: any): Promise<AIResponse>;
    abstract streamGenerate(prompt: string): AsyncGenerator<string>;
  }
  ```

- [ ] **实现 OpenAIAdapter**
  ```typescript
  // packages/ai-core/src/adapters/OpenAIAdapter.ts
  import { createOpenAI } from '@ai-sdk/openai';
  import { generateText, streamText } from 'ai';
  ```

---

## 🎯 第二周任务清单

### Day 1-2: 浮动按钮 UI

- [ ] **创建 AI 助手模块**
  ```bash
  mkdir -p apps/web/src/modules/ai-assistant/presentation/{components,stores}
  ```

- [ ] **AIFloatingButton.vue**
  - 位置: fixed, bottom: 80px, right: 24px
  - 图标: ✨ + 呼吸动画
  - 状态指示（绿/黄/红光环）
  - Ctrl+K 快捷键支持

### Day 3-4: 聊天面板

- [ ] **AIChatPanel.vue**
  - 尺寸: 420px × 600px
  - 可拖拽（vue-draggable）
  - 消息列表 + 输入框
  - Markdown 渲染（marked.js）

- [ ] **aiAssistantStore.ts**
  ```typescript
  export const useAIAssistantStore = defineStore('aiAssistant', () => {
    const isOpen = ref(false);
    const messages = ref<Message[]>([]);
    const isLoading = ref(false);
    
    async function sendMessage(content: string) {
      // 调用 AI Core
    }
    
    return { isOpen, messages, sendMessage };
  });
  ```

### Day 5: 基础对话测试

- [ ] **AIService 集成**
  ```typescript
  // packages/ai-core/src/services/AIService.ts
  export class AIService {
    private adapter: BaseAIAdapter;
    
    async chat(message: string) {
      return this.adapter.generate(message);
    }
  }
  ```

- [ ] **E2E 测试**
  - 打开浮动按钮
  - 输入"你好"
  - 验证 AI 回复

---

## 📋 第三周任务清单

### Day 1-3: Goal KR 生成插件

- [ ] **GoalPlugin.ts**
  ```typescript
  export class GoalPlugin implements AIPlugin {
    async generateKRs(goal: string) {
      const prompt = `
        目标: ${goal}
        生成 3 个 SMART 关键结果...
      `;
      return this.aiService.generate(prompt);
    }
  }
  ```

- [ ] **Prompt 模板设计**
  - 参考设计文档的 Prompt 示例
  - 输出 JSON 格式
  - 包含 title, metric_type, target_value

- [ ] **GoalKRGenerator.vue**
  - 卡片式展示生成的 KRs
  - 每个 KR 可编辑/删除
  - "重新生成" + "保存到 Goal" 按钮

### Day 4-5: 集成到 Goal 创建页

- [ ] **Goal 创建表单集成**
  - 添加 "AI 生成 KR" 按钮
  - 点击后弹出输入框
  - 调用 GoalPlugin
  - 将结果填充到表单

- [ ] **流式响应优化**
  - 使用 streamGenerate()
  - 逐个 KR 显示（打字机效果）

---

## 📚 第四周任务清单

### Day 1-2: 通用聊天增强

- [ ] **ContextBuilder**
  ```typescript
  export class ContextBuilder {
    getCurrentContext() {
      const route = useRoute();
      if (route.path.includes('/goal')) {
        return { module: 'goal', action: 'create' };
      }
      // ...
    }
  }
  ```

- [ ] **上下文感知提示**
  - 检测当前页面
  - 显示相关快捷指令
  - 自动注入上下文到 prompt

### Day 3-4: 知识库摘要

- [ ] **KnowledgePlugin.ts**
  ```typescript
  async summarize(document: string) {
    const prompt = `
      请为以下文档生成摘要（200字以内）：
      ${document}
    `;
    return this.aiService.generate(prompt);
  }
  ```

- [ ] **DocumentSummary.vue**
  - "生成摘要" 按钮
  - 显示摘要 + 关键要点
  - 可保存到文档元数据

### Day 5: 多轮对话支持

- [ ] **ConversationManager**
  - 保留最近 5 条历史
  - 构建对话上下文
  - 发送给 AI

---

## 🧪 第五周任务清单

### Day 1-2: Task 生成插件

- [ ] **扩展 GoalPlugin**
  ```typescript
  async generateTasks(goal: Goal, krs: KR[]) {
    const prompt = `
      目标: ${goal.title}
      关键结果: ${krs.map(kr => kr.title).join(', ')}
      
      生成 3-5 个任务模板...
    `;
    return this.aiService.generate(prompt);
  }
  ```

- [ ] **TaskTemplateGenerator.vue**
  - 类似 GoalKRGenerator
  - 展示任务列表
  - 批量添加到 Goal

### Day 3-5: 性能优化

- [ ] **请求队列**
  ```typescript
  class RequestQueue {
    private queue: Promise<any>[] = [];
    private maxConcurrent = 3;
    
    async add<T>(fn: () => Promise<T>) {
      if (this.queue.length >= this.maxConcurrent) {
        await Promise.race(this.queue);
      }
      // ...
    }
  }
  ```

- [ ] **缓存层**
  - LRU Cache（最近 100 个查询）
  - TTL 1 小时
  - 基于 prompt hash

- [ ] **熔断器**
  - 3 次失败后打开
  - 30 秒后尝试恢复
  - 降级到模板

---

## ✅ 第六周任务清单

### Day 1-2: 测试

- [ ] **单元测试**
  ```bash
  pnpm nx test ai-core
  pnpm nx test ai-assistant
  ```
  - BaseAIAdapter
  - GoalPlugin
  - KnowledgePlugin
  - 覆盖率 > 80%

- [ ] **集成测试**
  - AI 配置保存/加载
  - 聊天发送/接收
  - KR 生成/保存

- [ ] **E2E 测试**
  - 完整 Goal 创建流程
  - 知识库摘要流程
  - 快捷键唤起

### Day 3-4: 监控埋点

- [ ] **Analytics 集成**
  ```typescript
  analytics.track('ai_panel_opened', { source: 'fab' });
  analytics.track('ai_query_sent', { plugin: 'goal', length: 50 });
  analytics.track('ai_suggestion_accepted', { plugin: 'goal' });
  ```

- [ ] **性能监控**
  - 响应时间追踪
  - 成功率统计
  - 错误日志

### Day 5: 文档 + 发布

- [ ] **用户文档**
  - 如何配置 AI API
  - 如何使用 AI 生成 Goal
  - 快捷指令列表

- [ ] **发布 Checklist**
  - ✅ 所有测试通过
  - ✅ 无 TypeScript 错误
  - ✅ API Key 加密验证
  - ✅ 性能达标（< 5s）
  - ✅ 文档完整

---

## 🛠️ 关键命令

```bash
# 创建包
pnpm nx g @nx/js:library ai-core --directory=packages

# 运行开发服务器
pnpm nx serve web
pnpm nx serve api

# 运行测试
pnpm nx test ai-core
pnpm nx test web --testFile=ai-assistant

# 构建
pnpm nx build ai-core
pnpm nx build web

# 数据库
cd apps/api
pnpm prisma db push
pnpm prisma studio
```

---

## 📊 进度追踪

| 周 | 任务 | 状态 | 完成度 |
|----|------|------|--------|
| Week 1 | 基础设施 | ⏳ | 0% |
| Week 2 | UI 组件 | ⏳ | 0% |
| Week 3 | Goal 插件 | ⏳ | 0% |
| Week 4 | 通用聊天 + KB | ⏳ | 0% |
| Week 5 | Task + 优化 | ⏳ | 0% |
| Week 6 | 测试 + 发布 | ⏳ | 0% |

---

## 🎯 成功标准

**MVP 完成条件**:
- ✅ 用户可配置 AI API（OpenAI/Anthropic）
- ✅ 浮动按钮可用（Ctrl+K 唤起）
- ✅ 通用 AI 聊天功能正常
- ✅ Goal KR 生成可用（< 5s 响应）
- ✅ 知识库摘要可用
- ✅ 单元测试覆盖率 > 80%
- ✅ E2E 核心流程通过
- ✅ 无安全漏洞（API Key 加密）

---

**准备好开始了吗？从第一周的 Day 1 开始！** 🚀
