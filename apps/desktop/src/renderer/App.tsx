/**
 * Desktop App Root Component
 *
 * The main application component using React Router for navigation and `shadcn/ui` for styling.
 * Implements route-level code splitting using `React.lazy()` and `Suspense` for performance optimization.
 *
 * @module renderer/App
 */

import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './shared/components/Layout';

// Route-level Lazy Loading - Core Views
const DashboardView = lazy(() =>
  import('./views/dashboard').then((m) => ({ default: m.DashboardView }))
);
// Note: GoalListView and TaskListView imports are placeholders or need to be verified against file structure
const GoalListView = lazy(() =>
  import('./modules/goal/presentation/views/GoalListView').then((m) => ({ default: m.GoalListView }))
);
const TaskListView = lazy(() =>
  import('./modules/task/presentation/views/TaskListView').then((m) => ({ default: m.TaskListView }))
);

// Route-level Lazy Loading - Secondary Views (Placeholders, adjust paths as needed)
// Assuming standard module structure if views folder doesn't exist directly
const ScheduleView = lazy(() => import('./modules/schedule/presentation/views/ScheduleView').catch(() => ({ default: () => <div>Schedule View (Not Implemented)</div> })));
const ReminderView = lazy(() => import('./modules/reminder/presentation/views/ReminderView').catch(() => ({ default: () => <div>Reminder View (Not Implemented)</div> })));
const SettingsView = lazy(() => import('./modules/settings/presentation/views/SettingsView').catch(() => ({ default: () => <div>Settings View (Not Implemented)</div> })));
const AIAssistantView = lazy(() => import('./modules/ai/presentation/views/AIAssistantView').catch(() => ({ default: () => <div>AI Assistant View (Not Implemented)</div> })));

/**
 * Loading skeleton component displayed while routes are being lazily loaded.
 */
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

/**
 * The root component of the application.
 * Defines the routing structure and layout.
 */
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
