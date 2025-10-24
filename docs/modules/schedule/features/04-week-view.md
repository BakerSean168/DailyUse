# Feature Spec: 日程周视图

> **功能编号**: SCHEDULE-004  
> **RICE 评分**: 147 (Reach: 7, Impact: 6, Confidence: 7, Effort: 2)  
> **优先级**: P1  
> **预估时间**: 1.5-2 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

日历应用通常只提供日视图或月视图，但周视图是最常用的日程规划维度：

- ❌ 日视图太局限，看不到一周全貌
- ❌ 月视图太概括，事件细节不清晰
- ❌ 缺少周维度的拖拽调整
- ❌ 无法快速安排"本周"任务
- ❌ 周末和工作日混在一起难以区分

### 目标用户

- **主要用户**: 需要周度规划的职场人士
- **次要用户**: 学生、自由职业者
- **典型画像**: "我希望每周日晚上规划下周日程，并能一目了然看到整周安排"

### 价值主张

**一句话价值**: 提供以周为单位的日程视图，支持拖拽调整和快速规划

**核心收益**:

- ✅ 显示完整一周（周一到周日）
- ✅ 拖拽调整事件时间
- ✅ 快速切换周次
- ✅ 多日历叠加显示
- ✅ 时间槽可视化（30分钟粒度）

---

## 2. 用户价值与场景

### 核心场景 1: 查看周视图

**场景描述**:  
用户打开日程模块，默认显示当前周的所有事件。

**用户故事**:

```gherkin
As a 用户
I want 查看本周所有日程
So that 了解本周整体安排
```

**操作流程**:

1. 用户点击侧边栏"日程"图标
2. 系统显示周视图（默认当前周）：

   ```
   日程 - 2025年10月第3周
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   [< 上周]  [今天]  [下周 >]   | [日] [周] [月]  🔍 搜索...

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            周一      周二      周三      周四      周五      周六      周日
            10/14    10/15    10/16    10/17    10/18    10/19    10/20
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   08:00   ┌─────────┐
           │ 晨会    │
   08:30   └─────────┘

   09:00   ┌─────────┐ ┌─────────┐           ┌─────────┐
           │ 项目评审│ │ Code    │           │ 一对一  │
   09:30   │         │ │ Review  │           │         │
   10:00   └─────────┘ └─────────┘           └─────────┘

   10:30

   11:00                         ┌─────────┐
                                 │ 设计讨论│
   11:30                         └─────────┘

   12:00   ═══════════ 午休 ═══════════════════════════════

   13:00

   13:30             ┌─────────┐
   14:00             │ Sprint  │
                     │ Planning│
   14:30             └─────────┘

   15:00                                   ┌─────────┐
   15:30                                   │ 技术分享│
   16:00                                   └─────────┘

   16:30

   17:00
   17:30                                             ┌──────────┐
   18:00                                             │ 健身     │
                                                     └──────────┘
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   图例： 🔵 工作  🟢 个人  🟡 会议  🟣 学习

   本周统计：
   • 总事件: 17 个
   • 工作时长: 32.5 小时
   • 会议时长: 8 小时
   • 空闲时段: 周三下午、周五上午
   ```

3. 时间轴特性：
   - 24 小时制（00:00 - 24:00）
   - 30 分钟时间槽
   - 工作时间（8:00-18:00）高亮显示
   - 当前时间线（红色横线）
   - 过去时间段灰色显示

**预期结果**:

- 显示完整一周 7 天
- 每天显示所有事件
- 时间槽清晰可读
- 颜色区分事件类型

---

### 核心场景 2: 拖拽调整事件

**场景描述**:  
用户通过拖拽改变事件的时间或日期。

**用户故事**:

```gherkin
As a 用户
I want 拖拽调整事件时间
So that 快速重新安排日程
```

**操作流程**:

1. 用户看到周三 14:00 的"Sprint Planning"
2. 发现与周五的会议冲突，决定挪到周二
3. 用户鼠标按住事件块：

   ```
           周二      周三      周四
           10/15    10/16    10/17
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   13:00

   13:30             ┌─────────┐ ← 鼠标按住
   14:00             │ Sprint  │
                     │ Planning│
   14:30             │ 2h      │
   15:00             └─────────┘
   ```

