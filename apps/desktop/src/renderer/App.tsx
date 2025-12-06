/**
 * Desktop App Root Component
 *
 * React + shadcn/ui + React Router
 */

import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardView } from './views/dashboard';
import { GoalListView } from './views/goal';
import { TaskListView } from './views/task';

// Placeholder views for routes not yet implemented
function ScheduleView() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">日程管理</h1>
      <p className="text-muted-foreground">日程功能开发中...</p>
    </div>
  );
}

function ReminderView() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">提醒管理</h1>
      <p className="text-muted-foreground">提醒功能开发中...</p>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">设置</h1>
      <p className="text-muted-foreground">设置功能开发中...</p>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardView />} />
          <Route path="goals" element={<GoalListView />} />
          <Route path="tasks" element={<TaskListView />} />
          <Route path="schedule" element={<ScheduleView />} />
          <Route path="reminders" element={<ReminderView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
