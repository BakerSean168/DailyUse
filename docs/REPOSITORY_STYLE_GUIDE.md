# Repository 模块 - Obsidian 风格样式指南

**作者**: Sally (UX Designer)  
**日期**: 2025-11-11  
**状态**: 样式指南

---

## 🎨 设计原则

### Obsidian 核心视觉特征

1. **极简主义** - 少即是多，去除多余装饰
2. **高对比度** - 清晰的内容层级
3. **一致性** - 统一的间距、圆角、阴影
4. **微交互** - 细腻的悬停、选中效果
5. **暗色优先** - 护眼的配色方案

---

## 🎯 核心样式规范

### 1. 颜色系统

```scss
// 基础色板
$surface: rgb(var(--v-theme-surface));              // 主背景
$surface-variant: rgb(var(--v-theme-surface-variant)); // 次级背景（tab区域）
$surface-bright: rgb(var(--v-theme-surface-bright)); // 悬停高亮

$on-surface: rgba(var(--v-theme-on-surface), 0.87);  // 主文本
$on-surface-variant: rgba(var(--v-theme-on-surface), 0.60); // 次级文本
$on-surface-disabled: rgba(var(--v-theme-on-surface), 0.38); // 禁用文本

$primary: rgb(var(--v-theme-primary));              // 强调色
$accent: rgb(var(--v-theme-accent));                // 重点元素（md文件）
$error: rgb(var(--v-theme-error));                  // 错误提示

// 边框
$border-color: rgba(var(--v-border-color), var(--v-border-opacity));

// 透明度层级
$opacity-hover: 0.05;      // 悬停背景
$opacity-selected: 0.12;   // 选中背景
$opacity-pressed: 0.16;    // 按下背景
```

### 2. 间距系统

```scss
// 基础间距单位：4px
$spacing-xs: 4px;    // 超小
$spacing-sm: 8px;    // 小
$spacing-md: 12px;   // 中
$spacing-lg: 16px;   // 大
$spacing-xl: 24px;   // 超大
$spacing-xxl: 32px;  // 极大

// 组件内边距
$padding-compact: 4px 8px;    // 紧凑
$padding-normal: 8px 12px;    // 正常
$padding-comfortable: 12px 16px; // 舒适
```

### 3. 圆角规范

```scss
$radius-sm: 4px;   // 小元素（chip, badge）
$radius-md: 6px;   // 中等元素（button, input）
$radius-lg: 8px;   // 大元素（card, dialog）
$radius-xl: 12px;  // 超大元素（面板）
```

### 4. 阴影系统

```scss
// 悬浮阴影
$shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
$shadow-md: 0 2px 8px rgba(0, 0, 0, 0.15);
$shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.18);

// 内阴影（输入框）
$shadow-inset: inset 0 1px 2px rgba(0, 0, 0, 0.1);
```

### 5. 动画时长

