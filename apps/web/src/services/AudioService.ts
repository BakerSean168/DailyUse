/**
 * 音频服务
 *
 * 统一管理应用中的音效播放
 * 使用 @dailyuse/assets 中的音频资源
 */

// @ts-nocheck - Audio assets not yet configured
import {
  sounds,
  alertSound,
  defaultSound,
  errorSound,
  notificationSound,
  reminderSound,
  successSound,
  type SoundType,
} from '@dailyuse/assets/audio';

interface AudioServiceConfig {
  enabled: boolean;
  volume: number; // 0-1
  muted: boolean;
}

class AudioService {
  private static instance: AudioService;
  private config: AudioServiceConfig = {
    enabled: true,
    volume: 0.5,
    muted: false,
  };
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * 播放指定类型的音效
   */
  play(soundType: SoundType): Promise<void> {
    if (!this.config.enabled || this.config.muted) {
      return Promise.resolve();
    }

    const soundUrl = sounds[soundType];
    return this.playSound(soundUrl);
  }

  /**
   * 播放自定义音频 URL
   */
  async playSound(url: string): Promise<void> {
    if (!this.config.enabled || this.config.muted) {
      return;
    }

    try {
      let audio = this.audioCache.get(url);

      if (!audio) {
        audio = new Audio(url);
        audio.volume = this.config.volume;
        this.audioCache.set(url, audio);
      }

      // 重置播放位置
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.warn('[AudioService] 播放音频失败:', error);
    }
  }

  /**
   * 播放成功音效
   */
  playSuccess(): Promise<void> {
    return this.play('success');
  }

  /**
   * 播放错误音效
   */
  playError(): Promise<void> {
    return this.play('error');
  }

  /**
   * 播放通知音效
   */
  playNotification(): Promise<void> {
    return this.play('notification');
  }

  /**
   * 播放提醒音效
   */
  playReminder(): Promise<void> {
    return this.play('reminder');
  }

  /**
   * 播放警告音效
   */
  playAlert(): Promise<void> {
    return this.play('alert');
  }

  /**
   * 播放默认音效
   */
  playDefault(): Promise<void> {
    return this.play('default');
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.saveConfig();

    // 更新所有缓存音频的音量
    this.audioCache.forEach((audio) => {
      audio.volume = this.config.volume;
    });
  }

  /**
   * 获取音量
   */
  getVolume(): number {
    return this.config.volume;
  }

  /**
   * 静音/取消静音
   */
  setMuted(muted: boolean): void {
    this.config.muted = muted;
    this.saveConfig();
  }

  /**
   * 获取静音状态
   */
  isMuted(): boolean {
    return this.config.muted;
  }

  /**
   * 启用/禁用音效
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.saveConfig();
  }

  /**
   * 获取启用状态
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 获取所有可用的音效
   */
  getAvailableSounds(): Record<SoundType, string> {
    return { ...sounds };
  }

  /**
   * 清空音频缓存
   */
  clearCache(): void {
    this.audioCache.forEach((audio) => {
      audio.pause();
      audio.src = '';
    });
    this.audioCache.clear();
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    try {
      const configJson = localStorage.getItem('audio-service-config');
      if (configJson) {
        const config = JSON.parse(configJson);
        this.config = { ...this.config, ...config };
      }
    } catch (error) {
      console.warn('[AudioService] 加载配置失败:', error);
    }
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('audio-service-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('[AudioService] 保存配置失败:', error);
    }
  }
}

// 导出单例实例
export const audioService = AudioService.getInstance();
export { AudioService };
export type { SoundType };
