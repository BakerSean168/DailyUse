<!-- Security View -->
<template>
  <v-container fluid class="security-view">
    <v-row>
      <v-col cols="12" md="8" offset-md="2">
        <!-- 页面标题 -->
        <div class="d-flex align-center mb-6">
          <v-icon size="32" class="mr-3">mdi-shield-lock</v-icon>
          <h1 class="text-h4">安全设置</h1>
        </div>

        <!-- 修改密码卡片 -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-lock-reset</v-icon>
            修改密码
          </v-card-title>
          <v-card-text>
            <v-alert v-if="successMessage" type="success" dismissible class="mb-4">
              {{ successMessage }}
            </v-alert>

            <v-alert v-if="errorMessage" type="error" dismissible class="mb-4">
              {{ errorMessage }}
            </v-alert>

            <v-form ref="formRef" v-model="valid" @submit.prevent="handleChangePassword">
              <v-text-field
                v-model="form.currentPassword"
                label="当前密码"
                :type="showCurrentPassword ? 'text' : 'password'"
                :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showCurrentPassword = !showCurrentPassword"
                :rules="currentPasswordRules"
                prepend-inner-icon="mdi-lock"
                required
              ></v-text-field>

              <v-text-field
                v-model="form.newPassword"
                label="新密码"
                :type="showNewPassword ? 'text' : 'password'"
                :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showNewPassword = !showNewPassword"
                :rules="newPasswordRules"
                prepend-inner-icon="mdi-lock-plus"
                counter="100"
                required
                @input="updatePasswordStrength"
              ></v-text-field>

              <!-- 密码强度指示器 -->
              <div v-if="form.newPassword" class="mb-4">
                <div class="text-caption mb-1">密码强度</div>
                <v-progress-linear
                  :model-value="passwordStrength.score"
                  :color="passwordStrength.color"
                  height="8"
                  rounded
                ></v-progress-linear>
                <div class="text-caption mt-1" :style="{ color: passwordStrength.color }">
                  {{ passwordStrength.label }}
                </div>
                <div v-if="passwordStrength.suggestions.length" class="mt-2">
                  <div class="text-caption font-weight-bold mb-1">密码要求：</div>
                  <ul class="text-caption">
                    <li
                      v-for="(suggestion, index) in passwordStrength.suggestions"
                      :key="index"
                      :class="suggestion.met ? 'text-success' : 'text-error'"
                    >
                      <v-icon size="x-small" :color="suggestion.met ? 'success' : 'error'">
                        {{ suggestion.met ? 'mdi-check-circle' : 'mdi-close-circle' }}
                      </v-icon>
                      {{ suggestion.text }}
                    </li>
                  </ul>
                </div>
              </div>

              <v-text-field
                v-model="form.confirmPassword"
                label="确认新密码"
                :type="showConfirmPassword ? 'text' : 'password'"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                :rules="confirmPasswordRules"
                prepend-inner-icon="mdi-lock-check"
                required
              ></v-text-field>

              <div class="d-flex gap-2 mt-4">
                <v-btn
                  type="submit"
                  color="primary"
                  :loading="loading"
                  :disabled="!valid || loading"
                >
                  <v-icon start>mdi-content-save</v-icon>
                  修改密码
                </v-btn>
                <v-btn @click="resetForm" :disabled="loading">
                  <v-icon start>mdi-refresh</v-icon>
                  重置
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- 密码安全提示 -->
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-information</v-icon>
            安全提示
          </v-card-title>
          <v-card-text>
            <ul class="text-body-2">
              <li>密码长度至少 8 个字符</li>
              <li>必须包含大写字母（A-Z）</li>
              <li>必须包含小写字母（a-z）</li>
              <li>必须包含数字（0-9）</li>
              <li>必须包含特殊字符（@$!%*?&）</li>
              <li>修改密码后，所有设备将自动登出，需要重新登录</li>
            </ul>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useAccount } from '../composables/useAccount';
import { useRouter } from 'vue-router';

// Composables
const { changeMyPassword } = useAccount();
const router = useRouter();

// 状态管理
const loading = ref(false);
const valid = ref(false);
const formRef = ref();
const successMessage = ref('');
const errorMessage = ref('');

// 密码可见性控制
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// 表单数据
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// 密码强度评分
interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  suggestions: Array<{ text: string; met: boolean }>;
}

const passwordStrength = reactive<PasswordStrength>({
  score: 0,
  label: '',
  color: 'grey',
  suggestions: [],
});

// 表单验证规则
const currentPasswordRules = [
  (v: string) => !!v || '请输入当前密码',
  (v: string) => v.length >= 8 || '密码至少8个字符',
];

const newPasswordRules = [
  (v: string) => !!v || '请输入新密码',
  (v: string) => v.length >= 8 || '密码至少8个字符',
  (v: string) => v.length <= 100 || '密码最多100个字符',
  (v: string) => /[A-Z]/.test(v) || '密码必须包含大写字母',
  (v: string) => /[a-z]/.test(v) || '密码必须包含小写字母',
  (v: string) => /\d/.test(v) || '密码必须包含数字',
  (v: string) => /[@$!%*?&]/.test(v) || '密码必须包含特殊字符 (@$!%*?&)',
];

const confirmPasswordRules = [
  (v: string) => !!v || '请确认新密码',
  (v: string) => v === form.newPassword || '两次输入的密码不一致',
];

// 更新密码强度
const updatePasswordStrength = () => {
  const password = form.newPassword;
  if (!password) {
    passwordStrength.score = 0;
    passwordStrength.label = '';
    passwordStrength.color = 'grey';
    passwordStrength.suggestions = [];
    return;
  }

  const checks = [
    { text: '至少 8 个字符', met: password.length >= 8 },
    { text: '包含大写字母', met: /[A-Z]/.test(password) },
    { text: '包含小写字母', met: /[a-z]/.test(password) },
    { text: '包含数字', met: /\d/.test(password) },
    { text: '包含特殊字符 (@$!%*?&)', met: /[@$!%*?&]/.test(password) },
  ];

  const metCount = checks.filter((c) => c.met).length;
  const score = (metCount / checks.length) * 100;

  passwordStrength.suggestions = checks;
  passwordStrength.score = score;

  if (score < 40) {
    passwordStrength.label = '弱';
    passwordStrength.color = 'error';
  } else if (score < 80) {
    passwordStrength.label = '中等';
    passwordStrength.color = 'warning';
  } else {
    passwordStrength.label = '强';
    passwordStrength.color = 'success';
  }
};

// 提交表单
const handleChangePassword = async () => {
  if (!valid.value) return;

  loading.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    await changeMyPassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });

    successMessage.value = '密码修改成功！所有设备将自动登出，请使用新密码重新登录。';
    
    // 3秒后跳转到登录页
    setTimeout(() => {
      router.push('/auth');
    }, 3000);
  } catch (error: any) {
    if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message;
    } else if (error.message) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = '密码修改失败，请稍后重试';
    }
    console.error('Change password failed:', error);
  } finally {
    loading.value = false;
  }
};

// 重置表单
const resetForm = () => {
  form.currentPassword = '';
  form.newPassword = '';
  form.confirmPassword = '';
  successMessage.value = '';
  errorMessage.value = '';
  passwordStrength.score = 0;
  passwordStrength.label = '';
  passwordStrength.color = 'grey';
  passwordStrength.suggestions = [];
  formRef.value?.resetValidation();
};
</script>

<style scoped>
.security-view {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
