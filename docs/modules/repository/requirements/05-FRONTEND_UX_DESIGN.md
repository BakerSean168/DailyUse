# 仓储模块 - 前端交互与 UX 设计

> **文档类型**: BA 需求文档
> **作者**: BA - Business Analyst
> **日期**: 2025-11-09
> **版本**: v1.0
> **项目**: DailyUse - Repository Module (Obsidian-inspired)

---

## 🎯 文档目标

本文档定义仓储模块的前端用户体验设计，包括：

1. 页面布局与导航结构
2. 核心 UI 组件设计
3. 用户交互流程
4. Obsidian 风格参考
5. 技术实现建议

---

## 🏗️ 整体布局架构

### Obsidian 风格三栏布局

```
┌─────────────────────────────────────────────────────────────┐
│  顶部工具栏 (TopBar)                                         │
│  [仓储选择器] [搜索框] [新建] [设置]                          │
├──────────┬──────────────────────────────┬───────────────────┤
│          │                              │                   │
│  左侧边栏 │      中央编辑区               │    右侧边栏        │
│  (侧宽:  │     (主内容区)                │   (可收起)        │
│  250px)  │                              │   (宽: 300px)     │
│          │                              │                   │
│ 文件树   │  [Tab栏: 笔记1 | 笔记2 | ...]  │  大纲 (Outline)   │
│ (树形)   │                              │  反向链接         │
│          │  ┌──────────────────────┐    │  (Backlinks)     │
│  📁 前端  │  │  # Vue3 组合式 API   │    │  标签云          │
│    📄 笔记│  │                      │    │  知识图谱        │
│    📄 代码│  │  内容编辑区...       │    │  (可视化)        │
│  📁 后端  │  │                      │    │  版本历史        │
│    ...   │  │  (Tiptap 编辑器)     │    │                   │
│          │  └──────────────────────┘    │                   │
│          │                              │                   │
│  [新建]  │  底部状态栏: 字数 | 保存状态  │  [收起/展开]      │
└──────────┴──────────────────────────────┴───────────────────┘
```

### 响应式设计

| 屏幕宽度 | 布局调整 |
|---------|---------|
| > 1600px | 完整三栏布局 |
| 1200-1600px | 左侧栏 200px，右侧栏可折叠 |
| 768-1200px | 仅显示左侧栏 + 中央区，右侧栏隐藏 |
| < 768px | 移动端：底部导航栏，全屏编辑 |

---

## 1️⃣ 左侧边栏 - 文件资源管理器

### 1.1 文件树组件 (FileExplorer)

**技术选型**: Vuetify 3 的 `v-treeview` + 自定义样式

**核心功能**:
- ✅ 文件夹展开/折叠（记住状态）
- ✅ 拖拽移动文件/文件夹
- ✅ 右键菜单（新建、重命名、删除、移动）
- ✅ 文件图标（根据类型显示 emoji 或图标）
- ✅ 快捷键支持（N=新建，R=重命名，Del=删除）

**交互设计**:

```vue
<template>
  <v-navigation-drawer permanent width="250">
    <!-- 工具栏 -->
    <v-toolbar density="compact">
      <v-toolbar-title>文件资源管理器</v-toolbar-title>
      <v-spacer />
      <v-btn icon size="small" @click="createNewNote">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-toolbar>

    <!-- 文件树 -->
    <v-treeview
      v-model:opened="openedFolders"
      :items="folderTree"
      item-value="uuid"
      activatable
      open-on-click
      density="compact"
      class="file-tree"
    >
      <template #prepend="{ item }">
        <v-icon v-if="item.type === 'folder'">
          {{ item.expanded ? 'mdi-folder-open' : 'mdi-folder' }}
        </v-icon>
        <span v-else>{{ getFileIcon(item.type) }}</span>
      </template>

      <template #label="{ item }">
        <div class="tree-item" @contextmenu.prevent="showContextMenu($event, item)">
          <span>{{ item.name }}</span>
          <span v-if="item.type === 'folder'" class="item-count">
            {{ item.resourceCount }}
          </span>
        </div>
      </template>
    </v-treeview>

    <!-- 右键菜单 -->
    <v-menu v-model="contextMenuVisible" :position-x="contextMenuX" :position-y="contextMenuY">
      <v-list density="compact">
        <v-list-item @click="createNote">新建笔记</v-list-item>
        <v-list-item @click="createFolder">新建文件夹</v-list-item>
        <v-divider />
        <v-list-item @click="rename">重命名</v-list-item>
        <v-list-item @click="move">移动到...</v-list-item>
        <v-divider />
        <v-list-item @click="deleteItem" color="error">删除</v-list-item>
      </v-list>
    </v-menu>
  </v-navigation-drawer>
</template>
```

