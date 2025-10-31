<template>
  <v-card flat>
    <v-card-title>外观设置</v-card-title>
    <v-card-text>
      <v-row>
        <!-- 主题 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="theme"
            label="主题"
            :items="themeOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-theme-light-dark"
            @update:model-value="handleThemeChange"
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

        <!-- 紧凑模式 -->
        <v-col cols="12" md="6">
          <v-switch
            v-model="compactMode"
            label="紧凑模式"
            color="primary"
            hide-details
            @update:model-value="handleCompactModeChange"
          />
        </v-col>

        <!-- 主题色 -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="accentColor"
            label="主题色"
            variant="outlined"
            prepend-icon="mdi-palette"
            type="color"
            @change="handleAccentColorChange"
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
import { ref, watch, computed } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';

const settingStore = useUserSettingStore();

// 直接使用 Store 的 computed，无需本地 state
const appearance = computed(() => settingStore.appearance);

// Local state（用于 v-model）
const theme = ref(appearance.value.theme);
const fontSize = ref(appearance.value.fontSize);
const compactMode = ref(appearance.value.compactMode);
const accentColor = ref(appearance.value.accentColor);
const fontFamily = ref(appearance.value.fontFamily);

// Options
const themeOptions = [
  { label: '跟随系统', value: 'AUTO' },
  { label: '浅色模式', value: 'LIGHT' },
  { label: '深色模式', value: 'DARK' },
];

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

// Watch store changes to update local state
watch(
  appearance,
  (newAppearance) => {
    theme.value = newAppearance.theme;
    fontSize.value = newAppearance.fontSize;
    compactMode.value = newAppearance.compactMode;
    accentColor.value = newAppearance.accentColor;
    fontFamily.value = newAppearance.fontFamily;
  },
  { deep: true },
);

// Handlers - 使用新的便捷方法
async function handleThemeChange(value: string) {
  await settingStore.updateAppearance({ theme: value as any });
}

async function handleFontSizeChange(value: string) {
  await settingStore.updateAppearance({ fontSize: value as any });
}

async function handleCompactModeChange(value: boolean) {
  await settingStore.updateAppearance({ compactMode: value });
}

async function handleAccentColorChange() {
  // 颜色选择器使用防抖版本，避免频繁更新
  await settingStore.updateAppearanceDebounced({ accentColor: accentColor.value }, 300);
}

async function handleFontFamilyChange(value: string | null) {
  await settingStore.updateAppearance({ fontFamily: value });
}
</script>
