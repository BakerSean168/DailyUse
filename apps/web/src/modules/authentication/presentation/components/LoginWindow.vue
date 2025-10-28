<template>
  <v-form @submit.prevent="onFormSubmit" :loading="loading" ref="formRef">
    <v-card class="pa-4" style="background: transparent">
      <!-- <v-card-title class="text-center">登录</v-card-title> -->

      <v-card-text>
        <!-- 用户名下拉选择框 -->
        <v-combobox
          v-model="passwordAuthenticationForm.identifier"
          :items="rememberedUsernames"
          :loading="loading"
          label="用户名"
          :rules="usernameRules"
          @update:model-value="handleAccountSelect"
          prepend-inner-icon="mdi-account"
          density="comfortable"
          clearable
          required
        >
          <!-- 自定义下拉选项 -->
          <template v-slot:item="{ item, props }">
            <v-list-item v-bind="props" :title="item.raw">
              <template v-slot:prepend>
                <v-icon size="small" color="primary"> mdi-account </v-icon>
              </template>
              <template v-slot:append>
                <v-tooltip text="删除此账号记录" location="top">
                  <template v-slot:activator="{ props: tooltipProps }">
                    <v-icon
                      v-bind="tooltipProps"
                      color="error"
                      size="small"
                      @click.stop="handleRemoveAccount(item.raw)"
                      class="ml-2"
                    >
                      mdi-close
                    </v-icon>
                  </template>
                </v-tooltip>
              </template>
            </v-list-item>
          </template>

          <!-- 无数据时的提示 -->
          <template v-slot:no-data>
            <v-list-item>
              <v-list-item-title class="text-grey"> 暂无保存的账号 </v-list-item-title>
            </v-list-item>
          </template>
        </v-combobox>

        <!-- 密码输入框 -->
        <v-text-field
          v-model="passwordAuthenticationForm.password"
          label="密码"
          :rules="passwordRules"
          prepend-inner-icon="mdi-lock"
          clearable
          :counter="20"
          density="comfortable"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showPassword = !showPassword"
          :type="showPassword ? 'text' : 'password'"
          required
        />

        <!-- 记住密码选项 -->
        <v-checkbox
          v-model="passwordAuthenticationForm.rememberMe"
          label="记住密码"
          color="primary"
          density="comfortable"
        />
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-btn
          color="primary"
          type="submit"
          variant="elevated"
          :loading="loading"
          :disabled="!!loading || !isCurrentFormValid"
          block
          size="large"
        >
          登录
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>

  <!-- 错误提示 Snackbar -->
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="5000"
    location="top"
    variant="tonal"
    elevation="4"
  >
    {{ snackbar.message }}
    <template v-slot:actions>
      <v-btn variant="text" @click="snackbar.show = false"> 关闭 </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
// types
import type { AuthenticationContracts } from '@dailyuse/contracts';
// components
import { useAuthentication } from '../composables/useAuthentication';
// utils
import { usernameRules, passwordRules } from '@/shared/utils/validations/rules';

const { login: handleLogin, isLoading: authLoading } = useAuthentication();
const loading = computed(() => authLoading.value);
const formRef = ref();
const isCurrentFormValid = computed(() => {
  return formRef.value?.isValid ?? false;
});

// Snackbar 状态
const snackbar = ref({
  show: false,
  message: '',
  color: 'error',
});

const passwordAuthenticationForm = ref<AuthenticationContracts.LoginRequestDTO>({
  identifier: 'Test1',
  password: 'Llh123123!',
  rememberMe: false,
});

// 处理表单提交
const onFormSubmit = async (event: Event) => {
  console.log('event', event);
  event.preventDefault();

  // 验证表单
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }

  try {
    await handleLogin(passwordAuthenticationForm.value);
  } catch (error: any) {
    console.error('Login failed:', error);

    // 显示具体的错误消息（使用 Snackbar）
    snackbar.value = {
      show: true,
      message: error?.message || '登录失败，请重试',
      color: 'error',
    };
  }
};

const showPassword = ref(false);

const handleAccountSelect = (selectedUsername: string | null): void => {
  console.log('Selected username:', selectedUsername);
  console.log('Form valid:', formRef.value?.isValid);
  if (selectedUsername) {
    passwordAuthenticationForm.value.identifier = selectedUsername;
    // const savedPassword = getSavedPasswordForUser(selectedUsername);
    // if (savedPassword) {
    //   passwordAuthenticationForm.password = savedPassword;
    // }
  }
};

const handleRemoveAccount = (username: string): void => {
  // 删除用户信息
  console.log(`Removing account: ${username}`);
};

const rememberedUsernames = ref([]);
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
