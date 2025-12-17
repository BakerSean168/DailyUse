<!--
  音频和图片资源使用示例组件
  展示如何使用 @dailyuse/assets 包中的资源
-->
<template>
  <div class="assets-demo">
    <v-card class="ma-4 pa-4">
      <v-card-title>📦 Assets 资源库使用示例</v-card-title>

      <!-- 图片资源示例 -->
      <v-card-text>
        <h3 class="mb-4">🖼️ 图片资源</h3>
        <div class="image-showcase mb-6">
          <v-row>
            <v-col cols="12" md="4">
              <div class="text-center">
                <img :src="logo" alt="Logo SVG" style="width: 100px; height: auto" />
                <p class="text-caption mt-2">Logo SVG</p>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-center">
                <img :src="logo128" alt="Logo 128" style="width: 100px; height: auto" />
                <p class="text-caption mt-2">Logo 128px</p>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-center">
                <img
                  :src="defaultAvatar"
                  alt="Avatar"
                  style="width: 100px; height: auto; border-radius: 50%"
                />
                <p class="text-caption mt-2">默认头像</p>
              </div>
            </v-col>
          </v-row>
        </div>

        <!-- 音频资源示例 -->
        <h3 class="mb-4">🔊 音频资源</h3>
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-btn block color="success" @click="playSuccess" prepend-icon="mdi-check-circle">
              播放成功音效
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn block color="error" @click="playError" prepend-icon="mdi-alert-circle">
              播放错误音效
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn block color="info" @click="playNotification" prepend-icon="mdi-bell">
              播放通知音效
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn block color="warning" @click="playReminder" prepend-icon="mdi-alarm">
              播放提醒音效
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn block color="orange" @click="playAlert" prepend-icon="mdi-alert">
              播放警告音效
            </v-btn>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn block @click="playDefault" prepend-icon="mdi-music-note"> 播放默认音效 </v-btn>
          </v-col>
        </v-row>

        <!-- 音频控制 -->
        <h3 class="mb-4">⚙️ 音频控制</h3>
        <v-row>
          <v-col cols="12">
            <v-slider
              v-model="volume"
              :min="0"
              :max="100"
              :step="5"
              label="音量"
              prepend-icon="mdi-volume-high"
              @update:model-value="updateVolume"
            >
              <template #append>
                <v-chip size="small">{{ volume }}%</v-chip>
              </template>
            </v-slider>
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="enabled"
              label="启用音效"
              color="primary"
              @update:model-value="updateEnabled"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="muted"
              label="静音"
              color="error"
              @update:model-value="updateMuted"
            />
          </v-col>
        </v-row>

        <!-- 可用音效列表 -->
        <h3 class="mb-4">📋 可用音效列表</h3>
        <v-list density="compact">
          <v-list-item v-for="(soundUrl, soundType) in availableSounds" :key="soundType">
            <template #prepend>
              <v-icon>mdi-music-note</v-icon>
            </template>
            <v-list-item-title>{{ soundType }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ soundUrl }}</v-list-item-subtitle>
            <template #append>
              <v-btn size="small" icon="mdi-play" @click="playSound(soundType)" />
            </template>
          </v-list-item>
        </v-list>

        <!-- 调试功能 -->
        <h3 class="mb-4 mt-6">🐛 调试功能</h3>
        <v-row>
          <v-col cols="12" md="6">
            <v-btn
              block
              color="warning"
              prepend-icon="mdi-bug"
              @click="triggerTestReminder"
              :loading="testReminderLoading"
            >
              触发测试提醒 (SSE)
            </v-btn>
            <p class="text-caption mt-2 text-center">点击此按钮将从后端发送一个测试提醒事件</p>
          </v-col>
          <v-col cols="12" md="6">
            <v-btn
              block
              color="primary"
              prepend-icon="mdi-clock-outline"
              @click="createRecurringReminder"
              :loading="reminderCreating"
            >
              创建每1分钟提醒
            </v-btn>
            <p class="text-caption mt-2 text-center">创建一个每分钟触发的循环提醒模板</p>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
/**
 * @component AssetsDemo
 * @description 音频和图片资源使用示例组件。展示如何使用 @dailyuse/assets 包中的资源。
 * @author Jules (AI)
 */

import { ref, onMounted } from 'vue';
import { logo, logo128, defaultAvatar } from '@dailyuse/assets/images';
import { audioService, type SoundType } from '@/services/AudioService';
import { AuthManager } from '@/shared/api';
import { reminderApiClient } from '@/modules/reminder/infrastructure/api/reminderApiClient';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { ReminderTemplateClientDTO, CreateReminderTemplateRequest } from '@dailyuse/contracts/reminder';
import { ReminderType, TriggerType, RecurrenceType, NotificationChannel } from '@dailyuse/contracts/reminder';
import { generateUUID } from '@dailyuse/utils';

// Type alias
type CreateReminderTemplateRequestDTO = CreateReminderTemplateRequest;

/**
 * 音频音量 (0-100)
 */
const volume = ref(50);
/**
 * 是否启用音频
 */
const enabled = ref(true);
/**
 * 是否静音
 */
const muted = ref(false);
/**
 * 可用的音效列表
 */
const availableSounds = ref<Record<string, string>>({});
/**
 * 测试提醒按钮的加载状态
 */
