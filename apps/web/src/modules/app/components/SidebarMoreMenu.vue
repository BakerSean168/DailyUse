<template>
  <div class="sidebar-more-wrapper">
    <v-menu v-model="showMenu" :close-on-content-click="false" offset-y location="top">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          class="sidebar-btn bottom-button"
          color="default"
          title="更多"
          variant="text"
        >
          <v-icon>mdi-dots-horizontal</v-icon>
        </v-btn>
      </template>
      <v-list class="sidebar-more-menu-list">
        <v-list-item @click="onLogout">
          <v-list-item-title>
            <v-icon start>mdi-logout</v-icon>
            退出
          </v-list-item-title>
        </v-list-item>
        <v-list-item @click="go('/settings')">
          <v-list-item-title>
            <v-icon start>mdi-cog</v-icon>
            设置
          </v-list-item-title>
        </v-list-item>
        <v-list-item @click="go('/about')">
          <v-list-item-title>
            <v-icon start>mdi-information</v-icon>
            关于
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// import { useLogout } from '@/modules/Authentication/presentation/composables/useLogout'

const showMenu = ref(false);
const router = useRouter();
// const { handleLogout } = useLogout()

const handleLogout = async () => {
  // await logout()
  console.log('用户已登出');
};

const go = (path: string) => {
  router.push(path);
  showMenu.value = false;
};
const onLogout = async () => {
  await handleLogout();
  showMenu.value = false;
};
</script>

<style scoped>
.sidebar-more-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
}
.sidebar-more-menu-list {
  min-width: 140px;
}
</style>
