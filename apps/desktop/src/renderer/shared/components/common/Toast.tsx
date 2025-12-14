/**
 * Toast Component
 *
 * A customized toast component using Sonner that integrates with our theme system.
 * This component replaces the default shadcn/ui Toaster which depends on next-themes.
 *
 * @module renderer/shared/components/common/Toast
 */

import { Toaster as Sonner, toast } from 'sonner';
import { useTheme } from '../../../modules/setting/presentation/stores/settingStore';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toaster component that provides toast notifications.
 * Should be placed once at the root of your app.
 *
 * @example
 * ```tsx
 * // In App.tsx
 * function App() {
 *   return (
 *     <>
 *       <RouterProvider />
 *       <Toaster />
 *     </>
 *   );
 * }
 *
 * // Triggering toasts
 * import { toast } from 'sonner';
 * toast.success('Operation completed!');
 * toast.error('Something went wrong');
 * ```
 */
export function Toaster(props: ToasterProps) {
  const theme = useTheme();
  const resolvedTheme = theme === 'system' ? 'system' : theme;

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}

// Re-export toast function for convenience
export { toast };

export default Toaster;
