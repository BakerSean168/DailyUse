<template>
  <v-card flat>
    <v-card-title>通知设置</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-switch
            v-model="emailNotification"
            label="邮件通知"
            color="primary"
            hide-details
            @update:model-value="handleEmailChange"
          >
            <template #prepend>
              <v-icon>mdi-email</v-icon>
            </template>
          </v-switch>
          <p class="text-caption text-medium-emphasis mt-2">
            接收重要更新和提醒的邮件通知
          </p>
        </v-col>

        <v-col cols="12">
          <v-switch
            v-model="pushNotification"
            label="推送通知"
            color="primary"
            hide-details
            @update:model-value="handlePushChange"
          >
            <template #prepend>
              <v-icon>mdi-cellphone</v-icon>
            </template>
          </v-switch>
          <p class="text-caption text-medium-emphasis mt-2">
            接收浏览器推送通知
          </p>
        </v-col>

        <v-col cols="12">
          <v-switch
            v-model="inAppNotification"
            label="站内通知"
            color="primary"
            hide-details
            @update:model-value="handleInAppChange"
          >
            <template #prepend>
              <v-icon>mdi-bell</v-icon>
            </template>
          </v-switch>
          <p class="text-caption text-medium-emphasis mt-2">
            在应用内显示通知
          </p>
        </v-col>

        <v-col cols="12">
          <v-switch
            v-model="soundNotification"
            label="声音提示"
            color="primary"
            hide-details
            @update:model-value="handleSoundChange"
          >
            <template #prepend>
              <v-icon>mdi-volume-high</v-icon>
            </template>
          </v-switch>
          <p class="text-caption text-medium-emphasis mt-2">
            收到通知时播放提示音
          </p>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';

const settingStore = useUserSettingStore();

const emailNotification = ref(settingStore.settings?.notificationEmail ?? true);
const pushNotification = ref(settingStore.settings?.notificationPush ?? true);
const inAppNotification = ref(settingStore.settings?.notificationInApp ?? true);
const soundNotification = ref(settingStore.settings?.notificationSound ?? true);

watch(
  () => settingStore.settings,
  (newSettings) => {
    if (newSettings) {
      emailNotification.value = newSettings.notificationEmail;
      pushNotification.value = newSettings.notificationPush;
      inAppNotification.value = newSettings.notificationInApp;
      soundNotification.value = newSettings.notificationSound;
    }
  },
  { deep: true },
);

async function handleEmailChange(value: boolean) {
  await settingStore.updateNotifications({ email: value });
}

async function handlePushChange(value: boolean) {
  await settingStore.updateNotifications({ push: value });
}

async function handleInAppChange(value: boolean) {
  await settingStore.updateNotifications({ inApp: value });
}

async function handleSoundChange(value: boolean) {
  await settingStore.updateNotifications({ sound: value });
}
</script>