```scss
$transition-fast: 150ms ease-in-out;      // 快速响应（hover）
$transition-normal: 250ms ease-in-out;    // 正常（展开/折叠）
$transition-slow: 350ms ease-in-out;      // 慢速（页面切换）

// 缓动函数
$easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
$easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

---

## 📐 组件样式规范

### 1. 侧边栏（Sidebar）

```scss
.sidebar {
  width: 300px;
  background: $surface;
  border-right: 1px solid $border-color;
  display: flex;
  flex-direction: column;
  
  // 标签栏
  .sidebar-tabs {
    padding: $spacing-sm;
    background: $surface-variant;
    border-bottom: 1px solid $border-color;
    
    .v-btn {
      min-width: 0;
      padding: 6px;
      border-radius: $radius-md;
      transition: background-color $transition-fast;
      
      &:hover {
        background-color: rgba(var(--v-theme-on-surface), $opacity-hover);
      }
      
      &.v-btn--active {
        background-color: rgba(var(--v-theme-primary), $opacity-selected);
        color: $primary;
      }
    }
  }
  
  // 内容区
  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    
    // 自定义滚动条
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(var(--v-theme-on-surface), 0.2);
      border-radius: 4px;
      
      &:hover {
        background: rgba(var(--v-theme-on-surface), 0.3);
      }
    }
  }
  
  // 底部选择器
  .repository-selector {
    padding: $spacing-sm;
    border-top: 1px solid $border-color;
    background: $surface;
    
    .repository-selector-btn {
      text-transform: none;
      font-weight: 500;
      justify-content: flex-start;
      padding: $spacing-sm $spacing-md;
      border-radius: $radius-md;
      
      &:hover {
        background-color: rgba(var(--v-theme-on-surface), $opacity-hover);
      }
    }
  }
}
```

### 2. 文件树节点（TreeNode）

```scss
.tree-node-item {
  user-select: none;
  
  .node-content {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: $radius-sm;
    transition: all $transition-fast;
    
    // 悬停效果
    &:hover {
      background-color: rgba(var(--v-theme-on-surface), $opacity-hover);
      
      .node-actions {
        opacity: 1;
      }
    }
    
    // 选中效果
    &.is-selected {
      background-color: rgba(var(--v-theme-primary), $opacity-selected);
      
      .node-name {
        color: $primary;
        font-weight: 500;
      }
    }
    
    // 活动状态（正在编辑）
    &.is-active {
      border-left: 2px solid $primary;
      padding-left: 6px;
    }
  }
  
  // 展开图标
  .expand-icon {
    flex-shrink: 0;
    cursor: pointer;
    transition: transform $transition-fast;
    
    &.expanded {
      transform: rotate(90deg);
    }
  }
  
  // 文件/文件夹图标
  .node-icon {
    flex-shrink: 0;
    
    &.icon-folder {
      color: $primary;
    }
    
    &.icon-file-md {
      color: $accent;
    }
  }
  
  // 名称
  .node-name {
    flex: 1;
    font-size: 14px;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: $on-surface;
  }
  
  // 操作按钮
  .node-actions {
    opacity: 0;
    transition: opacity $transition-fast;
    display: flex;
    gap: 2px;
  }
}
```

### 3. 搜索面板（SearchPanel）

```scss
.search-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: $spacing-md;
  
  // 搜索输入
  .search-input-wrapper {
    margin-bottom: $spacing-md;
    
    .v-text-field {
      --v-field-padding-start: 12px;
      --v-field-padding-end: 12px;
      
      :deep(.v-field__outline) {
        border-radius: $radius-md;
      }
      
      :deep(.v-field--focused .v-field__outline) {
        border-color: $primary;
        box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.1);
      }
    }
  }
  
  // 搜索结果
  .search-results {
    flex: 1;
    overflow-y: auto;
    
    .result-group {
      margin-bottom: $spacing-sm;
      
      .file-header {
        background-color: rgba(var(--v-theme-surface-variant), 0.5);
        cursor: pointer;
        padding: 6px 12px;
        border-radius: $radius-sm;
        transition: background-color $transition-fast;
        
        &:hover {
          background-color: rgba(var(--v-theme-surface-variant), 0.8);
        }
      }
      
      .match-item {
        padding: 6px 12px 6px 24px;
        cursor: pointer;
        border-left: 2px solid transparent;
        transition: all $transition-fast;
        
        &:hover {
          background-color: rgba(var(--v-theme-on-surface), $opacity-hover);
          border-left-color: $primary;
        }
        
        .match-line {
          font-size: 13px;
          line-height: 1.6;
          color: $on-surface;
          
          mark {
            background-color: rgba(var(--v-theme-warning), 0.3);
            padding: 1px 2px;
            border-radius: 2px;
            font-weight: 500;
          }
        }
        
        .match-meta {
          font-size: 11px;
          color: $on-surface-variant;
          margin-top: 2px;
        }
      }
    }
  }
}
```

### 4. 编辑器面板（Editor Panel）

```scss
.resource-editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $surface;
  
  // Tab管理器
  .tab-manager {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 8px;
    background: $surface-variant;
    border-bottom: 1px solid $border-color;
    overflow-x: auto;
    
    .tab-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: $radius-md;
      cursor: pointer;
      transition: all $transition-fast;
      white-space: nowrap;
      
      &:hover {
        background-color: rgba(var(--v-theme-on-surface), $opacity-hover);
      }
      
      &.active {
        background-color: $surface;
        box-shadow: $shadow-sm;
      }
      
      .tab-icon {
        font-size: 16px;
      }
      
      .tab-name {
        font-size: 13px;
        font-weight: 500;
      }
      
      .tab-close {
        opacity: 0;
        transition: opacity $transition-fast;
      }
      
      &:hover .tab-close {
        opacity: 1;
      }
    }
  }
  
  // 编辑器内容
  .editor-content {
    flex: 1;
    overflow: hidden;
    
    .markdown-editor {
      height: 100%;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 14px;
      line-height: 1.6;
      padding: $spacing-lg;
    }
  }
}
```

### 5. 空状态（Empty State）

```scss
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xxl;
  height: 100%;
  
  .empty-icon {
    font-size: 64px;
    color: rgba(var(--v-theme-on-surface), 0.3);
    margin-bottom: $spacing-lg;
  }
  
  .empty-title {
    font-size: 18px;
    font-weight: 500;
    color: $on-surface-variant;
    margin-bottom: $spacing-sm;
  }
  
  .empty-description {
    font-size: 14px;
    color: $on-surface-disabled;
    text-align: center;
    max-width: 300px;
  }
}
```

---

## 🎭 微交互设计

### 1. 悬停效果

```scss
// 统一的悬停样式
.hoverable {
  transition: all $transition-fast;
  
  &:hover {
    background-color: rgba(var(--v-theme-on-surface), $opacity-hover);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    background-color: rgba(var(--v-theme-on-surface), $opacity-pressed);
  }
}
```

### 2. 加载状态

```scss
.loading-skeleton {
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-on-surface), 0.05) 25%,
    rgba(var(--v-theme-on-surface), 0.1) 50%,
    rgba(var(--v-theme-on-surface), 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: $radius-sm;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

### 3. 展开/折叠动画

```scss
.expand-transition {
  overflow: hidden;
  transition: max-height $transition-normal;
  
  &.collapsed {
    max-height: 0;
  }
  
  &.expanded {
    max-height: 1000px; // 根据内容调整
  }
}
```

---

## 📱 响应式设计

```scss
// 断点定义
$breakpoint-mobile: 768px;
$breakpoint-tablet: 1024px;
$breakpoint-desktop: 1440px;

// 移动端适配
@media (max-width: $breakpoint-mobile) {
  .repository-view {
    grid-template-columns: 1fr; // 单列布局
    
    .sidebar {
      position: fixed;
      left: -300px;
      z-index: 100;
      transition: left $transition-normal;
      
      &.open {
        left: 0;
      }
    }
  }
}

// 平板适配
@media (max-width: $breakpoint-tablet) {
  .sidebar {
    width: 250px; // 减小侧边栏宽度
  }
}
```

---

## 🌙 暗色主题优化

```scss
// 暗色主题特定样式
@media (prefers-color-scheme: dark) {
  .repository-view {
    // 增强对比度
    --v-theme-surface: #1e1e1e;
    --v-theme-surface-variant: #2a2a2a;
    --v-theme-surface-bright: #3a3a3a;
    
    // 减少阴影强度
    .v-card {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    // 优化滚动条
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}
```

---

## ✅ 样式检查清单

### 通用
- [ ] 所有间距使用统一的spacing变量
- [ ] 所有圆角使用统一的radius变量
- [ ] 所有动画使用统一的transition变量
- [ ] 所有颜色使用主题变量

### 交互
- [ ] 所有可点击元素有悬停效果
- [ ] 所有按钮有按下效果
- [ ] 所有输入框有聚焦效果
- [ ] 所有列表项有选中效果

### 响应式
- [ ] 移动端布局正常
- [ ] 触摸目标至少44x44px
- [ ] 文字大小在移动端可读

### 无障碍
- [ ] 对比度符合WCAG AA标准
- [ ] 交互元素有清晰的焦点指示
- [ ] 图标有文字提示

---

**文档结束**
