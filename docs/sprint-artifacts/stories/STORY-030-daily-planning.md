# STORY-030: 每日智能规划

## 📋 Story 概述

**Story ID**: STORY-030  
**Epic**: EPIC-006 (Smart Productivity)  
**优先级**: P1 (核心价值)  
**预估工时**: 3 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-027, STORY-028, STORY-029 ✅

---

## 🎯 用户故事

**作为** DailyUse 用户  
**我希望** 每天早上收到 AI 生成的日程建议  
**以便于** 快速启动高效的一天，无需花时间思考今天做什么

---

## 📋 验收标准

### 功能验收 - 智能日报

- [ ] 每天 8:00 自动生成今日规划
- [ ] 推荐 3-5 个优先任务
- [ ] 按时间块合理分配任务
- [ ] 考虑会议和已有日程
- [ ] 预估今日总工作量和可用时间

### 功能验收 - 能量曲线匹配

- [ ] 高专注任务安排在高效时段 (上午)
- [ ] 低专注任务安排在低效时段 (午后/晚上)
- [ ] 合理安排休息间隔
- [ ] 避免连续高强度任务

### 功能验收 - 上下文感知

- [ ] 检测当天会议和日程冲突
- [ ] 考虑昨日未完成任务
- [ ] 识别即将到期的任务
- [ ] 平衡短期紧急和长期重要任务

### 功能验收 - 用户交互

- [ ] 用户可预览并接受建议
- [ ] 支持拖拽调整顺序
- [ ] 支持替换或删除建议任务
- [ ] 一键应用到今日日程

---

## 🔧 技术方案

### 数据模型

```typescript
// packages/application-client/src/planning/
interface DailyPlan {
  date: string;  // YYYY-MM-DD
  generatedAt: Date;
  summary: {
    totalTasks: number;
    estimatedWorkHours: number;
    availableHours: number;
    workload: 'light' | 'moderate' | 'heavy' | 'overload';
  };
  recommendations: DailyTaskRecommendation[];
  insights: string[];  // AI 生成的洞察
  warnings?: string[]; // 潜在问题警告
}

interface DailyTaskRecommendation {
  task: Task;
  suggestedTime: {
    start: string;  // HH:mm
    end: string;
    duration: number;  // minutes
  };
  priority: number;  // 1-5
  reasoning: string;  // 为什么建议这个任务
  energyLevel: 'high' | 'medium' | 'low';  // 所需能量水平
  focusLevel: 'deep' | 'moderate' | 'light';
}

interface UserEnergyProfile {
  peakHours: number[];  // [8, 9, 10, 11] 高效时段
  lowHours: number[];   // [13, 14, 20, 21] 低效时段
  workStartHour: number;  // 默认 9
  workEndHour: number;    // 默认 18
  lunchBreak: { start: number; end: number };  // { 12, 13 }
}
```

### 规划算法

