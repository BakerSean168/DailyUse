# STORY-041: 习惯提醒系统

## 📋 Story 概述

**Story ID**: STORY-041  
**Epic**: EPIC-008 (Habit Tracking)  
**优先级**: P1 (核心价值)  
**预估工时**: 2 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-038 ✅ (Habit Check-in & Streak)

---

## 🎯 用户故事

**作为** DailyUse 用户  
**我希望** 系统能在合适的时间提醒我完成习惯  
**以便于** 不错过习惯打卡，保持习惯连续性

---

## 📋 验收标准

### 功能验收 - 固定时间提醒

- [ ] 设置每日固定时间提醒（如每天 7:00 晨跑）
- [ ] 支持多个时间点（如早中晚多次提醒）
- [ ] 支持重复模式（每天/工作日/周末/自定义）
- [ ] 支持提前提醒（如提前 5 分钟）
- [ ] 提醒方式：系统通知 + 应用内弹窗

### 功能验收 - 智能时间建议

- [ ] 基于历史打卡时间推荐最佳提醒时间
- [ ] 分析用户活跃时段，避开忙碌时间
- [ ] 考虑习惯类型自动建议时间（如晨跑建议早上6-8点）
- [ ] 学习用户延迟打卡习惯，动态调整时间

### 功能验收 - 位置提醒（未来移动端）

- [ ] 到达指定地点触发提醒（如到健身房提醒健身）
- [ ] 离开地点提醒（如离开办公室提醒关灯）
- [ ] 地理围栏设置
- [ ] 尊重用户隐私，可选功能

### 功能验收 - 习惯链提醒

- [ ] 识别习惯链（A完成后提醒B）
- [ ] 自动建议习惯顺序
- [ ] 完成前置习惯后立即提醒后续习惯
- [ ] 习惯链完成给予额外奖励

### 功能验收 - 提醒管理

- [ ] 全局开关：一键暂停所有提醒
- [ ] 单个习惯开关：独立控制每个习惯提醒
- [ ] 免打扰时段：设置勿扰时间（如午休、会议）
- [ ] 临时延迟：延迟 10/30/60 分钟
- [ ] 提醒历史：查看过去的提醒记录和响应情况

### 功能验收 - 提醒样式

- [ ] 系统通知显示习惯名称、图标、Streak信息
- [ ] 通知操作：立即打卡/延迟/跳过
- [ ] 应用内弹窗支持快速打卡
- [ ] 声音提醒（可自定义铃声）
- [ ] 震动提醒（移动端）

### 技术验收

- [ ] 提醒准时率 ≥ 99%（误差 ±1 分钟）
- [ ] 后台运行时正常提醒
- [ ] 系统重启后恢复提醒
- [ ] 时区切换正确处理

---

## 🔧 技术方案

### 数据模型

> **架构决策**: 习惯提醒作为 Reminder 模块的扩展，而非独立实现。原因：
> - 复用提醒调度引擎，避免重复实现定时任务系统
> - 统一通知管理，所有提醒走同一套通知渠道
> - 免打扰时段、提醒日志等基础设施共享
> - 减少 70% 的重复代码