4. 拖动到周二 13:30：

   ```
           周二      周三      周四
           10/15    10/16    10/17
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   13:00   ┌─────────┐
           │ Sprint  │ ← 半透明预览
   13:30   │ Planning│
   14:00   │ 2h      │
   14:30   └─────────┘
   15:00             ┌─────────┐ ← 原位置虚线
                     │         │
                     └─────────┘
   ```

5. 系统检测冲突：

   ```typescript
   function detectConflict(event: ScheduleEvent, newStart: Date, newEnd: Date): ConflictDetection {
     const overlapping = this.scheduleRepository.findOverlapping({
       userId: event.userId,
       startTime: newStart,
       endTime: newEnd,
       excludeUuid: event.uuid,
     });

     if (overlapping.length > 0) {
       return {
         hasConflict: true,
         conflictingEvents: overlapping,
         severity: calculateSeverity(overlapping),
       };
     }

     return { hasConflict: false };
   }
   ```

6. 松开鼠标，弹出确认对话框：

   ```
   📅 调整事件时间
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Sprint Planning

   从: 周三 10/16 14:00-16:00
   到: 周二 10/15 13:30-15:30

   ⚠️ 检测到冲突：
   • Code Review (周二 13:00-14:00)
     重叠 30 分钟

   [仍然移动]  [调整时间]  [取消]
   ```

7. 用户选择"调整时间"
8. 系统自动建议：

   ```
   建议时间：
   🟢 周二 15:30-17:30 (无冲突)
   🟢 周四 13:00-15:00 (无冲突)
   🟡 周五 10:00-12:00 (与午餐相邻)

   [应用建议]  [手动调整]
   ```

**预期结果**:

- 拖拽流畅，实时预览
- 自动检测冲突
- 提供智能建议
- 支持跨天拖拽

---

### 核心场景 3: 快速创建事件

**场景描述**:  
用户直接在周视图上点击时间槽创建事件。

**用户故事**:

```gherkin
As a 用户
I want 在周视图上快速创建事件
So that 减少点击步骤
```

**操作流程**:

1. 用户看到周四 15:00 有空闲
2. 双击周四 15:00 时间槽：

   ```
            周四
            10/17
   ━━━━━━━━━━━━━━━━
   14:30

   15:00   ✨ ← 双击这里

   15:30
   ```

3. 弹出快速创建面板：

   ```
   ⚡ 快速创建事件
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   标题: [输入事件标题...]

   时间: 周四 10/17
   从: [15:00 ▼]  到: [16:00 ▼]

   类型: 🔵 工作  🟢 个人  🟡 会议  🟣 学习

   [创建]  [详细设置]  [取消]
   ```

4. 用户输入"团队建设活动"
5. 选择类型"个人"
6. 调整结束时间到 18:00
7. 点击"创建"
8. 事件立即显示在周视图上：

   ```
            周四
            10/17
   ━━━━━━━━━━━━━━━━
   14:30

   15:00   ┌─────────┐
           │ 团队建设│
   15:30   │ 活动    │
           │         │
   16:00   │ 3h      │
           │         │
   16:30   │ 🟢      │
           │         │
   17:00   │         │
   17:30   └─────────┘
   ```

**预期结果**:

- 双击快速创建
- 默认 1 小时时长
- 自动对齐时间槽
- 支持快捷键（Enter 确认，Esc 取消）

---

### 核心场景 4: 周次切换与导航

**场景描述**:  
用户快速切换不同周次，查看过去或未来日程。

**用户故事**:

```gherkin
As a 用户
I want 快速切换不同周次
So that 查看历史或规划未来
```

**操作流程**:

1. 当前显示 2025-W42（10月第3周）
2. 用户点击"下周 >"按钮
3. 系统切换到 2025-W43：

   ```typescript
   function navigateWeek(direction: 'prev' | 'next'): void {
     const currentWeek = this.currentWeek;

     if (direction === 'next') {
       this.currentWeek = addWeeks(currentWeek, 1);
     } else {
       this.currentWeek = subWeeks(currentWeek, 1);
     }

     // 加载新周的事件
     await this.loadWeekEvents(this.currentWeek);

     // 更新 URL（支持浏览器前进/后退）
     this.router.push({
       query: { week: formatISO(this.currentWeek, { representation: 'date' }) },
     });
   }
   ```

