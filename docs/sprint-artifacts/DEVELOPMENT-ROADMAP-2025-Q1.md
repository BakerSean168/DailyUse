# 🚀 DailyUse 开发路线图 - 2025 Q1

## 📊 当前状态总览

**已完成 EPICs**:
- ✅ EPIC-002: Desktop Application Development (12 stories) 
- ✅ EPIC-004: Offline Sync (8 stories)
- ✅ EPIC-005: Backend Sync Service (8 stories)
- ✅ EPIC-009: Cloud Sync Integration (14 stories) - **刚完成! 🎉**

**待开发 EPICs** (29 stories):
- 📋 EPIC-006: Smart Productivity (5 stories)
- 📋 EPIC-007: Pomodoro & Focus Mode (5 stories)
- 📋 EPIC-008: Habits & Streaks (6 stories)
- 📋 EPIC-009 扩展: 缺失的适配器和UI (13 stories)

---

## 🎯 开发优先级策略

### Phase 1: 核心功能增强 (优先级 P0-P1)
重点：完成核心用户体验功能，增强产品价值

**Sprint 1: EPIC-006 Smart Productivity (2 周)**
- STORY-027: 智能任务分解 (3天) - P1 🎯
- STORY-028: 智能时间预估 (2天) - P1
- STORY-029: 智能优先级建议 (2天) - P2
- STORY-030: 每日智能规划 (3天) - P1
- STORY-031: 周期性复盘报告 (2天) - P2

**Sprint 2: EPIC-007 Pomodoro & Focus (1.5 周)**
- STORY-032: 番茄钟计时器 (2天) - P1 🎯
- STORY-033: 专注模式 UI (2天) - P1
- STORY-034: 白噪音音乐 (1天) - P2
- STORY-035: 专注流量追踪 (2天) - P2
- STORY-036: 专注统计成就 (2天) - P2

**Sprint 3: EPIC-008 Habits & Streaks (2 周)**
- STORY-037: 习惯创建管理 (3天) - P1 🎯
- STORY-038: 习惯打卡 Streak (2天) - P1
- STORY-039: 习惯热力图 (2天) - P2
- STORY-040: 习惯提醒通知 (2天) - P1
- STORY-041: 习惯数据分析 (2天) - P2
- STORY-042: 习惯养成挑战 (2天) - P3

### Phase 2: EPIC-009 补充实现 (优先级 P2)
完成 EPIC-009 缺失的8个故事

**Sprint 4: EPIC-009 补充 (2 周)**
- STORY-046: 坚果云适配器 (2天) - P2
- STORY-047: Dropbox适配器 (2天) - P2
- STORY-049: 多服务商管理 (3天) - P2
- STORY-050: 同步状态监控 (2天) - P2
- STORY-051: 数据导出功能 (2天) - P2
- STORY-052: 数据导入功能 (2天) - P2
- STORY-053: 设置面板 (2天) - P2
- STORY-054: 密钥管理UI (2天) - P2

---

## 📅 开发时间表 (2025 Q1)

| 周数 | Sprint | Epic | Stories | 工时 | 关键交付物 |
|------|--------|------|---------|------|-----------|
| **Week 1-2** | Sprint 1 | EPIC-006 | STORY-027~031 | 12天 | AI智能功能 |
| **Week 3-4** | Sprint 2 | EPIC-007 | STORY-032~036 | 9天 | 番茄钟专注 |
| **Week 5-6** | Sprint 3 | EPIC-008 | STORY-037~042 | 13天 | 习惯追踪 |
| **Week 7-8** | Sprint 4 | EPIC-009补充 | STORY-046~054 | 15天 | 云同步完善 |

**总计**: 8周, 49工作日, ~6个自然月 (考虑周末和迭代)

---

## 🎯 第一个故事: STORY-027 智能任务分解

### 📋 故事详情

**Story ID**: STORY-027  
**Epic**: EPIC-006 Smart Productivity  
**优先级**: P1 (高优先级)  
**预估工时**: 3天  

**用户故事**:
> 作为用户，我希望 AI 能将我的目标自动分解为可执行的子任务，以便于快速开始行动。

