# Renderer Shared

渲染进程共享代码

## 目录结构

```
shared/
├── components/          # 共享 React 组件
│   ├── Layout.tsx      # 布局组件
│   ├── Skeleton.tsx    # 骨架屏
│   ├── LazyImage.tsx   # 懒加载图片
│   └── ...
├── hooks/              # 共享 Hooks
│   ├── useInfiniteLoad.ts
│   ├── useVirtualList.ts
│   ├── useAutoCleanup.ts
│   └── ...
├── utils/              # 工具函数
└── types/              # 共享类型定义
```

## 使用规范

1. 只放置跨模块共享的代码
2. 模块专用代码放在各自模块内
3. 避免循环依赖
