# Story 13.23: Repository 模块 Views 和路由

## 基本信息

| 属性 | 值 |
|------|-----|
| Story ID | 13.23 |
| Epic | EPIC-013: Desktop 全模块架构完善 |
| Phase | Phase 3: 内容模块实现 |
| 优先级 | P1 (High) |
| 预估工时 | 6h |
| 前置依赖 | Story 13.22 (Repository UI 组件) |
| 关联模块 | Repository |

## 目标

完善 Repository 模块的页面视图和路由配置，实现完整的备份管理、导入导出等数据管理功能页面。

## 背景

Repository 模块在 Desktop 中负责数据备份、恢复、导入导出等功能。由于 Desktop 是离线优先模式，这些功能对用户数据安全至关重要。

## 任务列表

### 1. RepositoryView 主页面 (2h)
- [ ] 创建 `RepositoryView.tsx` 主容器
- [ ] 实现模块概览面板
- [ ] 显示存储使用情况统计
- [ ] 添加快捷操作入口
- [ ] 实现离线状态提示

### 2. BackupView 备份管理页面 (2h)
- [ ] 创建 `BackupView.tsx`
- [ ] 实现备份列表展示
- [ ] 添加创建备份入口
- [ ] 添加恢复备份功能
- [ ] 实现备份删除确认
- [ ] 显示备份详情

### 3. ImportExportView 导入导出页面 (1.5h)
- [ ] 创建 `ImportExportView.tsx`
- [ ] 实现导出向导
- [ ] 实现导入向导
- [ ] 添加格式选择 (JSON/CSV)
- [ ] 显示验证结果

### 4. 路由与导航配置 (0.5h)
- [ ] 添加 Repository 路由配置
- [ ] 添加导航菜单项
- [ ] 实现子路由 (backup, import-export)
- [ ] 添加面包屑导航

## 技术规范

### 目录结构
```
renderer/modules/repository/presentation/views/
├── index.ts
├── RepositoryView.tsx
├── BackupView.tsx
└── ImportExportView.tsx
```

### RepositoryView 示例
```typescript
import { FC } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SyncStatusPanel } from '../components/SyncStatusPanel';
import { useRepositoryStore } from '../stores/repositoryStore';
import { Database, Download, Upload, Archive } from 'lucide-react';

export const RepositoryView: FC = () => {
  const navigate = useNavigate();
  const { storageStats, syncStatus } = useRepositoryStore();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">数据管理</h1>
        <SyncStatusPanel status={syncStatus} />
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:bg-accent" onClick={() => navigate('backup')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              备份管理
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              创建、恢复和管理数据备份
            </p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:bg-accent" onClick={() => navigate('import-export')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              导入/导出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              导入或导出数据 (JSON/CSV)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              存储统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Goals</span>
                <span>{storageStats?.goals ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasks</span>
                <span>{storageStats?.tasks ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Schedules</span>
                <span>{storageStats?.schedules ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Outlet />
    </div>
  );
};
```

### 路由配置
```typescript
// router/routes.tsx
import { RepositoryView } from '@/modules/repository/presentation/views/RepositoryView';
import { BackupView } from '@/modules/repository/presentation/views/BackupView';
import { ImportExportView } from '@/modules/repository/presentation/views/ImportExportView';

export const repositoryRoutes = {
  path: 'repository',
  element: <RepositoryView />,
  children: [
    { path: 'backup', element: <BackupView /> },
    { path: 'import-export', element: <ImportExportView /> },
  ],
};
```

## 验收标准

- [ ] RepositoryView 正确显示模块概览
- [ ] BackupView 支持备份的增删查改
- [ ] ImportExportView 导入导出流程完整
- [ ] 路由切换正常工作
- [ ] 导航菜单正确高亮
- [ ] 离线状态正确提示
- [ ] TypeScript 类型检查通过

## 测试要点

1. 路由导航测试
2. 备份操作流程测试
3. 导入导出流程测试
4. 错误状态处理测试
5. 响应式布局测试

## 相关文件

- `renderer/modules/repository/presentation/views/`
- `renderer/router/routes.tsx`
- `renderer/components/layout/Sidebar.tsx`
