<template>
  <v-container class="h-100 d-flex flex-column gap-4 pa-4">
    <!-- 顶部操作栏 -->
    <div class="d-flex align-center justify-space-between mb-2">
      <v-btn icon variant="tonal" size="40" color="primary" @click="router.back()">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div class="text-h6 font-weight-bold">{{ keyResult.title }}</div>
      <v-chip :color="goal.color || undefined" variant="flat" class="ml-2" size="small">
        {{ goal.title }}
      </v-chip>
    </div>

    <!-- 关键结果卡片 -->
    <KeyResultCard :keyResult="keyResult" :goal="goal" class="mb-2" />

    <!-- 计算方式、起始值、权重 -->
    <v-row class="mb-2 flex-grow-0" align="center">
      <v-col cols="12" md="4">
        <v-sheet class="pa-2" color="surface-light" rounded>
          <v-icon start color="primary">mdi-calculator-variant</v-icon>
          <span class="font-weight-medium">聚合方式：</span>
          <span>{{ keyResult.aggregationMethodText }}</span>
        </v-sheet>
      </v-col>
      <v-col cols="12" md="4">
        <v-sheet class="pa-2" color="surface-light" rounded>
          <v-icon start color="primary">mdi-numeric</v-icon>
          <span class="font-weight-medium">当前值：</span>
          <span>{{ keyResult.progress.currentValue }} / {{ keyResult.progress.targetValue }}</span>
        </v-sheet>
      </v-col>
      <v-col cols="12" md="4">
        <v-sheet class="pa-2" color="surface-light" rounded>
          <v-icon start color="primary">mdi-weight</v-icon>
          <span class="font-weight-medium">权重：</span>
          <span>{{ keyResult.weight }}</span>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- 相关任务、记录 -->
    <v-card class="flex-grow-1 pa-0" elevation="2" rounded>
      <v-tabs v-model="activeTab" class="bg-surface-light px-4 pt-2" grow>
        <v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
          {{ tab.name }}
        </v-tab>
      </v-tabs>
      <v-divider />
      <v-window v-model="activeTab" class="h-100">
        <v-window-item :value="0" class="h-100">
          <div class="scrollable-content pa-4">
            <div v-if="taskTemplates.length === 0" class="text-center text-medium-emphasis">
              <v-icon size="32" color="grey">mdi-clipboard-text-outline</v-icon>
              <div>暂无关联任务</div>
            </div>
            <v-list v-else lines="two" density="comfortable">
              <v-list-item v-for="task in taskTemplates" :key="task.uuid" class="mb-2">
                <v-list-item-title class="font-weight-bold">{{ task.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ task.description }}</v-list-item-subtitle>
                <template #append>
                  <v-chip color="primary" size="small" variant="outlined">任务模板</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </v-window-item>
        <v-window-item :value="1" class="h-100">
          <div class="scrollable-content pa-4">
            <div v-if="records.length === 0" class="text-center text-medium-emphasis">
              <v-icon size="32" color="grey">mdi-file-document-outline</v-icon>
              <div>暂无记录</div>
            </div>
            <v-list v-else lines="two" density="comfortable">
              <v-list-item v-for="record in records" :key="record.uuid" class="mb-2">
                <GoalRecordCard :record="record" />
              </v-list-item>
            </v-list>
          </div>
        </v-window-item>
      </v-window>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
// vue
import { computed, onMounted, ref } from 'vue';
// vue-router
import { useRoute, useRouter } from 'vue-router';
// stores
import { useGoalStore } from '../stores/goalStore';

// 组件
import KeyResultCard from '../components/cards/KeyResultCard.vue';
import GoalRecordCard from '../components/cards/GoalRecordCard.vue';
// domain
import { KeyResultClient as KeyResult, GoalClient as Goal } from '@dailyuse/domain-client';
import type { GoalContracts } from '@dailyuse/contracts';
type GoalRecord = GoalContracts.GoalRecordClientDTO;

const router = useRouter();
const route = useRoute();
const goalUuid = route.params.goalUuid as string; // 从路由参数中获取目标ID
const keyResultUuid = route.params.keyResultUuid as string; // 从路由参数中获取关键结果ID

const goalStore = useGoalStore();
// TODO: 实现task store
// const taskStore = useTaskStore();

const taskTemplates = ref<any>([]);
const goal = computed(() => {
  const goal = goalStore.getGoalByUuid(goalUuid);
  if (!goal) {
    throw new Error('Goal not found');
  }
  return goal as Goal;
});
// 目标的颜色

// 关键结果
const keyResult = computed(() => {
  const keyResults = goal.value.keyResults;
  if (!keyResults) {
    throw new Error('Goal has no key results');
  }
  const keyResult = keyResults.find((kr) => kr.uuid === keyResultUuid);
  if (!keyResult) {
    throw new Error('Key result not found');
  }
  return keyResult as KeyResult;
});

const activeTab = ref(0);
const tabs = [
  { name: '关联任务', value: 0 },
  { name: '记录', value: 1 },
];

onMounted(async () => {
  // taskTemplates.value = await taskStore.getTaskTemplatesByKeyResultUuid(keyResultUuid);
});

// 计算所有记录
const records = computed(() => {
  // KeyResult 的 records 属性包含相关的记录
  return keyResult.value.records || [];
});
</script>

<style lang="css" scoped>
.key-result-relative-info {
  background-color: rgb(var(--v-theme-surface));
  min-height: 0;
}

.tab-content {
  min-height: 0;
  overflow: hidden;
}

.scrollable-content {
  height: 100%;
  overflow-y: auto;
}

.v-list-item-title {
  font-size: 1rem;
}

.v-list-item-subtitle {
  font-size: 0.85rem;
  color: var(--v-theme-on-surface-light);
}
</style>
