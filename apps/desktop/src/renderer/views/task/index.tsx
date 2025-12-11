import { Suspense, lazy } from 'react';

/**
 * Task List View - Placeholder
 */
export const TaskListView = lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Tasks</h1>
        <p className="text-muted-foreground">Tasks view coming soon...</p>
      </div>
    ),
  })
);