**拖拽实现**:
- 使用 `@vueuse/core` 的 `useDraggable` 和 `useDropzone`
- 拖拽时显示半透明 ghost 效果
- 拖拽到文件夹上时高亮显示可放置区域

---

### 1.2 文件夹元数据显示

**设计元素**:
- 文件夹图标（可自定义 emoji）
- 文件夹颜色标签
- 资源数量徽章
- 折叠/展开动画

**示例**:
```
📁 前端笔记 (12)      ← 文件夹名 + 资源数量
  📄 Vue3 基础.md
  📄 React Hooks.md
  📁 TypeScript (5)   ← 嵌套文件夹
    📄 类型系统.md
```

---

## 2️⃣ 中央编辑区 - 多标签页编辑器

### 2.1 Tab 栏设计

**功能需求**:
- ✅ 多标签页（支持固定标签）
- ✅ 拖拽排序标签
- ✅ 中键点击关闭
- ✅ 未保存状态提示（标题后显示 `*`）
- ✅ 最近打开历史（Ctrl+P 快速切换）

**交互实现**:

```vue
<template>
  <div class="editor-tabs">
    <!-- Tab 栏 -->
    <v-tabs v-model="activeTab" show-arrows>
      <v-tab
        v-for="tab in openTabs"
        :key="tab.uuid"
        :value="tab.uuid"
        @auxclick.middle="closeTab(tab.uuid)"
      >
        <v-icon v-if="tab.isPinned" size="small" class="mr-1">mdi-pin</v-icon>
        <span>{{ tab.name }}</span>
        <span v-if="tab.isDirty" class="unsaved-indicator">*</span>
        <v-btn
          icon
          size="x-small"
          variant="text"
          class="ml-2"
          @click.stop="closeTab(tab.uuid)"
        >
          <v-icon size="small">mdi-close</v-icon>
        </v-btn>
      </v-tab>
    </v-tabs>

    <!-- 编辑器内容区 -->
    <v-window v-model="activeTab" class="editor-window">
      <v-window-item
        v-for="tab in openTabs"
        :key="tab.uuid"
        :value="tab.uuid"
      >
        <ResourceEditor
          :resource="tab.resource"
          @update="handleContentUpdate"
        />
      </v-window-item>
    </v-window>
  </div>
</template>
```

---

### 2.2 Markdown 编辑器 (Milkdown 集成)

**技术选型**: Milkdown（专注于 Markdown 的编辑器框架）

**核心功能**:
- ✅ 所见即所得 (WYSIWYG) 模式
- ✅ Markdown 源码模式切换
- ✅ 实时预览（分屏或全屏）
- ✅ `[[]]` 双向链接语法支持（自动补全）
- ✅ 代码块高亮（Prism 插件）
- ✅ 图片/视频拖拽上传
- ✅ 数学公式 (KaTeX)
- ✅ 表格、任务列表、Callout

**Milkdown 基础配置**:

```typescript
// 编辑器初始化
import { Editor, rootCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { cursor } from '@milkdown/plugin-cursor';
import { prism } from '@milkdown/plugin-prism';

const editor = Editor.make()
  .config((ctx) => {
    ctx.set(rootCtx, editorContainer.value);
    
    // 监听内容变化
    ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
      emit('update:content', markdown);
    });
  })
  .use(commonmark)      // 基础 Markdown
  .use(listener)        // 事件监听
  .use(history)         // 撤销/重做
  .use(cursor)          // 光标管理
  .use(prism)           // 代码高亮
  .use(bidirectionalLinkPlugin);  // 双向链接
```

**双向链接插件实现**:

