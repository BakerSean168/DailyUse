<template>
  <v-card flat>
    <v-card-title>隐私设置</v-card-title>
    <v-card-text>
      <v-row>
        <!-- 个人资料可见性 -->
        <v-col cols="12">
          <v-select
            v-model="profileVisibility"
            label="个人资料可见性"
            :items="visibilityOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            prepend-icon="mdi-account-eye"
            @update:model-value="handleProfileVisibilityChange"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :icon="item.raw.icon" />
                </template>
                <template #subtitle>
                  <span class="text-caption">{{ item.raw.description }}</span>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>

        <v-divider class="my-2" />

        <!-- 在线状态 -->
        <v-col cols="12">
          <v-switch
            v-model="showOnlineStatus"
            label="显示在线状态"
            color="primary"
            hide-details
            @update:model-value="handleOnlineStatusChange"
          >
            <template #prepend>
              <v-icon>mdi-circle</v-icon>
            </template>
          </v-switch>
          <p class="text-caption text-medium-emphasis mt-2">
            让其他用户看到您的在线状态
          </p>
        </v-col>

        <v-divider class="my-2" />

        <!-- 搜索权限 -->
        <v-col cols="12">
          <p class="text-subtitle-2 mb-3">
            <v-icon>mdi-account-search</v-icon>
            搜索权限
          </p>
          <v-switch
            v-model="allowSearchByEmail"
            label="允许通过邮箱搜索"
            color="primary"
            hide-details
            class="mb-3"
            @update:model-value="handleSearchByEmailChange"
          />
          <v-switch
            v-model="allowSearchByPhone"
            label="允许通过手机号搜索"
            color="primary"
            hide-details
            @update:model-value="handleSearchByPhoneChange"
          />
          <p class="text-caption text-medium-emphasis mt-2">
            控制其他用户是否可以通过您的联系方式找到您
          </p>
        </v-col>

        <v-divider class="my-2" />

        <!-- 活动可见性 - TODO: 字段尚未在后端实现 -->
        <!--
        <v-col cols="12">
          <p class="text-subtitle-2 mb-3">
            <v-icon>mdi-chart-timeline</v-icon>
            活动可见性
          </p>
          <v-switch
            v-model="showActivityStatus"
            label="显示活动状态"
            color="primary"
            hide-details
            class="mb-3"
            @update:model-value="handleActivityStatusChange"
          />
          <p class="text-caption text-medium-emphasis">
            显示您最近的活动，如完成的任务、创建的目标等
          </p>
        </v-col>

        <v-divider class="my-2" />
        -->

        <!-- 数据共享 -->
        <v-col cols="12">
          <p class="text-subtitle-2 mb-3">
            <v-icon>mdi-database-export</v-icon>
            数据共享
          </p>
          <v-switch
            v-model="shareUsageData"
            label="共享使用数据"
            color="primary"
            hide-details
            class="mb-3"
            @update:model-value="handleUsageDataChange"
          />
          <p class="text-caption text-medium-emphasis mb-3">
            帮助我们改进产品，您的数据将被匿名化处理
          </p>
          
          <!-- TODO: shareCrashReports 字段尚未在后端实现 -->
          <!--
          <v-switch
            v-model="shareCrashReports"
            label="共享崩溃报告"
            color="primary"
            hide-details
            @update:model-value="handleCrashReportsChange"
          />
          <p class="text-caption text-medium-emphasis mt-2">
            自动发送崩溃报告以帮助我们修复问题
          </p>
          -->
        </v-col>

        <v-divider class="my-2" />

        <!-- 数据管理 -->
        <v-col cols="12">
          <p class="text-subtitle-2 mb-3">
            <v-icon>mdi-database-cog</v-icon>
            数据管理
          </p>
          <v-row>
            <v-col cols="12" md="4">
              <v-btn
                block
                variant="outlined"
                prepend-icon="mdi-download"
              >
                导出数据
              </v-btn>
            </v-col>
            <v-col cols="12" md="4">
              <v-btn
                block
                variant="outlined"
                prepend-icon="mdi-delete-sweep"
              >
                清除缓存
              </v-btn>
            </v-col>
            <v-col cols="12" md="4">
              <v-btn
                block
                variant="outlined"
                color="error"
                prepend-icon="mdi-account-remove"
              >
                删除账户
              </v-btn>
            </v-col>
          </v-row>
        </v-col>

        <!-- 隐私说明 -->
        <v-col cols="12">
          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            icon="mdi-information"
          >
            您的隐私对我们很重要。查看我们的
            <a href="#" class="text-primary">隐私政策</a>
            了解更多关于我们如何保护您的数据。
          </v-alert>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useUserSettingStore } from '../stores/userSettingStore';

