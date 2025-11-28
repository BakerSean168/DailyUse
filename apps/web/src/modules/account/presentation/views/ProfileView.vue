<!-- Profile View -->
<template>
  <v-container fluid class="profile-view pa-6">
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">
        <!-- 页面头部 -->
        <div class="d-flex align-center mb-8">
          <div class="d-flex align-center flex-grow-1">
            <v-avatar size="48" color="primary" class="mr-4">
              <v-icon size="32">mdi-account-circle</v-icon>
            </v-avatar>
            <div>
              <h1 class="text-h4 mb-1">个人资料</h1>
              <p class="text-body-2 text-medium-emphasis ma-0">
                管理您的个人信息和偏好设置
              </p>
            </div>
          </div>
          <v-btn
            v-if="!isEditing"
            color="primary"
            size="large"
            @click="enableEditMode"
            prepend-icon="mdi-pencil"
          >
            编辑资料
          </v-btn>
          <div v-else class="d-flex gap-2">
            <v-btn
              color="primary"
              size="large"
              @click="handleSubmit"
              :loading="loading"
              :disabled="!valid || loading"
              prepend-icon="mdi-content-save"
            >
              保存
            </v-btn>
            <v-btn
              size="large"
              variant="outlined"
              @click="cancelEdit"
              :disabled="loading"
              prepend-icon="mdi-close"
            >
              取消
            </v-btn>
          </div>
        </div>

        <!-- 加载状态 -->
        <v-progress-linear
          v-if="loading && !profile"
          indeterminate
          color="primary"
          class="mb-4"
        ></v-progress-linear>

        <!-- 错误提示 -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          closable
          @click:close="error = null"
          class="mb-4"
        >
          {{ error }}
        </v-alert>

        <!-- 资料内容 -->
        <v-card v-if="profile" class="elevation-2">
          <v-card-text class="pa-6">
            <v-form ref="formRef" v-model="valid">
              <!-- 查看模式 -->
              <template v-if="!isEditing">
                <!-- 基本信息 -->
                <div class="mb-6">
                  <div class="d-flex align-center mb-4">
                    <v-icon class="mr-2" color="primary">mdi-account</v-icon>
                    <h3 class="text-h6">基本信息</h3>
                  </div>
                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="info-item">
                        <div class="info-label">用户名</div>
                        <div class="info-value">{{ profile.username }}</div>
                      </div>
                    </v-col>

                    <v-col cols="12" md="6">
                      <div class="info-item">
                        <div class="info-label">显示名称</div>
                        <div class="info-value">
                          {{ profile.profile?.displayName || '未设置' }}
                        </div>
                      </div>
                    </v-col>

                    <v-col cols="12" md="6">
                      <div class="info-item">
                        <div class="info-label">邮箱</div>
                        <div class="info-value d-flex align-center">
                          {{ profile.email }}
                          <v-chip
                            v-if="profile.emailVerified"
                            size="x-small"
                            color="success"
                            variant="flat"
                            class="ml-2"
                          >
                            <v-icon start size="x-small">mdi-check-circle</v-icon>
                            已验证
                          </v-chip>
                          <v-chip
                            v-else
                            size="x-small"
                            color="warning"
                            variant="flat"
                            class="ml-2"
                          >
                            <v-icon start size="x-small">mdi-alert-circle</v-icon>
                            未验证
                          </v-chip>
                        </div>
                      </div>
                    </v-col>

                    <v-col cols="12" md="6">
                      <div class="info-item">
                        <div class="info-label">手机号</div>
                        <div class="info-value">
                          {{ profile.phoneNumber || '未设置' }}
                        </div>
                      </div>
                    </v-col>

                    <v-col cols="12">
                      <div class="info-item">
                        <div class="info-label">个人简介</div>
                        <div class="info-value text-medium-emphasis">
                          {{ profile.profile?.bio || '这个人很懒，还没有写简介...' }}
                        </div>
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <v-divider class="my-6"></v-divider>

                <!-- 偏好设置 -->
                <div class="mb-6">
                  <div class="d-flex align-center mb-4">
                    <v-icon class="mr-2" color="primary">mdi-cog</v-icon>
                    <h3 class="text-h6">偏好设置</h3>
                  </div>
                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="info-item">
                        <div class="info-label">时区</div>
                        <div class="info-value">{{ profile.profile?.timezone || 'UTC' }}</div>
                      </div>
                    </v-col>

                    <v-col cols="12" md="6">
                      <div class="info-item">
                        <div class="info-label">语言</div>
                        <div class="info-value">
                          {{ getLanguageDisplay(profile.profile?.language) }}
                        </div>
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <v-divider class="my-6"></v-divider>

                <!-- 账户信息 -->
                <div>
                  <div class="d-flex align-center mb-4">
                    <v-icon class="mr-2" color="primary">mdi-shield-account</v-icon>
                    <h3 class="text-h6">账户信息</h3>
                  </div>
                  <v-row>
                    <v-col cols="12" md="6">
                      <div class="info-item">
                        <div class="info-label">账户状态</div>
                        <div class="info-value">
                          <v-chip size="small" :color="getStatusColor(profile.status)" variant="flat">
                            {{ profile.status }}
                          </v-chip>
                        </div>
                      </div>
                    </v-col>

                    <v-col cols="12" md="6">
                      <div class="info-item">
                        <div class="info-label">注册时间</div>
                        <div class="info-value">{{ formatDate(profile.createdAt) }}</div>
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </template>

              <!-- 编辑模式 -->
              <template v-else>
                <div class="edit-form">
                  <div class="d-flex align-center mb-4">
                    <v-icon class="mr-2" color="primary">mdi-pencil</v-icon>
                    <h3 class="text-h6">编辑资料</h3>
                  </div>
                  
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editForm.displayName"
                        label="显示名称"
                        :rules="displayNameRules"
                        prepend-inner-icon="mdi-account"
                        variant="outlined"
                        counter="50"
                        hint="这是其他用户看到的您的名称"
                        persistent-hint
                      ></v-text-field>
                    </v-col>

                    <v-col cols="12">
                      <v-textarea
                        v-model="editForm.bio"
                        label="个人简介"
                        :rules="bioRules"
                        prepend-inner-icon="mdi-text"
                        variant="outlined"
                        counter="500"
                        rows="4"
                        auto-grow
                        hint="简单介绍一下您自己"
                        persistent-hint
                      ></v-textarea>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-select
                        v-model="editForm.timezone"
                        :items="timezones"
                        label="时区"
                        prepend-inner-icon="mdi-clock-outline"
                        variant="outlined"
                      ></v-select>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-select
                        v-model="editForm.language"
                        :items="languages"
                        label="语言"
                        prepend-inner-icon="mdi-translate"
                        variant="outlined"
                      ></v-select>
                    </v-col>
                  </v-row>
                </div>
              </template>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- 空状态 -->
        <v-card v-else-if="!loading" class="elevation-2">
          <v-card-text class="pa-8 text-center">
            <v-icon size="80" color="grey-lighten-1" class="mb-4">mdi-account-off</v-icon>
            <h3 class="text-h6 mb-2">无法加载个人资料</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">请检查网络连接后重试</p>
            <v-btn color="primary" @click="loadProfile" prepend-icon="mdi-refresh">
              重新加载
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 成功提示 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      <div class="d-flex align-center">
        <v-icon start>
          {{ snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
        </v-icon>
        {{ snackbar.message }}
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAccount } from '../composables/useAccount';
import type { AccountClientDTO, UpdateAccountRequest } from '@dailyuse/contracts/account';

// Composables
const { getMyProfile, updateMyProfile } = useAccount();

// 状态管理
const profile = ref<AccountDTO | null>(null);
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
  background-color: rgb(var(--v-theme-background));
  min-height: 100vh;
}

/* 信息项样式 */
.info-item {
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
  transition: background-color 0.2s;
}

.info-item:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
}

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 8px;
}

.info-value {
  font-size: 1rem;
  font-weight: 400;
  color: rgb(var(--v-theme-on-surface));
  word-break: break-word;
}

/* 编辑表单样式 */
.edit-form {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
  border-radius: 12px;
  padding: 24px;
}

/* 响应式调整 */
@media (max-width: 960px) {
  .profile-view {
    padding: 16px !important;
  }
  
  .info-item {
    padding: 12px;
  }
  
  .edit-form {
    padding: 16px;
  }
}
</style>

