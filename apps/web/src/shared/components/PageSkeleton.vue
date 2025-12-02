<!--
  PageSkeleton - 全局页面级骨架屏
  用于路由切换时显示加载状态，提升用户感知体验
  
  使用场景：
  - 路由切换时的 Suspense fallback
  - 页面级异步组件加载
-->
<template>
  <div class="page-skeleton">
    <!-- 顶部导航栏骨架 -->
    <div class="skeleton-header">
      <div class="skeleton-header-left">
        <div class="skeleton-icon"></div>
        <div class="skeleton-title"></div>
      </div>
      <div class="skeleton-header-right">
        <div class="skeleton-btn"></div>
        <div class="skeleton-btn"></div>
      </div>
    </div>

    <!-- 主内容区骨架 -->
    <div class="skeleton-content">
      <!-- 模拟卡片网格布局 -->
      <div class="skeleton-grid">
        <div 
          v-for="i in skeletonCount" 
          :key="i" 
          class="skeleton-card"
          :class="getCardClass(i)"
        >
          <div class="skeleton-card-header">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-text-group">
              <div class="skeleton-text skeleton-text-title"></div>
              <div class="skeleton-text skeleton-text-subtitle"></div>
            </div>
          </div>
          <div class="skeleton-card-body">
            <div class="skeleton-text skeleton-text-line"></div>
            <div class="skeleton-text skeleton-text-line short"></div>
            <div class="skeleton-text skeleton-text-line medium"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载提示 -->
    <div class="skeleton-loading-hint">
      <v-progress-circular 
        indeterminate 
        size="24" 
        width="2"
        color="primary"
      />
      <span class="skeleton-hint-text">正在加载页面...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// 根据视口大小调整骨架卡片数量
const skeletonCount = computed(() => {
  if (typeof window === 'undefined') return 6;
  const width = window.innerWidth;
  if (width < 768) return 2;
  if (width < 1024) return 4;
  return 6;
});

// 为卡片添加不同的动画延迟，创造波浪效果
const getCardClass = (index: number) => {
  return `delay-${(index - 1) % 4}`;
};
</script>

<style scoped>
.page-skeleton {
  min-height: 100vh;
  padding: 24px;
  background: rgb(var(--v-theme-background));
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 顶部导航骨架 */
.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.skeleton-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skeleton-header-right {
  display: flex;
  gap: 8px;
}

.skeleton-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-on-surface), 0.06) 25%,
    rgba(var(--v-theme-on-surface), 0.12) 50%,
    rgba(var(--v-theme-on-surface), 0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-title {
  width: 120px;
  height: 28px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-on-surface), 0.06) 25%,
    rgba(var(--v-theme-on-surface), 0.12) 50%,
    rgba(var(--v-theme-on-surface), 0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-btn {
  width: 80px;
  height: 36px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-on-surface), 0.06) 25%,
    rgba(var(--v-theme-on-surface), 0.12) 50%,
    rgba(var(--v-theme-on-surface), 0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* 内容区骨架 */
.skeleton-content {
  max-width: 1400px;
  margin: 0 auto;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.skeleton-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.skeleton-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-on-surface), 0.06) 25%,
    rgba(var(--v-theme-on-surface), 0.12) 50%,
    rgba(var(--v-theme-on-surface), 0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-text-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-text {
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-on-surface), 0.06) 25%,
    rgba(var(--v-theme-on-surface), 0.12) 50%,
    rgba(var(--v-theme-on-surface), 0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-text-title {
  width: 70%;
  height: 16px;
}

.skeleton-text-subtitle {
  width: 50%;
  height: 12px;
}

.skeleton-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-text-line {
  height: 12px;
  width: 100%;
}

.skeleton-text-line.short {
  width: 60%;
}

.skeleton-text-line.medium {
  width: 80%;
}

/* 波浪动画延迟 */
.delay-0 .skeleton-avatar,
.delay-0 .skeleton-text,
.delay-0 .skeleton-icon,
.delay-0 .skeleton-title,
.delay-0 .skeleton-btn {
  animation-delay: 0s;
}

.delay-1 .skeleton-avatar,
.delay-1 .skeleton-text,
.delay-1 .skeleton-icon,
.delay-1 .skeleton-title,
.delay-1 .skeleton-btn {
  animation-delay: 0.1s;
}

.delay-2 .skeleton-avatar,
.delay-2 .skeleton-text,
.delay-2 .skeleton-icon,
.delay-2 .skeleton-title,
.delay-2 .skeleton-btn {
  animation-delay: 0.2s;
}

.delay-3 .skeleton-avatar,
.delay-3 .skeleton-text,
.delay-3 .skeleton-icon,
.delay-3 .skeleton-title,
.delay-3 .skeleton-btn {
  animation-delay: 0.3s;
}

/* 微光动画 */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 加载提示 */
.skeleton-loading-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 40px;
  padding: 16px;
}

.skeleton-hint-text {
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-skeleton {
    padding: 16px;
  }

  .skeleton-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .skeleton-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .skeleton-header-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
