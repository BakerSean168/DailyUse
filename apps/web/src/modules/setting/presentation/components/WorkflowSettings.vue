<template>
  <v-card flat>
    <v-card-title>工作流设置</v-card-title>
    <v-card-text>
      <v-row>
        <!-- 自动保存 -->
        <v-col cols="12">
          <v-switch
            v-model="autoSave"
            label="自动保存"
            color="primary"
            hide-details
            @update:model-value="handleAutoSaveChange"
          >
            <template #prepend>
              <v-icon>mdi-content-save-auto</v-icon>
            </template>
          </v-switch>
          <p class="text-caption text-medium-emphasis mt-2">
            编辑内容时自动保存更改
          </p>
        </v-col>

        <!-- 自动保存间隔 -->
        <v-col cols="12" v-if="autoSave">
          <v-slider
            v-model="autoSaveInterval"
            label="自动保存间隔 (秒)"
            :min="5"
            :max="60"
            :step="5"
            thumb-label="always"
            prepend-icon="mdi-timer-outline"
            @update:model-value="handleAutoSaveIntervalChange"
          />
        </v-col>

        <v-divider class="my-2" />

        <!-- 删除确认 -->
        <v-col cols="12">
          <v-switch
            v-model="confirmBeforeDelete"
            label="删除前确认"
            color="primary"
            hide-details
            @update:model-value="handleConfirmDeleteChange"
          >
            <template #prepend>
              <v-icon>mdi-alert-circle-outline</v-icon>
            </template>
          </v-switch>
          <p class="text-caption text-medium-emphasis mt-2">
            删除项目前显示确认对话框
          </p>
        </v-col>

        <v-divider class="my-2" />

        <!-- 默认目标视图 -->
        <v-col cols="12" md="4">
          <v-select
            v-model="defaultGoalView"
            label="默认目标视图"
            :items="goalViewOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-target"
            @update:model-value="handleGoalViewChange"
          />
        </v-col>

        <!-- 默认日程视图 -->
        <v-col cols="12" md="4">
          <v-select
            v-model="defaultScheduleView"
            label="默认日程视图"
            :items="scheduleViewOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-calendar"
            @update:model-value="handleScheduleViewChange"
          />
        </v-col>

        <!-- 默认任务视图 -->
        <v-col cols="12" md="4">
          <v-select
            v-model="defaultTaskView"
            label="默认任务视图"
            :items="taskViewOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-checkbox-marked-outline"
            @update:model-value="handleTaskViewChange"
          />
        </v-col>

        <v-divider class="my-2" />

        <!-- 起始页 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="startPage"
            label="起始页"
            :items="startPageOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-home"
            @update:model-value="handleStartPageChange"
          />
          <p class="text-caption text-medium-emphasis mt-2">
            登录后默认打开的页面
          </p>
        </v-col>

        <!-- 侧边栏折叠 -->
        <v-col cols="12" md="6">
          <v-switch
            v-model="sidebarCollapsed"
            label="侧边栏默认折叠"
            color="primary"
            hide-details
            @update:model-value="handleSidebarCollapsedChange"
          >
            <template #prepend>
              <v-icon>mdi-dock-left</v-icon>
            </template>
          </v-switch>
          <p class="text-caption text-medium-emphasis mt-2">
            启动时侧边栏处于折叠状态
          </p>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';

const settingStore = useUserSettingStore();

// Use computed getter for workflow settings
const workflow = computed(() => settingStore.workflow);

// Local state
const autoSave = ref(workflow.value.autoSave);
const autoSaveInterval = ref(Math.floor(workflow.value.autoSaveInterval / 1000));
const confirmBeforeDelete = ref(workflow.value.confirmBeforeDelete);
const defaultGoalView = ref(workflow.value.defaultGoalView);
const defaultScheduleView = ref(workflow.value.defaultScheduleView);
const defaultTaskView = ref(workflow.value.defaultTaskView);

// TODO: startPage and sidebarCollapsed are not in workflow group yet
const startPage = ref(settingStore.settings?.startPage ?? 'dashboard');
const sidebarCollapsed = ref(settingStore.settings?.sidebarCollapsed ?? false);

// Options
const goalViewOptions = [
  { label: '列表视图', value: 'LIST' },
  { label: '看板视图', value: 'KANBAN' },
  { label: '甘特图', value: 'GANTT' },
  { label: '树形视图', value: 'TREE' },
];

const scheduleViewOptions = [
  { label: '日视图', value: 'DAY' },
  { label: '周视图', value: 'WEEK' },
  { label: '月视图', value: 'MONTH' },
  { label: '列表视图', value: 'LIST' },
];

const taskViewOptions = [
  { label: '列表视图', value: 'LIST' },
  { label: '看板视图', value: 'KANBAN' },
  { label: '日历视图', value: 'CALENDAR' },
  { label: '矩阵视图', value: 'MATRIX' },
];

const startPageOptions = [
  { label: '仪表盘', value: 'dashboard' },
  { label: '目标', value: 'goals' },
  { label: '任务', value: 'tasks' },
  { label: '日程', value: 'schedule' },
  { label: '文档', value: 'documents' },
];

// Watch workflow changes
watch(
  workflow,
  (newWorkflow) => {
    autoSave.value = newWorkflow.autoSave;
    autoSaveInterval.value = Math.floor(newWorkflow.autoSaveInterval / 1000);
    confirmBeforeDelete.value = newWorkflow.confirmBeforeDelete;
    defaultGoalView.value = newWorkflow.defaultGoalView;
    defaultScheduleView.value = newWorkflow.defaultScheduleView;
    defaultTaskView.value = newWorkflow.defaultTaskView;
  },
  { deep: true },
);

// Watch other settings
watch(
  () => settingStore.settings,
  (newSettings) => {
    if (newSettings) {
      startPage.value = newSettings.startPage;
      sidebarCollapsed.value = newSettings.sidebarCollapsed;
    }
  },
  { deep: true },
);

// Handlers - using convenience method
async function handleAutoSaveChange(value: boolean) {
  await settingStore.updateWorkflow({ autoSave: value });
}

async function handleAutoSaveIntervalChange(value: number) {
  await settingStore.updateWorkflowDebounced({ autoSaveInterval: value * 1000 }, 300);
}

async function handleConfirmDeleteChange(value: boolean) {
  await settingStore.updateWorkflow({ confirmBeforeDelete: value });
}

async function handleGoalViewChange(value: string) {
  await settingStore.updateWorkflow({ defaultGoalView: value as any });
}

async function handleScheduleViewChange(value: string) {
  await settingStore.updateWorkflow({ defaultScheduleView: value as any });
}

async function handleTaskViewChange(value: string) {
  await settingStore.updateWorkflow({ defaultTaskView: value as any });
}

async function handleStartPageChange(value: string) {
  await settingStore.updateSettings({ startPage: value });
}

async function handleSidebarCollapsedChange(value: boolean) {
  await settingStore.updateSettings({ sidebarCollapsed: value });
}
</script>