```typescript
// 自定义双向链接插件
import { $node, $inputRule } from '@milkdown/utils';

const bidirectionalLinkPlugin = $node('bidirectionalLink', () => ({
  group: 'inline',
  inline: true,
  atom: true,
  
  attrs: {
    title: { default: '' },
    href: { default: '' },
  },
  
  parseDOM: [
    {
      tag: 'a[data-type="bidirectional-link"]',
      getAttrs: (dom) => ({
        title: dom.getAttribute('data-title'),
        href: dom.getAttribute('href'),
      }),
    },
  ],
  
  toDOM: (node) => [
    'a',
    {
      'data-type': 'bidirectional-link',
      'data-title': node.attrs.title,
      href: node.attrs.href,
      class: 'wiki-link',
    },
    node.attrs.title,
  ],
  
  parseMarkdown: {
    match: (node) => node.type === 'bidirectionalLink',
    runner: (state, node, type) => {
      state.addNode(type, { title: node.title, href: node.href });
    },
  },
  
  toMarkdown: {
    match: (node) => node.type.name === 'bidirectionalLink',
    runner: (state, node) => {
      state.addNode('text', undefined, `[[${node.attrs.title}]]`);
    },
  },
}));

// 输入规则：检测 [[ 触发自动补全
const bidirectionalLinkInputRule = $inputRule((ctx) => ({
  rule: /\[\[([^\]]+)?$/,
  handler: ({ state, match }) => {
    const keyword = match[1] || '';
    // 触发资源搜索自动补全面板
    showAutocomplete(keyword);
    return true;
  },
}));
```

**自动补全面板 UI**:

```vue
<template>
  <v-menu
    v-model="autocompleteVisible"
    :position-x="autocompleteX"
    :position-y="autocompleteY"
    :close-on-content-click="false"
  >
    <v-list density="compact" max-height="300">
      <v-list-subheader>搜索资源（{{ filteredResources.length }}）</v-list-subheader>
      <v-list-item
        v-for="resource in filteredResources"
        :key="resource.uuid"
        @click="insertLink(resource)"
      >
        <template #prepend>
          <span class="mr-2">{{ getFileIcon(resource.type) }}</span>
        </template>
        <v-list-item-title>{{ resource.name }}</v-list-item-title>
        <v-list-item-subtitle>{{ resource.path }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
```

---

### 2.3 编辑器工具栏

**浮动工具栏**（选中文本时出现）:
```
[ B ] [ I ] [ U ] [ Code ] [ Link ] [ Highlight ]
```

**顶部菜单栏**:
```
格式 | 插入 | 视图 | 工具
  ↓      ↓      ↓      ↓
 标题   图片   预览   搜索
 列表   表格   大纲   替换
 引用   代码块 源码   字数统计
```

---

## 3️⃣ 右侧边栏 - 辅助面板

### 3.1 大纲视图 (Outline)

**功能**: 自动提取 Markdown 标题，生成可点击目录

```vue
<template>
  <v-expansion-panels>
    <v-expansion-panel value="outline">
      <v-expansion-panel-title>
        <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
        大纲
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-list density="compact">
          <v-list-item
            v-for="heading in outline"
            :key="heading.id"
            :style="{ paddingLeft: `${heading.level * 12}px` }"
            @click="scrollToHeading(heading.id)"
          >
            {{ heading.text }}
          </v-list-item>
        </v-list>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
```

---

### 3.2 反向链接 (Backlinks)

**功能**: 显示所有链接到当前笔记的其他笔记

```vue
<template>
  <v-expansion-panel value="backlinks">
    <v-expansion-panel-title>
      <v-icon class="mr-2">mdi-link-variant</v-icon>
      反向链接 ({{ backlinks.length }})
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-list density="compact">
        <v-list-item
          v-for="link in backlinks"
          :key="link.uuid"
          @click="openResource(link.sourceResource.uuid)"
        >
          <template #prepend>
            <v-icon size="small">mdi-file-document-outline</v-icon>
          </template>
          <v-list-item-title>{{ link.sourceResource.name }}</v-list-item-title>
          <v-list-item-subtitle class="link-context">
            ...{{ link.contextSnippet }}...
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>
```

**上下文片段显示**:
```
Vue3 响应式系统
  ...本文参考了 [[Vue3 组合式 API]] 的设计思想...
            ^^^^^^^^^^^^^^^^^^^
            (当前笔记被引用)
```

---

### 3.3 知识图谱可视化

**技术选型**: Cytoscape.js 或 D3.js

