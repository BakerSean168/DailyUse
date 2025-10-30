<!-- Profile View -->
<template>
  <v-container fluid class="profile-view">
    <v-row>
      <v-col cols="12" md="8" offset-md="2">
        <!-- 页面标题 -->
        <div class="d-flex align-center mb-6">
          <v-icon size="32" class="mr-3">mdi-account-circle</v-icon>
          <h1 class="text-h4">个人资料</h1>
          <v-spacer></v-spacer>
          <v-btn
            v-if="!isEditing"
            color="primary"
            @click="enableEditMode"
            prepend-icon="mdi-pencil"
          >
            编辑资料
          </v-btn>
        </div>

        <!-- 加载状态 -->
        <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

        <!-- 错误提示 -->
        <v-alert v-if="error" type="error" dismissible @click:close="error = null" class="mb-4">
          {{ error }}
        </v-alert>

        <!-- 资料卡片 -->
        <v-card v-if="profile">
          <v-card-text>
            <v-form ref="formRef" v-model="valid" @submit.prevent="handleSubmit">
              <!-- 查看模式 -->
              <template v-if="!isEditing">
                <!-- 基本信息 -->
                <v-row>
                  <v-col cols="12">
                    <h3 class="text-h6 mb-3">基本信息</h3>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="profile-field">
                      <div class="profile-field-label">用户名</div>
                      <div class="profile-field-value">{{ profile.username }}</div>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="profile-field">
                      <div class="profile-field-label">显示名称</div>
                      <div class="profile-field-value">
                        {{ profile.profile?.displayName || '未设置' }}
                      </div>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="profile-field">
                      <div class="profile-field-label">邮箱</div>
                      <div class="profile-field-value">
                        {{ profile.email }}
                        <v-chip
                          v-if="profile.emailVerified"
                          size="small"
                          color="success"
                          class="ml-2"
                        >
                          已验证
                        </v-chip>
                        <v-chip v-else size="small" color="warning" class="ml-2"> 未验证 </v-chip>
                      </div>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="profile-field">
                      <div class="profile-field-label">手机号</div>
                      <div class="profile-field-value">
                        {{ profile.phoneNumber || '未设置' }}
                      </div>
                    </div>
                  </v-col>

                  <v-col cols="12">
                    <div class="profile-field">
                      <div class="profile-field-label">个人简介</div>
                      <div class="profile-field-value">
                        {{ profile.profile?.bio || '这个人很懒，还没有写简介...' }}
                      </div>
                    </div>
                  </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <!-- 偏好设置 -->
                <v-row>
                  <v-col cols="12">
                    <h3 class="text-h6 mb-3">偏好设置</h3>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="profile-field">
                      <div class="profile-field-label">时区</div>
                      <div class="profile-field-value">{{ profile.profile?.timezone || 'UTC' }}</div>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="profile-field">
                      <div class="profile-field-label">语言</div>
                      <div class="profile-field-value">
                        {{ getLanguageDisplay(profile.profile?.language) }}
                      </div>
                    </div>
                  </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <!-- 账户信息 -->
                <v-row>
                  <v-col cols="12">
                    <h3 class="text-h6 mb-3">账户信息</h3>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="profile-field">
                      <div class="profile-field-label">账户状态</div>
                      <div class="profile-field-value">
                        <v-chip size="small" :color="getStatusColor(profile.status)">
                          {{ profile.status }}
                        </v-chip>
                      </div>
                    </div>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <div class="profile-field">
                      <div class="profile-field-label">注册时间</div>
                      <div class="profile-field-value">{{ formatDate(profile.createdAt) }}</div>
                    </div>
                  </v-col>
                </v-row>
              </template>

              <!-- 编辑模式 -->
              <template v-else>
                <v-row>
                  <v-col cols="12">
                    <h3 class="text-h6 mb-3">编辑资料</h3>
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="editForm.displayName"
                      label="显示名称"
                      :rules="displayNameRules"
                      prepend-inner-icon="mdi-account"
                      counter="50"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="editForm.bio"
                      label="个人简介"
                      :rules="bioRules"
                      prepend-inner-icon="mdi-text"
                      counter="500"
                      rows="3"
                      auto-grow
                    ></v-textarea>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="editForm.timezone"
                      :items="timezones"
                      label="时区"
                      prepend-inner-icon="mdi-clock"
                    ></v-select>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-select
                      v-model="editForm.language"
                      :items="languages"
                      label="语言"
                      prepend-inner-icon="mdi-translate"
                    ></v-select>
                  </v-col>
                </v-row>

                <!-- 编辑模式按钮 -->
                <v-row class="mt-4">
                  <v-col cols="12">
                    <v-btn
                      type="submit"
                      color="primary"
                      :loading="loading"
                      :disabled="!valid || loading"
                      class="mr-2"
                    >
                      <v-icon start>mdi-content-save</v-icon>
                      保存
                    </v-btn>
                    <v-btn @click="cancelEdit" :disabled="loading">
                      <v-icon start>mdi-close</v-icon>
                      取消
                    </v-btn>
                  </v-col>
                </v-row>
              </template>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- 空状态 -->
        <v-card v-else-if="!loading">
          <v-card-text>
            <v-empty-state
              icon="mdi-account-off"
              text="无法加载个人资料"
              title="加载失败"
            ></v-empty-state>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 成功提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAccount } from '../composables/useAccount';