4. 页面更新显示：

   ```
   日程 - 2025年10月第4周
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   [< 上周]  [今天]  [下周 >]

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            周一      周二      周三      周四      周五      周六      周日
            10/21    10/22    10/23    10/24    10/25    10/26    10/27
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   加载中...
   ```

5. 用户想回到本周，点击"今天"按钮
6. 立即跳转到当前周，并滚动到当前时间

**快捷键支持**:

```
← 左箭头: 上一周
→ 右箭头: 下一周
T: 回到今天（Today）
W: 切换到周视图（Week）
```

**预期结果**:

- 流畅切换周次
- 支持快捷键导航
- URL 同步（支持分享和书签）
- 自动滚动到相关时间

---

### 核心场景 5: 多日历叠加显示

**场景描述**:  
用户同时查看多个日历（个人、工作、项目）的事件。

**用户故事**:

```gherkin
As a 用户
I want 同时显示多个日历
So that 全面了解所有日程
```

**操作流程**:

1. 用户打开日历选择器：

   ```
   📅 日历
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   我的日历：
   ☑️ 🔵 个人日历 (23 事件)
   ☑️ 🟡 工作日历 (15 事件)
   ☐ 🟣 学习计划 (8 事件)

   共享日历：
   ☑️ 🟢 团队日历 (12 事件)
   ☐ 🟠 项目 Alpha (6 事件)

   外部日历：
   ☑️ 📧 Google 日历 (已同步)
   ☐ 📧 Outlook 日历 (未连接)

   [管理日历]
   ```

2. 用户勾选"学习计划"
3. 周视图立即更新，显示所有勾选日历的事件：

   ```
            周一      周二      周三
            10/14    10/15    10/16
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   08:00   ┌─────────┐
           │🔵 晨会  │ ← 个人
   08:30   └─────────┘

   09:00   ┌─────────┐ ┌─────────┐
           │🟡 项目  │ │🟢 站会  │ ← 工作 + 团队
   09:30   │  评审   │ └─────────┘
   10:00   └─────────┘

   10:30             ┌─────────┐
   11:00             │🟣 算法  │ ← 新增：学习
                     │  课程   │
   11:30             └─────────┘
   ```

4. 事件块显示对应日历颜色
5. 支持按日历筛选：
   ```typescript
   function filterByCalendars(
     events: ScheduleEvent[],
     selectedCalendars: string[],
   ): ScheduleEvent[] {
     return events.filter((event) => selectedCalendars.includes(event.calendarUuid));
   }
   ```

**预期结果**:

- 多日历事件叠加显示
- 颜色区分不同日历
- 支持快速切换显示
- 性能优化（大量事件）

---

### 核心场景 6: 周统计与洞察

**场景描述**:  
用户查看本周日程统计，获得时间分配洞察。

**用户故事**:

```gherkin
As a 用户
I want 查看本周时间统计
So that 了解时间分配是否合理
```

**操作流程**:

1. 用户点击周视图右上角"统计"图标
2. 弹出本周统计面板：

   ```
   📊 本周统计 (10/14 - 10/20)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⏱️ 时间分配
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   总计: 52.5 小时

   🟡 会议        18h (34%)  ████████████░░░░░░░░
   🔵 深度工作    24h (46%)  ████████████████░░░░
   🟢 个人事务     6h (11%)  ████░░░░░░░░░░░░░░░░
   🟣 学习发展    4.5h (9%)  ███░░░░░░░░░░░░░░░░░

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📈 趋势对比
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   vs 上周:
   • 会议时间 +3h ⬆️ (过多)
   • 深度工作 -2h ⬇️ (需要保护)
   • 学习时间 +1.5h ⬆️ (继续保持)

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚡ 效率洞察
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   • 最佳工作时段: 周二/周四上午
   • 会议密集时段: 周一全天
   • 建议: 周三下午适合安排深度工作

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎯 本周目标
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ☐ 完成项目评审 (已排期: 周一)
   ☑️ 学习新技术 4h (已完成)
   ☐ 健身 3 次 (已排期 2 次)

   [导出报告]  [优化建议]
   ```

