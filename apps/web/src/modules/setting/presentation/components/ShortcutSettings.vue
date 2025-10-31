<template>
  <v-card flat>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>快捷键设置</span>
      <v-btn
        size="small"
        variant="outlined"
        @click="resetAllShortcuts"
      >
        <v-icon start>mdi-restore</v-icon>
        全部重置
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-text-field
        v-model="searchQuery"
        label="搜索快捷键"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        class="mb-4"
        clearable
      />

      <v-expansion-panels variant="accordion">
        <v-expansion-panel
          v-for="category in filteredCategories"
          :key="category.name"
        >
          <v-expansion-panel-title>
            <v-icon :icon="category.icon" class="mr-2" />
            {{ category.label }} ({{ category.shortcuts.length }})
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list>
              <v-list-item
                v-for="shortcut in category.shortcuts"
                :key="shortcut.id"
                :title="shortcut.label"
                :subtitle="shortcut.description"
              >
                <template #append>
                  <v-chip
                    v-if="!editingShortcut || editingShortcut.id !== shortcut.id"
                    @click="startEdit(shortcut)"
                    class="mr-2"
                  >
                    {{ formatShortcutKey(shortcut.key) }}
                  </v-chip>
                  <v-text-field
                    v-else
                    v-model="editingKey"
                    density="compact"
                    variant="outlined"
                    placeholder="按下快捷键..."
                    readonly
                    @keydown="captureKey"
                    @blur="cancelEdit"
                    class="shortcut-input mr-2"
                  />
                  <v-btn
                    v-if="editingShortcut?.id === shortcut.id"
                    icon="mdi-check"
                    size="small"
                    variant="text"
                    color="success"
                    @click="saveEdit"
                  />
                  <v-btn
                    v-if="editingShortcut?.id === shortcut.id"
                    icon="mdi-close"
                    size="small"
                    variant="text"
                    @click="cancelEdit"
                  />
                  <v-btn
                    v-else
                    icon="mdi-restore"
                    size="small"
                    variant="text"
                    @click="resetShortcut(shortcut)"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';

const settingStore = useUserSettingStore();

// Local state
const searchQuery = ref('');
const editingShortcut = ref<ShortcutItem | null>(null);
const editingKey = ref('');

// Types
interface ShortcutItem {
  id: string;
  label: string;
  description: string;
  key: string;
  defaultKey: string;
}

interface ShortcutCategory {
  name: string;
  label: string;
  icon: string;
  shortcuts: ShortcutItem[];
}

// Shortcut definitions (这里简化示范，实际应从后端或配置加载)
const categories = ref<ShortcutCategory[]>([
  {
    name: 'global',
    label: '全局',
    icon: 'mdi-earth',
    shortcuts: [
      {
        id: 'global.search',
        label: '全局搜索',
        description: '打开全局搜索对话框',
        key: 'Ctrl+K',
        defaultKey: 'Ctrl+K',
      },
      {
        id: 'global.command',
        label: '命令面板',
        description: '打开命令面板',
        key: 'Ctrl+Shift+P',
        defaultKey: 'Ctrl+Shift+P',
      },
      {
        id: 'global.settings',
        label: '设置',
        description: '打开设置页面',
        key: 'Ctrl+,',
        defaultKey: 'Ctrl+,',
      },
    ],
  },
  {
    name: 'editor',
    label: '编辑器',
    icon: 'mdi-text-box-edit',
    shortcuts: [
      {
        id: 'editor.save',
        label: '保存',
        description: '保存当前文档',
        key: 'Ctrl+S',
        defaultKey: 'Ctrl+S',
      },
      {
        id: 'editor.undo',
        label: '撤销',
        description: '撤销上一步操作',
        key: 'Ctrl+Z',
        defaultKey: 'Ctrl+Z',
      },
      {
        id: 'editor.redo',
        label: '重做',
        description: '重做上一步操作',
        key: 'Ctrl+Y',
        defaultKey: 'Ctrl+Y',
      },
      {
        id: 'editor.find',
        label: '查找',
        description: '在文档中查找',
        key: 'Ctrl+F',
        defaultKey: 'Ctrl+F',
      },
    ],
  },
  {
    name: 'task',
    label: '任务',
    icon: 'mdi-checkbox-marked',
    shortcuts: [
      {
        id: 'task.new',
        label: '新建任务',
        description: '创建新任务',
        key: 'Ctrl+N',
        defaultKey: 'Ctrl+N',
      },
      {
        id: 'task.complete',
        label: '完成任务',
        description: '标记任务为完成',
        key: 'Ctrl+Enter',
        defaultKey: 'Ctrl+Enter',
      },
      {
        id: 'task.delete',
        label: '删除任务',
        description: '删除当前任务',
        key: 'Ctrl+D',
        defaultKey: 'Ctrl+D',
      },
    ],
  },
  {
    name: 'goal',
    label: '目标',
    icon: 'mdi-target',
    shortcuts: [
      {
        id: 'goal.new',
        label: '新建目标',
        description: '创建新目标',
        key: 'Ctrl+Shift+N',
        defaultKey: 'Ctrl+Shift+N',
      },
      {
        id: 'goal.view',
        label: '切换视图',
        description: '切换目标视图模式',
        key: 'Ctrl+Tab',
        defaultKey: 'Ctrl+Tab',
      },
    ],
  },
]);

