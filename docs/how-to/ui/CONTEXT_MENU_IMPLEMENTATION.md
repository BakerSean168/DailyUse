---
tags:
  - ui
  - context-menu
  - component
description: 通用右键菜单组件DuContextMenu的实现报告
created: 2025-11-23T14:54:12
updated: 2025-11-23T14:54:12
---

# 通用右键菜单组件实现报告

## 📋 概述

实现了一个高度复用的右键菜单组件 `DuContextMenu`，用于替代项目中多处重复实现的右键菜单逻辑。

## 🎯 设计目标

### 1. **高度复用**
- 支持文件树、目标分类、提醒模块等多种场景
- 统一的 API 设计，降低学习成本
- 易于扩展和维护

### 2. **功能完整**
- ✅ 分隔线（divider）
- ✅ 图标支持（icon + iconColor + iconSize）
- ✅ 快捷键提示（shortcut）
- ✅ 禁用状态（disabled）
- ✅ 危险操作标识（danger - 红色高亮）
- ✅ 后置图标（suffix - 如子菜单箭头）
- ✅ 自定义类名（className）

### 3. **交互友好**
- ✅ 自动定位（防止超出视口）
- ✅ 键盘导航（↑↓ 导航，Enter 选择，Esc 关闭）
- ✅ 点击外部关闭
- ✅ 过渡动画
- ✅ 悬停高亮

### 4. **类型安全**
- ✅ TypeScript 完整支持
- ✅ 导出接口类型供外部使用

## 📂 文件结构

```
apps/web/src/shared/components/context-menu/
├── DuContextMenu.vue          # 右键菜单组件
└── index.ts                   # 导出文件
```

## 🔧 核心接口

### ContextMenuItem

```typescript
interface ContextMenuItem {
  /** 菜单项标题 */
  title?: string;
  
  /** 前置图标 */
  icon?: string;
  
  /** 图标大小 */
  iconSize?: number;
  
  /** 图标颜色 */
  iconColor?: string;
  
  /** 点击回调 */
  action?: () => void | Promise<void>;
  
  /** 是否为危险操作（红色显示） */
  danger?: boolean;
  
  /** 是否禁用 */
  disabled?: boolean;
  
  /** 是否为分隔线 */
  divider?: boolean;
  
  /** 快捷键提示 */
  shortcut?: string;
  
  /** 后置图标 */
  suffix?: string;
  
  /** 自定义类名 */
  className?: string;
}
```

### Props

```typescript
interface Props {
  /** 是否显示 */
  show: boolean;
  
  /** X 坐标 */
  x: number;
  
  /** Y 坐标 */
  y: number;
  
  /** 菜单项列表 */
  items: ContextMenuItem[];
  
  /** 菜单最小宽度（默认 180px） */
  minWidth?: number;
}
```

### Emits

```typescript
interface Emits {
  /** 显示状态变化 */
  (e: 'update:show', value: boolean): void;
  
  /** 菜单项点击 */
  (e: 'item-click', item: ContextMenuItem, index: number): void;
  
  /** 菜单关闭 */
  (e: 'close'): void;
}
```

## 📖 使用示例

### 1. 基础用法

```vue
<template>
  <div @contextmenu.prevent="handleContextMenu">
    右键点击这里
  </div>
  
  <DuContextMenu
    v-model:show="menu.show"
    :x="menu.x"
    :y="menu.y"
    :items="menu.items"
  />
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { DuContextMenu, type ContextMenuItem } from '@/shared/components/context-menu';

const menu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
});

const handleContextMenu = (event: MouseEvent) => {
  menu.x = event.clientX;
  menu.y = event.clientY;
  menu.items = [
    {
      title: '新建',
      icon: 'mdi-plus',
      iconColor: 'primary',
      action: () => console.log('新建'),
    },
    { divider: true },
    {
      title: '删除',
      icon: 'mdi-delete',
      danger: true,
      action: () => console.log('删除'),
    },
  ];
  menu.show = true;
};
</script>
```

### 2. 文件树场景

