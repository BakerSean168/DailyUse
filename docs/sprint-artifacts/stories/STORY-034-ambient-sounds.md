# STORY-034: 白噪音与专注音乐

## 📋 Story 概述

**Story ID**: STORY-034  
**Epic**: EPIC-007 (Pomodoro & Focus Mode)  
**优先级**: P2 (增强体验)  
**预估工时**: 2 天  
**状态**: 📋 Ready for Dev  
**前置依赖**: STORY-032/033 ✅

---

## 🎯 用户故事

**作为** DailyUse 桌面用户  
**我希望** 在专注时播放白噪音或轻音乐帮助集中注意力  
**以便于** 屏蔽环境噪音，创造沉浸式工作环境

---

## 📋 验收标准

### 功能验收 - 内置音效

- [ ] 提供至少 5 种白噪音
- [ ] 雨声、咖啡馆、海浪、森林、火炉
- [ ] 音效可循环播放
- [ ] 音量独立调节（0-100%）
- [ ] 淡入淡出效果

### 功能验收 - 播放控制

- [ ] 专注模式自动播放（可配置）
- [ ] 快捷键静音/取消静音
- [ ] 与番茄钟联动（休息时暂停）
- [ ] 定时自动停止
- [ ] 系统托盘快速控制

### 功能验收 - 自定义音频

- [ ] 用户可上传自己的音频文件
- [ ] 支持 MP3/WAV/OGG 格式
- [ ] 创建个人播放列表
- [ ] 音频预览试听
- [ ] 管理已上传音频

### 功能验收 - 高级功能

- [ ] 混合播放（雨声 + 咖啡馆）
- [ ] 环境音效均衡器
- [ ] 收藏喜欢的组合
- [ ] 根据任务类型推荐音效

---

## 🔧 技术方案

### 音频文件管理

```
内置音效存储:
apps/desktop/public/sounds/
  ├── rain.mp3          # 雨声
  ├── cafe.mp3          # 咖啡馆
  ├── ocean.mp3         # 海浪
  ├── forest.mp3        # 森林
  ├── fireplace.mp3     # 火炉
  └── white-noise.mp3   # 纯白噪音

用户上传音频:
~/DailyUse/sounds/
  └── custom/
      ├── my-playlist.mp3
      └── ...
```

### 数据模型

```typescript
// packages/domain-client/src/focus/
interface AmbientSound {
  id: string;
  name: string;
  type: 'builtin' | 'custom';
  filePath: string;
  duration?: number;  // 秒
  category: 'nature' | 'urban' | 'music' | 'noise';
  thumbnail?: string;
  isFavorite: boolean;
}

interface SoundSettings {
  autoPlayOnFocus: boolean;
  defaultSound?: string;  // sound id
  volume: number;  // 0-100
  fadeInDuration: number;  // 秒
  fadeOutDuration: number;
  mixedSounds?: {
    soundId: string;
    volume: number;
  }[];
}

interface SoundPreset {
  id: string;
  name: string;
  sounds: Array<{
    soundId: string;
    volume: number;
  }>;
  createdAt: Date;
}
```

### 音频播放服务

```typescript
// packages/application-client/src/focus/AudioPlayerService.ts
export class AudioPlayerService {
  private audioContexts: Map<string, AudioContext> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  
  /**
   * 播放环境音
   */
  async play(sound: AmbientSound, volume: number = 50): Promise<void> {
    const audioContext = new AudioContext();
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    
    // 设置音量
    gainNode.gain.value = volume / 100;
    
    // 加载音频
    const response = await fetch(sound.filePath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // 创建音源
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;  // 循环播放
    source.connect(gainNode);
    
    // 淡入效果
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      volume / 100,
      audioContext.currentTime + 2  // 2 秒淡入
    );
    
    source.start();
    
    this.audioContexts.set(sound.id, audioContext);
    this.gainNodes.set(sound.id, gainNode);
  }
  
  /**
   * 停止播放（带淡出）
   */
  async stop(soundId: string, fadeOutDuration: number = 2): Promise<void> {
    const audioContext = this.audioContexts.get(soundId);
    const gainNode = this.gainNodes.get(soundId);
    
    if (!audioContext || !gainNode) return;
    
    // 淡出效果
    gainNode.gain.linearRampToValueAtTime(
      0,
      audioContext.currentTime + fadeOutDuration
    );
    
    setTimeout(() => {
      audioContext.close();
      this.audioContexts.delete(soundId);
      this.gainNodes.delete(soundId);
    }, fadeOutDuration * 1000);
  }
  
  /**
   * 调整音量
   */
  setVolume(soundId: string, volume: number): void {
    const gainNode = this.gainNodes.get(soundId);
    if (gainNode) {
      gainNode.gain.value = volume / 100;
    }
  }
  
  /**
   * 混合播放多个音效
   */
  async playMix(mix: SoundPreset): Promise<void> {
    for (const item of mix.sounds) {
      const sound = await this.soundService.getSound(item.soundId);
      await this.play(sound, item.volume);
    }
  }
  
  /**
   * 停止所有播放
   */
  stopAll(): void {
    for (const soundId of this.audioContexts.keys()) {
      this.stop(soundId);
    }
  }
}
```