import type { AccountContracts } from '@dailyuse/contracts';

// Composables
const { getMyProfile, updateMyProfile } = useAccount();

// 状态管理
const profile = ref<AccountContracts.AccountDTO | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isEditing = ref(false);
const valid = ref(false);
const formRef = ref();

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
});

// 编辑表单
const editForm = reactive({
  displayName: '',
  bio: '',
  timezone: 'UTC',
  language: 'zh',
});

// 时区选项
const timezones = [
  { title: 'UTC', value: 'UTC' },
  { title: '中国 (Asia/Shanghai)', value: 'Asia/Shanghai' },
  { title: '美国东部 (America/New_York)', value: 'America/New_York' },
  { title: '美国西部 (America/Los_Angeles)', value: 'America/Los_Angeles' },
  { title: '英国 (Europe/London)', value: 'Europe/London' },
  { title: '日本 (Asia/Tokyo)', value: 'Asia/Tokyo' },
];

// 语言选项
const languages = [
  { title: '中文', value: 'zh' },
  { title: 'English', value: 'en' },
  { title: '日本語', value: 'ja' },
];

// 表单验证规则
const displayNameRules = [
  (v: string) => !!v || '显示名称不能为空',
  (v: string) => v.length <= 50 || '显示名称最多50个字符',
];

const bioRules = [(v: string) => !v || v.length <= 500 || '个人简介最多500个字符'];

// 加载个人资料
const loadProfile = async () => {
  loading.value = true;
  error.value = null;
  try {
    profile.value = await getMyProfile();
  } catch (err: any) {
    error.value = err.message || '加载资料失败';
    console.error('Failed to load profile:', err);
  } finally {
    loading.value = false;
  }
};

// 启用编辑模式
const enableEditMode = () => {
  if (profile.value) {
    editForm.displayName = profile.value.profile?.displayName || '';
    editForm.bio = profile.value.profile?.bio || '';
    editForm.timezone = profile.value.profile?.timezone || 'UTC';
    editForm.language = profile.value.profile?.language || 'zh';
    isEditing.value = true;
  }
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
  formRef.value?.resetValidation();
};

// 提交更新
const handleSubmit = async () => {
  if (!valid.value) return;

  loading.value = true;
  error.value = null;
  try {
    profile.value = await updateMyProfile({
      displayName: editForm.displayName,
      bio: editForm.bio || undefined,
      timezone: editForm.timezone,
      language: editForm.language,
    });

    isEditing.value = false;
    snackbar.show = true;
    snackbar.message = '资料更新成功！';
    snackbar.color = 'success';
  } catch (err: any) {
    error.value = err.message || '更新失败';
    snackbar.show = true;
    snackbar.message = error.value || '更新失败';
    snackbar.color = 'error';
    console.error('Failed to update profile:', err);
  } finally {
    loading.value = false;
  }
};

// 辅助函数
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const getLanguageDisplay = (lang?: string) => {
  const langMap: Record<string, string> = {
    zh: '中文',
    en: 'English',
    ja: '日本語',
  };
  return langMap[lang || 'en'] || lang || 'English';
};

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    ACTIVE: 'success',
    INACTIVE: 'grey',
    SUSPENDED: 'error',
  };
  return colorMap[status] || 'info';
};

// 生命周期
onMounted(() => {
  loadProfile();
});
</script>

<style scoped>
.profile-view {
  max-width: 1200px;
  margin: 0 auto;
}

.profile-field {
  margin-bottom: 16px;
}

.profile-field-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 4px;
}

.profile-field-value {
  font-size: 1rem;
  color: rgba(0, 0, 0, 0.87);
  display: flex;
  align-items: center;
}
</style>