```vue
<template>
  <div
    v-for="node in treeNodes"
    :key="node.uuid"
    @contextmenu.prevent="handleNodeContextMenu($event, node)"
  >
    {{ node.name }}
  </div>
  
  <DuContextMenu
    v-model:show="contextMenu.show"
    :x="contextMenu.x"
    :y="contextMenu.y"
    :items="contextMenu.items"
  />
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { DuContextMenu, type ContextMenuItem } from '@/shared/components/context-menu';

const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
  currentNode: null as any,
});

const handleNodeContextMenu = (event: MouseEvent, node: any) => {
  contextMenu.currentNode = node;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;

  if (node.type === 'folder') {
    contextMenu.items = [
      {
        title: '打开',
        icon: 'mdi-folder-open',
        iconColor: 'primary',
        action: () => openFolder(node),
      },
      { divider: true },
      {
        title: '新建子文件夹',
        icon: 'mdi-folder-plus',
        action: () => createSubFolder(node),
      },
      {
        title: '新建文件',
        icon: 'mdi-file-plus',
        action: () => createFile(node),
      },
      { divider: true },
      {
        title: '重命名',
        icon: 'mdi-pencil',
        shortcut: 'F2',
        action: () => renameNode(node),
      },
      {
        title: '删除',
        icon: 'mdi-delete',
        danger: true,
        shortcut: 'Del',
        action: () => deleteNode(node),
      },
    ];
  } else {
    contextMenu.items = [
      {
        title: '打开',
        icon: 'mdi-open-in-new',
        action: () => openFile(node),
      },
      { divider: true },
      {
        title: '重命名',
        icon: 'mdi-pencil',
        action: () => renameNode(node),
      },
      {
        title: '删除',
        icon: 'mdi-delete',
        danger: true,
        action: () => deleteNode(node),
      },
    ];
  }

  contextMenu.show = true;
};
</script>
```

### 3. 目标分类场景（已实现）

```vue
<!-- GoalFolder.vue -->
<template>
  <v-list-item
    v-for="folder in goalFolders"
    :key="folder.uuid"
    @contextmenu.prevent="handleFolderContextMenu($event, folder)"
  >
    {{ folder.name }}
  </v-list-item>
  
  <DuContextMenu
    v-model:show="contextMenu.show"
    :x="contextMenu.x"
    :y="contextMenu.y"
    :items="contextMenu.items"
  />
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { DuContextMenu, type ContextMenuItem } from '@/shared/components/context-menu';

const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
  currentFolder: null as any,
});

const handleFolderContextMenu = (event: MouseEvent, folder: any) => {
  contextMenu.currentFolder = folder;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;

  if (folder.isSystemFolder) {
    // 系统文件夹：只读
    contextMenu.items = [
      {
        title: '查看详情',
        icon: 'mdi-information-outline',
        iconColor: 'primary',
        action: () => viewFolder(folder),
      },
      { divider: true },
      {
        title: '系统文件夹',
        icon: 'mdi-lock-outline',
        disabled: true,
      },
    ];
  } else {
    // 用户文件夹：完整功能
    contextMenu.items = [
      {
        title: '打开',
        icon: 'mdi-folder-open',
        iconColor: 'primary',
        action: () => openFolder(folder),
      },
      { divider: true },
      {
        title: '重命名',
        icon: 'mdi-pencil',
        action: () => renameFolder(folder),
      },
      {
        title: '新建子分类',
        icon: 'mdi-folder-plus',
        iconColor: 'success',
        action: () => createSubFolder(folder),
      },
      { divider: true },
      {
        title: '删除分类',
        icon: 'mdi-delete',
        iconColor: 'error',
        danger: true,
        action: () => deleteFolder(folder),
      },
    ];
  }

  contextMenu.show = true;
};
</script>
```

## 🎨 样式特性

### 1. 自动定位
- 防止超出视口右边界
- 防止超出视口下边界
- 留有 10px 安全边距

### 2. 视觉反馈
- 悬停高亮：`rgba(var(--v-theme-primary), 0.08)`
- 键盘导航高亮：`rgba(var(--v-theme-primary), 0.12)`
- 危险操作：红色文本 + 红色悬停背景

### 3. 过渡动画
- 淡入淡出 + 缩放效果
- 持续时间：150ms
- 起始缩放：0.95

### 4. 响应式设计
- 最小宽度：180px（可配置）
- 自适应内容高度
- 支持滚动（内容过多时）

## ⌨️ 键盘交互

| 按键 | 功能 |
|------|------|
| ↑ | 向上导航（跳过分隔线和禁用项） |
| ↓ | 向下导航（跳过分隔线和禁用项） |
| Enter | 选中当前项 |
| Esc | 关闭菜单 |

## 🔄 已应用场景

### 1. Goal 模块 - 目标分类
**文件**: `apps/web/src/modules/goal/presentation/components/GoalFolder.vue`

**功能**:
- 打开分类
- 重命名分类
- 新建子分类
- 删除分类
- 系统分类只读保护

