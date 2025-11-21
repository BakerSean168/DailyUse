<template>
  <v-app>
    <div v-if="isLoading" class="loading-container">
      <!-- 使用 @dailyuse/assets 中的 logo -->
      <img :src="logo" alt="DailyUse Logo" class="loading-logo mb-4" />
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">正在初始化应用...</p>
    </div>
    <router-view v-else></router-view>

    <!-- 全局 Snackbar 组件 -->
    <GlobalSnackbar />

    <!-- 应用内通知组件 -->
    <InAppNotification />

    <!-- @dailyuse/ui 消息提示组件 (用于 useMessage 确认框) -->
    <DuMessageProvider />

    <!-- 命令面板 (Cmd/Ctrl + K) - 按需加载 -->
    <component v-if="showCommandPalette" :is="CommandPalette" v-model="showCommandPalette" :goals="goals" :tasks="tasks"
      :reminders="reminders" />

    <!-- AI Orb Entry + Chat Drawer -->
    <AIFloatingOrb @open-chat="openChat" @create-key-result="handleCreateKeyResult" @assist-goal="handleAssistGoal"
      @generate-tasks="handleGenerateTasks" @generate-knowledge="handleGenerateKnowledge" />
    <!-- Hidden AI Dialogs (programmatic open) -->
    <AIGenerateKRButton ref="aiGenerateKRRef" @generated="onKeyResultsGenerated" @error="onKeyResultsError"
      style="display:none" />
    <AITasksQuickDialog ref="aiTasksRef" style="display:none" />
    <AIKnowledgeDocQuickDialog ref="aiKnowledgeRef" style="display:none" />
    <transition name="chat-fade">
      <div v-if="showChat" class="ai-chat-drawer">
        <div class="drawer-header">
          <span>AI Chat</span>
          <button class="close-btn" @click="closeChat">×</button>
        </div>
        <AIChatWindow />
      </div>
    </transition>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, defineAsyncComponent, shallowRef } from 'vue';
import AIChatWindow from '@/modules/ai-chat/components/AIChatWindow.vue';
import AIFloatingOrb from '@/modules/ai-chat/components/AIFloatingOrb.vue';
import AIGenerateKRButton from '@/modules/goal/presentation/components/AIGenerateKRButton.vue';
import AITasksQuickDialog from '@/modules/ai-chat/components/AITasksQuickDialog.vue';
import AIKnowledgeDocQuickDialog from '@/modules/ai-chat/components/AIKnowledgeDocQuickDialog.vue';
import { useSettingStore } from '@/modules/setting/presentation/stores/settingStore';
import { useSnackbarStore } from '@/shared/stores/snackbarStore';
import GlobalSnackbar from '@/shared/components/GlobalSnackbar.vue';
import InAppNotification from '@/modules/notification/presentation/components/InAppNotification.vue';
import { DuMessageProvider } from '@dailyuse/ui';
import { logo128 as logo } from '@dailyuse/assets';
import { getThemeService } from '@/modules/setting/application/services/ThemeService';

const isLoading = ref(true);
const showCommandPalette = ref(false);
const settingStore = useSettingStore();
const snackbarStore = useSnackbarStore();

// 懒加载命令面板组件和搜索数据
const CommandPalette = shallowRef<any>(null);
const goals = ref<any[]>([]);
const tasks = ref<any[]>([]);
const reminders = ref<any[]>([]);
const showChat = ref(false);

// 🔔 监听 Session 过期事件，显示友好提示
const handleSessionExpired = (event: CustomEvent) => {
  const { message, reason, errorCode } = event.detail;
  console.log('🚨 [App] Session 过期事件:', { message, reason, errorCode });

  // 显示友好的错误提示
  snackbarStore.show({
    message: message || '登录已过期，请重新登录',
    type: 'warning',
    timeout: 5000,
    action: {
      text: '立即登录',
      handler: () => {
        window.location.href = '/auth/login';
      },
    },
  });
};

// 监听快捷键，按需加载命令面板
if (typeof window !== 'undefined') {
  // Session 过期监听器
  window.addEventListener('auth:session-expired', handleSessionExpired as EventListener);

  window.addEventListener('keydown', async (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();

      // 首次打开时才加载组件和数据
      if (!CommandPalette.value) {
        console.log('⏳ 正在加载命令面板...');
        const [paletteModule, providerModule] = await Promise.all([
          import('@/shared/components/command-palette/CommandPalette.vue'),
          import('@/shared/services/SearchDataProvider'),
        ]);

        CommandPalette.value = paletteModule.default;
        const { searchDataProvider } = providerModule;

        // 加载搜索数据
        goals.value = searchDataProvider.getGoals();
        tasks.value = searchDataProvider.getTasks();
        reminders.value = searchDataProvider.getReminders();

        console.log('✅ 命令面板加载完成');
      }

      showCommandPalette.value = !showCommandPalette.value;
    }
  });
}

