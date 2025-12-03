<template>
  <v-card 
    class="goal-dir h-100 d-flex flex-column" 
    elevation="0" 
    variant="outlined"
    @contextmenu.prevent
  >
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
    <v-card-text 
      class="goal-dir-list pa-0 flex-grow-1 overflow-y-auto"
      @contextmenu.prevent="handleAreaContextMenu"
    >
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
          @contextmenu.prevent.stop="handleFolderContextMenu($event, folder)"
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
            <v-chip
              :color="selectedDirUuid === folder.uuid ? 'primary' : 'surface-bright'"
              :text-color="selectedDirUuid === folder.uuid ? 'on-primary' : 'on-surface-variant'"
              size="small"
              variant="flat"
              class="font-weight-bold"
            >
              {{ getGoalCountByDir(folder.uuid) }}
            </v-chip>
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

    <!-- 右键菜单 -->
    <DuContextMenu
      v-model:show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :items="contextMenu.items"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import type { GoalFolderClient } from '@dailyuse/contracts/goal';
import { useGoalStore } from '../stores/goalStore';
import { DuContextMenu, type ContextMenuItem } from '@/shared/components/context-menu';

interface Props {
  goalFolders: readonly GoalFolderClient[];
}

interface Emits {
  (e: 'selected-goal-folder', folderUuid: string): void;
  (e: 'create-goal-folder'): void;
  (e: 'edit-goal-folder', goalFolder: GoalFolderClient): void;
  (e: 'delete-goal-folder', folderUuid: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const goalStore = useGoalStore();
const selectedDirUuid = ref<string>('all');

// ===== 右键菜单 =====

const contextMenu = reactive<{
  show: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  currentFolder: GoalFolderClient | null;
}>({
  show: false,
  x: 0,
  y: 0,
  items: [],
  currentFolder: null,
});

/**
 * 处理文件夹右键菜单
 */
const handleFolderContextMenu = (event: MouseEvent, folder: GoalFolderClient) => {
  event.preventDefault();
  event.stopPropagation();

  contextMenu.currentFolder = folder;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;

  // 系统文件夹只能查看，不能编辑删除
  if (folder.isSystemFolder) {
    contextMenu.items = [
      {
        title: '查看详情',
        icon: 'mdi-information-outline',
        iconColor: 'primary',
        action: () => {
          selectDir(folder.uuid);
        },
      },
      { divider: true },
      {
        title: '系统文件夹',
        icon: 'mdi-lock-outline',
        disabled: true,
      },
    ];
  } else {
    contextMenu.items = [
      {
        title: '打开',
        icon: 'mdi-folder-open',
        iconColor: 'primary',
        action: () => {
          selectDir(folder.uuid);
        },
      },
      { divider: true },
      {
        title: '重命名',
        icon: 'mdi-pencil',
        action: () => {
          emit('edit-goal-folder', folder);
        },
      },
      {
        title: '新建子分类',
        icon: 'mdi-folder-plus',
        iconColor: 'success',
        action: () => {
          emit('create-goal-folder');
        },
      },
      { divider: true },
      {
        title: '删除分类',
        icon: 'mdi-delete',
        iconColor: 'error',
        danger: true,
        action: () => {
          emit('delete-goal-folder', folder.uuid);
        },
      },
    ];
  }

  contextMenu.show = true;
};

/**
 * 处理空白区域右键菜单
 */
const handleAreaContextMenu = (event: MouseEvent) => {
  event.preventDefault();

  contextMenu.currentFolder = null;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.items = [
    {
      title: '新建分类',
      icon: 'mdi-folder-plus',
      iconColor: 'primary',
      action: () => {
        emit('create-goal-folder');
      },
    },
    {
      title: '刷新列表',
      icon: 'mdi-refresh',
      action: () => {
        // 触发刷新
        window.location.reload();
      },
    },
  ];

  contextMenu.show = true;
};

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
