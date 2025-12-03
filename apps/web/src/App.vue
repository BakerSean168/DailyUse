<template>
  <v-app>
    <div v-if="isLoading" class="loading-container">
      <!-- 使用 @dailyuse/assets 中的 logo -->
      <img :src="logo" alt="DailyUse Logo" class="loading-logo mb-4" />
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">正在初始化应用...</p>
    </div>
    <router-view v-else></router-view>

    <!-- 应用内通知组件 -->
    <InAppNotification />

    <!-- @dailyuse/ui 消息提示组件 (用于 useMessage 确认框) -->
    <DuMessageProvider />

    <!-- 命令面板 (Cmd/Ctrl + K) - 按需加载 -->
    <component v-if="showCommandPalette" :is="CommandPalette" v-model="showCommandPalette" :goals="goals" :tasks="tasks"
      :reminders="reminders" />

    <!-- AI Orb Entry + Chat Drawer -->
    <AIFloatingOrb @open-chat="openChat" @generate-goal="handleGenerateGoal" @assist-goal="handleAssistGoal"
      @generate-tasks="handleGenerateTasks" @generate-knowledge="handleGenerateKnowledge" />
    <!-- Hidden AI Dialogs (programmatic open) -->
    <AIGoalGenerateDialog ref="aiGoalGenerateRef" @generated="onGoalGenerated" @error="onGoalError" />
    <AITasksQuickDialog ref="aiTasksRef" style="display:none" />
    <AIKnowledgeDocQuickDialog ref="aiKnowledgeRef" style="display:none" />

    <!-- Global Goal Dialog for AI-generated goals -->
    <GoalDialog ref="globalGoalDialogRef" />

    <!-- Conversation History Sidebar -->
    <ConversationHistorySidebar :isOpen="showHistory" @close="showHistory = false"
      @conversation-selected="handleConversationSelected" />

    <!-- AI Chat Dialog - Using ObsidianDialog -->
    <ObsidianDialog
      v-model="showChat"
      title="AI Chat"
      icon="mdi-robot"
      :width="860"
      :height="680"
      :min-width="400"
      :min-height="400"
      @close="closeChat"
    >
      <template #header-actions>
        <button class="obsidian-header-btn" @click="showHistory = !showHistory" title="历史对话">
          <v-icon size="16">mdi-history</v-icon>
        </button>
      </template>
      <AIChatWindow :conversationUuid="activeConversationUuid" />
    </ObsidianDialog>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, defineAsyncComponent, shallowRef } from 'vue';
import AIChatWindow from '@/modules/ai/presentation/components/chat/AIChatWindow.vue';
import AIFloatingOrb from '@/modules/ai/presentation/components/chat/AIFloatingOrb.vue';
import ConversationHistorySidebar from '@/modules/ai/presentation/components/chat/ConversationHistorySidebar.vue';
import AIGoalGenerateDialog from '@/modules/ai/presentation/components/chat/AIGoalGenerateDialog.vue';
import AITasksQuickDialog from '@/modules/ai/presentation/components/chat/AITasksQuickDialog.vue';
import AIKnowledgeDocQuickDialog from '@/modules/ai/presentation/components/chat/AIKnowledgeDocQuickDialog.vue';
import GoalDialog from '@/modules/goal/presentation/components/dialogs/GoalDialog.vue';
import ObsidianDialog from '@/shared/components/ObsidianDialog.vue';
import { useSettingStore } from '@/modules/setting/presentation/stores/settingStore';
import { useMessage } from '@dailyuse/ui';
import { knowledgeGenerationApplicationService } from '@/modules/ai/application/services';
import type { GoalClientDTO } from '@dailyuse/contracts/goal';
import InAppNotification from '@/modules/notification/presentation/components/InAppNotification.vue';
import { DuMessageProvider } from '@dailyuse/ui';
import { logo128 as logo } from '@dailyuse/assets';
import { getThemeService } from '@/modules/setting/application/services/ThemeService';

const isLoading = ref(true);
const showCommandPalette = ref(false);
const settingStore = useSettingStore();
const message = useMessage();

// 懒加载命令面板组件和搜索数据
const CommandPalette = shallowRef<any>(null);
const goals = ref<any[]>([]);
const tasks = ref<any[]>([]);
const reminders = ref<any[]>([]);
const showChat = ref(false);
const showHistory = ref(false);
const activeConversationUuid = ref<string | null>(null);