3. 用户点击"优化建议"
4. 系统提供智能建议：

   ```
   💡 本周日程优化建议
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   1. ⚠️ 周一会议过多（5个）
      建议: 合并部分例会，或改为异步沟通

   2. 🔄 缺少连续深度工作时间
      建议: 周三下午保留 3 小时不被打断

   3. ⏰ 午餐时间不固定
      建议: 固定 12:00-13:00 为午休时间

   4. 📚 学习时间分散
      建议: 集中到周末早晨

   [一键优化]  [手动调整]
   ```

**预期结果**:

- 清晰的时间分配统计
- 与历史对比
- 智能洞察和建议
- 支持导出报告

---

## 3. 设计要点

### 涉及字段（对齐 Contracts）

#### 无需新增实体（复用现有 ScheduleEvent）

**位置**: `packages/contracts/src/modules/schedule/entities/ScheduleEventServer.ts`

已有字段足够支持周视图：

```typescript
export interface ScheduleEventServerDTO {
  // 时间相关
  readonly startTime: number; // 用于定位到周的哪一天
  readonly endTime: number; // 用于计算事件时长
  readonly isAllDay: boolean; // 全天事件显示在顶部

  // 显示相关
  readonly title: string; // 事件标题
  readonly description?: string; // 鼠标悬停显示
  readonly color?: string; // 自定义颜色
  readonly calendarUuid?: string; // 用于多日历过滤

  // 冲突检测
  readonly conflictDetection?: ConflictDetection;
}
```

#### 新增前端状态接口（仅前端使用）

```typescript
// apps/web/src/modules/schedule/types/week-view.ts
export interface WeekViewState {
  readonly currentWeek: Date; // 当前显示的周
  readonly selectedCalendars: string[]; // 已选中的日历
  readonly viewConfig: WeekViewConfig; // 视图配置
  readonly isDragging: boolean; // 是否正在拖拽
  readonly dragPreview?: DragPreview; // 拖拽预览
}

export interface WeekViewConfig {
  readonly startHour: number; // 开始显示时间（默认 6）
  readonly endHour: number; // 结束显示时间（默认 22）
  readonly timeSlotHeight: number; // 时间槽高度（px）
  readonly firstDayOfWeek: 0 | 1; // 周一或周日开始
  readonly showWeekend: boolean; // 是否显示周末
}

export interface DragPreview {
  readonly eventUuid: string;
  readonly originalStart: Date;
  readonly originalEnd: Date;
  readonly newStart: Date;
  readonly newEnd: Date;
  readonly hasConflict: boolean;
}
```

---

### 交互设计

#### 1. 时间槽设计

| 粒度    | 高度 | 使用场景             |
| ------- | ---- | -------------------- |
| 30 分钟 | 40px | 默认，适合大部分事件 |
| 15 分钟 | 20px | 精细调整（可缩放）   |
| 1 小时  | 80px | 概览模式（少数事件） |

#### 2. 拖拽行为

```typescript
// 拖拽逻辑
function handleDrag(event: MouseEvent, scheduleEvent: ScheduleEvent) {
  // 1. 计算鼠标移动距离
  const deltaX = event.clientX - dragStart.x;
  const deltaY = event.clientY - dragStart.y;

  // 2. 转换为日期和时间偏移
  const dayOffset = Math.floor(deltaX / DAY_WIDTH);
  const timeOffset = Math.floor(deltaY / SLOT_HEIGHT) * SLOT_DURATION;

  // 3. 计算新时间
  const newStart = addMinutes(addDays(originalStart, dayOffset), timeOffset);
  const newEnd = addMinutes(newStart, duration);

  // 4. 对齐到时间槽
  const alignedStart = roundToNearestMinutes(newStart, { nearestTo: 30 });
  const alignedEnd = addMinutes(alignedStart, duration);

  // 5. 检测冲突
  const conflict = detectConflict(scheduleEvent, alignedStart, alignedEnd);

  // 6. 更新预览
  updateDragPreview({
    newStart: alignedStart,
    newEnd: alignedEnd,
    hasConflict: conflict.hasConflict,
  });
}
```

#### 3. 视图性能优化

