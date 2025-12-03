<template>
  <v-overlay
    :model-value="state?.visible || false"
    :z-index="state?.zIndex || 9999"
    :opacity="state?.opacity || 0.8"
    persistent
    class="du-loading-overlay"
  >
    <div class="loading-content">
      <v-progress-circular :color="state?.color || 'primary'" :size="64" :width="6" indeterminate />
      <div class="loading-text mt-4">
        {{ state?.text || '加载中...' }}
      </div>
    </div>
  </v-overlay>
</template>

<script setup lang="ts">
import { useGlobalLoading } from '../../composables/useLoading';

const { state } = useGlobalLoading();
</script>

<style scoped>
.du-loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-text {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
}
</style>
