import { Suspense, lazy } from 'react';

/**
 * Goal List View - Placeholder
 */
export const GoalListView = lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">Goals</h1>
        <p className="text-muted-foreground">Goals view coming soon...</p>
      </div>
    ),
  })
);
