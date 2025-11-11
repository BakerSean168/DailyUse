# Story 11.3: Unified Styles (统一样式优化) - 实施计划

**Story Points:** 5  
**预计时间:** 1-2 天  
**优先级:** P0 (必须有)

---

## 📋 验收标准 (8 ACs)

### AC #1: 颜色系统统一 ✅
- CSS 变量 (`rgb(var(--v-theme-surface))`)
- 透明度层级：hover(0.05) / selected(0.12) / pressed(0.16)
- 主题色应用：primary / accent / error

### AC #2: 间距系统统一 ✅
- 统一单位：4px/8px/12px/16px/24px/32px
- 侧边栏 padding：8px
- 组件内边距：compact(4px 8px) / normal(8px 12px) / comfortable(12px 16px)

### AC #3: 圆角规范 ✅
- chip/badge: 4px
- button/input: 6px
- card/dialog: 8px
- panel: 12px

### AC #4: 微交互优化 ✅
- 悬停：背景色变化 + 150ms 过渡
- 按下：transform: translateY(0)
- 选中：背景色高亮 + 文字加粗
- 展开/折叠：图标旋转 90° + 150ms

### AC #5: 滚动条样式 ✅
- 宽度：8px
- 颜色：rgba(var(--v-theme-on-surface), 0.2)
- 悬停：rgba(var(--v-theme-on-surface), 0.3)

### AC #6: Tab 标签栏优化 ✅
- 背景色：surface-variant
- 按钮 padding：6px
- 活动 Tab：primary(0.12) + primary 文字色
- 悬停 Tab：on-surface(0.05)

### AC #7: 空状态优化 ✅
- 图标：64px，grey-lighten-1
- 标题：text-h6，grey
- 描述：text-caption，grey-lighten-1

### AC #8: 响应式设计 ✅
- 桌面端 (>1024px)：侧边栏 300px
- 平板端 (768-1024px)：侧边栏 250px
- 移动端 (<768px)：侧边栏折叠

---

## 🎯 实施策略

### 阶段 1: 创建样式指南文件 (30 min)
- [ ] 创建 `apps/web/src/modules/repository/styles/variables.scss`
- [ ] 定义颜色变量
- [ ] 定义间距变量
- [ ] 定义圆角变量
- [ ] 定义过渡时间变量

### 阶段 2: 创建通用 SCSS Mixins (30 min)
- [ ] 创建 `apps/web/src/modules/repository/styles/mixins.scss`
- [ ] hover-effect mixin
- [ ] selected-state mixin
- [ ] transition mixin
- [ ] scrollbar mixin
- [ ] empty-state mixin

### 阶段 3: 更新 RepositoryView (30 min)
- [ ] 引入 SCSS 变量
- [ ] 更新侧边栏样式（padding, 间距）
- [ ] 更新 Tab 标签栏样式
- [ ] 添加响应式断点
- [ ] 更新空状态样式

### 阶段 4: 更新侧边栏组件 (40 min)
- [ ] FilesPanel.vue - 间距、圆角
- [ ] SearchPanel.vue - 间距、圆角
- [ ] BookmarksPanel.vue - 间距、圆角
- [ ] 统一 hover 效果
- [ ] 统一选中效果

### 阶段 5: 更新子组件 (40 min)
- [ ] FileExplorer.vue - 文件树样式
- [ ] ResourceList.vue - 资源列表样式
- [ ] TreeNodeItem.vue (如果存在) - 树节点样式
- [ ] 统一图标大小和颜色

### 阶段 6: 滚动条和微交互 (20 min)
- [ ] 侧边栏内容区自定义滚动条
- [ ] 展开/折叠动画优化
- [ ] 按钮 press 效果
- [ ] Tooltip 延迟和样式

### 阶段 7: 响应式测试 (30 min)
- [ ] 测试桌面端布局 (>1024px)
- [ ] 测试平板端布局 (768-1024px)
- [ ] 测试移动端布局 (<768px)
- [ ] 折叠/展开侧边栏功能 (移动端)

---

## 📦 需要创建/修改的文件

### 新建文件 (2)
1. `apps/web/src/modules/repository/styles/variables.scss`
2. `apps/web/src/modules/repository/styles/mixins.scss`

### 修改文件 (6+)
1. `apps/web/src/modules/repository/presentation/views/RepositoryView.vue`
2. `apps/web/src/modules/repository/presentation/components/FilesPanel.vue`
3. `apps/web/src/modules/repository/presentation/components/SearchPanel.vue`
4. `apps/web/src/modules/repository/presentation/components/BookmarksPanel.vue`
5. `apps/web/src/modules/repository/presentation/components/FileExplorer.vue`
6. `apps/web/src/modules/repository/presentation/components/ResourceList.vue`

---

## 🎨 样式变量系统

