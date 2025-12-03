<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit" :loading="loading">
    <v-container>
      <!-- 错误提示 -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="$emit('clear-error')"
      >
        {{ error }}
      </v-alert>

      <!-- 成功提示 -->
      <v-alert
        v-if="success"
        type="success"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="$emit('clear-success')"
      >
        {{ success }}
      </v-alert>

      <!-- 标题和说明 -->
      <v-row v-if="showTitle">
        <v-col cols="12" class="text-center">
          <h2 class="text-h5 mb-2">{{ title }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ description }}</p>
        </v-col>
      </v-row>

      <!-- 步骤指示器 -->
      <v-row v-if="showSteps">
        <v-col cols="12">
          <v-stepper v-model="currentStep" :items="stepItems" flat class="mb-4" />
        </v-col>
      </v-row>

      <!-- 步骤1: 输入用户名/邮箱 -->
      <template v-if="currentStep === 1">
        <v-row>
          <v-col cols="12">
            <DuTextField
              v-model="formData.identifier"
              label="用户名或邮箱"
              :rules="identifierRules"
              prepend-inner-icon="mdi-account"
              placeholder="请输入用户名或邮箱地址"
              autofocus
              required
            >
              <template #append-inner>
                <v-icon v-if="isValidEmail" color="success" size="small"> mdi-check-circle </v-icon>
              </template>
            </DuTextField>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" class="text-center">
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!isIdentifierValid"
              @click="handleSendCode"
              size="large"
              block
            >
              <v-icon start>mdi-send</v-icon>
              发送验证码
            </v-btn>
          </v-col>
        </v-row>
      </template>

      <!-- 步骤2: 输入验证码 -->
      <template v-if="currentStep === 2">
        <v-row>
          <v-col cols="12">
            <DuTextField
              v-model="formData.verificationCode"
              label="验证码"
              :rules="codeRules"
              prepend-inner-icon="mdi-shield-key"
              placeholder="请输入6位验证码"
              :counter="6"
              autofocus
              required
            >
              <template #append-inner>
                <v-btn
                  variant="text"
                  size="small"
                  color="primary"
                  :disabled="resendCountdown > 0"
                  @click="handleResendCode"
                >
                  {{ resendCountdown > 0 ? `${resendCountdown}秒后重发` : '重新发送' }}
                </v-btn>
              </template>
            </DuTextField>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <v-btn
              variant="outlined"
              @click="currentStep = 1"
              :disabled="loading"
              size="large"
              block
            >
              上一步
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!isCodeValid"
              @click="handleVerifyCode"
              size="large"
              block
            >
              <v-icon start>mdi-check</v-icon>
              验证
            </v-btn>
          </v-col>
        </v-row>
      </template>

      <!-- 步骤3: 设置新密码 -->
      <template v-if="currentStep === 3">
        <v-row>
          <v-col cols="12">
            <DuTextField
              v-model="formData.newPassword"
              label="新密码"
              type="password"
              :rules="passwordRules"
              prepend-inner-icon="mdi-lock"
              :show-password-strength="true"
              required
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <DuTextField
              v-model="formData.confirmPassword"
              label="确认新密码"
              type="password"
              :rules="confirmPasswordRules"
              prepend-inner-icon="mdi-lock-check"
              required
            />
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <v-btn
              variant="outlined"
              @click="currentStep = 2"
              :disabled="loading"
              size="large"
              block
            >
              上一步
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              color="primary"
              type="submit"
              :loading="loading"
              :disabled="!isPasswordValid"
              size="large"
              block
            >
              <v-icon start>mdi-check-all</v-icon>
              重置密码
            </v-btn>
          </v-col>
        </v-row>
      </template>

      <!-- 返回登录链接 -->
      <v-row class="mt-4">
        <v-col cols="12" class="text-center">
          <v-btn variant="text" color="primary" size="small" @click="$emit('back-to-login')">
            <v-icon start>mdi-arrow-left</v-icon>
            返回登录
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { useFormRules } from '../../composables/useFormValidation';
import DuTextField from '../form/DuTextField.vue';

