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
            label="用户名"
            :rules="usernameRules"
            :counter="20"
            prepend-inner-icon="mdi-account"
            required
          />
        </v-col>
      </v-row>

      <!-- 密码 -->
      <v-row>
        <v-col cols="12">
          <DuTextField
            v-model="formData.password"
            label="密码"
            type="password"
            :rules="passwordRules"
            :counter="32"
            prepend-inner-icon="mdi-lock"
            :show-password-strength="true"
            required
          />
        </v-col>
      </v-row>

      <!-- 确认密码 -->
      <v-row>
        <v-col cols="12">
          <DuTextField
            v-model="formData.confirmPassword"
            label="确认密码"
            type="password"
            :rules="confirmPasswordRules"
            prepend-inner-icon="mdi-lock-check"
            required
          />
        </v-col>
      </v-row>

      <!-- 邮箱 -->
      <v-row v-if="showEmail">
        <v-col cols="12">
          <DuTextField
            v-model="formData.email"
            label="邮箱地址"
            type="email"
            :rules="emailRules"
            prepend-inner-icon="mdi-email"
          />
        </v-col>
      </v-row>

      <!-- 手机号 -->
      <v-row v-if="showPhone">
        <v-col cols="12">
          <DuTextField
            v-model="formData.phoneNumber"
            label="手机号码"
            type="tel"
            :rules="phoneRules"
            prepend-inner-icon="mdi-phone"
            placeholder="+86 13800138000"
          />
        </v-col>
      </v-row>

      <!-- 个人信息 -->
      <v-row v-if="showPersonalInfo">
        <v-col cols="12" md="6">
          <DuTextField
            v-model="formData.firstName"
            label="姓"
            prepend-inner-icon="mdi-account-outline"
          />
        </v-col>
        <v-col cols="12" md="6">
          <DuTextField
            v-model="formData.lastName"
            label="名"
            prepend-inner-icon="mdi-account-outline"
          />
        </v-col>
      </v-row>

      <v-row v-if="showPersonalInfo">
        <v-col cols="12">
          <DuTextField
            v-model="formData.displayName"
            label="显示名称"
            prepend-inner-icon="mdi-badge-account-horizontal"
          />
        </v-col>
      </v-row>

      <v-row v-if="showPersonalInfo">
        <v-col cols="12">
          <v-textarea
            v-model="formData.bio"
            label="个人简介"
            prepend-inner-icon="mdi-account-details"
            density="comfortable"
            rows="3"
            clearable
          />
        </v-col>
      </v-row>

      <!-- 服务条款 -->
      <v-row>
        <v-col cols="12">
          <v-checkbox
            v-model="agreeTerms"
            :rules="[(v: boolean) => !!v || '请同意服务条款']"
            color="primary"
            density="compact"
          >
            <template v-slot:label>
              <span
                >我已阅读并同意
                <a href="#" @click.prevent="showTermsDialog = true" class="text-primary">
                  服务条款
                </a>
              </span>
            </template>
          </v-checkbox>
        </v-col>
      </v-row>

      <!-- 按钮 -->
      <v-row>
        <v-col cols="6" class="text-center">
          <v-btn variant="outlined" @click="handleReset" :disabled="loading" size="large">
            重置
          </v-btn>
        </v-col>
        <v-col cols="6" class="text-center">
          <v-btn
            color="primary"
            type="submit"
            :loading="loading"
            :disabled="!isFormValid || !agreeTerms"
            size="large"
          >
            <v-icon start>mdi-account-plus</v-icon>
            {{ submitText }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- 服务条款对话框 -->
    <DuDialog
      v-model="showTermsDialog"
      title="服务条款"
      title-icon="mdi-file-document-outline"
      max-width="600px"
    >
      <div class="text-body-2">
        <slot name="terms">
          <p>欢迎使用我们的服务。在使用本服务前，请仔细阅读以下条款：</p>
          <ul class="mt-2">
            <li>您需要对自己的账号安全负责</li>
            <li>请不要与他人分享您的账号信息</li>
            <li>我们会保护您的隐私数据安全</li>
            <li>禁止使用本服务进行违法活动</li>
          </ul>
        </slot>
      </div>

      <template #actions>
        <v-btn @click="showTermsDialog = false">关闭</v-btn>
        <v-btn color="primary" @click="acceptTerms">同意</v-btn>
      </template>
    </DuDialog>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useFormRules } from '../../composables/useFormValidation';
import type { RegistrationData } from '../../types';
import DuTextField from '../form/DuTextField.vue';
import DuDialog from '../dialog/DuDialog.vue';

interface Props {
  loading?: boolean;
  error?: string;
  title?: string;
  showTitle?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  showPersonalInfo?: boolean;
  submitText?: string;
  initialData?: Partial<RegistrationData>;
}

interface Emits {
  (e: 'submit', data: RegistrationData): void;
  (e: 'reset'): void;
  (e: 'clear-error'): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  title: '注册新账号',
  showTitle: true,
  showEmail: true,
  showPhone: true,
  showPersonalInfo: true,
  submitText: '注册',
});

const emit = defineEmits<Emits>();

// 表单引用和数据
const formRef = ref<InstanceType<typeof HTMLFormElement>>();
const agreeTerms = ref(false);
const showTermsDialog = ref(false);

// 表单数据
const formData = reactive<RegistrationData>({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  phoneNumber: '',
  firstName: '',
  lastName: '',
  displayName: '',
  bio: '',
  ...props.initialData,
} as RegistrationData);

// 表单验证规则
const { usernameRules, passwordRules, emailRules, phoneRules } = useFormRules();

// 确认密码验证规则
const confirmPasswordRules = [
  (v: string) => !!v || '请确认密码',
  (v: string) => v === formData.password || '两次输入的密码不一致',
];

// 表单有效性
const isFormValid = computed(() => {
  return formRef.value?.isValid ?? false;
});

// 处理提交
const handleSubmit = () => {
  if (isFormValid.value && agreeTerms.value) {
    emit('submit', { ...formData });
  }
};

// 处理重置
const handleReset = () => {
  formRef.value?.reset();
  agreeTerms.value = false;
  emit('reset');
};

// 接受条款
const acceptTerms = () => {
  agreeTerms.value = true;
  showTermsDialog.value = false;
};
</script>

<style scoped>
.text-primary {
  text-decoration: none;
}

.text-primary:hover {
  text-decoration: underline;
}
</style>
