/**
 * Bookmark Store
 * Story 11.4: Bookmarks 功能
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { RepositoryContracts } from '@dailyuse/contracts';
import { v4 as uuidv4 } from 'uuid';

type Bookmark = RepositoryContracts.Bookmark;
type BookmarkTargetType = RepositoryContracts.BookmarkTargetType;

const STORAGE_KEY = 'repository-bookmarks';

export const useBookmarkStore = defineStore('repository-bookmarks', () => {
  // State
  const bookmarks = ref<Bookmark[]>([]);

  // Computed
  const bookmarksByRepository = computed(() => {
    return (repositoryUuid: string) =>
      bookmarks.value.filter(b => b.repositoryUuid === repositoryUuid);
  });

  const bookmarkCount = computed(() => bookmarks.value.length);

  const hasBookmark = computed(() => {
    return (targetUuid: string) =>
      bookmarks.value.some(b => b.targetUuid === targetUuid);
  });

  /**
   * 加载书签
   */
  function loadBookmarks(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        bookmarks.value = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      bookmarks.value = [];
    }
  }

  /**
   * 保存书签
   */
  function saveBookmarks(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks.value));
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }

  /**
   * 添加书签
   */
  function addBookmark(params: {
    name: string;
    targetUuid: string;
    targetType: BookmarkTargetType;
    repositoryUuid: string;
    icon?: string;
  }): Bookmark {
    // 检查是否已存在
    const existing = bookmarks.value.find(b => b.targetUuid === params.targetUuid);
    if (existing) {
      console.warn('Bookmark already exists for target:', params.targetUuid);
      return existing;
    }

    // 创建新书签
    const newBookmark: Bookmark = {
      uuid: uuidv4(),
      name: params.name,
      targetUuid: params.targetUuid,
      targetType: params.targetType,
      repositoryUuid: params.repositoryUuid,
      order: bookmarks.value.length,
      icon: params.icon,
      createdAt: new Date().toISOString(),
    };

    bookmarks.value.push(newBookmark);
    saveBookmarks();

    return newBookmark;
  }

  /**
   * 删除书签
   */
  function removeBookmark(uuid: string): void {
    const index = bookmarks.value.findIndex(b => b.uuid === uuid);
    if (index !== -1) {
      bookmarks.value.splice(index, 1);
      // 重新排序
      bookmarks.value.forEach((b, i) => {
        b.order = i;
      });
      saveBookmarks();
    }
  }

  /**
   * 根据目标删除书签
   */
  function removeBookmarkByTarget(targetUuid: string): void {
    const bookmark = bookmarks.value.find(b => b.targetUuid === targetUuid);
    if (bookmark) {
      removeBookmark(bookmark.uuid);
    }
  }

  /**
   * 更新书签
   */
  function updateBookmark(uuid: string, updates: { name?: string; order?: number }): void {
    const bookmark = bookmarks.value.find(b => b.uuid === uuid);
    if (bookmark) {
      if (updates.name !== undefined) {
        bookmark.name = updates.name;
      }
      if (updates.order !== undefined) {
        bookmark.order = updates.order;
      }
      saveBookmarks();
    }
  }

  /**
   * 重新排序书签
   */
  function reorderBookmarks(uuids: string[]): void {
    const reordered: Bookmark[] = [];
    
    uuids.forEach((uuid, index) => {
      const bookmark = bookmarks.value.find(b => b.uuid === uuid);
      if (bookmark) {
        bookmark.order = index;
        reordered.push(bookmark);
      }
    });

    bookmarks.value = reordered;
    saveBookmarks();
  }

  /**
   * 上移书签
   */
  function moveUp(uuid: string): void {
    const index = bookmarks.value.findIndex(b => b.uuid === uuid);
    if (index > 0) {
      const temp = bookmarks.value[index];
      bookmarks.value[index] = bookmarks.value[index - 1];
      bookmarks.value[index - 1] = temp;
      
      // 更新 order
      bookmarks.value.forEach((b, i) => {
        b.order = i;
      });
      
      saveBookmarks();
    }
  }

  /**
   * 下移书签
   */
  function moveDown(uuid: string): void {
    const index = bookmarks.value.findIndex(b => b.uuid === uuid);
    if (index < bookmarks.value.length - 1 && index !== -1) {
      const temp = bookmarks.value[index];
      bookmarks.value[index] = bookmarks.value[index + 1];
      bookmarks.value[index + 1] = temp;
      
      // 更新 order
      bookmarks.value.forEach((b, i) => {
        b.order = i;
      });
      
      saveBookmarks();
    }
  }

  /**
   * 清空仓储的所有书签
   */
  function clearRepositoryBookmarks(repositoryUuid: string): void {
    bookmarks.value = bookmarks.value.filter(b => b.repositoryUuid !== repositoryUuid);
    saveBookmarks();
  }

  // 初始化时加载书签
  loadBookmarks();

  return {
    // State
    bookmarks,

    // Computed
    bookmarksByRepository,
    bookmarkCount,
    hasBookmark,

    // Actions
    addBookmark,
    removeBookmark,
    removeBookmarkByTarget,
    updateBookmark,
    reorderBookmarks,
    moveUp,
    moveDown,
    clearRepositoryBookmarks,
    loadBookmarks,
  };
});