### 2. Goal 模块 - 统计修复
**文件**: `apps/web/src/modules/goal/presentation/views/GoalListView.vue`

**修复**:
- ✅ 统计数据现在基于选中的分类过滤
- ✅ 状态标签的徽章显示正确的数量
- ✅ 支持删除分类的操作

## 📊 对比其他实现

### 原有实现（多处重复）

```vue
<!-- Reminder 模块 -->
<div v-if="contextMenu.show" class="context-menu-overlay">
  <div class="context-menu" :style="{ left: x + 'px', top: y + 'px' }">
    <div v-for="item in items" :key="item.label" class="context-menu-item">
      <v-icon>{{ item.icon }}</v-icon>
      {{ item.label }}
    </div>
  </div>
</div>

<!-- Repository 模块 -->
<v-menu v-model="show" :position-x="x" :position-y="y">
  <v-list>
    <v-list-item v-for="item in items" :key="item.title">
      <v-icon>{{ item.icon }}</v-icon>
      {{ item.title }}
    </v-list-item>
  </v-list>
</v-menu>

<!-- Desktop Editor 模块 -->
<ContextMenu :show="show" :x="x" :y="y" :items="items" />
```

**问题**:
- ❌ 样式不统一
- ❌ 功能不完整（有的没有键盘导航、有的没有危险项标识）
- ❌ 代码重复
- ❌ 维护困难

### 新实现（统一组件）

```vue
<DuContextMenu
  v-model:show="menu.show"
  :x="menu.x"
  :y="menu.y"
  :items="menu.items"
/>
```

**优势**:
- ✅ 统一的 API
- ✅ 完整的功能
- ✅ 类型安全
- ✅ 易于维护

## 🚀 后续优化建议

### 1. 待迁移的模块

- [ ] **Repository 模块** - 文件树右键菜单
- [ ] **Reminder 模块** - 提醒模板/分组右键菜单
- [ ] **Desktop Editor 模块** - 编辑器文件树

### 2. 功能扩展

- [ ] **子菜单支持** - 嵌套菜单
- [ ] **复选框/单选框** - 状态切换
- [ ] **搜索过滤** - 菜单项过多时
- [ ] **主题定制** - 支持暗色模式

### 3. 性能优化

- [ ] **虚拟滚动** - 菜单项极多时
- [ ] **懒加载** - 动态生成菜单项
- [ ] **缓存机制** - 避免重复计算

## 📝 最佳实践

### 1. 菜单项设计

```typescript
// ✅ 好的设计
const items: ContextMenuItem[] = [
  // 主要操作
  { title: '打开', icon: 'mdi-open-in-new', iconColor: 'primary' },
  
  { divider: true }, // 分组
  
  // 次要操作
  { title: '重命名', icon: 'mdi-pencil' },
  { title: '复制', icon: 'mdi-content-copy' },
  
  { divider: true },
  
  // 危险操作（放最后）
  { title: '删除', icon: 'mdi-delete', danger: true },
];

// ❌ 不好的设计
const items: ContextMenuItem[] = [
  { title: '删除' }, // 危险操作放前面
  { title: '打开' },
  { title: '重命名' },
  // 没有分组，没有图标
];
```

### 2. 状态管理

```typescript
// ✅ 使用 reactive 统一管理
const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
  currentNode: null as any, // 保存上下文数据
});

// ❌ 分散的 ref
const show = ref(false);
const x = ref(0);
const y = ref(0);
const items = ref([]);
```

### 3. 事件处理

```typescript
// ✅ 使用 action 回调
const items: ContextMenuItem[] = [
  {
    title: '删除',
    icon: 'mdi-delete',
    action: async () => {
      await deleteItem();
      // 操作完成后菜单自动关闭
    },
  },
];

// ❌ 监听 item-click 事件
<DuContextMenu @item-click="handleClick" />

const handleClick = (item: ContextMenuItem) => {
  // 需要手动判断是哪个菜单项
  if (item.title === '删除') {
    deleteItem();
  }
};
```

## 🎯 总结

通过实现 `DuContextMenu` 组件，我们：

1. **统一了右键菜单的实现方式**，消除了代码重复
2. **提供了完整的功能支持**，包括分隔线、图标、快捷键等
3. **优化了用户体验**，支持键盘导航、自动定位等
4. **修复了目标列表的统计问题**，现在基于选中的分类进行统计
5. **建立了最佳实践规范**，方便后续开发

这是一个**生产级别的通用组件**，可以在整个项目中推广使用。
