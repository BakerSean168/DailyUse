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
import { Layout } from './shared/components';

// Route-level Lazy Loading - Core Views
const DashboardView = lazy(() =>
  import('./views/dashboard').then((m) => ({ default: m.DashboardView }))
);

const GoalListView = lazy(() =>
  import('./views/goal').then((m) => ({ default: m.GoalListView }))
);

const TaskListView = lazy(() =>
  import('./views/task').then((m) => ({ default: m.TaskListView }))
);

// Route-level Lazy Loading - Secondary Views
const ScheduleView = lazy(() =>
  import('./views/schedule').then((m) => ({ default: m.default }))
);

const ReminderView = lazy(() =>
  import('./views/reminder').then((m) => ({ default: m.default }))
);

const SettingsView = lazy(() =>
  import('./views/settings').then((m) => ({ default: m.default }))
);

const AIAssistantView = lazy(() =>
  import('./views/ai').then((m) => ({ default: m.default }))
);

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