```typescript
// 虚拟滚动（仅渲染可见时间段）
function getVisibleTimeRange(): { start: number; end: number } {
  const scrollTop = scrollContainer.scrollTop;
  const viewportHeight = scrollContainer.clientHeight;

  const startHour = Math.floor(scrollTop / HOUR_HEIGHT);
  const endHour = Math.ceil((scrollTop + viewportHeight) / HOUR_HEIGHT);

  return {
    start: Math.max(0, startHour - 1), // 预渲染上方 1 小时
    end: Math.min(24, endHour + 1), // 预渲染下方 1 小时
  };
}

// 事件去重与合并（多日历）
function deduplicateEvents(events: ScheduleEvent[]): ScheduleEvent[] {
  const seen = new Map<string, ScheduleEvent>();

  for (const event of events) {
    // 使用 sourceEventId 去重（外部日历同步）
    const key = event.sourceEventId || event.uuid;

    if (!seen.has(key)) {
      seen.set(key, event);
    }
  }

  return Array.from(seen.values());
}
```

---

## 4. MVP/MMP/Full 路径

### MVP: 基础周视图（1.5-2 周）

**范围**:

- ✅ 显示当前周 7 天
- ✅ 时间槽布局（30分钟粒度）
- ✅ 事件渲染（标题、时间、颜色）
- ✅ 周次导航（上一周/下一周/今天）
- ✅ 双击创建事件
- ✅ 点击事件查看详情

**技术要点**:

- CSS Grid 布局（7列 × 48行）
- 事件定位算法（时间 → 像素坐标）
- 周次计算（ISO 8601）

**验收标准**:

```gherkin
Given 当前是 2025-10-15（周三）
When 用户打开周视图
Then 应显示 10/14-10/20 这一周
And 显示所有事件
```

---

### MMP: 拖拽与多日历（+1 周）

**在 MVP 基础上新增**:

- ✅ 拖拽调整事件时间
- ✅ 拖拽调整事件时长（拖动边缘）
- ✅ 冲突检测与提示
- ✅ 多日历切换
- ✅ 全天事件显示
- ✅ 快捷键支持

**技术要点**:

- Drag & Drop API
- 冲突检测算法
- 多日历过滤逻辑

**验收标准**:

```gherkin
Given 用户正在查看周视图
When 拖动事件到新时间
And 新时间有冲突
Then 应显示冲突提示
And 提供调整建议
```

---

### Full Release: 智能统计与优化（+1 周）

**在 MMP 基础上新增**:

- ✅ 周统计面板
- ✅ 时间分配分析
- ✅ 智能优化建议
- ✅ 导出周报
- ✅ 自定义视图配置
- ✅ 周期事件重复显示

**技术要点**:

- 统计算法
- 时间模式识别
- 报告生成

**验收标准**:

```gherkin
Given 本周有 30 个事件
When 用户查看周统计
Then 应显示时间分配饼图
And 提供优化建议
```

---

## 5. 验收标准（Gherkin）

### Feature: 日程周视图

#### Scenario 1: 显示当前周

```gherkin
Feature: 日程周视图
  作为用户，我希望查看一周的日程安排

  Background:
    Given 用户"郑十"已登录
    And 当前日期是 2025-10-15（周三）
    And 用户有以下事件：
      | title    | startTime          | endTime            |
      | 晨会     | 2025-10-14 08:00  | 2025-10-14 08:30  |
      | 项目评审 | 2025-10-14 09:00  | 2025-10-14 10:00  |
      | 站会     | 2025-10-15 09:00  | 2025-10-15 09:30  |

  Scenario: 打开周视图
    When 用户打开日程模块
    Then 应显示周视图
    And 应显示 2025-W42（10/14-10/20）
    And 应显示所有 3 个事件
    And 事件应按时间排列
    And 当前时间线应可见（红线）
```

---

#### Scenario 2: 拖拽调整事件