### 颜色
```scss
// Vuetify 主题变量（已有）
// 使用方式：rgb(var(--v-theme-primary))

// 自定义透明度层级
$hover-opacity: 0.05;
$selected-opacity: 0.12;
$pressed-opacity: 0.16;
$disabled-opacity: 0.38;
```

### 间距
```scss
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$spacing-xl: 24px;
$spacing-2xl: 32px;

$sidebar-padding: 8px;
$content-padding-compact: 4px 8px;
$content-padding-normal: 8px 12px;
$content-padding-comfortable: 12px 16px;
```

### 圆角
```scss
$border-radius-sm: 4px;  // chip, badge
$border-radius-md: 6px;  // button, input
$border-radius-lg: 8px;  // card, dialog
$border-radius-xl: 12px; // panel
```

### 过渡
```scss
$transition-fast: 150ms;
$transition-normal: 250ms;
$transition-slow: 350ms;

$ease-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### 滚动条
```scss
$scrollbar-width: 8px;
$scrollbar-color: rgba(var(--v-theme-on-surface), 0.2);
$scrollbar-hover-color: rgba(var(--v-theme-on-surface), 0.3);
```

---

## 🔧 Mixins 示例

### hover-effect
```scss
@mixin hover-effect($opacity: 0.05) {
  transition: background-color $transition-fast $ease-out;
  
  &:hover {
    background-color: rgba(var(--v-theme-on-surface), $opacity);
  }
}
```

### selected-state
```scss
@mixin selected-state {
  background-color: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
```

### custom-scrollbar
```scss
@mixin custom-scrollbar {
  &::-webkit-scrollbar {
    width: $scrollbar-width;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: $scrollbar-color;
    border-radius: $border-radius-sm;

    &:hover {
      background-color: $scrollbar-hover-color;
    }
  }
}
```

---

## 📊 工作量预估

| 阶段 | 任务 | 预估时间 |
|------|------|----------|
| 1 | 创建样式指南文件 | 30 min |
| 2 | 创建 SCSS Mixins | 30 min |
| 3 | 更新 RepositoryView | 30 min |
| 4 | 更新侧边栏组件 | 40 min |
| 5 | 更新子组件 | 40 min |
| 6 | 滚动条和微交互 | 20 min |
| 7 | 响应式测试 | 30 min |
| **总计** | | **3.5 小时** |

---

## 🧪 测试清单

### 视觉一致性
- [ ] 颜色使用 Vuetify 主题变量
- [ ] 间距符合 4px 网格系统
- [ ] 圆角统一（chip/button/card/panel）
- [ ] 过渡动画流畅（150ms）

### 交互反馈
- [ ] 悬停效果：背景色变化
- [ ] 选中效果：背景高亮 + 文字加粗
- [ ] 按下效果：transform
- [ ] 展开/折叠：图标旋转

### 滚动条
- [ ] 侧边栏显示自定义滚动条
- [ ] 宽度 8px，圆角 4px
- [ ] 悬停颜色加深

### 响应式
- [ ] 桌面端：侧边栏 300px
- [ ] 平板端：侧边栏 250px
- [ ] 移动端：侧边栏折叠到抽屉

### 主题适配
- [ ] 浅色主题显示正常
- [ ] 深色主题显示正常
- [ ] 主题切换平滑过渡

---

## 💡 技术决策

### 1. 使用 SCSS 而非 CSS-in-JS
- **原因**: Vuetify 3 使用 SCSS，保持一致性
- **优点**: 变量复用、嵌套语法、强大的 mixin 系统
- **缺点**: 需要额外配置（已完成）

### 2. 使用 CSS 变量 (Vuetify 主题)
- **原因**: 主题切换时自动更新颜色
- **优点**: 无需 JavaScript，性能更好
- **语法**: `rgb(var(--v-theme-primary))`

### 3. 避免 !important
- **原则**: 使用更高特异性选择器
- **例外**: Vuetify 组件强制覆盖时使用（尽量少）

### 4. 移动端策略
- **方案**: 侧边栏折叠为 v-navigation-drawer（overlay 模式）
- **触发**: 汉堡菜单按钮（左上角）
- **宽度**: 280px（移动端）

---

## 🚀 下一步行动

### 立即执行
1. 创建 `variables.scss` 和 `mixins.scss`
2. 更新 RepositoryView 样式
3. 逐个更新侧边栏组件

### 可选增强 (超出 Story 范围)
- [ ] 主题编辑器（自定义颜色）
- [ ] 动画库（Framer Motion）
- [ ] 暗黑模式优化（对比度增强）

---

**计划创建时间**: 2025-01-11  
**预计完成时间**: 2025-01-11 (同一天)  
**依赖**: Story 11.1 ✅, Story 11.2 ✅, Story 11.4 ✅