const settingStore = useUserSettingStore();

// Use computed getter for privacy settings
const privacy = computed(() => settingStore.privacy);

// Local state
const profileVisibility = ref(privacy.value.profileVisibility);
const showOnlineStatus = ref(privacy.value.showOnlineStatus);
const allowSearchByEmail = ref(privacy.value.allowSearchByEmail);
const allowSearchByPhone = ref(privacy.value.allowSearchByPhone);
const shareUsageData = ref(privacy.value.shareUsageData);

// TODO: These fields are not in privacy DTO yet - commented out for now
// const showActivityStatus = ref(settingStore.settings?.privacyShowActivityStatus ?? true);
// const shareCrashReports = ref(settingStore.settings?.privacyShareCrashReports ?? true);

// Options
const visibilityOptions = [
  {
    label: '公开',
    value: 'PUBLIC',
    icon: 'mdi-earth',
    description: '所有人都可以查看您的资料',
  },
  {
    label: '好友',
    value: 'FRIENDS',
    icon: 'mdi-account-group',
    description: '只有您的好友可以查看',
  },
  {
    label: '私密',
    value: 'PRIVATE',
    icon: 'mdi-lock',
    description: '只有您自己可以查看',
  },
];

// Watch privacy changes
watch(
  privacy,
  (newPrivacy) => {
    profileVisibility.value = newPrivacy.profileVisibility;
    showOnlineStatus.value = newPrivacy.showOnlineStatus;
    allowSearchByEmail.value = newPrivacy.allowSearchByEmail;
    allowSearchByPhone.value = newPrivacy.allowSearchByPhone;
    shareUsageData.value = newPrivacy.shareUsageData;
  },
  { deep: true },
);

// Watch other settings - commented out fields not yet in DTO
/*
watch(
  () => settingStore.settings,
  (newSettings) => {
    if (newSettings) {
      showActivityStatus.value = newSettings.privacyShowActivityStatus;
      shareCrashReports.value = newSettings.privacyShareCrashReports;
    }
  },
  { deep: true },
);
*/

// Handlers - using convenience method
async function handleProfileVisibilityChange(value: string) {
  await settingStore.updatePrivacy({ profileVisibility: value as any });
}

async function handleOnlineStatusChange(value: boolean | null) {
  if (value !== null) {
    await settingStore.updatePrivacy({ showOnlineStatus: value });
  }
}

async function handleSearchByEmailChange(value: boolean | null) {
  if (value !== null) {
    await settingStore.updatePrivacy({ allowSearchByEmail: value });
  }
}

async function handleSearchByPhoneChange(value: boolean | null) {
  if (value !== null) {
    await settingStore.updatePrivacy({ allowSearchByPhone: value });
  }
}

// Commented out - fields not yet in DTO
/*
async function handleActivityStatusChange(value: boolean) {
  await settingStore.updateSettings({ privacyShowActivityStatus: value });
}
*/

async function handleUsageDataChange(value: boolean | null) {
  if (value !== null) {
    await settingStore.updatePrivacy({ shareUsageData: value });
  }
}

// Commented out - field not yet in DTO
/*
async function handleCrashReportsChange(value: boolean) {
  await settingStore.updateSettings({ privacyShareCrashReports: value });
}
*/
</script>
