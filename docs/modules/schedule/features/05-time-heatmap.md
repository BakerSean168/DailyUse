# Feature Spec: 时间热力图

> **功能编号**: SCHEDULE-005  
> **RICE 评分**: 119 (Reach: 6, Impact: 5, Confidence: 7, Effort: 1.8)  
> **优先级**: P2  
> **预估时间**: 1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 背景与痛点

用户难以直观了解自己的时间使用模式：

- ❌ 不知道哪些时段最忙碌
- ❌ 无法识别低效时间段
- ❌ 缺少长期时间分配趋势
- ❌ 会议时间分布不清晰

### 价值主张

**一句话价值**: 通过热力图可视化时间分配，发现时间使用模式和优化机会

**核心收益**:

- ✅ GitHub-style 热力图（年度/月度/周度）
- ✅ 按时间段分析（早晨/下午/晚上）
- ✅ 按事件类型统计（会议/工作/个人）
- ✅ 识别空闲和过载时段

---

## 2. 用户价值与场景

### 核心场景 1: 查看年度时间热力图

**场景描述**:  
用户查看过去一年的时间分配热力图，类似 GitHub 贡献图。

**用户故事**:

```gherkin
As a 用户
I want 查看年度时间热力图
So that 了解长期时间使用趋势
```

**操作流程**:

1. 用户打开"日程统计"页面
2. 默认显示年度热力图：

   ```
   📊 时间热力图 - 2025 年
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   总日程时长: 1,245 小时
   平均每天: 3.4 小时
   最忙的一天: 2025-08-15 (12 小时)

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        1月  2月  3月  4月  5月  6月  7月  8月  9月  10月 11月 12月
   周一 ░░  ░░  ▓▓  ██  ██  ▓▓  ▓▓  ██  ██  ░░  ░░  ░░
   周二 ░░  ░░  ██  ██  ▓▓  ░░  ██  ██  ██  ▓▓  ░░  ░░
   周三 ░░  ▓▓  ▓▓  ░░  ░░  ██  ░░  ░░  ▓▓  ██  ░░  ░░
   周四 ▓▓  ▓▓  ██  ▓▓  ▓▓  ██  ██  ░░  ░░  ░░  ░░  ░░
   周五 ░░  ░░  ░░  ██  ██  ██  ▓▓  ░░  ░░  ▓▓  ░░  ░░
   周六 ░░  ░░  ░░  ░░  ░░  ▓▓  ░░  ░░  ░░  ░░  ░░  ░░
   周日 ░░  ░░  ░░  ░░  ░░  ░░  ░░  ░░  ░░  ░░  ░░  ░░

   颜色深度：
   ░░ 0-2h  ▓▓ 2-4h  ██ 4-6h  ██ 6+h

   💡 洞察：
   • 8月最繁忙（项目上线高峰）
   • 周末时间较少安排
   • 3-5月工作日程较满
   ```

3. 用户鼠标悬停在某个方块：

   ```
   🗓️ 2025-08-15（周五）
   ━━━━━━━━━━━━━━━━━━━━━━━
   总时长: 12 小时

   事件类型分布：
   🟡 会议: 6h (50%)
   🔵 工作: 4h (33%)
   🟢 个人: 2h (17%)

   主要事件：
   • 产品评审会 (2h)
   • 技术方案讨论 (3h)
   • 代码开发 (4h)

   [查看详情]
   ```

**预期结果**:

- 直观展示全年时间分布
- 识别高峰和低谷期
- 支持悬停查看详情

---

### 核心场景 2: 按时段分析（日内热力图）

**场景描述**:  
用户查看一天 24 小时的时间分布热力图。

**用户故事**:

```gherkin
As a 用户
I want 查看日内时段热力图
So that 了解最佳工作时段
```

**操作流程**:

1. 用户点击"时段分析"
2. 显示日内热力图：

   ```
   ⏰ 时段热力图 - 最近 30 天
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   时间     0   2   4   6   8   10  12  14  16  18  20  22  24
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   周一-五  ░░  ░░  ░░  ░░  ██  ██  ▓▓  ██  ██  ▓▓  ░░  ░░  ░░
   周末     ░░  ░░  ░░  ░░  ░░  ▓▓  ░░  ░░  ▓▓  ░░  ░░  ░░  ░░

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 高峰时段
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🔥 最忙时段: 9:00-11:00, 14:00-17:00
   平均占用率: 85%
   主要活动: 会议、深度工作

   🟢 空闲时段: 12:00-14:00 (午休), 18:00-20:00
   平均占用率: 20%
   建议: 可安排灵活任务

   🌙 晚间时段: 20:00-24:00
   平均占用率: 10%
   建议: 保持良好作息
   ```

