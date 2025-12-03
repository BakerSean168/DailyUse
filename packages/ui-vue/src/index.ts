/**
 * @dailyuse/ui-vue
 *
 * Vue 3 composables for DailyUse headless UI.
 *
 * This package provides Vue 3 composables that wrap the framework-agnostic
 * logic from @dailyuse/ui-core, making it reactive and easy to use in Vue.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useDialog, useSnackbar, usePasswordStrength } from '@dailyuse/ui-vue';
 *
 * const dialog = useDialog();
 * const snackbar = useSnackbar();
 * const { score, suggestions } = usePasswordStrength(password);
 *
 * async function handleDelete() {
 *   const confirmed = await dialog.confirmDelete({ itemName: 'Item' });
 *   if (confirmed) {
 *     // Delete the item
 *     snackbar.success('Item deleted!');
 *   }
 * }
 * </script>
 * ```
 */

export * from './composables';
