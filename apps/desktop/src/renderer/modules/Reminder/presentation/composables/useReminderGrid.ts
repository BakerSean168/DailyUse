import { ref, computed } from 'vue';
import { GridItem } from '../../../../../common/modules/reminder/types/reminder';
import { useReminderStore } from '../stores/reminderStore';
import { ReminderTemplateGroup } from '../../domain/aggregates/reminderTemplateGroup';

export function useReminderGrid() {
  const reminderStore = useReminderStore();

  const selectedItem = ref<GridItem | null>(null);
  const isDetailPanelOpen = ref(false);

  const allGridItems = computed<GridItem[]>(() => {
    const groupItems: ReminderTemplateGroup[] = reminderStore.getAllReminderGroupExceptSystemGroup;
    const systemGroup = reminderStore.getSystemGroup;

    // 获取所有已分组的模板 UUID 集合
    const groupedTemplateUuids = new Set<string>();
    for (const group of groupItems) {
      for (const template of group.templates) {
        groupedTemplateUuids.add(template.uuid);
      }
    }

    // 只渲染未分组的模板（groupUuid 为 null/undefined/空字符串 且不在任何其他分组中）
    const ungroupedTemplates = (systemGroup?.templates ?? []).filter((template) => {
      const hasNoGroupUuid = !template.groupUuid || template.groupUuid === '' || template.groupUuid === null || template.groupUuid === 'system-root';
      const notInOtherGroup = !groupedTemplateUuids.has(template.uuid);
      return hasNoGroupUuid && notInOtherGroup;
    });

    const allGridItems: GridItem[] = [...ungroupedTemplates, ...groupItems];
    console.log('所有网格项:', allGridItems, {
      ungroupedCount: ungroupedTemplates.length,
      groupCount: groupItems.length,
      groupedTemplateUuids: Array.from(groupedTemplateUuids),
    });
    return allGridItems;
  });

  const selectItem = (item: GridItem) => {
    selectedItem.value = item;
    isDetailPanelOpen.value = true;
  };

  const closeDetailPanel = () => {
    isDetailPanelOpen.value = false;
    selectedItem.value = null;
  };

  return {
    allGridItems,
    selectedItem,
    isDetailPanelOpen,
    selectItem,
    closeDetailPanel,
  };
}
