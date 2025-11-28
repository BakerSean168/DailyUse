<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h3 class="text-h5 mb-4">
          <v-icon class="mr-2">mdi-flask</v-icon>
          实验性功能
        </h3>
      </v-col>
    </v-row>

    <!-- 警告横幅 -->
    <v-row>
      <v-col cols="12">
        <v-alert type="warning" variant="tonal" prominent border="start" class="mb-4">
          <v-alert-title>注意</v-alert-title>
          <div class="text-body-2">
            实验性功能可能不稳定，可能会在未来版本中更改或移除。
            启用这些功能意味着您愿意承担潜在的风险。
          </div>
        </v-alert>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-list lines="two">
          <!-- 启用实验性功能 -->
          <v-list-item>
            <template v-slot:prepend>
              <v-icon>mdi-flask-outline</v-icon>
            </template>
            <v-list-item-title>启用实验性功能</v-list-item-title>
            <v-list-item-subtitle>允许访问正在开发中的新功能</v-list-item-subtitle>
            <template v-slot:append>
              <v-switch
                v-model="localExperimental.enabled"
                color="primary"
                hide-details
                @update:model-value="handleExperimentalChange"
                :disabled="loading"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>

    <!-- 功能列表 -->
    <v-row v-if="localExperimental.enabled">
      <v-col cols="12">
        <h4 class="text-h6 mb-3">可用的实验性功能</h4>

        <!-- 无功能提示 -->
        <v-alert
          v-if="availableFeatures.length === 0"
          type="info"
          variant="tonal"
          text="暂无可用的实验性功能"
        />

        <!-- 功能卡片列表 -->
        <v-row v-else>
          <v-col v-for="feature in availableFeatures" :key="feature.key" cols="12" md="6">
            <v-card
              :color="isFeatureEnabled(feature.key) ? 'primary' : undefined"
              :variant="isFeatureEnabled(feature.key) ? 'tonal' : 'outlined'"
              hover
            >
              <v-card-text>
                <div class="d-flex align-center mb-2">
                  <span class="text-h5 mr-2">{{ feature.icon }}</span>
                  <span class="text-h6 flex-grow-1">{{ feature.name }}</span>
                  <v-chip v-if="feature.isNew" color="success" size="small" class="ml-2">
                    新
                  </v-chip>
                  <v-switch
                    :model-value="isFeatureEnabled(feature.key)"
                    color="primary"
                    hide-details
                    density="compact"
                    class="ml-2"
                    @update:model-value="() => handleFeatureToggle(feature.key)"
                    :disabled="loading"
                  />
                </div>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  {{ feature.description }}
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- 操作按钮 -->
    <v-row>
      <v-col cols="12" class="d-flex justify-end ga-2">
        <v-btn
          color="primary"
          @click="handleSaveAll"
          :disabled="loading || !hasChanges"
          :loading="loading"
        >
          保存更改
        </v-btn>
        <v-btn variant="outlined" @click="handleReset" :disabled="loading"> 重置 </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserSetting } from '../composables/useUserSetting';
import type { UserSettingClientDTO, UpdateUserSettingRequest, ExperimentalFeatures } from '@dailyuse/contracts/setting';

// ===== 实验性功能定义 =====
interface ExperimentalFeature {
  key: string;
  name: string;
  icon: string;
  description: string;
  isNew: boolean;
}

const availableFeatures: ExperimentalFeature[] = [
  {
    key: 'ai-assistant',
    name: 'AI 助手',
    icon: '🤖',
    description: '基于 AI 的智能任务建议和自动化助手',
    isNew: true,
  },
  {
    key: 'voice-input',
    name: '语音输入',
    icon: '🎤',
    description: '使用语音输入创建任务和笔记',
    isNew: true,
  },
  {
    key: 'collaboration',
    name: '协作模式',
    icon: '👥',
    description: '实时协作编辑和共享工作空间',
    isNew: false,
  },
  {
    key: 'advanced-analytics',
    name: '高级分析',
    icon: '📊',
    description: '深入的生产力分析和可视化报表',
    isNew: false,
  },
];

// ===== Props =====
const props = defineProps<{
  autoSave?: boolean;
}>();

// ===== Composables =====
const { userSetting, loading, updateExperimental, hasExperimentalFeature } = useUserSetting();

// ===== 本地状态 =====
const localExperimental = ref<UpdateExperimentalRequest>({
  enabled: false,
  features: [],
});

const originalExperimental = ref<UpdateExperimentalRequest>({});

// ===== 计算属性 =====
const hasChanges = computed(() => {
  return JSON.stringify(localExperimental.value) !== JSON.stringify(originalExperimental.value);
});

// ===== 监听用户设置变化 =====
watch(
  () => userSetting.value?.experimental,
  (experimental) => {
    if (experimental) {
      localExperimental.value = {
        enabled: experimental.enabled,
        features: [...(experimental.features || [])],
      };
      originalExperimental.value = {
        enabled: experimental.enabled,
        features: [...(experimental.features || [])],
      };
    }
  },
  { immediate: true, deep: true },
);

// ===== 工具方法 =====
const isFeatureEnabled = (featureKey: string): boolean => {
  return localExperimental.value.features?.includes(featureKey) || false;
};

// ===== 事件处理 =====
const handleExperimentalChange = async () => {
  if (!localExperimental.value.enabled) {
    localExperimental.value.features = [];
  }

  if (props.autoSave) {
    await updateExperimental(localExperimental.value);
  }
};

const handleFeatureToggle = async (featureKey: string) => {
  if (!localExperimental.value.features) {
    localExperimental.value.features = [];
  }

  const index = localExperimental.value.features.indexOf(featureKey);

  if (index > -1) {
    localExperimental.value.features.splice(index, 1);
  } else {
    localExperimental.value.features.push(featureKey);
  }

  if (props.autoSave) {
    await updateExperimental(localExperimental.value);
  }
};

const handleSaveAll = async () => {
  await updateExperimental(localExperimental.value);
  originalExperimental.value = {
    enabled: localExperimental.value.enabled,
    features: [...(localExperimental.value.features || [])],
  };
};

const handleReset = () => {
  localExperimental.value = {
    enabled: originalExperimental.value.enabled,
    features: [...(originalExperimental.value.features || [])],
  };
};
</script>

<style scoped>
/* Vuetify 组件自带样式，无需额外 CSS */
</style>

