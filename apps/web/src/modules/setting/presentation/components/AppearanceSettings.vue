<template>
  <v-card flat>
    <v-card-title>外观设置</v-card-title>
    <v-card-text>
      <v-row>
        <!-- 主题 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="themeStyle"
            label="主题"
            :items="themeOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-palette"
            hint="选择您喜欢的主题颜色方案"
            persistent-hint
            @update:model-value="handleThemeStyleChange"
          />
        </v-col>

        <!-- 字体大小 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="fontSize"
            label="字体大小"
            :items="fontSizeOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-format-size"
            @update:model-value="handleFontSizeChange"
          />
        </v-col>

        <!-- 主题色 -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="accentColor"
            label="强调色"
            variant="outlined"
            prepend-icon="mdi-palette-outline"
            type="color"
            hint="自定义主题的强调颜色"
            persistent-hint
            @change="handleAccentColorChange"
          />
        </v-col>

        <!-- 紧凑模式 -->
        <v-col cols="12" md="6">
          <v-switch
            v-model="compactMode"
            label="紧凑模式"
            color="primary"
            hint="减小组件间距，显示更多内容"
            persistent-hint
            @update:model-value="handleCompactModeChange"
          />
        </v-col>

        <!-- 字体 -->
        <v-col cols="12">
          <v-select
            v-model="fontFamily"
            label="字体"
            :items="fontFamilyOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-format-font"
            clearable
            @update:model-value="handleFontFamilyChange"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';
import { getThemeService } from '../../application/services/ThemeService';

const settingStore = useUserSettingStore();
const themeService = getThemeService();

// 直接使用 Store 的 computed
const appearance = computed(() => settingStore.appearance);

// Local state（用于 v-model）
const themeStyle = ref('dark'); // 当前主题样式
const fontSize = ref(appearance.value.fontSize);
const compactMode = ref(appearance.value.compactMode);
const accentColor = ref(appearance.value.accentColor);
const fontFamily = ref(appearance.value.fontFamily);

// 主题选项（从 Vuetify 配置动态获取，带深色/浅色标识）
const themeOptions = computed(() => {
  const availableThemes = themeService.getAvailableThemes();
  
  // 主题元数据：名称、类型（深色/浅色）、图标
  const themeMetadata: Record<string, { label: string; type: '深色' | '浅色'; icon: string }> = {
    light: { label: '标准浅色', type: '浅色', icon: '☀️' },
    dark: { label: '标准深色', type: '深色', icon: '🌙' },
    darkBlue: { label: '深蓝', type: '深色', icon: '🌊' },
    warmPaper: { label: '暖纸', type: '浅色', icon: '📄' },
    lightBlue: { label: '浅蓝', type: '浅色', icon: '💠' },
    blueGreen: { label: '蓝绿', type: '深色', icon: '🌿' },
  };

  return availableThemes.map(themeName => {
    const meta = themeMetadata[themeName] || { label: themeName, type: '深色', icon: '🎨' };
    return {
      label: `${meta.icon} ${meta.label} (${meta.type})`,
      value: themeName,
    };
  });
});

// 字体大小选项
const fontSizeOptions = [
  { label: '小', value: 'SMALL' },
  { label: '中', value: 'MEDIUM' },
  { label: '大', value: 'LARGE' },
];

const fontFamilyOptions = [
  { label: '系统默认', value: null },
  { label: 'Inter', value: 'Inter' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Roboto', value: 'Roboto' },
  { label: '微软雅黑', value: 'Microsoft YaHei' },
  { label: '苹方', value: 'PingFang SC' },
];

// 初始化：从 ThemeService 获取当前主题样式
onMounted(() => {
  const currentTheme = themeService.getCurrentTheme();
  themeStyle.value = currentTheme;
  console.log('🎨 当前主题样式:', currentTheme);
});

// Watch store changes to update local state
watch(
  appearance,
  (newAppearance) => {
    fontSize.value = newAppearance.fontSize;
    compactMode.value = newAppearance.compactMode;
    accentColor.value = newAppearance.accentColor;
    fontFamily.value = newAppearance.fontFamily;
  },
  { deep: true },
);

// Handlers - 主题样式变化
async function handleThemeStyleChange(value: string) {
  console.log('🎨 切换主题样式:', value);
  // 直接调用 ThemeService 切换 Vuetify 主题
  themeService.setThemeStyle(value);
}

async function handleFontSizeChange(value: string) {
  await settingStore.updateAppearance({ fontSize: value as any });
}

async function handleCompactModeChange(value: boolean | null) {
  if (value !== null) {
    await settingStore.updateAppearance({ compactMode: value });
  }
}

async function handleAccentColorChange() {
  // 颜色选择器使用防抖版本，避免频繁更新
  await settingStore.updateAppearanceDebounced({ accentColor: accentColor.value }, 300);
}

async function handleFontFamilyChange(value: string | null) {
  await settingStore.updateAppearance({ fontFamily: value });
}
</script>