```typescript
// packages/domain-client/src/reminder/entities/
interface HabitReminder extends ReminderTemplate {
  id: string;
  habitId: string;
  userId: string;
  enabled: boolean;
  type: 'fixed' | 'smart' | 'location' | 'chain';
  schedule: ReminderSchedule;
  notification: NotificationConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface ReminderSchedule {
  type: 'daily' | 'weekly' | 'custom';
  times: string[];               // HH:mm 格式
  daysOfWeek?: number[];         // 0-6，周日到周六
  customDates?: Date[];
  advanceMinutes?: number;       // 提前提醒分钟数
  repeatCount?: number;          // 重复次数（如每小时重复3次）
  repeatInterval?: number;       // 重复间隔（分钟）
}

interface NotificationConfig {
  showSystemNotification: boolean;
  showInAppPopup: boolean;
  playSound: boolean;
  soundFile?: string;
  vibrate?: boolean;              // 移动端
  actions: NotificationAction[];
}

interface NotificationAction {
  type: 'checkin' | 'delay' | 'skip';
  label: string;
}

interface SmartReminderConfig {
  enabled: boolean;
  learnFromHistory: boolean;
  avoidBusyHours: boolean;
  considerHabitChain: boolean;
  adaptToDelays: boolean;
  confidence: number;            // AI 推荐置信度
}

interface LocationReminder {
  id: string;
  habitId: string;
  trigger: 'enter' | 'exit';
  location: {
    latitude: number;
    longitude: number;
    radius: number;              // 米
    name: string;
  };
  enabled: boolean;
}

interface HabitChainReminder {
  id: string;
  sequence: string[];            // habit IDs
  enabled: boolean;
  delaySeconds: number;          // 前一个完成后延迟提醒
}

interface ReminderLog {
  id: string;
  reminderId: string;
  triggeredAt: Date;
  respondedAt?: Date;
  action: 'checkin' | 'delay' | 'skip' | 'ignore';
  delayMinutes?: number;
}

interface DoNotDisturbPeriod {
  id: string;
  userId: string;
  startTime: string;             // HH:mm
  endTime: string;               // HH:mm
  daysOfWeek: number[];
  enabled: boolean;
}
```

### 服务层

```typescript
// packages/application-client/src/reminder/services/HabitReminderService.ts
// 扩展 ReminderService，添加习惯特定的提醒逻辑
export class HabitReminderService extends ReminderService {
  // 提醒创建
  createReminder(
    habitId: string,
    schedule: ReminderSchedule
  ): Promise<HabitReminder>;
  
  createSmartReminder(habitId: string): Promise<HabitReminder>;
  
  createChainReminder(habitIds: string[]): Promise<HabitChainReminder>;
  
  // 提醒管理
  updateReminder(
    reminderId: string,
    updates: Partial<HabitReminder>
  ): Promise<HabitReminder>;
  
  deleteReminder(reminderId: string): Promise<void>;
  
  enableReminder(reminderId: string): Promise<void>;
  disableReminder(reminderId: string): Promise<void>;
  
  // 全局控制
  pauseAllReminders(durationMinutes: number): Promise<void>;
  resumeAllReminders(): Promise<void>;
  
  // 提醒查询
  getReminders(habitId: string): Promise<HabitReminder[]>;
  getNextReminder(habitId?: string): Promise<HabitReminder | null>;
  getReminderLogs(
    habitId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReminderLog[]>;
  
  // 勿扰设置
  addDoNotDisturbPeriod(period: DoNotDisturbPeriod): Promise<void>;
  removeDoNotDisturbPeriod(periodId: string): Promise<void>;
  isInDoNotDisturbPeriod(): boolean;
  
  // 智能建议
  suggestReminderTime(habitId: string): Promise<string[]>;
  analyzeReminderEffectiveness(
    habitId: string
  ): Promise<EffectivenessReport>;
  
  // 提醒响应
  respondToReminder(
    reminderId: string,
    action: 'checkin' | 'delay' | 'skip',
    delayMinutes?: number
  ): Promise<void>;
  
  // 事件
  onReminderTriggered: (reminder: HabitReminder) => void;
  onReminderResponded: (log: ReminderLog) => void;
}
```

### 智能提醒算法

