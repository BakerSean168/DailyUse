# STORY-029: 智能优先级建议

## 📋 Story 概述

**Story ID**: STORY-029  
**Epic**: EPIC-006 (Smart Productivity)  
**优先级**: P2 (增强体验)  
**预估工时**: 2 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: 现有 Task/Goal 模块 ✅

---

## 🎯 用户故事

**作为** DailyUse 用户  
**我希望** 系统能分析多维度因素建议任务优先级  
**以便于** 聚焦最重要的工作，避免被不紧急的事情分散注意力

---

## 📋 验收标准

### 功能验收 - 优先级分析

- [ ] 任务列表显示 AI 建议优先级
- [ ] 基于艾森豪威尔矩阵 (紧急 × 重要)
- [ ] 考虑目标关联度
- [ ] 考虑截止日期临近程度
- [ ] 考虑任务依赖关系

### 功能验收 - 智能排序

- [ ] 任务列表可按 AI 优先级排序
- [ ] 显示优先级理由说明
- [ ] 用户可手动调整优先级
- [ ] 调整后系统学习用户偏好

### 功能验收 - 上下文感知

- [ ] 考虑当前时间段适合的任务类型
- [ ] 考虑用户能量水平曲线
- [ ] 考虑任务所需专注时长
- [ ] 避免同时推荐多个高强度任务

### 功能验收 - 可解释性

- [ ] 显示优先级评分（0-100）
- [ ] 展示关键影响因素
- [ ] 用户可查看详细分析
- [ ] 提供改进建议

---

## 🔧 技术方案

### 优先级计算模型

```typescript
// packages/application-client/src/task/services/PriorityAnalysisService.ts

interface PriorityScore {
  score: number;  // 0-100
  level: 'critical' | 'high' | 'medium' | 'low';
  factors: {
    urgency: number;        // 0-10 (基于截止日期)
    importance: number;     // 0-10 (基于目标关联)
    impact: number;         // 0-10 (完成后的影响)
    effort: number;         // 0-10 (所需时间和复杂度)
    dependencies: number;   // 0-10 (阻塞其他任务)
    momentum: number;       // 0-10 (与当前工作连续性)
  };
  eisenhowerQuadrant: 'urgent-important' | 'not-urgent-important' 
                    | 'urgent-not-important' | 'not-urgent-not-important';
  recommendation: string;
  contextFit: {
    timeOfDay: boolean;     // 当前时段是否适合
    energyLevel: boolean;   // 当前能量是否足够
    focusRequired: number;  // 所需专注度 0-10
  };
}

export class PriorityAnalysisService {
  /**
   * 计算任务优先级
   */
  async analyzePriority(task: Task): Promise<PriorityScore> {
    const factors = {
      urgency: this.calculateUrgency(task.deadline),
      importance: await this.calculateImportance(task),
      impact: await this.calculateImpact(task),
      effort: this.estimateEffort(task),
      dependencies: await this.countDependents(task.id),
      momentum: await this.calculateMomentum(task),
    };

    // 加权求和
    const score = 
      factors.urgency * 0.25 +
      factors.importance * 0.25 +
      factors.impact * 0.20 +
      (10 - factors.effort) * 0.10 +  // 较小努力优先
      factors.dependencies * 0.10 +
      factors.momentum * 0.10;

    return {
      score: Math.round(score * 10),  // 转换为 0-100
      level: this.getLevel(score * 10),
      factors,
      eisenhowerQuadrant: this.classifyEisenhower(
        factors.urgency, 
        factors.importance
      ),
      recommendation: this.generateRecommendation(factors),
      contextFit: await this.analyzeContextFit(task),
    };
  }

  /**
   * 紧急度计算 (基于截止日期)
   */
  private calculateUrgency(deadline?: Date): number {
    if (!deadline) return 3;  // 无截止日期 = 低紧急度
    
    const daysUntil = differenceInDays(deadline, new Date());
    
    if (daysUntil < 0) return 10;  // 已过期 = 最高紧急
    if (daysUntil === 0) return 9; // 今天 = 极高紧急
    if (daysUntil === 1) return 8; // 明天 = 很高紧急
    if (daysUntil <= 3) return 7;  // 3天内 = 高紧急
    if (daysUntil <= 7) return 5;  // 一周内 = 中等紧急
    if (daysUntil <= 14) return 3; // 两周内 = 低紧急
    return 2;  // 更远 = 很低紧急
  }

  /**
   * 重要度计算 (基于目标关联)
   */
  private async calculateImportance(task: Task): Promise<number> {
    if (!task.goalId) return 5;  // 无关联目标 = 中等重要
    
    const goal = await this.goalService.getGoal(task.goalId);
    
    // 考虑目标优先级、进度、类型
    let importance = 5;
    
    if (goal.priority === 'P0') importance += 3;
    if (goal.priority === 'P1') importance += 2;
    if (goal.priority === 'P2') importance += 1;
    
    // 目标落后时，其任务更重要
    if (goal.progress < goal.targetProgress) importance += 1;
    
    return Math.min(importance, 10);
  }

  /**
   * 影响力计算
   */
  private async calculateImpact(task: Task): Promise<number> {
    // 考虑: 目标贡献度、完成后解锁的任务数
    const goalContribution = task.estimatedHours || 1;
    const blockedTasks = await this.countBlockedTasks(task.id);
    
    return Math.min(
      (goalContribution / 10) * 5 + blockedTasks * 2,
      10
    );
  }

  /**
   * 艾森豪威尔矩阵分类
   */
  private classifyEisenhower(
    urgency: number, 
    importance: number
  ): string {
    const isUrgent = urgency >= 6;
    const isImportant = importance >= 6;
    
    if (isUrgent && isImportant) return 'urgent-important';
    if (!isUrgent && isImportant) return 'not-urgent-important';
    if (isUrgent && !isImportant) return 'urgent-not-important';
    return 'not-urgent-not-important';
  }

  /**
   * 生成建议
   */
  private generateRecommendation(factors: any): string {
    const { urgency, importance, effort } = factors;
    
    if (urgency >= 8 && importance >= 8) {
      return '立即处理！这是高优先级任务';
    }
    if (urgency < 5 && importance >= 8) {
      return '重要但不紧急，可安排专注时段处理';
    }
    if (urgency >= 8 && importance < 5) {
      return '紧急但不重要，考虑委托或快速处理';
    }
    if (effort <= 3) {
      return '快速任务，可在零散时间完成';
    }
    return '合理安排时间处理';
  }

  /**
   * 批量排序任务
   */
  async sortByPriority(tasks: Task[]): Promise<Task[]> {
    const scored = await Promise.all(
      tasks.map(async (task) => ({
        task,
        priority: await this.analyzePriority(task),
      }))
    );

    return scored
      .sort((a, b) => b.priority.score - a.priority.score)
      .map(s => s.task);
  }
}
```