```typescript
// packages/application-client/src/planning/DailyPlanningService.ts
export class DailyPlanningService {
  /**
   * 生成每日规划
   */
  async generateDailyPlan(date: Date = new Date()): Promise<DailyPlan> {
    // 1. 获取候选任务
    const candidateTasks = await this.getCandidateTasks(date);
    
    // 2. 优先级排序
    const prioritized = await this.prioritizeTasks(candidateTasks);
    
    // 3. 获取今日已有日程
    const existingSchedule = await this.getScheduleForDate(date);
    
    // 4. 计算可用时间块
    const availableSlots = this.calculateAvailableSlots(
      existingSchedule,
      date
    );
    
    // 5. 智能分配任务到时间块
    const recommendations = await this.allocateTasksToSlots(
      prioritized,
      availableSlots
    );
    
    // 6. 生成洞察和建议
    const insights = await this.generateInsights(
      recommendations,
      availableSlots
    );
    
    return {
      date: format(date, 'yyyy-MM-DD'),
      generatedAt: new Date(),
      summary: this.generateSummary(recommendations, availableSlots),
      recommendations,
      insights,
      warnings: this.detectWarnings(recommendations, availableSlots),
    };
  }

  /**
   * 获取候选任务
   */
  private async getCandidateTasks(date: Date): Promise<Task[]> {
    // 优先考虑:
    // 1. 今天到期的任务
    // 2. 昨日未完成任务
    // 3. 高优先级任务
    // 4. 本周到期任务
    // 5. 关联重要目标的任务
    
    const tasks = await this.taskService.getTasks({
      status: 'todo',
      limit: 50,
    });
    
    return tasks
      .filter(t => !t.isCompleted)
      .filter(t => this.isRelevantForDate(t, date));
  }

  /**
   * 计算可用时间块
   */
  private calculateAvailableSlots(
    schedule: ScheduleEvent[],
    date: Date
  ): TimeSlot[] {
    const profile = this.getUserEnergyProfile();
    const dayStart = setHours(date, profile.workStartHour);
    const dayEnd = setHours(date, profile.workEndHour);
    
    // 从全天时间中减去已有日程
    const slots: TimeSlot[] = [];
    let currentTime = dayStart;
    
    for (const event of schedule.sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    )) {
      if (currentTime < event.startTime) {
        // 找到空闲时间块
        const duration = differenceInMinutes(event.startTime, currentTime);
        if (duration >= 30) {  // 至少 30 分钟
          slots.push({
            start: currentTime,
            end: event.startTime,
            duration,
            energyLevel: this.getEnergyLevel(currentTime, profile),
          });
        }
      }
      currentTime = event.endTime;
    }
    
    // 最后一个事件后到下班的时间
    if (currentTime < dayEnd) {
      slots.push({
        start: currentTime,
        end: dayEnd,
        duration: differenceInMinutes(dayEnd, currentTime),
        energyLevel: this.getEnergyLevel(currentTime, profile),
      });
    }
    
    return slots;
  }

  /**
   * 分配任务到时间块
   */
  private async allocateTasksToSlots(
    tasks: Task[],
    slots: TimeSlot[]
  ): Promise<DailyTaskRecommendation[]> {
    const recommendations: DailyTaskRecommendation[] = [];
    const remainingSlots = [...slots];
    
    for (const task of tasks) {
      if (recommendations.length >= 5) break;  // 最多推荐 5 个
      
      const taskMeta = await this.analyzeTaskRequirements(task);
      
      // 找到最合适的时间块
      const bestSlot = this.findBestSlot(taskMeta, remainingSlots);
      
      if (bestSlot) {
        recommendations.push({
          task,
          suggestedTime: {
            start: format(bestSlot.start, 'HH:mm'),
            end: format(
              addMinutes(bestSlot.start, taskMeta.estimatedMinutes),
              'HH:mm'
            ),
            duration: taskMeta.estimatedMinutes,
          },
          priority: taskMeta.priority,
          reasoning: this.explainAllocation(task, bestSlot, taskMeta),
          energyLevel: bestSlot.energyLevel,
          focusLevel: taskMeta.focusLevel,
        });
        
        // 从可用时间块中扣除
        this.consumeSlot(remainingSlots, bestSlot, taskMeta.estimatedMinutes);
      }
    }
    
    return recommendations;
  }

  /**
   * 生成洞察
   */
  private async generateInsights(
    recommendations: DailyTaskRecommendation[],
    slots: TimeSlot[]
  ): Promise<string[]> {
    const insights: string[] = [];
    
    const totalWorkMinutes = recommendations.reduce(
      (sum, r) => sum + r.suggestedTime.duration,
      0
    );
    
    const availableMinutes = slots.reduce((sum, s) => sum + s.duration, 0);
    
    if (totalWorkMinutes / availableMinutes > 0.8) {
      insights.push('⚠️ 今日工作量较大，建议合理安排休息时间');
    }
    
    const deepFocusTasks = recommendations.filter(
      r => r.focusLevel === 'deep'
    );
    
    if (deepFocusTasks.length > 2) {
      insights.push('💡 今日有多个深度工作任务，建议拆分到不同时段');
    }
    
    const morningSlots = slots.filter(s => 
      getHours(s.start) < 12
    );
    
    if (morningSlots.length === 0) {
      insights.push('📅 上午时间已被占满，下午可能效率较低');
    }
    
    return insights;
  }
}
```

