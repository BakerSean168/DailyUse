# Feature Spec: 用户偏好设置

> **功能编号**: SETTING-001  
> **RICE 评分**: 154 (Reach: 7, Impact: 6, Confidence: 7, Effort: 2)  
> **优先级**: P0  
> **预估时间**: 1 周  
> **状态**: Draft  
> **负责人**: TBD  
> **最后更新**: 2025-10-21

---

## 1. 概述与目标

### 价值主张

**核心收益**:

- ✅ 个性化界面设置
- ✅ 主题切换（亮/暗/自动）
- ✅ 通知偏好配置
- ✅ 语言/时区设置
- ✅ 快捷键自定义

---

## 2. 核心场景

### 场景 1: 外观设置

```
⚙️ 用户设置
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 外观
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

主题:
🔘 亮色主题
⚪ 暗色主题
⚪ 跟随系统

界面语言:
[简体中文 ▼]

字体大小:
小 ●─────── 大  (14px)

侧边栏位置:
🔘 左侧  ⚪ 右侧

[保存]  [重置为默认]
```

---

### 场景 2: 通知偏好

```
🔔 通知设置
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

桌面通知:
☑️ 启用桌面通知

通知渠道:
☑️ 应用内通知
☑️ 桌面推送
☐ 邮件通知
☐ 微信通知

免打扰模式:
☑️ 启用
时间: [22:00] - [08:00]

通知声音:
🔘 默认  ⚪ 无声  ⚪ 自定义

[保存]
```

---

### 场景 3: 快捷键设置

```
⌨️ 快捷键
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

全局快捷键:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

创建任务:       Ctrl+N      [修改]
快速搜索:       Ctrl+K      [修改]
打开日程:       Ctrl+D      [修改]
打开目标:       Ctrl+G      [修改]

编辑器快捷键:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

加粗文本:       Ctrl+B      [修改]
插入链接:       Ctrl+L      [修改]
保存文档:       Ctrl+S      [修改]

[恢复默认]  [导入配置]  [导出配置]
```

---

## 3. Contracts

```typescript
export interface UserPreferenceServerDTO {
  readonly userId: string;

  // 外观
  readonly theme: 'light' | 'dark' | 'auto';
  readonly language: 'zh-CN' | 'en-US';
  readonly fontSize: number;
  readonly sidebarPosition: 'left' | 'right';

  // 通知
  readonly notificationSettings: {
    readonly enabled: boolean;
    readonly channels: ('in_app' | 'desktop' | 'email')[];
    readonly dndEnabled: boolean;
    readonly dndStartTime?: string;
    readonly dndEndTime?: string;
    readonly soundEnabled: boolean;
  };

  // 快捷键
  readonly shortcuts: Record<string, string>;

  // 其他
  readonly timezone: string;
  readonly weekStartDay: 0 | 1; // 周日或周一
  readonly dateFormat: string; // 'YYYY-MM-DD'

  readonly updatedAt: number;
}
```

---

## 4. MVP 范围

- ✅ 主题切换
- ✅ 语言设置
- ✅ 通知偏好
- ✅ 基础快捷键

---

**文档状态**: ✅ Ready
