<template>
  <v-card flat>
    <v-card-title>区域设置</v-card-title>
    <v-card-text>
      <v-row>
        <!-- 语言 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="language"
            label="语言"
            :items="languageOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-translate"
            @update:model-value="handleLanguageChange"
          />
        </v-col>

        <!-- 时区 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="timezone"
            label="时区"
            :items="timezoneOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-earth"
            @update:model-value="handleTimezoneChange"
          />
        </v-col>

        <!-- 日期格式 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="dateFormat"
            label="日期格式"
            :items="dateFormatOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-calendar"
            @update:model-value="handleDateFormatChange"
          />
        </v-col>

        <!-- 时间格式 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="timeFormat"
            label="时间格式"
            :items="timeFormatOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-clock-outline"
            @update:model-value="handleTimeFormatChange"
          />
        </v-col>

        <!-- 每周开始 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="weekStartsOn"
            label="每周开始于"
            :items="weekStartOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-calendar-week"
            @update:model-value="handleWeekStartChange"
          />
        </v-col>

        <!-- 货币 -->
        <v-col cols="12" md="6">
          <v-select
            v-model="currency"
            label="货币"
            :items="currencyOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-currency-usd"
            @update:model-value="handleCurrencyChange"
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

// 直接使用 Store 的 computed
const locale = computed(() => settingStore.locale);

// Local state（用于 v-model）
const language = ref(locale.value.language);
const timezone = ref(locale.value.timezone);
const dateFormat = ref(locale.value.dateFormat);
const timeFormat = ref(locale.value.timeFormat);
const weekStartsOn = ref(locale.value.weekStartsOn);
const currency = ref(locale.value.currency);

// Options
const languageOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en-US' },
  { label: '日本語', value: 'ja-JP' },
  { label: '한국어', value: 'ko-KR' },
];

const timezoneOptions = [
  { label: '北京时间 (UTC+8)', value: 'Asia/Shanghai' },
  { label: '东京时间 (UTC+9)', value: 'Asia/Tokyo' },
  { label: '纽约时间 (UTC-5)', value: 'America/New_York' },
  { label: '伦敦时间 (UTC+0)', value: 'Europe/London' },
  { label: '悉尼时间 (UTC+11)', value: 'Australia/Sydney' },
];

const dateFormatOptions = [
  { label: '2025-10-31 (YYYY-MM-DD)', value: 'YYYY-MM-DD' },
  { label: '31/10/2025 (DD/MM/YYYY)', value: 'DD/MM/YYYY' },
  { label: '10/31/2025 (MM/DD/YYYY)', value: 'MM/DD/YYYY' },
  { label: '2025年10月31日', value: 'YYYY年MM月DD日' },
];

const timeFormatOptions = [
  { label: '24小时制 (23:59)', value: '24H' },
  { label: '12小时制 (11:59 PM)', value: '12H' },
];

const weekStartOptions = [
  { label: '星期日', value: 0 },
  { label: '星期一', value: 1 },
  { label: '星期六', value: 6 },
];

const currencyOptions = [
  { label: '人民币 (CNY ¥)', value: 'CNY' },
  { label: '美元 (USD $)', value: 'USD' },
  { label: '欧元 (EUR €)', value: 'EUR' },
  { label: '日元 (JPY ¥)', value: 'JPY' },
  { label: '英镑 (GBP £)', value: 'GBP' },
];

// Watch store changes
watch(
  locale,
  (newLocale) => {
    language.value = newLocale.language;
    timezone.value = newLocale.timezone;
    dateFormat.value = newLocale.dateFormat;
    timeFormat.value = newLocale.timeFormat;
    weekStartsOn.value = newLocale.weekStartsOn;
    currency.value = newLocale.currency;
  },
  { deep: true },
);

// Handlers - 使用新的便捷方法
async function handleLanguageChange(value: string) {
  await settingStore.updateLocale({ language: value });
}

async function handleTimezoneChange(value: string) {
  await settingStore.updateLocale({ timezone: value });
}

async function handleDateFormatChange(value: string) {
  await settingStore.updateLocale({ dateFormat: value as any });
}

async function handleTimeFormatChange(value: string) {
  await settingStore.updateLocale({ timeFormat: value as any });
}

async function handleWeekStartChange(value: number) {
  await settingStore.updateLocale({ weekStartsOn: value as any });
}

async function handleCurrencyChange(value: string) {
  await settingStore.updateLocale({ currency: value });
}
</script>
