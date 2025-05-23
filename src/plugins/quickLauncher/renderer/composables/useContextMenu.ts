import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuickLauncherStore } from '../store';

export function useContextMenu() {
    const { t } = useI18n();
    const showContextMenu = ref(false);
    const contextMenuX = ref(0);
    const contextMenuY = ref(0);
    const contextMenuItems = ref([] as any[]);
    const selectedItem = ref<any>(null);
    const store = useQuickLauncherStore();

    const getCategoryListAreaContextMenuItems = (createCategory: Function) => [
        { value: 'newCategory', title: t('quickLauncher.category.new'), action: createCategory }
    ];

    const getCategoryListItemContextMenuItems = (
        renameCategory: Function,
        deleteCategory: Function
    ) => [
            { value: 'renameCategory', title: t('quickLauncher.category.rename'), action: renameCategory },
            { value: 'deleteCategory', title: t('quickLauncher.category.delete'), className: 'text-error', action: deleteCategory },
            { divider: true },
        ];

    const getShortcutListAreaContextMenuItems = (
        addShortcut: Function,
        addTitle: Function
    ) => [
            { value: 'newTitle', title: t('quickLauncher.shortcut.newTitle'), action: addTitle },
            { value: 'newShortcut', title: t('quickLauncher.shortcut.new'), action: addShortcut },

            { divider: true },
        ];

    const getShortcutListItemContextMenuItems = (
        editShortcut: Function,
        deleteShortcut: Function,
        openShortcutLocation: Function
    ) => [
            { value: 'editShortcut', title: t('quickLauncher.shortcut.edit'), action: editShortcut },
            { value: 'deleteShortcut', title: t('quickLauncher.shortcut.delete'), className: 'text-error', action: deleteShortcut },
            { value: 'openShortcutLocation', title: t('quickLauncher.shortcut.openShortcutLocation'), action: openShortcutLocation },
            { divider: true },
        ];
    // Show functions
    const showCategoryListAreaContextMenu = (e: MouseEvent, items: any[]) => {
        contextMenuItems.value = items;
        showContextMenu.value = true;
        contextMenuX.value = e.clientX;
        contextMenuY.value = e.clientY;
    };

    const showCategoryListItemContextMenu = (e: MouseEvent, categoryId: any, items: any[]) => {
        e.preventDefault();
        store.setSelectedCategory(categoryId);
        contextMenuItems.value = items;
        showContextMenu.value = true;
        contextMenuX.value = e.clientX;
        contextMenuY.value = e.clientY;
    };

    const showShortcutListAreaContextMenu = (e: MouseEvent, items: any[]) => {
        contextMenuItems.value = items;
        showContextMenu.value = true;
        contextMenuX.value = e.clientX;
        contextMenuY.value = e.clientY;
    };

    const showShortcutListItemContextMenu = (e: MouseEvent, shortcutId: any, items: any[]) => {
        e.preventDefault();
        store.setSelectedItem(shortcutId);
        contextMenuItems.value = items;
        showContextMenu.value = true;
        contextMenuX.value = e.clientX;
        contextMenuY.value = e.clientY;
    };
    return {
        showContextMenu,
        contextMenuX,
        contextMenuY,
        contextMenuItems,
        selectedItem,
        getCategoryListAreaContextMenuItems,
        getCategoryListItemContextMenuItems,
        showCategoryListAreaContextMenu,
        showCategoryListItemContextMenu,
        getShortcutListAreaContextMenuItems,
        getShortcutListItemContextMenuItems,
        showShortcutListAreaContextMenu,
        showShortcutListItemContextMenu
    };
}