3. 用户点击"9:00-11:00"查看详情：

   ```
   📈 9:00-11:00 时段详情
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   最近 30 天平均占用率: 85%

   常见事件类型：
   🟡 会议: 60% (团队站会、周例会)
   🔵 深度工作: 30% (代码开发)
   🟢 个人事务: 10%

   建议：
   • 这是你的黄金工作时段
   • 尽量减少非必要会议
   • 适合安排需要专注的任务
   ```

**预期结果**:

- 识别最佳工作时段
- 发现时间浪费
- 优化日程安排

---

### 核心场景 3: 按事件类型统计

**场景描述**:  
用户查看不同类型事件的时间分配趋势。

**用户故事**:

```gherkin
As a 用户
I want 查看事件类型时间分配
So that 优化时间结构
```

**操作流程**:

1. 用户选择"类型分析"
2. 显示堆叠面积图：

   ```
   📊 事件类型时间分配 - 最近 12 周
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   小时
   60h |                                               ██████
       |                                        ▓▓▓▓▓▓▓▓████
   50h |                                 ░░░░░░▓▓▓▓▓▓▓▓████
       |                          ░░░░░░░░░░░░░▓▓▓▓▓▓▓████
   40h |                   ▓▓▓▓▓▓░░░░░░░░░░░░░▓▓▓▓▓▓████
       |            ░░░░░░▓▓▓▓▓▓░░░░░░░░░░░░░▓▓▓▓████
   30h |     ░░░░░░░░░░░░▓▓▓▓▓▓░░░░░░░░░░░░▓▓████
       |░░░░░░░░░░░░░░░░▓▓▓▓▓▓░░░░░░░░░░████
   20h |░░░░░░░░░░░░░░░░▓▓▓▓▓▓░░░░░░████
       |░░░░░░░░░░░░░░░░▓▓▓▓▓▓░░████
   10h |░░░░░░░░░░░░░░░░▓▓▓▓████
       |░░░░░░░░░░░░░░░░████
    0h |────────────────────────────────────────────────────
       W1  W3  W5  W7  W9  W11 W13 W15 W17 W19 W21 W23 W25

   ██ 会议  ▓▓ 工作  ░░ 个人

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📈 趋势分析
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   • 会议时间持续增长（W1: 15h → W25: 28h）⚠️
   • 深度工作时间减少（W1: 25h → W25: 18h）⚠️
   • 个人时间基本稳定

   💡 建议：
   • 会议占比过高（50%），建议控制在 30% 以内
   • 保护深度工作时间，设置"专注时段"
   • 考虑异步沟通替代部分会议
   ```

**预期结果**:

- 识别时间分配失衡
- 发现趋势变化
- 提供优化建议

---

### 核心场景 4: 智能洞察和建议

**场景描述**:  
系统基于热力图数据提供个性化洞察。

**用户故事**:

```gherkin
As a 用户
I want 获得智能时间洞察
So that 改进时间管理
```

**操作流程**:

1. 系统分析用户数据：

   ```typescript
   function generateInsights(events: ScheduleEvent[]): Insight[] {
     const insights: Insight[] = [];

     // 1. 识别过载时段
     const overloadPeriods = findOverloadPeriods(events);
     if (overloadPeriods.length > 0) {
       insights.push({
         type: 'warning',
         title: '发现过载时段',
         message: `${overloadPeriods[0]} 日程过满，建议留出缓冲时间`,
         action: 'optimize_schedule',
       });
     }

     // 2. 识别碎片化
     const fragmentation = calculateFragmentation(events);
     if (fragmentation > 0.7) {
       insights.push({
         type: 'suggestion',
         title: '日程较为碎片化',
         message: '考虑合并小会议或设置连续工作时段',
         action: 'consolidate_events',
       });
     }

     // 3. 识别低效时段
     const lowUtilization = findLowUtilizationPeriods(events);
     if (lowUtilization.length > 0) {
       insights.push({
         type: 'info',
         title: '发现空闲时段',
         message: `${lowUtilization[0]} 通常较空闲，可安排重要任务`,
         action: 'suggest_tasks',
       });
     }

     return insights;
   }
   ```