### UI 组件

```
每日规划视图:
┌─────────────────────────────────────────────────────┐
│  📅 今日智能规划 - 12月8日 周一           [刷新]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📊 工作量: 中等 (6小时 / 8小时可用)                │
│  ⚡ 3 个高优先级 | 2 个中优先级                      │
│                                                      │
│  💡 今日洞察:                                        │
│  • 上午有 3 小时连续时间，适合深度工作               │
│  • 建议在下午处理 2 个快速任务                       │
│                                                      │
├─────────────────────────────────────────────────────┤
│  推荐任务列表:                                       │
│                                                      │
│  1⃣ 09:00-11:00 (2h) 🔴 高优先级                    │
│     完成产品设计文档                                 │
│     需要深度专注 | 今天截止                          │
│     原因: 上午精力充沛，适合创造性工作               │
│                                                      │
│  2⃣ 11:15-12:00 (45m) 🟠 高优先级                   │
│     代码审查 PR #234                                 │
│     中等专注 | 阻塞其他开发                          │
│     原因: 其他工程师等待中                           │
│                                                      │
│  3⃣ 14:00-15:30 (1.5h) 🟡 中优先级                  │
│     整理会议记录                                     │
│     轻度专注 | 本周完成                              │
│     原因: 午后适合处理整理类任务                     │
│                                                      │
│  4⃣ 15:45-16:30 (45m) 🟡 中优先级                   │
│     回复 5 封邮件                                    │
│     轻度专注 | 快速任务                              │
│     原因: 利用零散时间                               │
│                                                      │
│  5⃣ 16:45-18:00 (1h15m) 🟢 低优先级                 │
│     学习 React 19 新特性                             │
│     中等专注 | 自我提升                              │
│     原因: 下班前的学习时间                           │
│                                                      │
├─────────────────────────────────────────────────────┤
│  ⚠️ 注意事项:                                        │
│  • 12:00-13:00 午餐休息                              │
│  • 15:30-15:45 建议短暂休息                          │
│                                                      │
│          [自定义调整]           [应用到今日日程]     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 文件变更清单

### 新增文件

```
packages/application-client/src/planning/
  ├── DailyPlanningService.ts
  ├── EnergyProfileService.ts
  └── index.ts

packages/domain-client/src/planning/
  ├── aggregates/DailyPlan.ts
  ├── value-objects/TimeSlot.ts
  └── index.ts

apps/desktop/src/renderer/views/planning/
  ├── DailyPlanView.tsx
  ├── DailyPlanCard.tsx
  └── TimelineVisualization.tsx

apps/desktop/src/renderer/components/planning/
  ├── TaskRecommendationItem.tsx
  └── PlanInsights.tsx
```

### 修改文件

```
apps/desktop/src/renderer/views/dashboard/DashboardView.tsx
  └── 添加「今日规划」卡片入口

apps/desktop/src/main/services/
  └── 添加定时任务生成每日规划
```

---

## 🧪 测试要点

### 单元测试

- 可用时间块计算
- 任务分配算法
- 能量曲线匹配

### 集成测试

- 与日程模块集成
- 多任务并发分配
- 洞察生成准确性

---

## 📝 注意事项

1. **用户定制**：允许用户设置工作时段和能量曲线
2. **渐进式推荐**：新用户使用通用规则，老用户基于历史数据优化
3. **实时调整**：日程变化时自动重新规划
4. **隐私保护**：规划逻辑在本地执行