const testReminderLoading = ref(false);
/**
 * 创建提醒按钮的加载状态
 */
const reminderCreating = ref(false);

/**
 * 初始化组件，加载音频服务状态
 */
onMounted(() => {
  volume.value = Math.round(audioService.getVolume() * 100);
  enabled.value = audioService.isEnabled();
  muted.value = audioService.isMuted();
  availableSounds.value = audioService.getAvailableSounds();
});

/**
 * 播放成功音效
 */
const playSuccess = () => audioService.playSuccess();
/**
 * 播放错误音效
 */
const playError = () => audioService.playError();
/**
 * 播放通知音效
 */
const playNotification = () => audioService.playNotification();
/**
 * 播放提醒音效
 */
const playReminder = () => audioService.playReminder();
/**
 * 播放警告音效
 */
const playAlert = () => audioService.playAlert();
/**
 * 播放默认音效
 */
const playDefault = () => audioService.playDefault();

/**
 * 播放指定类型的音效
 * @param soundType - 音效类型
 */
const playSound = (soundType: string) => {
  audioService.play(soundType as SoundType);
};

/**
 * 更新音量
 * @param value - 新的音量值
 */
const updateVolume = (value: number) => {
  audioService.setVolume(value / 100);
};

/**
 * 更新启用状态
 * @param value - 是否启用
 */
const updateEnabled = (value: boolean | null) => {
  audioService.setEnabled(value ?? false);
};

/**
 * 更新静音状态
 * @param value - 是否静音
 */
const updateMuted = (value: boolean | null) => {
  audioService.setMuted(value ?? false);
};

/**
 * 触发测试提醒
 * 发送请求到后端以触发一个 SSE 调试事件
 */
const triggerTestReminder = async () => {
  testReminderLoading.value = true;
  try {
    const token = AuthManager.getAccessToken();
    if (!token) {
      console.error('未找到访问令牌');
      return;
    }

    console.log('🧪 发送测试提醒请求...');
    const response = await fetch('http://localhost:3888/api/v1/schedules/debug/trigger-reminder', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('🧪 测试提醒响应:', data);

    if (data.success) {
      console.log('✅ 测试提醒已通过 SSE 推送');
      console.log('📡 请等待 SSE 事件到达...');
      console.log('🔊 声音将由 Notification 模块自动播放');
      // ❌ 不要在这里播放声音！
      // ✅ 等待 SSE 推送 → 事件总线 → Notification 模块监听 → 自动播放声音
    } else {
      console.error('❌ 测试提醒触发失败:', data);
      audioService.playError();
    }
  } catch (error) {
    console.error('❌ 触发测试提醒失败:', error);
    audioService.playError();
  } finally {
    testReminderLoading.value = false;
  }
};

/**
 * 创建每1分钟循环提醒
 * 创建一个用于测试的循环提醒模板
 */
const createRecurringReminder = async () => {
  reminderCreating.value = true;
  try {
    // 从 localStorage 获取用户 UUID
    const persistedData = localStorage.getItem('authentication');
    let userUuid: string | undefined;
    if (persistedData) {
      try {
        const authData = JSON.parse(persistedData);
        userUuid = authData.user?.uuid;
      } catch (error) {
        console.error('解析认证数据失败:', error);
      }
    }

    if (!userUuid) {
      console.error('未找到用户UUID');
      audioService.playError();
      return;
    }

    console.log('🔔 创建每1分钟循环提醒...');

    // 创建提醒模板
    const templateUuid = generateUUID();
    const now = Date.now();

    const request: CreateReminderTemplateRequestDTO = {
      title: '测试提醒 - 每1分钟',
      description: '这是一个测试提醒，每分钟触发一次',
      type: ReminderType.RECURRING,
      trigger: {
        type: TriggerType.FIXED_TIME,
        fixedTime: {
          time: '09:00',
        },
        interval: null,
      },
      recurrence: {
        type: RecurrenceType.DAILY,
        daily: { interval: 1 },
        weekly: null,
        customDays: null,
      },
      activeTime: {
        activatedAt: now,
      },
      activeHours: undefined,
      notificationConfig: {
        channels: [NotificationChannel.IN_APP],
        title: '测试提醒',
        body: '这是一个测试提醒，每分钟触发一次',
        sound: { enabled: true, soundName: 'default' },
        vibration: undefined,
        actions: undefined,
      },
      importanceLevel: ImportanceLevel.Moderate,
      tags: ['测试', '循环'],
      color: undefined,
      icon: undefined,
      groupUuid: undefined,
    };

    console.log('📤 发送创建请求:', request);
    const response = await reminderApiClient.createTemplate(request);
    console.log('✅ 提醒模板创建成功:', response);

    audioService.playSuccess();
    alert(
      `提醒模板创建成功！\nUUID: ${templateUuid}\n标题: ${request.title}\n\n请检查控制台查看详细信息。`,
    );
  } catch (error) {
    console.error('❌ 创建提醒模板失败:', error);
    audioService.playError();
    alert(`创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    reminderCreating.value = false;
  }
};
</script>

<style scoped>
.assets-demo {
  max-width: 1200px;
  margin: 0 auto;
}

.image-showcase {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 16px;
}
</style>
