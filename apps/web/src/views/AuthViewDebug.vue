<template>
  <div
    class="auth-debug"
    style="padding: 20px; min-height: 100vh; background: linear-gradient(45deg, #1e3c72, #2a5298)"
  >
    <div style="color: white; text-align: center; padding-top: 100px">
      <h1>认证页面调试版本</h1>
      <p>如果你看到这个页面，说明路由导航正常工作</p>
      <p>当前路由: {{ $route.path }}</p>
      <p>当前时间: {{ new Date().toLocaleString() }}</p>

      <div style="margin-top: 30px">
        <button
          @click="testAuth"
          style="
            padding: 10px 20px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 4px;
          "
        >
          测试认证状态
        </button>
      </div>

      <div
        v-if="authStatus"
        style="
          margin-top: 20px;
          background: rgba(255, 255, 255, 0.1);
          padding: 15px;
          border-radius: 8px;
          text-align: left;
        "
      >
        <pre>{{ JSON.stringify(authStatus, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/modules/authentication/presentation/stores/authenticationStore';
import { AuthManager } from '@/shared/api';

const authStatus = ref<any>(null);

const testAuth = () => {
  try {
    const authStore = useAuthStore();
    authStatus.value = {
      isAuthenticated: AuthManager.isAuthenticated(),
      hasAccessToken: !!AuthManager.getAccessToken(),
      isTokenExpired: AuthManager.isTokenExpired(),
      needsRefresh: AuthManager.needsRefresh(),
      user: authStore.getCurrentUser,
      error: authStore.error,
      loading: authStore.isLoading,
    };
  } catch (error: any) {
    authStatus.value = {
      error: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
    };
  }
};
</script>