// ⚠️ 重要：在 Vue 组件的 setup 中初始化 ThemeService
const themeService = getThemeService();
themeService.initialize();

onMounted(async () => {
  try {
    // 只初始化不依赖用户登录态的设置
    await settingStore.initializeSettings();

    // 初始化完成（用户数据会在登录后由 USER_LOGIN 阶段自动加载）
    isLoading.value = false;

    console.log('应用基础初始化完成');
  } catch (error) {
    console.error('应用基础初始化失败:', error);
    isLoading.value = false;
  }
});

onUnmounted(() => {
  // 清理事件监听器
  if (typeof window !== 'undefined') {
    window.removeEventListener('auth:session-expired', handleSessionExpired as EventListener);
  }
});

function openChat() { showChat.value = true; }
function closeChat() { showChat.value = false; }

const aiGenerateKRRef = ref<InstanceType<typeof AIGenerateKRButton> | null>(null);
const aiTasksRef = ref<InstanceType<typeof AITasksQuickDialog> | null>(null);
const aiKnowledgeRef = ref<InstanceType<typeof AIKnowledgeDocQuickDialog> | null>(null);

function handleCreateKeyResult() {
  // Open the KR generation dialog programmatically
  if (!aiGenerateKRRef.value) {
    snackbarStore.show({ message: '组件尚未加载', type: 'error' });
    return;
  }
  aiGenerateKRRef.value.openDialog();
}

function handleAssistGoal() {
  openChat();
  // Dispatch an injected prompt for goal assistance
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('ai-chat:inject', {
      detail: {
        content: '我需要帮助来拆解一个目标，请给我建议：\n\n目标：提升团队交付效率。请建议 3-5 个可衡量的关键结果。'
      }
    }));
  }, 50);
}

function onKeyResultsGenerated(result: any) {
  const count = result?.keyResults?.length || 0;
  snackbarStore.show({ message: `成功生成 ${count} 个关键结果`, type: 'success' });
  if (count > 0) {
    openChat();
    const list = result.keyResults.map((kr: any, i: number) => `${i + 1}. ${kr.title || kr.name || '未命名'} (${kr.valueType || 'N/A'})`).join('\n');
    window.dispatchEvent(new CustomEvent('ai-chat:inject', {
      detail: {
        content: `以下是刚生成的关键结果：\n\n${list}\n\n请帮我评估这些关键结果是否平衡，并提出改进建议。`
      }
    }));
  }
}

function onKeyResultsError(error: string) {
  snackbarStore.show({ message: error || '生成关键结果失败', type: 'error' });
}

function handleGenerateTasks() {
  if (!aiTasksRef.value) {
    snackbarStore.show({ message: '任务生成组件未加载', type: 'error' });
    return;
  }
  aiTasksRef.value.openDialog();
}

function handleGenerateKnowledge() {
  if (!aiKnowledgeRef.value) {
    snackbarStore.show({ message: '知识文档组件未加载', type: 'error' });
    return;
  }
  aiKnowledgeRef.value.openDialog();
}
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
  background-color: rgb(var(--v-theme-background));
}

.loading-logo {
  width: 128px;
  height: 128px;
  object-fit: contain;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
</style>

<style>
:root {
  color-scheme: light dark;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
}

/* Theme transition styles */
body.theme-transition,
body.theme-transition *,
body.theme-transition *::before,
body.theme-transition *::after {
  transition:
    background-color 0.3s ease-in-out,
    color 0.3s ease-in-out,
    border-color 0.3s ease-in-out !important;
  transition-delay: 0s !important;
}

.ai-chat-drawer {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 860px;
  max-width: calc(100vw - 40px);
  height: 680px;
  max-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #ffffff 0%, #fafbff 100%);
  border: 1px solid rgba(208, 211, 217, 0.6);
  border-radius: 20px;
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.18),
    0 4px 16px rgba(74, 108, 247, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  z-index: 1100;
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

@media (max-width: 768px) {
  .ai-chat-drawer {
    bottom: 0;
    right: 0;
    width: 100vw;
    height: calc(100vh - 80px);
    border-radius: 20px 20px 0 0;
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: linear-gradient(135deg, #4a6cf7 0%, #5e7bfa 100%);
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 8px rgba(74, 108, 247, 0.15);
}

.close-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 8px;
  color: #fff;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.close-btn:active {
  transform: scale(0.95);
}

.chat-fade-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.chat-fade-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.95);
}

.chat-fade-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .ai-chat-drawer {
    background: linear-gradient(135deg, #1a1d2e 0%, #252936 100%);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow:
      0 12px 48px rgba(0, 0, 0, 0.5),
      0 4px 16px rgba(74, 108, 247, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
}
</style>