2. 显示洞察卡片：

   ```
   💡 智能洞察
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   ⚠️ 周一日程过载
   周一平均安排 8 小时事件，建议减少至 6 小时以内
   [查看周一日程] [优化建议]

   💡 周三下午较空闲
   最近 4 周周三下午平均仅 1 小时事件
   建议安排需要专注的任务
   [查看可安排任务]

   📊 会议时间持续增长
   过去 8 周会议时间增长 40%
   [分析会议分布] [设置会议上限]

   ✅ 时间管理良好
   工作/生活平衡保持稳定
   深度工作时段保护较好
   ```

**预期结果**:

- 主动发现问题
- 提供可行建议
- 支持一键优化

---

## 3. 设计要点

### 热力图计算逻辑

```typescript
interface HeatmapData {
  date: string; // 'YYYY-MM-DD'
  totalDuration: number; // 分钟
  eventCount: number;
  eventsByType: Record<string, number>;
  intensity: 0 | 1 | 2 | 3 | 4; // 0=空闲, 4=最忙
}

function calculateIntensity(duration: number): number {
  if (duration === 0) return 0;
  if (duration <= 120) return 1; // 0-2h
  if (duration <= 240) return 2; // 2-4h
  if (duration <= 360) return 3; // 4-6h
  return 4; // 6h+
}

function generateYearHeatmap(events: ScheduleEvent[]): HeatmapData[] {
  const year = new Date().getFullYear();
  const heatmap: HeatmapData[] = [];

  for (let month = 0; month < 12; month++) {
    const daysInMonth = getDaysInMonth(new Date(year, month));

    for (let day = 1; day <= daysInMonth; day++) {
      const date = format(new Date(year, month, day), 'yyyy-MM-dd');
      const dayEvents = events.filter((e) => isSameDay(e.startTime, date));

      const totalDuration = dayEvents.reduce(
        (sum, e) => sum + (e.endTime - e.startTime) / 60000,
        0,
      );

      heatmap.push({
        date,
        totalDuration,
        eventCount: dayEvents.length,
        eventsByType: groupEventsByType(dayEvents),
        intensity: calculateIntensity(totalDuration),
      });
    }
  }

  return heatmap;
}
```

---

### 前端展示

```vue
<template>
  <div class="heatmap-container">
    <!-- 年度热力图 -->
    <div class="heatmap-year">
      <div
        v-for="cell in heatmapData"
        :key="cell.date"
        :class="['heatmap-cell', `intensity-${cell.intensity}`]"
        @mouseenter="showTooltip(cell)"
        @mouseleave="hideTooltip"
      />
    </div>

    <!-- 悬停提示 -->
    <Tooltip v-if="hoveredCell" :data="hoveredCell" />
  </div>
</template>

<style>
.heatmap-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin: 2px;
}

.intensity-0 {
  background: #ebedf0;
}
.intensity-1 {
  background: #9be9a8;
}
.intensity-2 {
  background: #40c463;
}
.intensity-3 {
  background: #30a14e;
}
.intensity-4 {
  background: #216e39;
}
</style>
```

---

## 4. MVP 范围

### MVP（1 周）

- ✅ 年度热力图（GitHub 风格）
- ✅ 日内时段热力图
- ✅ 基础统计（总时长、平均值）
- ✅ 悬停查看详情

### Full（后续）

- ✅ 按类型堆叠图
- ✅ 智能洞察
- ✅ 对比分析（本月 vs 上月）
- ✅ 导出报告

---

## 5. 验收标准（Gherkin）

```gherkin
Feature: 时间热力图

  Scenario: 查看年度热力图
    Given 用户有 365 天的日程数据
    When 打开时间热力图
    Then 应显示 365 个方块
    And 颜色深度反映时间长度

  Scenario: 识别最忙时段
    Given 9:00-11:00 平均占用率 85%
    When 查看时段分析
    Then 应标记为"高峰时段"
    And 提供优化建议
```

---

## 6. 成功指标

| 指标       | 目标值                |
| ---------- | --------------------- |
| 功能使用率 | >20% 用户查看热力图   |
| 洞察点击率 | >40% 用户点击洞察卡片 |
| 用户满意度 | >4.2/5.0              |

---

**文档状态**: ✅ Ready for Review  
**下一步**: Notification 通知摘要
