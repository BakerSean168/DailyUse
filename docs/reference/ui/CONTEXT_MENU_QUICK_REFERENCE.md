---
tags:
  - ui
  - context-menu
  - quick-reference
  - component
description: DuContextMenu组件API快速参考手册
created: 2025-11-23T14:54:12
updated: 2025-11-23T14:54:12
---

# DuContextMenu 快速参考

> 通用右键菜单组件的 API 速查手册

---

## 📦 导入

```typescript
import { DuContextMenu, type ContextMenuItem } from '@/shared/components/context-menu';
```

---

## 🎯 基础用法

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
      action: () => console.log('新建'),
    },
  ];
  menu.show = true;
};
</script>
```

---

## 📋 Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `show` | `boolean` | ✅ | - | 是否显示（支持 v-model） |
| `x` | `number` | ✅ | - | X 坐标 |
| `y` | `number` | ✅ | - | Y 坐标 |
| `items` | `ContextMenuItem[]` | ✅ | - | 菜单项列表 |
| `minWidth` | `number` | ❌ | `180` | 最小宽度（px） |

---

## 🔧 ContextMenuItem 接口

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | `string` | ❌ | 菜单项标题 |
| `icon` | `string` | ❌ | 前置图标（Material Design Icons） |
| `iconSize` | `number` | ❌ | 图标大小（默认 20） |
| `iconColor` | `string` | ❌ | 图标颜色 |
| `action` | `() => void \| Promise<void>` | ❌ | 点击回调 |
| `danger` | `boolean` | ❌ | 是否为危险操作（红色显示） |
| `disabled` | `boolean` | ❌ | 是否禁用 |
| `divider` | `boolean` | ❌ | 是否为分隔线 |
| `shortcut` | `string` | ❌ | 快捷键提示 |
| `suffix` | `string` | ❌ | 后置图标 |
| `className` | `string` | ❌ | 自定义类名 |

---

## 🎨 菜单项示例

### 普通菜单项

```typescript
{
  title: '打开',
  icon: 'mdi-open-in-new',
  action: () => console.log('打开'),
}
```

### 带颜色的图标

```typescript
{
  title: '新建',
  icon: 'mdi-plus',
  iconColor: 'primary',
  action: () => console.log('新建'),
}
```

### 危险操作

```typescript
{
  title: '删除',
  icon: 'mdi-delete',
  danger: true,
  action: () => console.log('删除'),
}
```

### 禁用状态

```typescript
{
  title: '系统文件夹',
  icon: 'mdi-lock-outline',
  disabled: true,
}
```

### 分隔线

```typescript
{ divider: true }
```

### 快捷键提示

```typescript
{
  title: '重命名',
  icon: 'mdi-pencil',
  shortcut: 'F2',
  action: () => console.log('重命名'),
}
```

### 后置图标

```typescript
{
  title: '更多选项',
  icon: 'mdi-dots-horizontal',
  suffix: 'mdi-chevron-right',
  action: () => console.log('展开子菜单'),
}
```

---

## 📤 Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:show` | `(value: boolean)` | 显示状态变化 |
| `item-click` | `(item: ContextMenuItem, index: number)` | 菜单项点击（不推荐使用，建议用 action 回调） |
| `close` | - | 菜单关闭 |

---

## ⌨️ 键盘快捷键

| 按键 | 功能 |
|------|------|
| `↑` | 向上导航 |
| `↓` | 向下导航 |
| `Enter` | 选中当前项 |
| `Esc` | 关闭菜单 |

---

## 🎯 完整示例

### 文件树右键菜单

```typescript
const menu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
});

const handleFileContextMenu = (event: MouseEvent, file: File) => {
  menu.x = event.clientX;
  menu.y = event.clientY;
  menu.items = [
    {
      title: '打开',
      icon: 'mdi-open-in-new',
      iconColor: 'primary',
      action: () => openFile(file),
    },
    { divider: true },
    {
      title: '重命名',
      icon: 'mdi-pencil',
      shortcut: 'F2',
      action: () => renameFile(file),
    },
    {
      title: '复制',
      icon: 'mdi-content-copy',
      shortcut: 'Ctrl+C',
      action: () => copyFile(file),
    },
    { divider: true },
    {
      title: '删除',
      icon: 'mdi-delete',
      danger: true,
      shortcut: 'Del',
      action: () => deleteFile(file),
    },
  ];
  menu.show = true;
};
```

### 条件菜单项

```typescript
const handleContextMenu = (event: MouseEvent, item: any) => {
  menu.x = event.clientX;
  menu.y = event.clientY;
  
  const items: ContextMenuItem[] = [
    {
      title: '查看详情',
      icon: 'mdi-information-outline',
      action: () => viewDetails(item),
    },
  ];
  
  // 只读项：添加禁用提示
  if (item.isReadOnly) {
    items.push(
      { divider: true },
      {
        title: '只读文件',
        icon: 'mdi-lock-outline',
        disabled: true,
      }
    );
  } else {
    // 可编辑项：添加完整操作
    items.push(
      { divider: true },
      {
        title: '编辑',
        icon: 'mdi-pencil',
        action: () => editItem(item),
      },
      {
        title: '删除',
        icon: 'mdi-delete',
        danger: true,
        action: () => deleteItem(item),
      }
    );
  }
  
  menu.items = items;
  menu.show = true;
};
```

---

## 💡 最佳实践

### ✅ 推荐

```typescript
// 1. 使用 reactive 统一管理状态
const menu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
});

// 2. 使用 action 回调处理点击
{
  title: '删除',
  action: () => deleteItem(),
}

// 3. 危险操作放在最后
[
  { title: '打开' },
  { divider: true },
  { title: '重命名' },
  { divider: true },
  { title: '删除', danger: true }, // 放最后
]

// 4. 使用分隔线分组
[
  // 主要操作
  { title: '打开' },
  { divider: true },
  
  // 次要操作
  { title: '重命名' },
  { title: '复制' },
  { divider: true },
  
  // 危险操作
  { title: '删除', danger: true },
]
```

### ❌ 不推荐

```typescript
// 1. 分散的 ref
const show = ref(false);
const x = ref(0);
const y = ref(0);

// 2. 监听 item-click 事件
<DuContextMenu @item-click="handleClick" />

// 3. 危险操作放前面
[
  { title: '删除', danger: true }, // ❌ 不应放前面
  { title: '打开' },
]

// 4. 没有分组
[
  { title: '打开' },
  { title: '重命名' },
  { title: '删除' },
  // ❌ 缺少分隔线
]
```

---

## 🎨 样式定制

### 自定义最小宽度

```vue
<DuContextMenu
  v-model:show="menu.show"
  :x="menu.x"
  :y="menu.y"
  :items="menu.items"
  :min-width="200"
/>
```

### 自定义菜单项类名

```typescript
{
  title: '特殊项',
  className: 'my-custom-menu-item',
  action: () => console.log('点击'),
}
```

```css
/* 自定义样式 */
.my-custom-menu-item {
  background-color: rgba(var(--v-theme-warning), 0.1);
  font-weight: bold;
}
```

---

## 🔗 相关文档

- [完整实现文档](./CONTEXT_MENU_IMPLEMENTATION.md)
- [Vuetify Icons](https://vuetifyjs.com/en/features/icon-fonts/)
- [Material Design Icons](https://pictogrammers.com/library/mdi/)

---

## 📞 支持

遇到问题？查看：
- [实现文档](./CONTEXT_MENU_IMPLEMENTATION.md) - 详细的实现说明
- [源码](../../../apps/web/src/shared/components/context-menu/) - 组件源代码