```gherkin
  Background:
    Given 用户在周视图
    And 事件"项目评审"在周一 09:00

  Scenario: 拖动到新时间（无冲突）
    When 用户拖动"项目评审"到周二 14:00
    Then 应显示拖拽预览（半透明）
    And 原位置显示虚线占位
    When 用户松开鼠标
    Then 应更新事件时间为：
      | 字段      | 值                |
      | startTime | 2025-10-15 14:00 |
      | endTime   | 2025-10-15 15:00 |
    And 事件应显示在新位置

  Scenario: 拖动到新时间（有冲突）
    Given 周二 14:00 已有事件"站会"
    When 用户拖动"项目评审"到周二 14:00
    Then 拖拽预览应显示为红色（冲突）
    When 用户松开鼠标
    Then 应弹出冲突提示
    And 提示："与站会冲突 30 分钟"
    And 提供选项：["仍然移动", "调整时间", "取消"]
```

---

#### Scenario 3: 快速创建事件

```gherkin
  Background:
    Given 用户在周视图
    And 周四 15:00 时间槽为空

  Scenario: 双击创建事件
    When 用户双击周四 15:00 时间槽
    Then 应弹出快速创建面板
    And 默认时间为 15:00-16:00
    And 默认日期为周四 10/17
    When 用户输入标题"团队会议"
    And 点击"创建"
    Then 应创建事件
    And 事件应立即显示在周视图
```

---

#### Scenario 4: 周次导航

```gherkin
  Background:
    Given 用户在周视图
    And 当前显示 2025-W42（10/14-10/20）

  Scenario: 切换到下一周
    When 用户点击"下周 >"
    Then 应显示 2025-W43（10/21-10/27）
    And 应加载该周的事件
    And URL 应更新为 ?week=2025-W43

  Scenario: 回到今天
    When 用户点击"今天"
    Then 应跳转到当前周
    And 应滚动到当前时间
```

---

#### Scenario 5: 多日历显示

```gherkin
  Background:
    Given 用户有 3 个日历：
      | name     | color  | eventCount |
      | 个人日历 | blue   | 10         |
      | 工作日历 | orange | 8          |
      | 学习计划 | purple | 5          |
    And 默认选中"个人"和"工作"

  Scenario: 切换日历显示
    When 用户打开日历选择器
    Then 应显示所有日历
    And "个人"和"工作"应被勾选
    When 用户勾选"学习计划"
    Then 周视图应立即更新
    And 应显示所有 3 个日历的事件（共 23 个）
    And 事件应按日历颜色显示
```

---

#### Scenario 6: 周统计

```gherkin
  Background:
    Given 本周有以下事件：
      | type   | duration |
      | 会议   | 18h      |
      | 工作   | 24h      |
      | 个人   | 6h       |
      | 学习   | 4h       |

  Scenario: 查看周统计
    When 用户点击"统计"图标
    Then 应显示统计面板
    And 应显示总时长 52h
    And 应显示各类型占比：
      | 类型 | 占比 |
      | 工作 | 46%  |
      | 会议 | 34%  |
      | 个人 | 12%  |
      | 学习 | 8%   |
    And 应提供"vs 上周"对比
```

---

## 6. 指标与追踪

### 事件埋点

```typescript
// 查看周视图
{
  event: 'week_view_opened',
  properties: {
    week: string,              // '2025-W42'
    eventCount: number,
    selectedCalendars: string[]
  }
}

// 拖拽事件
{
  event: 'event_dragged',
  properties: {
    oldDay: string,
    newDay: string,
    timeDelta: number,         // 分钟
    hadConflict: boolean
  }
}

// 快速创建
{
  event: 'event_quick_created',
  properties: {
    source: 'double_click' | 'drag_select',
    duration: number
  }
}

// 周次导航
{
  event: 'week_navigated',
  properties: {
    direction: 'prev' | 'next' | 'today',
    weeksOffset: number        // 相对当前周
  }
}
```

---

### 成功指标

**定量指标**:
| 指标 | 目标值 | 测量方式 |
|------|-------|---------|
| 周视图使用率 | >60% | 周视图打开次数 / 日程模块总打开次数 |
| 拖拽调整率 | >30% | 拖拽调整次数 / 事件编辑总次数 |
| 快速创建率 | >40% | 双击创建次数 / 事件创建总次数 |
| 周统计查看率 | >20% | 统计面板打开次数 / 周视图打开次数 |

**定性指标**:

- 用户反馈"周视图最实用"
- 日程规划效率提升
- 时间冲突减少

---

## 7. 技术实现要点

### 前端组件结构