```typescript
// 基于历史数据推荐最佳提醒时间
class SmartReminderEngine {
  async suggestBestTime(habitId: string): Promise<string[]> {
    // 1. 获取历史打卡数据
    const checkIns = await this.getCheckInHistory(habitId);
    
    // 2. 分析打卡时间分布
    const timeDistribution = this.analyzeTimeDistribution(checkIns);
    
    // 3. 找出峰值时间段
    const peakHours = this.findPeakHours(timeDistribution);
    
    // 4. 提前 15 分钟提醒
    const reminderTimes = peakHours.map(hour => {
      const reminderHour = hour - 0.25; // 提前 15 分钟
      return this.formatTime(reminderHour);
    });
    
    return reminderTimes;
  }
  
  analyzeTimeDistribution(checkIns: HabitCheckIn[]): Map<number, number> {
    const distribution = new Map<number, number>();
    
    checkIns.forEach(checkIn => {
      const hour = checkIn.checkedAt.getHours() + 
                   checkIn.checkedAt.getMinutes() / 60;
      const count = distribution.get(hour) || 0;
      distribution.set(hour, count + 1);
    });
    
    return distribution;
  }
  
  findPeakHours(distribution: Map<number, number>): number[] {
    const sorted = Array.from(distribution.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // 返回前 2 个峰值时间
    return sorted.slice(0, 2).map(([hour]) => hour);
  }
  
  // 学习用户延迟习惯
  async adaptToDelayPattern(habitId: string): Promise<number> {
    const logs = await this.getReminderLogs(habitId);
    
    // 计算平均延迟时间
    const delays = logs
      .filter(log => log.action === 'delay')
      .map(log => log.delayMinutes || 0);
    
    if (delays.length === 0) return 0;
    
    const avgDelay = delays.reduce((a, b) => a + b) / delays.length;
    
    // 如果用户经常延迟 30 分钟，就提前 30 分钟提醒
    return avgDelay;
  }
}

// 习惯链识别
class HabitChainDetector {
  async detectChains(userId: string): Promise<HabitChainReminder[]> {
    const habits = await this.getHabits(userId);
    const chains: HabitChainReminder[] = [];
    
    // 分析每对习惯的完成顺序
    for (let i = 0; i < habits.length; i++) {
      for (let j = 0; j < habits.length; j++) {
        if (i === j) continue;
        
        const correlation = await this.calculateSequenceCorrelation(
          habits[i].id,
          habits[j].id
        );
        
        // 如果 A 完成后 30 分钟内 B 也完成的概率 > 70%
        if (correlation.probability > 0.7 && correlation.avgDelay < 30) {
          chains.push({
            id: generateId(),
            sequence: [habits[i].id, habits[j].id],
            enabled: true,
            delaySeconds: correlation.avgDelay * 60,
          });
        }
      }
    }
    
    return chains;
  }
  
  async calculateSequenceCorrelation(
    habitA: string,
    habitB: string
  ): Promise<{ probability: number; avgDelay: number }> {
    const checkInsA = await this.getCheckIns(habitA);
    const checkInsB = await this.getCheckIns(habitB);
    
    let matches = 0;
    let totalDelays = 0;
    
    checkInsA.forEach(a => {
      const b = checkInsB.find(b =>
        this.isSameDay(a.date, b.date) && b.checkedAt > a.checkedAt
      );
      
      if (b) {
        matches++;
        const delay = (b.checkedAt.getTime() - a.checkedAt.getTime()) / 60000;
        totalDelays += delay;
      }
    });
    
    return {
      probability: matches / checkInsA.length,
      avgDelay: matches > 0 ? totalDelays / matches : 0,
    };
  }
}
```

### UI 组件

#### 提醒设置页面

