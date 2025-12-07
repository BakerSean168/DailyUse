/**
 * Desktop App Root Component
 *
 * React + shadcn/ui + React Router
 * 使用 React.lazy() 实现路由级代码分割
 */

import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

// 路由级懒加载 - 核心视图
const DashboardView = lazy(() =>
  import('./views/dashboard').then((m) => ({ default: m.DashboardView }))
);
const GoalListView = lazy(() =>
  import('./views/goal').then((m) => ({ default: m.GoalListView }))
);
const TaskListView = lazy(() =>
  import('./views/task').then((m) => ({ default: m.TaskListView }))
);

// 路由级懒加载 - 次要视图 (占位组件，后续实现)
const ScheduleView = lazy(() => import('./views/schedule/ScheduleView'));
const ReminderView = lazy(() => import('./views/reminder/ReminderView'));
const SettingsView = lazy(() => import('./views/settings/SettingsView'));
const AIAssistantView = lazy(() => import('./views/ai/AIAssistantView'));

// 路由加载骨架屏
function RouteLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="h-24 bg-muted rounded" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-24 bg-muted rounded" />
      </div>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<RouteLoadingSkeleton />}>
                <DashboardView />
              </Suspense>
            }
          />
          <Route
            path="goals"
            element={
              <Suspense fallback={<RouteLoadingSkeleton />}>
                <GoalListView />
              </Suspense>
            }
          />
          <Route
            path="tasks"
            element={
              <Suspense fallback={<RouteLoadingSkeleton />}>
                <TaskListView />
              </Suspense>
            }
          />
          <Route
            path="schedule"
            element={
              <Suspense fallback={<RouteLoadingSkeleton />}>
                <ScheduleView />
              </Suspense>
            }
          />
          <Route
            path="reminders"
            element={
              <Suspense fallback={<RouteLoadingSkeleton />}>
                <ReminderView />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<RouteLoadingSkeleton />}>
                <SettingsView />
              </Suspense>
            }
          />
          <Route
            path="ai"
            element={
              <Suspense fallback={<RouteLoadingSkeleton />}>
                <AIAssistantView />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
