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
      <v-card class="beian-info">
        <a 
          href="https://beian.miit.gov.cn/" 
          target="_blank" 
          class="beian-link"
        >
          浙ICP备2025220345号
        </a>
      </v-card>
      <div >
        
        
        <a 
          href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010602000000" 
          target="_blank" 
          class="beian-link gongan-link"
        >
          <img 
            src="https://beian.mps.gov.cn/img/logo01.dd7ff50e.png" 
            class="gongan-icon" 
            alt="公安备案图标" 
          />
          <span>浙公网安备 33010602000000 号</span>
        </a>
      </div>
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
  padding: 20px 0;
  overflow-y: auto;
}

.form-container {
  width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
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

.beian-info {
  position: absolute;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 24px;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  width: 100%;
  -webkit-app-region: no-drag;

  background: transparent;
}

.beian-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--v-theme-on-surface);
}

.beian-link:hover {
}

.gongan-link {
  gap: 6px;
}

.gongan-icon {
  width: 18px;
  height: 18px;
  vertical-align: middle;
  flex-shrink: 0;
}

/* 小屏幕设备 - 备案信息垂直排列 */
@media screen and (max-width: 600px) {
  .beian-info {
    flex-direction: column;
    gap: 12px;
    font-size: 12px;
  }
  
  .beian-link {
    text-align: center;
  }
}

.v-window {
  min-height: 300px;
}
</style>