```
┌─────────────────────────────────────────────────────┐
│              ⏰ 习惯提醒设置                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [ ✓ ] 启用所有提醒                                  │
│                                                      │
│  习惯: 🏃 晨跑 30 分钟                               │
│                                                      │
│  固定时间提醒:                                       │
│  [ ✓ ] 每天 06:30  [编辑] [删除]                     │
│  [ ✓ ] 每天 18:00  [编辑] [删除]                     │
│  [ + 添加时间 ]                                      │
│                                                      │
│  重复设置:                                           │
│  ( ● ) 每天                                          │
│  (   ) 工作日 (周一至周五)                           │
│  (   ) 周末                                          │
│  (   ) 自定义 [选择日期]                             │
│                                                      │
│  💡 智能建议:                                        │
│  根据你的历史记录，建议在以下时间提醒:               │
│  • 06:45 (你通常在这个时间完成)                      │
│  • 提前 15 分钟提醒效果最好                          │
│  [ 应用建议 ]                                        │
│                                                      │
│  提醒方式:                                           │
│  [ ✓ ] 系统通知                                      │
│  [ ✓ ] 应用内弹窗                                    │
│  [ ✓ ] 声音提醒  [选择铃声 ▼]                        │
│  [   ] 震动 (移动端)                                 │
│                                                      │
│  快捷操作:                                           │
│  [ ✓ ] 通知中显示"立即打卡"按钮                      │
│  [ ✓ ] 显示当前 Streak 信息                          │
│                                                      │
│  🔗 习惯链提醒:                                      │
│  [ ✓ ] 完成"晨跑"后 5 分钟提醒"冥想"                 │
│  (系统检测到你通常在跑步后冥想)                      │
│                                                      │
│  ⏸️  免打扰时段:                                     │
│  [ ✓ ] 12:00 - 13:00 (午休)                          │
│  [ ✓ ] 22:00 - 次日 06:00 (睡眠)                     │
│  [ + 添加时段 ]                                      │
│                                                      │
│  📊 提醒效果分析:                                    │
│  响应率: 87%  (13/15 次)                             │
│  平均延迟: 12 分钟                                   │
│  最佳提醒时间: 06:30                                 │
│  [ 查看详细分析 ]                                    │
│                                                      │
│           [ 保存设置 ]  [ 测试提醒 ]                 │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### 系统通知样式

```
┌─────────────────────────────────────────────────────┐
│  DailyUse                                    [关闭] │
│  ─────────────────────────────────────────          │
│  🏃 该跑步了！                                       │
│                                                      │
│  晨跑 30 分钟                                        │
│  🔥 当前连续 7 天                                    │
│                                                      │
│  [ ✓ 立即打卡 ]  [ ⏰ 延迟 ]  [ ✗ 跳过 ]            │
└─────────────────────────────────────────────────────┘
```

#### 应用内弹窗

```
┌─────────────────────────────────────────────────────┐
│                 ⏰ 习惯提醒                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│                      🏃                              │
│                                                      │
│                  晨跑 30 分钟                        │
│                                                      │
│              现在是最佳运动时间！                    │
│                                                      │
│            🔥 保持 7 天连续记录 🔥                   │
│                                                      │
│                                                      │
│             [ ✓ 去打卡 ]                             │
│                                                      │
│         [ 延迟 10分钟 ]  [ 跳过今天 ]                │
│                                                      │
└─────────────────────────────────────────────────────┘
```

#### 延迟选择

```
┌─────────────────────────────────────────────────────┐
│              ⏰ 延迟提醒                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│  将在稍后再次提醒你完成"晨跑 30 分钟"                │
│                                                      │
│  选择延迟时长:                                       │
│                                                      │
│      [ 10 分钟 ]    [ 30 分钟 ]                     │
│                                                      │
│      [ 1 小时 ]     [ 2 小时 ]                      │
│                                                      │
│      [ 自定义 ]                                      │
│                                                      │
│                [ 确定 ]  [ 取消 ]                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 主进程提醒服务

```typescript
// apps/desktop/src/main/services/ReminderMainService.ts
export class ReminderMainService {
  private scheduledReminders = new Map<string, NodeJS.Timeout>();
  
  async initialize() {
    // 启动时加载所有提醒
    const reminders = await this.getAllReminders();
    reminders.forEach(reminder => this.scheduleReminder(reminder));
    
    // 监听系统状态
    this.watchSystemStatus();
  }
  
  scheduleReminder(reminder: HabitReminder) {
    const nextTriggerTime = this.calculateNextTriggerTime(reminder);
    const delay = nextTriggerTime.getTime() - Date.now();
    
    if (delay > 0) {
      const timeout = setTimeout(() => {
        this.triggerReminder(reminder);
      }, delay);
      
      this.scheduledReminders.set(reminder.id, timeout);
    }
  }
  
  async triggerReminder(reminder: HabitReminder) {
    // 检查是否在免打扰时段
    if (this.isInDoNotDisturbPeriod()) {
      // 延迟到免打扰结束
      this.delayReminder(reminder, this.getDoNotDisturbEndTime());
      return;
    }
    
    // 显示系统通知
    if (reminder.notification.showSystemNotification) {
      this.showSystemNotification(reminder);
    }
    
    // 发送到渲染进程显示弹窗
    if (reminder.notification.showInAppPopup) {
      this.sendToRenderer('reminder:show', reminder);
    }
    
    // 播放声音
    if (reminder.notification.playSound) {
      this.playSound(reminder.notification.soundFile);
    }
    
    // 记录提醒日志
    await this.logReminder(reminder);
    
    // 重新调度（如果是重复提醒）
    this.scheduleReminder(reminder);
  }
  
  private watchSystemStatus() {
    const { powerMonitor } = require('electron');
    
    // 系统睡眠时清除所有定时器
    powerMonitor.on('suspend', () => {
      this.scheduledReminders.forEach(timeout => clearTimeout(timeout));
      this.scheduledReminders.clear();
    });
    
    // 系统唤醒时重新调度
    powerMonitor.on('resume', () => {
      this.initialize();
    });
  }
}
```

