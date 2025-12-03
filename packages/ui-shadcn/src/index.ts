/**
 * @dailyuse/ui-shadcn
 *
 * shadcn/ui styled React components for DailyUse Electron desktop application.
 * Built on top of @dailyuse/ui-react hooks and Radix UI primitives.
 */

// Utilities
export { cn } from './lib/utils';

// Re-export React hooks from ui-react
export {
  useFormValidation,
  usePasswordStrength,
  useLoading,
  useMessage,
  useDialog,
  useColorPicker,
  // Core types
  type ValidationRule,
  type ValidationRules,
  type PasswordStrengthLevel,
  type PasswordStrengthResult,
  type LoadingState,
  type MessageType,
  type MessageOptions,
  type MessageState,
  type DialogState,
  type ColorPickerState,
  // Core utilities
  VALIDATION_RULES,
  generatePassword,
  isLightColor,
  hexToRgb,
  rgbToHex,
} from '@dailyuse/ui-react';

// UI Components
export { Button, buttonVariants, type ButtonProps } from './components/ui/button';
export { Input, type InputProps } from './components/ui/input';
export { Label } from './components/ui/label';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './components/ui/card';
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './components/ui/alert-dialog';
export { Progress } from './components/ui/progress';
export { Separator } from './components/ui/separator';
export { Switch } from './components/ui/switch';
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './components/ui/tooltip';