interface PasswordResetData {
  identifier: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
}

interface StepItem {
  title: string;
  value: number;
}

interface Props {
  loading?: boolean;
  error?: string;
  success?: string;
  title?: string;
  description?: string;
  showTitle?: boolean;
  showSteps?: boolean;
}

interface Emits {
  (e: 'send-code', identifier: string): void;
  (e: 'verify-code', data: { identifier: string; code: string }): void;
  (e: 'reset-password', data: PasswordResetData): void;
  (e: 'back-to-login'): void;
  (e: 'clear-error'): void;
  (e: 'clear-success'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: '重置密码',
  description: '请按照以下步骤重置您的密码',
  showTitle: true,
  showSteps: true,
});

const emit = defineEmits<Emits>();

// 表单引用和状态
const formRef = ref<InstanceType<typeof HTMLFormElement>>();
const currentStep = ref(1);
const resendCountdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;

// 表单数据
const formData = reactive<PasswordResetData>({
  identifier: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: '',
});

// 步骤配置
const stepItems: StepItem[] = [
  { title: '输入账号', value: 1 },
  { title: '验证身份', value: 2 },
  { title: '设置密码', value: 3 },
];

// 表单验证规则
const { passwordRules } = useFormRules();

// 身份识别验证规则
const identifierRules = [
  (v: string) => !!v || '请输入用户名或邮箱',
  (v: string) => v.length >= 3 || '用户名至少3个字符',
];

// 验证码规则
const codeRules = [
  (v: string) => !!v || '请输入验证码',
  (v: string) => /^\d{6}$/.test(v) || '验证码必须是6位数字',
];

// 确认密码规则
const confirmPasswordRules = [
  (v: string) => !!v || '请确认新密码',
  (v: string) => v === formData.newPassword || '两次输入的密码不一致',
];

// 检查是否为有效邮箱
const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(formData.identifier);
});

// 表单验证状态
const isIdentifierValid = computed(() => {
  return formData.identifier.length >= 3;
});

const isCodeValid = computed(() => {
  return /^\d{6}$/.test(formData.verificationCode);
});

const isPasswordValid = computed(() => {
  return formData.newPassword.length >= 6 && formData.confirmPassword === formData.newPassword;
});

// 发送验证码
const handleSendCode = () => {
  if (isIdentifierValid.value) {
    emit('send-code', formData.identifier);
    currentStep.value = 2;
    startCountdown();
  }
};

// 重新发送验证码
const handleResendCode = () => {
  if (resendCountdown.value === 0) {
    emit('send-code', formData.identifier);
    startCountdown();
  }
};

// 验证验证码
const handleVerifyCode = () => {
  if (isCodeValid.value) {
    emit('verify-code', {
      identifier: formData.identifier,
      code: formData.verificationCode,
    });
    currentStep.value = 3;
  }
};

// 提交表单（重置密码）
const handleSubmit = () => {
  if (isPasswordValid.value) {
    emit('reset-password', { ...formData });
  }
};

// 开始倒计时
const startCountdown = () => {
  resendCountdown.value = 60;
  countdownTimer = setInterval(() => {
    resendCountdown.value--;
    if (resendCountdown.value <= 0) {
      if (countdownTimer !== null) {
        clearInterval(countdownTimer);
      }
      countdownTimer = null;
    }
  }, 1000);
};

// 清理定时器
onMounted(() => {
  // 组件挂载时不需要特别处理
});

onUnmounted(() => {
  if (countdownTimer !== null) {
    clearInterval(countdownTimer);
  }
});
</script>

<style scoped>
.text-medium-emphasis {
  opacity: 0.7;
}

.v-stepper {
  box-shadow: none;
  border: 1px solid rgb(var(--v-theme-surface-variant));
}
</style>