---

## 📁 文件变更清单

### 新增文件

```
packages/domain-client/src/habit/
  ├── aggregates/HabitReminder.ts
  ├── aggregates/LocationReminder.ts
  ├── aggregates/HabitChainReminder.ts
  ├── value-objects/ReminderSchedule.ts
  ├── value-objects/NotificationConfig.ts
  ├── value-objects/ReminderLog.ts
  └── value-objects/DoNotDisturbPeriod.ts

packages/application-client/src/habit/
  ├── services/HabitReminderService.ts
  └── utils/
      ├── SmartReminderEngine.ts
      └── HabitChainDetector.ts

packages/infrastructure-client/src/repositories/
  └── HabitReminderRepository.ts

apps/desktop/src/main/services/
  └── ReminderMainService.ts

apps/desktop/src/renderer/components/habit/reminder/
  ├── ReminderSettingsPage.tsx
  ├── ReminderTimeSelector.tsx
  ├── ReminderNotificationModal.tsx
  ├── DelayReminderModal.tsx
  ├── DoNotDisturbSettings.tsx
  ├── SmartSuggestions.tsx
  ├── HabitChainSettings.tsx
  └── ReminderEffectivenessReport.tsx

apps/desktop/src/renderer/hooks/
  └── useReminders.ts

apps/desktop/src/preload/channels/
  └── reminderChannels.ts
```

### 修改文件

```
apps/desktop/src/main/main.ts
  └── 初始化 ReminderMainService

apps/desktop/src/preload/preload.ts
  └── 添加 reminder:* 通道白名单

apps/desktop/src/renderer/components/habit/HabitDetailPage.tsx
  └── 添加提醒设置入口
```

---

## 🧪 测试要点

### 单元测试

- 提醒时间计算
- 智能推荐算法
- 习惯链检测
- 免打扰判断

### 集成测试

- 提醒准时触发
- 系统睡眠/唤醒处理
- 主进程 ↔ 渲染进程通信
- 提醒响应记录

### E2E 测试

- 完整提醒流程
- 延迟提醒
- 快速打卡
- 习惯链提醒

### 性能测试

- 大量提醒调度
- 长时间运行稳定性
- 内存占用

---

## 📝 注意事项

1. **准时性**：提醒要准时，误差控制在 1 分钟内
2. **可靠性**：系统重启、睡眠唤醒后要正常工作
3. **用户体验**：提醒不能过于打扰，要尊重免打扰设置
4. **权限管理**：系统通知需要用户授权
5. **电池优化**：移动端要考虑电池消耗
6. **时区处理**：跨时区使用要正确处理
7. **隐私保护**：位置提醒要明确告知用户
8. **无障碍**：通知要支持屏幕阅读器

---

## 🚀 未来扩展

1. **语音提醒**：语音播报提醒内容
2. **情境感知**：根据日历、天气等调整提醒
3. **社交提醒**：好友完成时提醒自己
4. **手表集成**：智能手表震动提醒
5. **AI 助手**：对话式提醒交互
6. **游戏化**：提醒失败有"惩罚"，及时响应有奖励
7. **家庭共享**：家人互相提醒
8. **第三方集成**：与日历、待办事项同步
