# 🎯 Dashboard 问题修复速查

## 问题现状

1. ❌ 只显示 4 个 widgets（缺少：今日待办、目标时间进度图）
2. ❌ 加载时间 30 秒（极度异常）

## 根本原因

### 数据库配置过时

- 后端代码已更新为 6 个 widgets
- 但数据库中的**现有记录**仍然是旧的 4 个配置
- 新用户会自动创建 6 个，已有用户不会更新

## 解决方案

### ✅ 已完成

1. **更新数据库配置**

   ```sql
   -- 已执行，配置现在包含全部 6 个 widgets
   UPDATE dashboard_configs SET widget_config = ...
   ```

2. **添加性能监控**
   - DashboardView.vue: Performance API 监控
   - DashboardConfigApiClient.ts: 详细时间日志
   - dashboardConfigStore.ts: 加载性能日志

3. **添加超时保护**

   ```typescript
   // 5 秒超时，避免无限等待
   await Promise.race([
     configStore.loadConfig(),
     new Promise((_, reject) => setTimeout(() => reject(new Error('配置加载超时')), 5000)),
   ]);
   ```

4. **配置缓存**
   ```typescript
   // 避免重复加载
   if (configStore.initialized) {
     console.log('Using cached widget configurations');
     return;
   }
   ```

## 🧪 测试步骤

1. **清除浏览器缓存**
   - DevTools > 右键刷新按钮 > "清空缓存并硬性重新加载"

2. **查看控制台日志**

   ```
   应该看到：
   📊 Dashboard 加载性能:
     widget-registration: XX.XXms
     config-load: XX.XXms
     dashboard-load-total: XX.XXms  ← 应该 < 500ms
   ```

3. **验证 Widgets**
   应该显示全部 6 个：
   - ✅ 任务统计
   - ✅ 目标统计
   - ✅ 提醒统计
   - ✅ 日程统计
   - ✅ 今日待办 ← **新增**
   - ✅ 目标时间进度图 ← **新增**

## 🔧 诊断工具

```bash
# 运行诊断脚本
./diagnose-dashboard.sh

# 检查：
# - API 服务器状态
# - 数据库状态
# - 数据库表内容
# - API 响应时间
```

## 📊 性能指标

### 目标

- Dashboard 首屏加载: **≤ 500ms**
- Widget 渲染: **≤ 50ms** per widget
- API 响应: **≤ 500ms**

### 如果仍然慢

查看 DevTools > Network 面板：

1. 找到 `/api/v1/dashboard/widget-config` 请求
2. 检查其 Status 和 Time
3. 运行诊断命令：
   ```javascript
   // 在浏览器控制台：
   performance
     .getEntriesByType('resource')
     .filter((r) => r.duration > 1000)
     .forEach((r) => console.log(`${r.name}: ${r.duration}ms`));
   ```

## 📁 修改的文件

1. `apps/web/src/modules/dashboard/presentation/views/DashboardView.vue`
2. `apps/web/src/modules/dashboard/infrastructure/api/DashboardConfigApiClient.ts`
3. `apps/web/src/modules/dashboard/stores/dashboardConfigStore.ts`
4. `apps/web/src/modules/dashboard/utils/performanceMonitor.ts` ← 新建
5. `diagnose-dashboard.sh` ← 新建
6. 数据库：`dashboard_configs` 表更新

## 🚀 预期结果

刷新页面后：

- ⚡ **加载时间：< 500ms**（不是 30 秒！）
- ✅ **显示 6 个 widgets**
- 📊 **控制台有详细的性能日志**

## 📖 详细报告

查看完整分析和优化建议：

- `DASHBOARD_PERFORMANCE_FIX_REPORT.md`

---

**下一步**：刷新浏览器验证！如果还有问题，查看控制台日志定位具体环节。
