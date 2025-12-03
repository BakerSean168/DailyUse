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

      <!-- 标题 -->
      <v-row v-if="showTitle">
        <v-col cols="12" class="text-center">
          <h2 class="text-h5 mb-4">{{ title }}</h2>
        </v-col>
      </v-row>

      <!-- 用户名 -->
      <v-row>
        <v-col cols="12">
          <DuTextField
            v-model="formData.username"
            label="用户名或邮箱"
            :rules="loginUsernameRules"
            prepend-inner-icon="mdi-account"
            autocomplete="username"
            autofocus
            required
          >
            <template #append-inner>
              <v-icon v-if="isValidEmail" color="success" size="small"> mdi-check-circle </v-icon>
            </template>
          </DuTextField>
        </v-col>
      </v-row>

      <!-- 密码 -->
      <v-row>
        <v-col cols="12">
          <DuTextField
            v-model="formData.password"
            label="密码"
            type="password"
            :rules="loginPasswordRules"
            prepend-inner-icon="mdi-lock"
            autocomplete="current-password"
            required
          />
        </v-col>
      </v-row>

      <!-- 记住登录 -->
      <v-row>
        <v-col cols="12">
          <v-checkbox
            v-model="formData.remember"
            label="记住我"
            color="primary"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>

      <!-- 按钮 -->
      <v-row class="mt-4">
        <v-col cols="12" class="text-center">
          <v-btn
            color="primary"
            type="submit"
            :loading="loading"
            :disabled="!isFormValid"
            size="large"
            block
          >
            <v-icon start>mdi-login</v-icon>
            {{ submitText }}
          </v-btn>
        </v-col>
      </v-row>

      <!-- 其他操作链接 -->
      <v-row v-if="showActions" class="mt-2">
        <v-col cols="6" class="text-center">
          <v-btn variant="text" color="primary" size="small" @click="$emit('forgot-password')">
            忘记密码？
          </v-btn>
        </v-col>
        <v-col cols="6" class="text-center">
          <v-btn variant="text" color="primary" size="small" @click="$emit('register')">
            注册新账号
          </v-btn>
        </v-col>
      </v-row>

      <!-- 第三方登录 -->
      <v-row v-if="showSocialLogin" class="mt-4">
        <v-col cols="12">
          <v-divider class="mb-4">
            <span class="text-caption text-medium-emphasis px-2">或者</span>
          </v-divider>

          <div class="d-flex justify-center">
            <v-btn
              v-for="provider in socialProviders"
              :key="provider.name"
              :color="provider.color"
              variant="outlined"
              class="mx-1"
              @click="$emit('social-login', provider.name)"
            >
              <v-icon>{{ provider.icon }}</v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useFormRules } from '../../composables/useFormValidation';
import type { LoginData } from '../../types';
import DuTextField from '../form/DuTextField.vue';

interface SocialProvider {
  name: string;
  color: string;
  icon: string;
}

interface Props {
  loading?: boolean;
  error?: string;
  title?: string;
  showTitle?: boolean;
  showActions?: boolean;
  showSocialLogin?: boolean;
  submitText?: string;
  initialData?: Partial<LoginData>;
  socialProviders?: SocialProvider[];
}

interface Emits {
  (e: 'submit', data: LoginData): void;
  (e: 'forgot-password'): void;
  (e: 'register'): void;
  (e: 'social-login', provider: string): void;
  (e: 'clear-error'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: '登录',
  showTitle: true,
  showActions: true,
  showSocialLogin: true,
  submitText: '登录',
  socialProviders: () => [
    { name: 'google', color: 'red', icon: 'mdi-google' },
    { name: 'github', color: 'grey-darken-3', icon: 'mdi-github' },
    { name: 'wechat', color: 'green', icon: 'mdi-wechat' },
  ],
});

const emit = defineEmits<Emits>();

// 表单引用和数据
const formRef = ref<InstanceType<typeof HTMLFormElement>>();

// 表单数据
const formData = reactive<LoginData>({
  username: '',
  password: '',
  remember: false,
  ...props.initialData,
} as LoginData);

// 表单验证规则
const { usernameRules, passwordRules } = useFormRules();

// 简单的登录用户名规则（可以是用户名或邮箱）
const loginUsernameRules = [
  (v: string) => !!v || '请输入用户名或邮箱',
  (v: string) => v.length >= 3 || '用户名至少3个字符',
];

// 简单的登录密码规则（不需要太严格）
const loginPasswordRules = [
  (v: string) => !!v || '请输入密码',
  (v: string) => v.length >= 6 || '密码至少6个字符',
];

// 检查是否为有效邮箱
const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(formData.username);
});

// 表单有效性
const isFormValid = computed(() => {
  return formRef.value?.isValid ?? false;
});

// 处理提交
const handleSubmit = () => {
  if (isFormValid.value) {
    emit('submit', { ...formData });
  }
};
</script>

<style scoped>
/* 第三方登录按钮样式 */
.v-btn--variant-outlined {
  border-width: 1px;
}

/* 分割线样式 */
.v-divider {
  opacity: 0.6;
}
</style>
