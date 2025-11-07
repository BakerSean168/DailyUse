<template>
  <v-container>
    <v-card>
      <v-card-title>主题测试页面</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <h3>当前主题信息</h3>
            <pre>{{ themeInfo }}</pre>
          </v-col>

          <v-col cols="12">
            <h3>主题模式切换</h3>
            <v-btn-toggle
              :model-value="currentMode"
              @update:model-value="changeMode"
              mandatory
              color="primary"
            >
              <v-btn value="LIGHT">浅色</v-btn>
              <v-btn value="DARK">深色</v-btn>
              <v-btn value="AUTO">自动</v-btn>
            </v-btn-toggle>
          </v-col>

          <v-col cols="12">
            <h3>主题色选择</h3>
            <input
              type="color"
              :value="currentColor"
              @change="changeColor"
              style="width: 100px; height: 50px"
            />
            <span class="ml-4">当前主题色: {{ currentColor }}</span>
          </v-col>

          <v-col cols="12">
            <h3>字体大小</h3>
            <v-btn-toggle
              :model-value="currentFontSize"
              @update:model-value="changeFontSize"
              mandatory
              color="primary"
            >
              <v-btn value="SMALL">小</v-btn>
              <v-btn value="MEDIUM">中</v-btn>
              <v-btn value="LARGE">大</v-btn>
            </v-btn-toggle>
          </v-col>

          <v-col cols="12">
            <h3>紧凑模式</h3>
            <v-switch
              :model-value="currentCompact"
              @update:model-value="toggleCompact"
              label="紧凑模式"
              color="primary"
            />
          </v-col>

          <v-col cols="12">
            <h3>测试组件</h3>
            <v-btn color="primary" class="mr-2">Primary Button</v-btn>
            <v-btn color="secondary" class="mr-2">Secondary Button</v-btn>
            <v-btn color="error" class="mr-2">Error Button</v-btn>
            <v-btn color="success" class="mr-2">Success Button</v-btn>
          </v-col>

          <v-col cols="12">
            <v-alert type="info">这是一个信息提示</v-alert>
            <v-alert type="success">这是一个成功提示</v-alert>
            <v-alert type="warning">这是一个警告提示</v-alert>
            <v-alert type="error">这是一个错误提示</v-alert>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme as useVuetifyTheme } from 'vuetify';
import { useTheme } from '@/modules/theme';

const vuetifyTheme = useVuetifyTheme();
const {
  mode,
  accentColor,
  fontSize,
  compactMode,
  setMode,
  setAccentColor,
  setFontSize,
  toggleCompactMode,
} = useTheme();

// 当前值
const currentMode = computed(() => mode.value);
const currentColor = computed(() => accentColor.value);
const currentFontSize = computed(() => fontSize.value);
const currentCompact = computed(() => compactMode.value);

// 主题信息
const themeInfo = computed(() => ({
  vuetifyTheme: vuetifyTheme.global.name.value,
  mode: mode.value,
  accentColor: accentColor.value,
  fontSize: fontSize.value,
  compactMode: compactMode.value,
}));

// 切换方法
const changeMode = async (newMode: string) => {
  console.log('🎨 [ThemeTest] 切换主题模式:', newMode);
  await setMode(newMode as any);
};

const changeColor = async (e: Event) => {
  const color = (e.target as HTMLInputElement).value;
  console.log('🎨 [ThemeTest] 切换主题色:', color);
  await setAccentColor(color);
};

const changeFontSize = async (size: string) => {
  console.log('🎨 [ThemeTest] 切换字体大小:', size);
  await setFontSize(size as any);
};

const toggleCompact = async () => {
  console.log('🎨 [ThemeTest] 切换紧凑模式');
  await toggleCompactMode();
};
</script>