```vue
<template>
  <v-expansion-panel value="graph">
    <v-expansion-panel-title>
      <v-icon class="mr-2">mdi-graph-outline</v-icon>
      知识图谱
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <!-- 图谱容器 -->
      <div ref="graphContainer" class="graph-view" style="height: 400px;">
        <!-- Cytoscape 渲染 -->
      </div>

      <!-- 控制按钮 -->
      <v-btn-group density="compact" class="mt-2">
        <v-btn size="small" @click="zoomIn">
          <v-icon>mdi-magnify-plus</v-icon>
        </v-btn>
        <v-btn size="small" @click="zoomOut">
          <v-icon>mdi-magnify-minus</v-icon>
        </v-btn>
        <v-btn size="small" @click="resetView">
          <v-icon>mdi-fit-to-screen</v-icon>
        </v-btn>
        <v-btn size="small" @click="openFullscreenGraph">
          <v-icon>mdi-fullscreen</v-icon>
        </v-btn>
      </v-btn-group>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup lang="ts">
import cytoscape from 'cytoscape';

const initGraph = () => {
  const cy = cytoscape({
    container: graphContainer.value,
    elements: graphData.value,
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#4CAF50',
          'label': 'data(label)',
          'width': 40,
          'height': 40,
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#90A4AE',
          'target-arrow-color': '#90A4AE',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ],
    layout: { name: 'cose' }  // 力导向布局
  });

  // 点击节点跳转
  cy.on('tap', 'node', (evt) => {
    const node = evt.target;
    openResource(node.data('id'));
  });
};
</script>
```

---

### 3.4 版本历史

**功能**: 显示当前笔记的版本列表，支持对比和恢复

```vue
<template>
  <v-expansion-panel value="versions">
    <v-expansion-panel-title>
      <v-icon class="mr-2">mdi-history</v-icon>
      版本历史 ({{ versions.length }})
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-timeline density="compact" side="end">
        <v-timeline-item
          v-for="version in versions"
          :key="version.uuid"
          :dot-color="getVersionColor(version.changeType)"
          size="small"
        >
          <template #opposite>
            <span class="version-time">{{ formatTime(version.createdAt) }}</span>
          </template>
          <v-card density="compact">
            <v-card-text>
              <div class="version-header">
                <v-chip :color="getVersionColor(version.changeType)" size="small">
                  {{ version.changeType }}
                </v-chip>
                <span class="ml-2">v{{ version.versionNumber }}</span>
              </div>
              <p class="text-caption mt-1">{{ version.changeDescription }}</p>
              <v-btn-group density="compact" class="mt-2">
                <v-btn size="x-small" @click="compareVersion(version)">对比</v-btn>
                <v-btn size="x-small" @click="restoreVersion(version)">恢复</v-btn>
              </v-btn-group>
            </v-card-text>
          </v-card>
        </v-timeline-item>
      </v-timeline>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>
```

---

## 4️⃣ 顶部工具栏

### 4.1 仓储选择器

```vue
<template>
  <v-select
    v-model="currentRepository"
    :items="repositories"
    item-title="name"
    item-value="uuid"
    density="compact"
    style="max-width: 200px"
    prepend-inner-icon="mdi-database"
  >
    <template #item="{ item, props }">
      <v-list-item v-bind="props">
        <template #prepend>
          <v-icon>{{ getRepositoryIcon(item.type) }}</v-icon>
        </template>
      </v-list-item>
    </template>
  </v-select>
</template>
```

---

### 4.2 全局搜索框

**功能**: 支持全文搜索、标签筛选、模糊匹配

```vue
<template>
  <v-text-field
    v-model="searchQuery"
    prepend-inner-icon="mdi-magnify"
    placeholder="搜索笔记... (Ctrl+K)"
    density="compact"
    hide-details
    clearable
    @keydown.enter="performSearch"
  >
    <template #append>
      <v-btn icon size="small" @click="showAdvancedSearch">
        <v-icon>mdi-tune</v-icon>
      </v-btn>
    </template>
  </v-text-field>

  <!-- 搜索结果面板 -->
  <v-dialog v-model="searchResultsVisible" max-width="800">
    <v-card>
      <v-card-title>搜索结果 ({{ searchResults.length }})</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item
            v-for="result in searchResults"
            :key="result.resource.uuid"
            @click="openResource(result.resource.uuid)"
          >
            <template #prepend>
              <v-avatar color="primary" size="small">
                {{ result.score.toFixed(2) }}
              </v-avatar>
            </template>
            <v-list-item-title>{{ result.resource.name }}</v-list-item-title>
            <v-list-item-subtitle>
              <div v-for="highlight in result.highlights" :key="highlight" v-html="highlight" />
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
```

