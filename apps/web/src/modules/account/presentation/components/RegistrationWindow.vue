<template>
  <v-form ref="formRef" :loading="loading">
    <v-container>
      <v-row>
        <v-col cols="12" md="6" offset-md="3">
          <h2 class="text-center mb-4">注册新账号</h2>
        </v-col>
      </v-row>
      <v-row>
        <v-text-field
          v-model="form.username"
          label="账号名"
          :rules="usernameRules"
          :counter="20"
          prepend-inner-icon="mdi-account"
          clearable
          required
        />
      </v-row>
      <v-row>
        <v-text-field
          v-model="form.email"
          label="邮箱"
          type="email"
          :rules="emailRules"
          prepend-inner-icon="mdi-email"
          clearable
          required
        />
      </v-row>
      <v-row>
        <!-- 密码输入 -->
        <v-text-field
          v-model="form.password"
          label="密码"
          :type="showPassword ? 'text' : 'password'"
          :rules="passwordRules"
          :counter="20"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showPassword = !showPassword"
          clearable
          required
        >
          <!-- 密码强度指示器 -->
          <template v-slot:details>
            <div v-if="form.password" class="mt-2">
              <div class="text-caption mb-1">密码强度:</div>
              <v-progress-linear
                :model-value="passwordStrength.score * 25"
                :color="passwordStrength.color"
                height="4"
                rounded
              />
              <div class="text-caption mt-1" :class="`text-${passwordStrength.color}`">
                {{ passwordStrength.text }}
              </div>
            </div>
          </template>
        </v-text-field>
      </v-row>
      <v-row>
        <!-- 确认密码输入 -->
        <v-text-field
          v-model="form.confirmPassword"
          label="确认密码"
          :type="showConfirmPassword ? 'text' : 'password'"
          :rules="confirmPasswordRules"
          prepend-inner-icon="mdi-lock-check"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
          clearable
          required
        />
      </v-row>

      <v-row>
        <v-col>
          <v-checkbox
            v-model="agreeTerms"
            :rules="[(v) => !!v || '请同意服务条款']"
            color="primary"
            density="compact"
          >
            <template v-slot:label>
              <span
                >我已阅读并同意
                <a href="#" @click.prevent="showTerms = true" class="text-primary"> 服务条款 </a>
              </span>
            </template>
          </v-checkbox>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="text-center">
          <v-btn variant="outlined" @click="resetForm" :disabled="loading"> 重置 </v-btn>
        </v-col>
        <v-col class="text-center">
          <v-btn
            color="primary"
            @click="handleRegistration(form)"
            :loading="loading"
            :disabled="!!loading || !isCurrentFormValid"
            size="large"
          >
            <v-icon start>mdi-account-plus</v-icon>
            注册
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-form>

  <!-- 提示信息 -->
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    location="top"
    variant="tonal"
    elevation="4"
  >
    {{ snackbar.message }}
  </v-snackbar>

  <!-- 服务条款对话框 -->
  <v-dialog v-model="showTerms" max-width="600">
    <v-card>
      <v-card-title>服务条款</v-card-title>
      <v-card-text>
        <div class="text-body-2">
          <p>欢迎使用我们的服务。在使用本服务前，请仔细阅读以下条款：</p>
          <ul class="mt-2">
            <li>您需要对自己的账号安全负责</li>
            <li>请不要与他人分享您的账号信息</li>
            <li>我们会保护您的隐私数据安全</li>
            <li>禁止使用本服务进行违法活动</li>
          </ul>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showTerms = false">关闭</v-btn>
        <v-btn color="primary" @click="acceptTerms">同意</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type { AuthenticationContracts } from '@dailyuse/contracts';
// composables
import { useAuth } from '@/modules/authentication/presentation/composables/useAuth';
import { useSnackbar } from '@/shared/composables/useSnackbar';
// utils
import { passwordRules, usernameRules, emailRules } from '@/shared/utils/validations/rules';

const { register, login } = useAuth();
const { snackbar, showSuccess, showError } = useSnackbar();

// 定义 emit（用于切换到登录模式）
const emit = defineEmits<{
  'change-mode': [mode: string];
}>();

// 注册表单类型
interface RegistrationByUsernameAndPasswordForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
}

// 注册处理函数
const handleRegistration = async (formData: RegistrationByUsernameAndPasswordForm) => {
  if (!formData.agree) {
    showError('请先同意服务条款');
    return;
  }

  loading.value = true;
  try {
    const request: AuthenticationContracts.RegisterRequestDTO = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    // 注册成功（返回账户信息和提示消息）
    const response = await register(request);
    showSuccess(response.message || '注册成功！正在为您登录...');
    
    // 自动登录：使用刚注册的账号和密码登录
    setTimeout(async () => {
      try {
        await login({
          identifier: formData.username,
          password: formData.password,
          rememberMe: false,
        });
        showSuccess('登录成功！');
        // 登录成功后会自动跳转到主页（由 useAuth composable 处理）
      } catch (loginError: any) {
        showError('注册成功，但自动登录失败，请手动登录');
        // 跳转到登录表单
        emit('change-mode', 'login');
      }
    }, 1000);
    
    resetForm();
  } catch (error: any) {
    showError(error.message || '注册失败，请重试');
  } finally {
    loading.value = false;
  }
};
const valid = ref(false);
const loading = ref(false);
const agreeTerms = ref(false);
const showTerms = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive<RegistrationByUsernameAndPasswordForm>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agree: false,
});

const confirmPasswordRules = [
  (v: string) => !!v || '请确认密码',
  (v: string) => v === form.password || '两次输入的密码不一致',
];

const formRef = ref<InstanceType<typeof HTMLFormElement> | null>(null);

const isCurrentFormValid = computed(() => {
  return formRef.value?.isValid ?? false;
});

const passwordStrength = computed(() => {
  const password = form.password;
  if (!password) return { score: 0, text: '', color: 'grey' };

  let score = 0;
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
    password.length >= 12,
  ];

  score = checks.filter(Boolean).length;

  if (score <= 2) return { score: 1, text: '弱', color: 'error' };
  if (score <= 4) return { score: 2, text: '中等', color: 'warning' };
  if (score <= 5) return { score: 3, text: '强', color: 'success' };
  return { score: 4, text: '很强', color: 'success' };
});

const resetForm = () => {
  formRef.value?.reset();
  form.agree = false;
};

const acceptTerms = () => {
  form.agree = true;
  showTerms.value = false;
};
</script>

<style lang="css" scoped></style>
