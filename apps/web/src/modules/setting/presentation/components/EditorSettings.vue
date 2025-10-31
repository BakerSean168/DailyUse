<template>
  <v-card flat>
    <v-card-title>编辑器设置</v-card-title>
    <v-card-text>
      <v-row>
        <!-- 编辑器主题 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="theme"
            label="编辑器主题"
            :items="themeOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-palette"
            @update:model-value="handleThemeChange"
          />
        </v-col>

        <!-- 字体大小 -->
        <v-col cols="12" md="6">
          <v-slider
            v-model="fontSize"
            label="字体大小"
            :min="10"
            :max="24"
            :step="1"
            thumb-label="always"
            prepend-icon="mdi-format-size"
            @update:model-value="handleFontSizeChange"
          />
        </v-col>

        <!-- Tab 大小 -->
        <v-col cols="12" md="6">
          <v-slider
            v-model="tabSize"
            label="Tab 大小"
            :min="2"
            :max="8"
            :step="2"
            thumb-label="always"
            prepend-icon="mdi-keyboard-tab"
            @update:model-value="handleTabSizeChange"
          />
        </v-col>

        <!-- 自动换行 -->
        <v-col cols="12" md="6">
          <v-switch
            v-model="wordWrap"
            label="自动换行"
            color="primary"
            hide-details
            @update:model-value="handleWordWrapChange"
          >
            <template #prepend>
              <v-icon>mdi-wrap</v-icon>
            </template>
          </v-switch>
        </v-col>

        <!-- 显示行号 -->
        <v-col cols="12" md="6">
          <v-switch
            v-model="lineNumbers"
            label="显示行号"
            color="primary"
            hide-details
            @update:model-value="handleLineNumbersChange"
          >
            <template #prepend>
              <v-icon>mdi-format-list-numbered</v-icon>
            </template>
          </v-switch>
        </v-col>

        <!-- 显示迷你地图 -->
        <v-col cols="12" md="6">
          <v-switch
            v-model="minimap"
            label="显示迷你地图"
            color="primary"
            hide-details
            @update:model-value="handleMinimapChange"
          >
            <template #prepend>
              <v-icon>mdi-map</v-icon>
            </template>
          </v-switch>
        </v-col>
      </v-row>

      <!-- 预览区域 -->
      <v-divider class="my-4" />
      <div class="editor-preview">
        <p class="text-subtitle-2 mb-2">预览</p>
        <div 
          class="preview-box pa-4" 
          :style="previewStyle"
        >
          <pre v-if="lineNumbers" class="line-numbers">1
2
3</pre>
          <div class="preview-content">
            <code>function hello() {
  console.log('Hello World');
}</code>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';

const settingStore = useUserSettingStore();

// Local state
const theme = ref(settingStore.settings?.editorTheme ?? 'default');
const fontSize = ref(settingStore.settings?.editorFontSize ?? 14);
const tabSize = ref(settingStore.settings?.editorTabSize ?? 2);
const wordWrap = ref(settingStore.settings?.editorWordWrap ?? true);
const lineNumbers = ref(settingStore.settings?.editorLineNumbers ?? true);
const minimap = ref(settingStore.settings?.editorMinimap ?? true);

// Options
const themeOptions = [
  { label: '默认', value: 'default' },
  { label: 'VS Code Dark', value: 'vs-dark' },
  { label: 'GitHub Light', value: 'github-light' },
  { label: 'Monokai', value: 'monokai' },
  { label: 'Dracula', value: 'dracula' },
];

// Preview style
const previewStyle = computed(() => ({
  fontSize: `${fontSize.value}px`,
  fontFamily: 'monospace',
  whiteSpace: wordWrap.value ? 'pre-wrap' : 'pre',
  display: 'flex',
}));

// Watch store changes
watch(
  () => settingStore.settings,
  (newSettings) => {
    if (newSettings) {
      theme.value = newSettings.editorTheme;
      fontSize.value = newSettings.editorFontSize;
      tabSize.value = newSettings.editorTabSize;
      wordWrap.value = newSettings.editorWordWrap;
      lineNumbers.value = newSettings.editorLineNumbers;
      minimap.value = newSettings.editorMinimap;
    }
  },
  { deep: true },
);

// Handlers (with debounce)
async function handleThemeChange(value: string) {
  await settingStore.updateSettings({ editorTheme: value });
}

async function handleFontSizeChange(value: number) {
  await settingStore.updateSettingsDebounced({ editorFontSize: value }, 300);
}

async function handleTabSizeChange(value: number) {
  await settingStore.updateSettingsDebounced({ editorTabSize: value }, 300);
}

async function handleWordWrapChange(value: boolean) {
  await settingStore.updateSettings({ editorWordWrap: value });
}

async function handleLineNumbersChange(value: boolean) {
  await settingStore.updateSettings({ editorLineNumbers: value });
}

async function handleMinimapChange(value: boolean) {
  await settingStore.updateSettings({ editorMinimap: value });
}
</script>

<style scoped>
.editor-preview {
  margin-top: 16px;
}

.preview-box {
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  overflow-x: auto;
}

.line-numbers {
  color: #858585;
  padding-right: 12px;
  margin-right: 12px;
  border-right: 1px solid #3e3e3e;
  user-select: none;
  text-align: right;
  min-width: 30px;
}

.preview-content {
  flex: 1;
}

code {
  color: #d4d4d4;
}
</style>