---

## 5️⃣ 对话框与模态窗口

### 5.1 新建笔记对话框

```vue
<template>
  <v-dialog v-model="createNoteVisible" max-width="500">
    <v-card>
      <v-card-title>新建笔记</v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="newNote.name"
            label="笔记名称"
            :rules="[rules.required]"
            autofocus
          />
          <v-select
            v-model="newNote.folderUuid"
            :items="folders"
            item-title="name"
            item-value="uuid"
            label="所属文件夹"
          />
          <v-combobox
            v-model="newNote.tags"
            :items="existingTags"
            label="标签"
            multiple
            chips
            closable-chips
          />
          <v-textarea
            v-model="newNote.description"
            label="描述（可选）"
            rows="2"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="createNoteVisible = false">取消</v-btn>
        <v-btn color="primary" @click="createNote">创建</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
```

---

### 5.2 版本对比对话框

**功能**: 左右分屏显示 Diff

```vue
<template>
  <v-dialog v-model="diffVisible" fullscreen>
    <v-card>
      <v-toolbar density="compact">
        <v-toolbar-title>
          版本对比: v{{ version1.versionNumber }} ↔ v{{ version2.versionNumber }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="diffVisible = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text class="diff-container">
        <div class="diff-view" v-html="diffHtml" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.diff-view :deep(.added) {
  background-color: #e6ffec;
  color: #22863a;
}
.diff-view :deep(.deleted) {
  background-color: #ffeef0;
  color: #cb2431;
}
</style>
```

---

## 6️⃣ 快捷键支持

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建笔记 |
| `Ctrl+K` | 全局搜索 |
| `Ctrl+P` | 快速切换标签页 |
| `Ctrl+S` | 保存当前笔记 |
| `Ctrl+W` | 关闭当前标签页 |
| `Ctrl+Shift+F` | 文件夹内搜索 |
| `Ctrl+B` | 切换左侧边栏 |
| `Ctrl+\` | 切换右侧边栏 |
| `Ctrl+E` | 切换编辑/预览模式 |
| `[[` | 触发链接自动补全 |

---

## 📊 前端技术栈总结

| 技术 | 用途 |
|------|------|
| **Vue 3** | 核心框架 |
| **Vuetify 3** | UI 组件库 |
| **Milkdown** | Markdown 编辑器（专注于 Markdown 的编辑框架） |
| **Cytoscape.js** | 知识图谱可视化 |
| **Prism** | 代码高亮（Milkdown 插件） |
| **KaTeX** | 数学公式渲染 |
| **diff2html** | 版本对比可视化 |
| **@vueuse/core** | 工具函数库（拖拽、快捷键等） |
| **Pinia** | 状态管理 |

---

## 📝 总结

### 核心 UI 组件清单

| 组件 | 文件路径 | 优先级 |
|------|---------|--------|
| FileExplorer | `components/FileExplorer.vue` | P0 |
| ResourceEditor | `components/ResourceEditor.vue` | P0 |
| BacklinksPanel | `components/BacklinksPanel.vue` | P1 |
| OutlinePanel | `components/OutlinePanel.vue` | P1 |
| VersionHistory | `components/VersionHistory.vue` | P1 |
| KnowledgeGraphView | `components/KnowledgeGraphView.vue` | P2 |
| SearchDialog | `components/SearchDialog.vue` | P2 |
| VersionDiffDialog | `components/VersionDiffDialog.vue` | P2 |

### 下一步

1. ✅ 数据库架构设计
2. ✅ 领域模型设计
3. ✅ 应用服务接口设计
4. ✅ RESTful API 设计
5. ✅ 前端交互设计（本文档）
6. ⏭️ 实现开发（参考 README.md 中的实施路线图）

---

**文档作者**: BA - Business Analyst  
**审核人员**: PM - John  
**最后更新**: 2025-11-09