```
apps/web/src/modules/schedule/components/week-view/
├── WeekView.vue                    # 主容器
├── WeekHeader.vue                  # 周标题 + 导航
├── TimeAxis.vue                    # 左侧时间轴
├── WeekGrid.vue                    # 7列时间槽网格
├── EventBlock.vue                  # 单个事件块
├── DragPreview.vue                 # 拖拽预览
├── QuickCreatePanel.vue            # 快速创建面板
├── CalendarSelector.vue            # 日历选择器
└── WeekStats.vue                   # 周统计面板
```

### 核心算法

#### 1. 事件定位算法

```typescript
// 将时间转换为 CSS 坐标
function getEventPosition(event: ScheduleEvent): {
  column: number; // 0-6（周一到周日）
  top: number; // px
  height: number; // px
} {
  // 1. 计算是周几（0=周一, 6=周日）
  const column = getDay(event.startTime) - 1;

  // 2. 计算从 00:00 开始的分钟数
  const startMinutes = getHours(event.startTime) * 60 + getMinutes(event.startTime);
  const endMinutes = getHours(event.endTime) * 60 + getMinutes(event.endTime);

  // 3. 转换为像素坐标
  const MINUTES_PER_SLOT = 30;
  const SLOT_HEIGHT = 40; // px

  const top = (startMinutes / MINUTES_PER_SLOT) * SLOT_HEIGHT;
  const height = ((endMinutes - startMinutes) / MINUTES_PER_SLOT) * SLOT_HEIGHT;

  return { column, top, height };
}
```

#### 2. 冲突事件布局

```typescript
// 多个事件重叠时，并排显示
function layoutOverlappingEvents(events: ScheduleEvent[]): EventLayout[] {
  // 1. 按开始时间排序
  const sorted = events.sort((a, b) => a.startTime - b.startTime);

  // 2. 构建重叠组
  const groups: ScheduleEvent[][] = [];
  let currentGroup: ScheduleEvent[] = [];

  for (const event of sorted) {
    if (currentGroup.length === 0) {
      currentGroup.push(event);
    } else {
      const lastEvent = currentGroup[currentGroup.length - 1];
      if (event.startTime < lastEvent.endTime) {
        // 重叠
        currentGroup.push(event);
      } else {
        // 不重叠，开始新组
        groups.push(currentGroup);
        currentGroup = [event];
      }
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // 3. 为每组分配列
  const layouts: EventLayout[] = [];
  for (const group of groups) {
    const columnCount = group.length;
    group.forEach((event, index) => {
      layouts.push({
        event,
        column: index,
        columnCount,
        width: `${100 / columnCount}%`,
        left: `${(index * 100) / columnCount}%`,
      });
    });
  }

  return layouts;
}
```

---

## 8. 风险与缓解

| 风险             | 可能性 | 影响 | 缓解措施                       |
| ---------------- | ------ | ---- | ------------------------------ |
| 大量事件性能问题 | 中     | 高   | 虚拟滚动 + 事件分页加载        |
| 拖拽冲突误判     | 低     | 中   | 精确时间对齐 + 用户确认        |
| 多日历同步延迟   | 中     | 中   | 本地缓存 + 后台同步 + 加载状态 |
| 移动端周视图难用 | 高     | 中   | 提供简化的移动周视图           |

---

## 9. 后续增强方向

### Phase 2 功能

- 🔄 自定义视图配置（开始时间、时间槽粒度）
- 📅 工作日模式（仅显示周一到周五）
- 🎨 事件样式自定义（边框、图标）
- 📱 移动端优化（横向滚动）

### Phase 3 功能

- 🤖 AI 时间安排建议
- 📊 长期趋势分析（多周对比）
- 🔗 与任务模块联动（显示任务截止）
- 🌙 专注模式（隐藏非核心事件）

---

## 10. 参考资料

- [Schedule Contracts](../../../../packages/contracts/src/modules/schedule/)
- [Google Calendar Week View](https://calendar.google.com)
- [FullCalendar Library](https://fullcalendar.io/)

---

**文档状态**: ✅ Ready for PM Review  
**下一步**: PM 生成 Project Flow

---

**文档维护**:

- 创建: 2025-10-21
- 创建者: PO Agent
- 版本: 1.0
- 下次更新: Sprint Planning 前