// 🔔 监听 Session 过期事件，显示友好提示
const handleSessionExpired = (event: CustomEvent) => {
  const { message: msg, reason, errorCode } = event.detail;
  console.log('🚨 [App] Session 过期事件:', { message: msg, reason, errorCode });

  // 显示友好的错误提示
  message.warning(msg || '登录已过期，请重新登录');
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

const aiGoalGenerateRef = ref<InstanceType<typeof AIGoalGenerateDialog> | null>(null);
const aiTasksRef = ref<InstanceType<typeof AITasksQuickDialog> | null>(null);
const aiKnowledgeRef = ref<InstanceType<typeof AIKnowledgeDocQuickDialog> | null>(null);
const globalGoalDialogRef = ref<InstanceType<typeof GoalDialog> | null>(null);

function handleGenerateGoal() {
  if (!aiGoalGenerateRef.value) {
    message.error('目标生成组件尚未加载');
    return;
  }
  aiGoalGenerateRef.value.openDialog();
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

function onGoalGenerated(result: any, options: { includeKnowledgeDoc: boolean }) {
  const goalTitle = result?.goal?.title || '未命名目标';
  message.success(`成功生成目标：${goalTitle}，请查看并编辑`);
  
  // Open GoalDialog with AI-generated data for preview and editing
  if (globalGoalDialogRef.value && result?.goal) {
    const goal = result.goal;
    const prefillData = {
      // 基本信息
      title: goal.title,
      description: goal.description,
      category: goal.category,
      // 动机和可行性分析
      motivation: goal.motivation,
      feasibilityAnalysis: goal.feasibilityAnalysis,
      // 重要性和紧急性
      importance: goal.importance,
      urgency: goal.urgency,
      // 标签
      tags: goal.tags,
      // AI 建议的日期
      suggestedStartDate: goal.suggestedStartDate,
      suggestedEndDate: goal.suggestedEndDate,
      // 关键结果
      keyResults: result.keyResults?.map((kr: any) => ({
        title: kr.title,
        description: kr.description,
        valueType: kr.valueType || 'percentage',
        targetValue: kr.targetValue || 100,
        unit: kr.unit,
      })),
    };
    
    console.log('[App] AI 生成目标数据:', { goal, keyResults: result.keyResults, prefillData, options });
    
    // 创建目标后的回调（用于生成知识文档）
    const onGoalCreated = options.includeKnowledgeDoc 
      ? async (goalDto: GoalClientDTO) => {
          try {
            await generateKnowledgeForGoal(goalDto);
          } catch (error) {
            console.error('[App] 生成知识文档失败:', error);
            message.warning('知识文档生成失败，请稍后重试');
          }
        }
      : undefined;
    
    // Short delay to ensure AI dialog is closed first
    setTimeout(() => {
      globalGoalDialogRef.value?.openForCreate(prefillData, onGoalCreated);
    }, 100);
  } else {
    // Fallback: open chat if no goal dialog available
    openChat();
  }
}

/**
 * 为目标生成知识文档
 * 使用 KnowledgeGenerationApplicationService 处理
 */
async function generateKnowledgeForGoal(goalDto: GoalClientDTO) {
  try {
    await knowledgeGenerationApplicationService.generateGoalKnowledge({
      goalUuid: goalDto.uuid,
      goalTitle: goalDto.title,
      goalDescription: goalDto.description || undefined,
      goalCategory: goalDto.category || undefined,
    });
    // 成功提示已在 service 中处理
  } catch (error) {
    // 错误提示已在 service 中处理
    console.error('[App] 生成目标知识文档失败:', error);
  }
}

function onGoalError(error: string) {
  message.error(error || '生成目标失败');
}

function handleGenerateTasks() {
  if (!aiTasksRef.value) {
    message.error('任务生成组件未加载');
    return;
  }
  aiTasksRef.value.openDialog();
}

function handleGenerateKnowledge() {
  if (!aiKnowledgeRef.value) {
    message.error('知识文档组件未加载');
    return;
  }
  aiKnowledgeRef.value.openDialog();
}

function handleConversationSelected(uuid: string | null) {
  activeConversationUuid.value = uuid;
  if (uuid) {
    // Conversation selected, ensure chat is open
    openChat();
  }
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

/* Custom header button for ObsidianDialog */
.obsidian-header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.6);
  transition: all 0.15s ease;
}

.obsidian-header-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}
</style>