// Computed
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value;
  
  const query = searchQuery.value.toLowerCase();
  return categories.value
    .map((category) => ({
      ...category,
      shortcuts: category.shortcuts.filter(
        (shortcut) =>
          shortcut.label.toLowerCase().includes(query) ||
          shortcut.description.toLowerCase().includes(query) ||
          shortcut.key.toLowerCase().includes(query),
      ),
    }))
    .filter((category) => category.shortcuts.length > 0);
});

// Functions
function formatShortcutKey(key: string): string {
  return key
    .replace('Ctrl', '⌃')
    .replace('Alt', '⌥')
    .replace('Shift', '⇧')
    .replace('Meta', '⌘');
}

function startEdit(shortcut: ShortcutItem) {
  editingShortcut.value = shortcut;
  editingKey.value = shortcut.key;
}

function cancelEdit() {
  editingShortcut.value = null;
  editingKey.value = '';
}

function captureKey(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();

  const keys: string[] = [];
  
  if (event.ctrlKey) keys.push('Ctrl');
  if (event.altKey) keys.push('Alt');
  if (event.shiftKey) keys.push('Shift');
  if (event.metaKey) keys.push('Meta');
  
  // 添加主键
  if (
    event.key !== 'Control' &&
    event.key !== 'Alt' &&
    event.key !== 'Shift' &&
    event.key !== 'Meta'
  ) {
    keys.push(event.key.length === 1 ? event.key.toUpperCase() : event.key);
  }
  
  if (keys.length > 1) {
    editingKey.value = keys.join('+');
  }
}

async function saveEdit() {
  if (editingShortcut.value && editingKey.value) {
    // 检测冲突
    const conflict = categories.value
      .flatMap((cat) => cat.shortcuts)
      .find(
        (s) =>
          s.key === editingKey.value && s.id !== editingShortcut.value?.id,
      );

    if (conflict) {
      alert(`快捷键 "${editingKey.value}" 已被 "${conflict.label}" 使用`);
      return;
    }

    editingShortcut.value.key = editingKey.value;
    
    // TODO: 保存到后端
    // await settingStore.updateSettings({ shortcuts: ... });
    
    cancelEdit();
  }
}

function resetShortcut(shortcut: ShortcutItem) {
  shortcut.key = shortcut.defaultKey;
  // TODO: 保存到后端
}

function resetAllShortcuts() {
  if (confirm('确定要重置所有快捷键吗？')) {
    categories.value.forEach((category) => {
      category.shortcuts.forEach((shortcut) => {
        shortcut.key = shortcut.defaultKey;
      });
    });
    // TODO: 保存到后端
  }
}
</script>

<style scoped>
.shortcut-input {
  max-width: 200px;
}
</style>
