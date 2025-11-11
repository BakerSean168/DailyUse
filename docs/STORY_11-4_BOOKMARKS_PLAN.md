# Story 11.4: Bookmarks (书签功能) - 实施计划

**Story Points:** 5  
**优先级:** P1  
**依赖:** Story 11.1 (File Tree), Story 11.2 (Search)

---

## 📋 用户故事

**作为** 用户  
**我想要** 能够为常用的文件和文件夹添加书签  
**以便** 快速访问重要的资源，无需在文件树中查找

---

## 🎯 验收标准

### AC#1: 书签数据模型
- [ ] Bookmark 接口定义（uuid, name, type, targetUuid, targetType, order）
- [ ] BookmarkContracts 类型定义
- [ ] localStorage 持久化

### AC#2: 书签管理 API
- [ ] bookmarkStore.ts - Pinia store
- [ ] addBookmark() - 添加书签
- [ ] removeBookmark() - 删除书签
- [ ] updateBookmark() - 重命名书签
- [ ] reorderBookmarks() - 调整顺序

### AC#3: BookmarksPanel 组件
- [ ] 书签列表展示（v-list）
- [ ] 文件/文件夹图标
- [ ] 右键菜单（重命名、删除）
- [ ] 拖拽排序
- [ ] 空状态提示

### AC#4: 添加书签交互
- [ ] 文件树右键菜单 "添加到书签"
- [ ] 编辑器工具栏 "添加书签" 按钮
- [ ] 快捷键 Ctrl+D / Cmd+D

### AC#5: 书签导航
- [ ] 点击书签打开资源
- [ ] 双击书签在新标签页打开
- [ ] 书签数量 badge 显示

---

## 🔧 技术实现

### 1. Contracts (10 min)
```typescript
// packages/contracts/src/repository/BookmarkContracts.ts
export type BookmarkTargetType = 'resource' | 'folder';

export interface Bookmark {
  uuid: string;
  name: string;
  targetUuid: string;
  targetType: BookmarkTargetType;
  repositoryUuid: string;
  order: number;
  icon?: string;
  createdAt: string;
}
```

### 2. Store (30 min)
```typescript
// apps/web/src/modules/repository/presentation/stores/bookmarkStore.ts
export const useBookmarkStore = defineStore('repository-bookmarks', () => {
  const bookmarks = ref<Bookmark[]>([]);
  
  function addBookmark(target: Resource | Folder): void {
    // 创建书签
    // 保存到 localStorage
  }
  
  function removeBookmark(uuid: string): void {}
  function updateBookmark(uuid: string, name: string): void {}
  function reorderBookmarks(uuids: string[]): void {}
  
  return { bookmarks, addBookmark, removeBookmark, updateBookmark, reorderBookmarks };
});
```

### 3. BookmarksPanel Component (60 min)
- Vuetify v-list
- v-list-item with drag handle
- Context menu (v-menu)
- Empty state illustration

### 4. 集成到 RepositoryView (20 min)
- 添加书签按钮到文件树右键菜单
- 添加书签按钮到编辑器工具栏
- 处理书签点击事件

---

## 🎨 UI 设计

### BookmarksPanel 布局
```
┌──────────────────────────┐
│ 📌 书签                   │
│ ───────────────────────── │
│                           │
│ 📄 重要笔记.md            │
│ 📁 工作文件夹             │
│ 📄 README.md              │
│                           │
│ [空状态]                  │
│ 🔖 暂无书签                │
│ 右键文件选择"添加书签"     │
└──────────────────────────┘
```

### 右键菜单
- ✏️ 重命名
- 🗑️ 删除
- ↑ 上移
- ↓ 下移

---

## 📊 工作量估算

| 任务 | 预估时间 |
|------|---------|
| 1. BookmarkContracts | 10 min |
| 2. bookmarkStore | 30 min |
| 3. BookmarksPanel | 60 min |
| 4. 右键菜单集成 | 20 min |
| 5. 拖拽排序 | 30 min |
| 6. 快捷键支持 | 20 min |
| 7. 手动测试 | 30 min |
| **总计** | **3 小时** |

---

## 🧪 测试清单

- [ ] 添加资源书签
- [ ] 添加文件夹书签
- [ ] 点击书签打开资源
- [ ] 重命名书签
- [ ] 删除书签
- [ ] 拖拽调整顺序
- [ ] 书签持久化（刷新后保留）
- [ ] 空状态显示
- [ ] 快捷键 Ctrl+D 添加书签

---

## 🔗 依赖关系

**需要:**
- ✅ FileTreeStore (Story 11.1)
- ✅ ResourceStore (Epic 10 Story 10-2)

**被依赖:**
- ⏳ Story 11.6 (Advanced Search - 可以搜索书签)

---

## 📝 注意事项

1. **数据存储**: 使用 localStorage，未来可扩展为 backend API
2. **图标**: 复用 fileTreeStore 的 getFileIcon() 逻辑
3. **去重**: 检查书签是否已存在（targetUuid）
4. **排序**: order 字段控制显示顺序
5. **删除保护**: 资源删除后自动删除对应书签

---

**开始实施时间:** 待定  
**预计完成时间:** 3 小时
