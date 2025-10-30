<template>
  <div
    class="grid-template-item"
    :class="{ disabled: !isTemplateEnabled }"
    @click="handleClick"
    @contextmenu="handleRightClick"
    draggable="true"
    @dragstart="onDragStart"
  >
    <div class="template-icon">
      <v-icon size="32" :color="isTemplateEnabled ? 'primary' : 'grey'">
        {{ 'mdi-bell' }}
      </v-icon>
    </div>
    <div class="template-name">
      {{ item.title }}
    </div>
    <div></div>

    <!-- 简单的上下文菜单 -->
    <div
      v-if="showContextMenu"
      class="context-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
    >
      <div class="context-menu-item" @click="handleMoveTemplate">
        <v-icon size="small" class="mr-2">mdi-folder-move</v-icon>
        移动到分组
      </div>
      <div class="context-menu-item" @click="handleEditTemplate">
        <v-icon size="small" class="mr-2">mdi-pencil</v-icon>
        编辑模板
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item text-error" @click="handleDeleteTemplate">
        <v-icon size="small" class="mr-2" color="error">mdi-delete</v-icon>
        删除模板
      </div>
    </div>

    <!-- 全局覆盖层，用于关闭菜单 -->
    <div
      v-if="showContextMenu"
      class="context-menu-overlay"
      @click="closeContextMenu"
      @contextmenu.prevent="closeContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { inject, computed, ref } from 'vue';
import { ReminderContracts } from '@dailyuse/contracts';
import { useReminderStore } from '../../stores/reminderStore';

type ReminderTemplate = ReminderContracts.ReminderTemplateClientDTO;

const reminderStore = useReminderStore();

const props = defineProps<{
  item: ReminderTemplate;
}>();

// 响应式数据
const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

const isTemplateEnabled = computed(() => props.item.effectiveEnabled);

const onDragStart = (event: DragEvent) => {
  // 传递 template 信息
  event.dataTransfer?.setData('application/json', JSON.stringify(props.item));
};

// 注入的回调函数
const onClickTemplate = inject<(item: ReminderTemplate) => void>('onClickTemplate');
const onMoveTemplate = inject<(item: ReminderTemplate) => void>('onMoveTemplate');
const onEditTemplate = inject<(item: ReminderTemplate) => void>('onEditTemplate');
const onDeleteTemplate = inject<(item: ReminderTemplate) => void>('onDeleteTemplate');

const handleClick = () => {
  onClickTemplate?.(props.item);
};

const handleRightClick = (event: MouseEvent) => {
  event.preventDefault();
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  showContextMenu.value = true;
};

const closeContextMenu = () => {
  showContextMenu.value = false;
};

const handleMoveTemplate = () => {
  closeContextMenu();
  onMoveTemplate?.(props.item);
};

const handleEditTemplate = () => {
  closeContextMenu();
  onEditTemplate?.(props.item);
};

const handleDeleteTemplate = () => {
  closeContextMenu();
  onDeleteTemplate?.(props.item);
};
</script>

<style scoped>
.grid-template-item {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  padding: 8px;
  cursor: pointer;
}

.grid-template-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.grid-template-item.disabled {
  opacity: 0.5;
  background: rgba(128, 128, 128, 0.2);
}

.template-icon {
  margin-bottom: 4px;
}

.template-name {
  font-size: 10px;
  text-align: center;
  line-height: 1.2;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.disabled .template-name {
  color: #999;
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  background: transparent;
}

.context-menu {
  position: fixed;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  min-width: 150px;
  overflow: hidden;
}

.context-menu-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.context-menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.context-menu-divider {
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
  margin: 4px 0;
}

.text-error {
  color: #f44336;
}
</style>