**功能范围**:
- 目标 → 任务自动分解
- 任务复杂度评估
- 依赖关系识别
- 时间线建议

### 🏗️ 技术方案

**模块设计**:
```
Goal 模块扩展:
├── 新增字段: 
│   ├── aiAnalysisEnabled: boolean
│   ├── decompositionHistory: DecompositionResult[]
│   └── lastAIAnalysisAt: Date
│
├── 新增方法:
│   ├── analyzeGoalDecomposition(): Promise<DecompositionResult>
│   └── applyDecomposedTasks(): Promise<Task[]>
│
└── 依赖新服务:
    └── TaskDecompositionService (新建)
```

**新增基础设施**:
```
apps/desktop/src/main/services/ai/
├── TaskDecompositionService.ts (主服务)
├── AIPromptTemplates.ts (提示词模板)
├── AIResultCache.ts (结果缓存)
└── types.ts (类型定义)

packages/application-client/src/ai/
├── IAIService.ts (接口)
└── AIServiceFactory.ts (工厂)
```

### 📦 依赖管理

**已有依赖**:
- ✅ Goal 聚合根 (packages/domain-client/src/goal/)
- ✅ Task 聚合根 (packages/domain-client/src/task/)
- ✅ DI 容器 (InversifyJS)

**新增依赖**:
```json
{
  "dependencies": {
    "openai": "^4.65.0",
    "@anthropic-ai/sdk": "^0.31.0"
  }
}
```

### 🎨 用户交互流程

```
1. 用户在目标详情页点击 "AI 智能分解"
   ↓
2. 系统调用 TaskDecompositionService.analyze()
   ↓
3. AI 分析目标内容，生成分解建议
   ↓
4. 展示分解结果预览（可编辑）
   ↓
5. 用户确认后，创建子任务并关联目标
   ↓
6. 更新目标状态和进度
```

### ✅ 验收标准

- [ ] 点击"AI分解"后3秒内返回分解结果
- [ ] 生成3-8个合理的子任务
- [ ] 每个子任务有清晰的描述和预估时长
- [ ] 识别任务间的依赖关系
- [ ] 支持手动编辑AI建议
- [ ] 分解结果可缓存，避免重复分析
- [ ] 错误处理：AI服务不可用时友好提示
- [ ] 单元测试覆盖率 ≥ 80%

---

## 🚀 开始开发建议

### 选项 1: 按计划顺序开发 (推荐)
从 STORY-027 开始，按 Sprint 顺序逐个完成

### 选项 2: 快速价值交付
优先开发 P1 故事:
1. STORY-027 (智能任务分解)
2. STORY-032 (番茄钟)
3. STORY-037 (习惯管理)
4. STORY-030 (每日规划)

### 选项 3: 完成 EPIC-009 补充
先完成 STORY-046~054，使云同步功能完整

---

## 📋 下一步行动

**立即开始**:
```bash
# 1. 创建 STORY-027 开发分支
git checkout -b feature/STORY-027-ai-task-decomposition

# 2. 创建故事上下文文档
# (BMM workflow: *story-context for STORY-027)

# 3. 开始开发
# (BMM workflow: *dev-story for STORY-027)
```

**需要决策**:
- [ ] 选择 AI 提供商（OpenAI GPT-4 / Anthropic Claude / 本地模型）
- [ ] 确定 API key 管理方式（用户自带 / 应用代付）
- [ ] 确定分解策略（全量分解 / 渐进式分解）

---

## 🎉 2025 Q1 里程碑

- **Week 2**: 完成 EPIC-006，发布 v2.1.0 (AI 智能功能)
- **Week 4**: 完成 EPIC-007，发布 v2.2.0 (番茄钟专注)
- **Week 6**: 完成 EPIC-008，发布 v2.3.0 (习惯追踪)
- **Week 8**: 完成 EPIC-009补充，发布 v2.4.0 (云同步完整版)

🎯 **Q1 目标**: 发布 4 个功能版本，实现 29 个新故事，提升产品竞争力！
