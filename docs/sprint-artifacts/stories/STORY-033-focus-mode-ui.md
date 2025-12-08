# STORY-033: 专注模式 UI

## 📋 Story 概述

**Story ID**: STORY-033  
**Epic**: EPIC-007 (Pomodoro & Focus Mode)  
**优先级**: P1 (核心价值)  
**预估工时**: 2 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-032 ✅ (Pomodoro Timer)

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 进入专注模式时界面简化，只显示当前任务  
**以便于** 屏蔽干扰，进入深度工作状态

---

## 📋 验收标准

### 功能验收 - 专注视图

- [ ] 全屏或大窗口专注视图
- [ ] 显示当前任务名称和描述
- [ ] 显示番茄钟倒计时（大字体）
- [ ] 最小化其他 UI 元素
- [ ] 柔和的背景色/渐变

### 功能验收 - 快捷操作

- [ ] Esc 键退出专注模式
- [ ] 空格键暂停/继续
- [ ] 鼠标悬停显示控制条
- [ ] 快捷键切换任务
- [ ] 快速记录笔记功能

### 功能验收 - 勿扰集成

- [ ] 自动开启系统勿扰模式
- [ ] 隐藏桌面通知
- [ ] 暂停非紧急提醒
- [ ] 退出时恢复通知状态

### 功能验收 - 视觉效果

- [ ] 平滑进入/退出动画
- [ ] 呼吸灯效果（可选）
- [ ] 进度环动画
- [ ] 极简设计风格

---

## 🔧 技术方案

> **架构决策**: 专注模式 UI 作为 Goal 模块的视图组件，数据来自 Goal 聚合根

### UI 设计

```
专注模式全屏视图:
┌─────────────────────────────────────────────────────┐
│                                                      │
│                                                      │
│                                                      │
│                    ████████                          │
│                  ██        ██                        │
│                ██   24:37   ██                       │
│                ██            ██                      │
│                  ██        ██                        │
│                    ████████                          │
│                                                      │
│         编写 STORY-033 技术方案文档                  │
│                                                      │
│            目标: 完成专注模式设计                    │
│                                                      │
│                                                      │
│             [按 Esc 退出专注模式]                    │
│                                                      │
│                                                      │
│                                                      │
└─────────────────────────────────────────────────────┘

鼠标悬停时显示控制条:
┌─────────────────────────────────────────────────────┐
│                                                      │
│                   [控制条自动隐藏]                   │
│  ┌──────────────────────────────────────────────┐   │
│  │  [⏸ 暂停] [⏭ 跳过] [📝 笔记] [✕ 退出]      │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 组件实现

```typescript
// apps/desktop/src/renderer/views/focus/FocusModeView.tsx
import { useState, useEffect } from 'react';
import { usePomodoro } from '@/hooks/usePomodoro';

export const FocusModeView = () => {
  const { currentSession, remainingSeconds, pause, resume, skip } = usePomodoro();
  const [showControls, setShowControls] = useState(false);
  const [notes, setNotes] = useState('');
  
  // 自动隐藏鼠标
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFocusMode();
      } else if (e.key === ' ') {
        e.preventDefault();
        currentSession?.status === 'active' ? pause() : resume();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSession]);
  
  return (
    <div className="focus-mode-container">
      {/* 大倒计时器 */}
      <CircularTimer
        seconds={remainingSeconds}
        total={currentSession?.duration || 1500}
      />
      
      {/* 任务信息 */}
      <div className="task-info">
        <h1>{currentSession?.task?.title || '专注中'}</h1>
        <p>{currentSession?.task?.description}</p>
      </div>
      
      {/* 控制条（悬停显示） */}
      {showControls && (
        <div className="controls-bar">
          <button onClick={pause}>⏸ 暂停</button>
          <button onClick={skip}>⏭ 跳过</button>
          <button onClick={() => setShowNoteDialog(true)}>📝 笔记</button>
          <button onClick={exitFocusMode}>✕ 退出</button>
        </div>
      )}
      
      {/* 呼吸灯背景 */}
      <div className="breathing-background" />
    </div>
  );
};

