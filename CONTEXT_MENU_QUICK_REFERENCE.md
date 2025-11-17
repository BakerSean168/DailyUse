# DuContextMenu 快速参考

## 🚀 快速开始

### 1. 导入组件

```typescript
import { DuContextMenu, type ContextMenuItem } from '@/shared/components/context-menu';
```

### 2. 创建菜单状态

```typescript
const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
});
```

### 3. 使用组件

```vue
<template>
  <!-- 触发区域 -->
  <div @contextmenu.prevent="handleContextMenu">
    右键点击这里
  </div>
  
  <!-- 菜单组件 -->
  <DuContextMenu
    v-model:show="contextMenu.show"
    :x="contextMenu.x"
    :y="contextMenu.y"
    :items="contextMenu.items"
  />
</template>
```

### 4. 处理右键事件

```typescript
const handleContextMenu = (event: MouseEvent) => {
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.items = [
    {
      title: '操作1',
      icon: 'mdi-plus',
      iconColor: 'primary',
      action: () => console.log('操作1'),
    },
    { divider: true },
    {
      title: '危险操作',
      icon: 'mdi-delete',
      danger: true,
      action: () => console.log('删除'),
    },
  ];
  contextMenu.show = true;
};
```

## 📋 菜单项配置

### 基础属性

```typescript
{
  title: '菜单项标题',        // 必填（divider 除外）
  icon: 'mdi-icon-name',      // Material Design Icons
  iconColor: 'primary',       // primary, success, error 等
  iconSize: 18,               // 默认 18
  action: () => {},           // 点击回调
}
```

### 特殊状态

```typescript
{
  title: '禁用项',
  disabled: true,             // 禁用，不可点击
}

{
  title: '危险操作',
  danger: true,               // 红色高亮
}

{
  divider: true,              // 分隔线
}
```

### 增强功能

```typescript
{
  title: '带快捷键',
  shortcut: 'Ctrl+S',        // 快捷键提示
  suffix: 'mdi-chevron-right', // 后置图标
}
```

## 🎯 常见场景

### 文件树菜单

```typescript
// 文件夹菜单
const folderMenu: ContextMenuItem[] = [
  {
    title: '打开',
    icon: 'mdi-folder-open',
    iconColor: 'primary',
    action: () => openFolder(),
  },
  { divider: true },
  {
    title: '新建文件',
    icon: 'mdi-file-plus',
    action: () => createFile(),
  },
  {
    title: '新建文件夹',
    icon: 'mdi-folder-plus',
    action: () => createFolder(),
  },
  { divider: true },
  {
    title: '重命名',
    icon: 'mdi-pencil',
    shortcut: 'F2',
    action: () => rename(),
  },
  {
    title: '删除',
    icon: 'mdi-delete',
    danger: true,
    shortcut: 'Del',
    action: () => deleteItem(),
  },
];
```

### 卡片/列表项菜单

```typescript
const itemMenu: ContextMenuItem[] = [
  {
    title: '查看详情',
    icon: 'mdi-eye',
    action: () => viewDetail(),
  },
  {
    title: '编辑',
    icon: 'mdi-pencil',
    action: () => edit(),
  },
  { divider: true },
  {
    title: '复制',
    icon: 'mdi-content-copy',
    action: () => copy(),
  },
  {
    title: '移动',
    icon: 'mdi-folder-move',
    action: () => move(),
  },
  { divider: true },
  {
    title: '删除',
    icon: 'mdi-delete',
    danger: true,
    action: () => deleteItem(),
  },
];
```

### 系统保护项

```typescript
const systemMenu: ContextMenuItem[] = [
  {
    title: '查看',
    icon: 'mdi-eye',
    action: () => view(),
  },
  { divider: true },
  {
    title: '系统保护',
    icon: 'mdi-lock',
    disabled: true,
  },
];
```

## ⌨️ 键盘快捷键

| 按键 | 功能 |
|------|------|
| ↑ | 向上导航 |
| ↓ | 向下导航 |
| Enter | 选中当前项 |
| Esc | 关闭菜单 |

## 💡 最佳实践

### 1. 菜单项顺序

```typescript
// ✅ 推荐顺序
[
  // 1. 主要操作（蓝色/默认色）
  { title: '打开', iconColor: 'primary' },
  
  { divider: true },
  
  // 2. 创建操作（绿色）
  { title: '新建', iconColor: 'success' },
  
  { divider: true },
  
  // 3. 编辑操作（默认色）
  { title: '重命名' },
  { title: '移动' },
  
  { divider: true },
  
  // 4. 危险操作（红色，放最后）
  { title: '删除', danger: true },
]
```

### 2. 图标使用

```typescript
// ✅ 使用 Material Design Icons
icon: 'mdi-folder'          // 文件夹
icon: 'mdi-file'            // 文件
icon: 'mdi-plus'            // 新建
icon: 'mdi-pencil'          // 编辑
icon: 'mdi-delete'          // 删除
icon: 'mdi-content-copy'    // 复制
icon: 'mdi-folder-move'     // 移动

// 查看更多图标：https://pictogrammers.com/library/mdi/
```

### 3. 颜色规范

```typescript
iconColor: 'primary'    // 主要操作（蓝色）
iconColor: 'success'    // 创建操作（绿色）
iconColor: 'warning'    // 警告操作（橙色）
iconColor: 'error'      // 危险操作（红色）
// 或使用 danger: true
```

### 4. 异步操作

```typescript
{
  title: '保存',
  icon: 'mdi-content-save',
  action: async () => {
    try {
      await saveData();
      showSuccessMessage();
    } catch (error) {
      showErrorMessage();
    }
    // 菜单会自动关闭
  },
}
```

## 🔧 自定义配置

### 调整菜单宽度

```vue
<DuContextMenu
  v-model:show="contextMenu.show"
  :x="contextMenu.x"
  :y="contextMenu.y"
  :items="contextMenu.items"
  :min-width="200"
/>
```

### 监听事件

```vue
<DuContextMenu
  v-model:show="contextMenu.show"
  :x="contextMenu.x"
  :y="contextMenu.y"
  :items="contextMenu.items"
  @item-click="handleItemClick"
  @close="handleClose"
/>
```

```typescript
const handleItemClick = (item: ContextMenuItem, index: number) => {
  console.log('点击了菜单项:', item.title, '索引:', index);
};

const handleClose = () => {
  console.log('菜单已关闭');
};
```

## 🐛 常见问题

### Q: 菜单位置不正确？
A: 确保使用 `event.clientX` 和 `event.clientY`，不是 `pageX/pageY`。

### Q: 菜单不能关闭？
A: 检查是否使用了 `v-model:show` 而不是 `:show`。

### Q: 快捷键不显示？
A: 快捷键只是提示，不会自动绑定。需要在外部实现键盘事件监听。

### Q: 如何保存当前操作的对象？
A: 在 `contextMenu` 中添加 `currentItem` 字段：

```typescript
const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
  currentItem: null as any, // 保存当前操作的对象
});

const handleContextMenu = (event: MouseEvent, item: any) => {
  contextMenu.currentItem = item; // 保存对象
  // ... 设置菜单项
};
```

## 📚 完整示例

查看 `apps/web/src/modules/goal/presentation/components/GoalFolder.vue` 获取完整的实现示例。
