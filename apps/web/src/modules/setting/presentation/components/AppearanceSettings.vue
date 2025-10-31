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
import { ref, watch } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';

const settingStore = useUserSettingStore();

// Local state
const theme = ref(settingStore.settings?.appearanceTheme ?? 'AUTO');
const fontSize = ref(settingStore.settings?.appearanceFontSize ?? 'MEDIUM');
const compactMode = ref(settingStore.settings?.appearanceCompactMode ?? false);
const accentColor = ref(settingStore.settings?.appearanceAccentColor ?? '#3B82F6');
const fontFamily = ref(settingStore.settings?.appearanceFontFamily ?? null);

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
  { label: 'Arial', value: 'Arial' },
  { label: 'Helvetica', value: 'Helvetica' },
  { label: 'Microsoft YaHei', value: 'Microsoft YaHei' },
  { label: 'PingFang SC', value: 'PingFang SC' },
  { label: 'Source Han Sans', value: 'Source Han Sans' },
];

// Watch store changes
watch(
  () => settingStore.settings,
  (newSettings) => {
    if (newSettings) {
      theme.value = newSettings.appearanceTheme;
      fontSize.value = newSettings.appearanceFontSize;
      compactMode.value = newSettings.appearanceCompactMode;
      accentColor.value = newSettings.appearanceAccentColor;
      fontFamily.value = newSettings.appearanceFontFamily;
    }
  },
  { deep: true },
);

// Handlers
async function handleThemeChange(value: 'AUTO' | 'LIGHT' | 'DARK') {
  await settingStore.updateSettings({ appearanceTheme: value });
}

async function handleFontSizeChange(value: 'SMALL' | 'MEDIUM' | 'LARGE') {
  await settingStore.updateSettings({ appearanceFontSize: value });
}

async function handleCompactModeChange(value: boolean) {
  await settingStore.updateSettings({ appearanceCompactMode: value });
}

async function handleAccentColorChange() {
  await settingStore.updateSettingsDebounced({ appearanceAccentColor: accentColor.value });
}

async function handleFontFamilyChange(value: string | null) {
  await settingStore.updateSettings({ appearanceFontFamily: value });
}
</script>