// 圆形进度计时器
const CircularTimer = ({ seconds, total }: { seconds: number; total: number }) => {
  const progress = (total - seconds) / total;
  const circumference = 2 * Math.PI * 120;  // r=120
  const offset = circumference * (1 - progress);
  
  return (
    <svg width="300" height="300" className="circular-timer">
      {/* 背景圆 */}
      <circle
        cx="150"
        cy="150"
        r="120"
        fill="none"
        stroke="#e0e0e0"
        strokeWidth="8"
      />
      {/* 进度圆 */}
      <circle
        cx="150"
        cy="150"
        r="120"
        fill="none"
        stroke="#4CAF50"
        strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 150 150)"
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
      {/* 时间文字 */}
      <text
        x="150"
        y="160"
        textAnchor="middle"
        fontSize="48"
        fontWeight="bold"
        fill="#333"
      >
        {formatTime(seconds)}
      </text>
    </svg>
  );
};
```

### 系统勿扰集成

```typescript
// apps/desktop/src/main/services/FocusModeService.ts
import { systemPreferences } from 'electron';

export class FocusModeService {
  private previousDNDState: boolean = false;
  
  async enterFocusMode(): Promise<void> {
    // 保存当前勿扰状态
    this.previousDNDState = await this.isDNDEnabled();
    
    // 开启勿扰
    await this.enableDND();
    
    // 隐藏 Dock 图标（macOS）
    if (process.platform === 'darwin') {
      app.dock.hide();
    }
    
    // 设置全屏或最大化
    const win = BrowserWindow.getFocusedWindow();
    win?.setFullScreen(true);
    
    // 暂停非紧急通知
    notificationService.pauseNotifications();
  }
  
  async exitFocusMode(): Promise<void> {
    // 恢复勿扰状态
    if (!this.previousDNDState) {
      await this.disableDND();
    }
    
    // 恢复 Dock 图标
    if (process.platform === 'darwin') {
      app.dock.show();
    }
    
    // 退出全屏
    const win = BrowserWindow.getFocusedWindow();
    win?.setFullScreen(false);
    
    // 恢复通知
    notificationService.resumeNotifications();
  }
  
  private async isDNDEnabled(): Promise<boolean> {
    if (process.platform === 'darwin') {
      return systemPreferences.getUserDefault(
        'AppleInterfaceStyle',
        'boolean'
      );
    }
    // Windows/Linux 实现
    return false;
  }
  
  private async enableDND(): Promise<void> {
    // 平台特定实现
    if (process.platform === 'darwin') {
      // macOS: 使用 AppleScript
      const { exec } = require('child_process');
      exec('defaults write com.apple.notificationcenterui doNotDisturb -boolean true');
    }
  }
}
```

### CSS 样式

```css
/* apps/desktop/src/renderer/styles/focus-mode.css */
.focus-mode-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.5s ease-in;
}

.task-info {
  margin-top: 3rem;
  text-align: center;
  color: white;
}

.task-info h1 {
  font-size: 2.5rem;
  font-weight: 300;
  margin-bottom: 1rem;
}

.task-info p {
  font-size: 1.2rem;
  opacity: 0.8;
}

.controls-bar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  animation: slideUp 0.3s ease-out;
}

.controls-bar button {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.controls-bar button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}

/* 呼吸灯效果 */
.breathing-background {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateX(-50%) translateY(50px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
```

---

## 📁 文件变更清单

### 新增文件

```
apps/desktop/src/renderer/views/focus/
  ├── FocusModeView.tsx
  └── components/
      ├── CircularTimer.tsx
      ├── ControlsBar.tsx
      └── QuickNoteDialog.tsx

apps/desktop/src/renderer/styles/
  └── focus-mode.css

apps/desktop/src/main/services/
  └── FocusModeService.ts
```

### 修改文件

```
apps/desktop/src/renderer/App.tsx
  └── 添加专注模式路由

apps/desktop/src/main/main.ts
  └── 注册专注模式 IPC 处理
```

---

## 📝 注意事项

1. **性能优化**：使用 CSS transform 而非 margin/padding 实现动画
2. **跨平台兼容**：勿扰模式在不同平台实现方式不同
3. **用户体验**：确保快捷键响应灵敏，不能有延迟
4. **状态恢复**：异常退出时恢复系统设置