### UI 组件

```
任务列表:
┌─────────────────────────────────────────────────────┐
│  今日任务            [按 AI 优先级排序 ▼]            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🔴 95分 | 修复线上 Bug #1234                        │
│     紧急且重要 | ⏰ 今天截止 | 🎯 关联核心目标       │
│     [查看分析]                                       │
│                                                      │
│  🟠 82分 | 完成季度 OKR 复盘                         │
│     重要不紧急 | ⏰ 3天后 | 💡 高影响力              │
│                                                      │
│  🟡 65分 | 回复客户邮件                              │
│     紧急不重要 | ⏰ 今天 | ⚡ 快速任务 (15分钟)      │
│                                                      │
│  🟢 40分 | 学习新技术                                │
│     不紧急不重要 | 📅 无截止日期 | 适合零散时间       │
│                                                      │
└─────────────────────────────────────────────────────┘

优先级详情对话框:
┌─────────────────────────────────────────────────────┐
│  任务优先级分析                              [X]   │
├─────────────────────────────────────────────────────┤
│  修复线上 Bug #1234                                  │
│                                                      │
│  综合评分: 95 / 100  🔴 极高优先级                  │
│                                                      │
│  影响因素:                                           │
│  ├─ 紧急度: ██████████ 10/10  今天截止             │
│  ├─ 重要度: █████████░  9/10  影响核心功能         │
│  ├─ 影响力: ████████░░  8/10  阻塞 3 个任务        │
│  ├─ 工作量: ████░░░░░░  4/10  预计 2 小时          │
│  ├─ 依赖性: ██████░░░░  6/10  其他任务等待中       │
│  └─ 连续性: ███░░░░░░░  3/10  需要切换上下文       │
│                                                      │
│  艾森豪威尔矩阵: 紧急且重要 (第一象限)              │
│                                                      │
│  💡 建议: 立即处理！这是高优先级任务                │
│                                                      │
│  当前上下文适配:                                     │
│  ✅ 时段合适 (下午适合技术工作)                      │
│  ✅ 能量充足 (需要高度专注)                          │
│                                                      │
│                          [开始任务]  [稍后再看]     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 文件变更清单

### 新增文件

```
packages/application-client/src/task/services/
  └── PriorityAnalysisService.ts

packages/domain-client/src/task/value-objects/
  └── PriorityScore.ts

apps/desktop/src/renderer/components/task/
  ├── PriorityBadge.tsx
  ├── PriorityAnalysisDialog.tsx
  └── EisenhowerMatrix.tsx
```

### 修改文件

```
apps/desktop/src/renderer/views/task/TaskListView.tsx
  └── 添加 AI 优先级排序选项

apps/desktop/src/renderer/components/task/TaskCard.tsx
  └── 显示优先级评分和徽章
```

---

## 🧪 测试要点

### 单元测试

- 紧急度计算逻辑
- 重要度评估算法
- 艾森豪威尔矩阵分类

### 集成测试

- 批量任务排序性能
- 目标关联度查询
- 依赖关系分析

---

## 📝 注意事项

1. **用户偏好学习**：记录用户手动调整，优化算法权重
2. **实时更新**：截止日期临近时自动更新优先级
3. **可解释性**：必须清晰说明为什么某个任务优先级高
4. **性能优化**：大量任务时使用增量计算