### UI 组件

```
环境音面板:
┌─────────────────────────────────────────────────────┐
│  环境音                              [🔇 静音]       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  内置音效:                                           │
│                                                      │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐           │
│  │ 🌧️   │ │ ☕    │ │ 🌊    │ │ 🌲    │           │
│  │ 雨声  │ │咖啡馆 │ │ 海浪  │ │ 森林  │           │
│  │ ▶️    │ │       │ │       │ │       │           │
│  └───────┘ └───────┘ └───────┘ └───────┘           │
│                                                      │
│  ┌───────┐ ┌───────┐                                │
│  │ 🔥    │ │ 📻    │                                │
│  │火炉声 │ │白噪音 │                                │
│  │       │ │       │                                │
│  └───────┘ └───────┘                                │
│                                                      │
│  音量: [████████░░] 80%                             │
│                                                      │
│  我的预设:                                           │
│  [工作模式] [深夜编码] [创意时间]  [+ 新建]         │
│                                                      │
│  自定义音频:                                         │
│  [📂 上传音频文件]                                   │
│                                                      │
│  ☑ 专注模式自动播放                                  │
│  ☑ 休息时自动暂停                                    │
│                                                      │
└─────────────────────────────────────────────────────┘

混合播放编辑器:
┌─────────────────────────────────────────────────────┐
│  创建音效组合                                 [X]   │
├─────────────────────────────────────────────────────┤
│  预设名称                                            │
│  ┌──────────────────────────────────────────────┐   │
│  │ 工作模式                                     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  已选音效:                                           │
│                                                      │
│  🌧️ 雨声                                            │
│  音量: [██████░░░░] 60%                             │
│                                                      │
│  ☕ 咖啡馆                                           │
│  音量: [███░░░░░░░] 30%                             │
│                                                      │
│  [+ 添加更多音效]                                    │
│                                                      │
│  [试听]                      [取消]  [保存预设]     │
└─────────────────────────────────────────────────────┘
```

---

## 📁 文件变更清单

### 新增文件

```
apps/desktop/public/sounds/
  └── [6 个内置音效文件]

packages/domain-client/src/focus/
  ├── aggregates/AmbientSound.ts
  └── value-objects/SoundSettings.ts

packages/application-client/src/focus/
  ├── services/AudioPlayerService.ts
  └── services/SoundLibraryService.ts

apps/desktop/src/renderer/components/focus/
  ├── AmbientSoundPanel.tsx
  ├── SoundCard.tsx
  ├── SoundMixer.tsx
  └── VolumeControl.tsx
```

### 修改文件

```
apps/desktop/src/renderer/views/focus/FocusModeView.tsx
  └── 集成环境音控制

apps/desktop/src/main/tray/PomodoroTray.tsx
  └── 添加音效快捷控制
```

---

## 📝 注意事项

1. **音频格式**：使用 MP3 (有损压缩)，文件大小控制在 5MB 以内
2. **版权问题**：内置音效使用 Creative Commons 授权
3. **性能优化**：使用 Web Audio API 而非 `<audio>` 标签
4. **内存管理**：及时释放 AudioContext 避免内存泄漏
