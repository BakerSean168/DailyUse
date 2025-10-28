<template>
  <v-card class="goal-dir h-100 d-flex flex-column" elevation="0" variant="outlined">
    <!-- 头部 -->
    <v-card-title class="goal-dir-header d-flex align-center justify-space-between pa-4">
      <div class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-folder-multiple</v-icon>
        <span class="text-h6 font-weight-medium">目标分类</span>
      </div>

      <!-- 添加按钮 -->
      <v-menu>
        <template v-slot:activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            icon="mdi-plus"
            size="small"
            variant="text"
            color="primary"
            class="add-btn"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>

        <v-list class="py-2" min-width="180">
          <v-list-item @click="$emit('create-goal-folder')" class="px-4">
            <template v-slot:prepend>
              <v-icon color="primary">mdi-folder-plus</v-icon>
            </template>
            <v-list-item-title>创建目标分类</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>

    <v-divider></v-divider>

    <!-- 目标分类列表 -->
    <v-card-text class="goal-dir-list pa-0 flex-grow-1 overflow-y-auto">
      <v-list class="py-0" density="compact">
        <!-- 全部目标 -->
        <v-list-item
          :class="{ 'goal-dir-item--active': selectedDirUuid === 'all' }"
          class="goal-dir-item mx-2 my-1"
          @click="selectDir('all')"
          rounded="lg"
        >
          <template v-slot:prepend>
            <v-icon :color="selectedDirUuid === 'all' ? 'primary' : 'medium-emphasis'">
              mdi-target
            </v-icon>
          </template>

          <v-list-item-title class="font-weight-medium"> 全部目标 </v-list-item-title>

          <template v-slot:append>
            <v-chip
              :color="selectedDirUuid === 'all' ? 'primary' : 'surface-bright'"
              :text-color="selectedDirUuid === 'all' ? 'on-primary' : 'on-surface-variant'"
              size="small"
              variant="flat"
              class="font-weight-bold"
            >
              {{ totalGoalsCount }}
            </v-chip>
          </template>
        </v-list-item>

        <!-- 动态目标分类 -->
        <v-list-item
          v-for="folder in goalFolders"
          :key="folder.uuid"
          :class="{ 'goal-dir-item--active': selectedDirUuid === folder.uuid }"
          class="goal-dir-item mx-2 my-1"
          @click="selectDir(folder.uuid)"
          rounded="lg"
        >
          <template v-slot:prepend>
            <v-icon :color="selectedDirUuid === folder.uuid ? 'primary' : 'medium-emphasis'">
              {{ folder.icon || 'mdi-folder' }}
            </v-icon>
          </template>

          <v-list-item-title class="font-weight-medium">
            {{ folder.name }}
          </v-list-item-title>

          <template v-slot:append>
            <div class="d-flex align-center">
              <v-chip
                :color="selectedDirUuid === folder.uuid ? 'primary' : 'surface-bright'"
                :text-color="selectedDirUuid === folder.uuid ? 'on-primary' : 'on-surface-variant'"
                size="small"
                variant="flat"
                class="font-weight-bold"
              >
                {{ getGoalCountByDir(folder.uuid) }}
              </v-chip>

              <!-- 系统目录不显示编辑按钮 -->
              <v-btn
                v-if="!folder.isSystemFolder"
                icon="mdi-pencil"
                size="x-small"
                variant="text"
                color="medium-emphasis"
                class="ml-1"
                @click.stop="$emit('edit-goal-folder', folder)"
              >
                <v-icon size="12">mdi-pencil</v-icon>
              </v-btn>
            </div>
          </template>
        </v-list-item>

        <!-- 已归档 -->
        <v-list-item
          v-if="archivedGoalsCount > 0"
          :class="{ 'goal-dir-item--active': selectedDirUuid === 'archived' }"
          class="goal-dir-item mx-2 my-1"
          @click="selectDir('archived')"
          rounded="lg"
        >
          <template v-slot:prepend>
            <v-icon :color="selectedDirUuid === 'archived' ? 'primary' : 'medium-emphasis'">
              mdi-archive
            </v-icon>
          </template>

          <v-list-item-title class="font-weight-medium"> 已归档 </v-list-item-title>

          <template v-slot:append>
            <v-chip
              :color="selectedDirUuid === 'archived' ? 'primary' : 'surface-bright'"
              :text-color="selectedDirUuid === 'archived' ? 'on-primary' : 'on-surface-variant'"
              size="small"
              variant="flat"
              class="font-weight-bold"
            >
              {{ archivedGoalsCount }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { GoalFolderClient } from '@dailyuse/domain-client';
import { useGoalStore } from '../stores/goalStore';

interface Props {
  goalFolders: GoalFolderClient[];
}

interface Emits {
  (e: 'selected-goal-folder', folderUuid: string): void;
  (e: 'create-goal-folder'): void;
  (e: 'edit-goal-folder', goalFolder: GoalFolderClient): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const goalStore = useGoalStore();
const selectedDirUuid = ref<string>('all');

// ===== 计算属性 =====

/**
 * 总目标数量
 */
const totalGoalsCount = computed(() => {
  return goalStore.getAllGoals.length;
});

/**
 * 已归档目标数量
 */
const archivedGoalsCount = computed(() => {
  return goalStore.getGoalsByStatus('ARCHIVED').length;
});

// ===== 方法 =====

/**
 * 根据目录获取目标数量
 */
const getGoalCountByDir = (dirUuid: string) => {
  return goalStore.getGoalsByDir(dirUuid).length;
};

/**
 * 选择目录
 */
const selectDir = (dirUuid: string) => {
  selectedDirUuid.value = dirUuid;
  emit('selected-goal-folder', dirUuid);
};

// ===== 生命周期 =====

onMounted(() => {
  // 默认选中全部目标
  selectDir('all');
});
</script>

<style scoped>
.goal-dir {
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  border-radius: 12px;
}

.goal-dir-header {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 12px 12px 0 0;
}

.goal-dir-list {
  background-color: rgba(var(--v-theme-surface), 0.8);
  min-height: 200px;
}

.goal-dir-item {
  transition: all 0.2s ease;
  margin: 0 8px 4px 8px;
}

.goal-dir-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.goal-dir-item--active {
  background-color: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.goal-dir-item--active :deep(.v-list-item-title) {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.add-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.add-btn:hover {
  opacity: 1;
}
</style>
