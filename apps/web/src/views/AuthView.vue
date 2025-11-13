<template>
  <div id="auth-view">
    <AnimatedTrain />
    <div class="form-container">
      <v-card class="mx-auto pa-4 auth-view-card">
        <v-tabs v-model="activeMode" align-tabs="center" color="primary">
          <v-tab value="login">
            <template #prepend>
              <v-icon>mdi-login</v-icon>
            </template>
            登录
          </v-tab>
          <v-tab value="register">
            <template #prepend>
              <v-icon>mdi-account-plus</v-icon>
            </template>
            注册
          </v-tab>
        </v-tabs>

        <v-window v-model="activeMode">
          <v-window-item value="login">
            <LoginWindow />
          </v-window-item>
          <v-window-item value="register">
            <RegistrationWindow />
          </v-window-item>
        </v-window>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

import AnimatedTrain from '@/shared/animation/AnimatedTrain.vue';
import LoginWindow from '@/modules/authentication/presentation/components/LoginWindow.vue';
import RegistrationWindow from '@/modules/account/presentation/components/RegistrationWindow.vue';

const activeMode = ref('login');

onMounted(() => {
  console.log('✅ [AuthView] 登录页面已渲染完成，用户可见');
  console.log('⏱️ [Performance] 页面加载耗时:', performance.now().toFixed(2), 'ms');
});
</script>

<style scoped>
#auth-view {
  -webkit-app-region: drag;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.form-container {
  width: 800px;
}

.auth-view-card {
  width: 100%;
  height: 100%;
  margin: auto;
  background: transparent;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(8px);
  -webkit-app-region: no-drag;
}

/* 小屏幕设备 (手机, 600px 及以下) */
@media screen and (max-width: 600px) {
  .auth-view-card {
    width: 95%;
    max-width: 100%;
  }
}

/* 中等屏幕设备 (平板电脑, 600px 到 960px) */
@media screen and (min-width: 600px) and (max-width: 960px) {
  .auth-view-card {
    width: 85%;
    max-width: 550px;
  }
}

/* 大屏幕设备 (桌面电脑, 960px 以上) */
@media screen and (min-width: 960px) {
  .auth-view-card {
    width: 80%;
    max-width: 600px;
  }
}

.v-card {
  margin-top: 2rem;
}

.v-window {
  min-height: 300px;
}
</style>
