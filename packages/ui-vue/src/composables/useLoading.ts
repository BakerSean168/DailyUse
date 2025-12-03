/**
 * @dailyuse/ui-vue - Loading Composables
 *
 * Vue 3 composables wrapping @dailyuse/ui-core loading state.
 */

import {
  ref,
  readonly,
  onUnmounted,
  type Ref,
  type DeepReadonly,
} from 'vue';
import {
  createLoadingController,
  createGlobalLoadingController,
  createButtonLoadingController,
  createTableLoadingController,
  createLoadingWrapper,
  type LoadingState,
  type ButtonLoadingController,
  type TableLoadingState,
} from '@dailyuse/ui-core';

// ============================================================================
// Basic Loading
// ============================================================================

/**
 * Basic loading state composable
 */
export function useLoading(): {
  /** Reactive loading state */
  state: DeepReadonly<Ref<LoadingState>>;
  /** Whether currently loading */
  isLoading: Ref<boolean>;
  /** Loading message */
  message: Ref<string | undefined>;
  /** Start loading */
  start: (message?: string) => void;
  /** Stop loading */
  stop: () => void;
  /** Reset loading */
  reset: () => void;
  /** Set progress */
  setProgress: (progress: number) => void;
  /** Wrap an async function with loading state */
  wrap: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
} {
  const controller = createLoadingController();
  const state = ref<LoadingState>(controller.getState());
  const isLoading = ref(false);
  const message = ref<string | undefined>();

  const unsubscribe = controller.subscribe((newState) => {
    state.value = newState;
    isLoading.value = newState.isLoading;
    message.value = newState.message;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  const wrapper = createLoadingWrapper(controller);

  return {
    state: readonly(state),
    isLoading,
    message,
    start: controller.start.bind(controller),
    stop: controller.stop.bind(controller),
    reset: controller.reset.bind(controller),
    setProgress: controller.setProgress.bind(controller),
    wrap: wrapper.run.bind(wrapper),
  };
}

// ============================================================================
// Global Loading
// ============================================================================

// Singleton global loading controller
let globalLoadingController: ReturnType<typeof createGlobalLoadingController> | null = null;

function getGlobalLoadingController() {
  if (!globalLoadingController) {
    globalLoadingController = createGlobalLoadingController();
  }
  return globalLoadingController;
}

/**
 * Global loading overlay composable (singleton)
 */
export function useGlobalLoading(): {
  /** Whether currently loading */
  isLoading: Ref<boolean>;
  /** Loading message */
  message: Ref<string | undefined>;
  /** Loading counter */
  count: Ref<number>;
  /** Show loading overlay */
  show: (message?: string) => void;
  /** Hide loading overlay */
  hide: () => void;
  /** Reset all loading */
  reset: () => void;
} {
  const controller = getGlobalLoadingController();
  const isLoading = ref(false);
  const message = ref<string | undefined>();
  const count = ref(0);

  const unsubscribe = controller.subscribe((state) => {
    isLoading.value = state.isLoading;
    message.value = state.message;
    count.value = state.count;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    isLoading,
    message,
    count,
    show: controller.show.bind(controller),
    hide: controller.hide.bind(controller),
    reset: controller.reset.bind(controller),
  };
}

// ============================================================================
// Advanced Loading (with utils integration)
// ============================================================================

/**
 * Advanced loading with wrapper utilities
 */
export function useAdvancedLoading() {
  const controller = createLoadingController();
  const wrapper = createLoadingWrapper(controller);

  const state = ref<LoadingState>(controller.getState());

  const unsubscribe = controller.subscribe((newState) => {
    state.value = newState;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    state: readonly(state),
    isLoading: ref(state.value.isLoading),
    controller,
    /**
     * Run an async function with loading state
     */
    run: wrapper.run.bind(wrapper),
    /**
     * Create a wrapped version of an async function
     */
    wrapFn: wrapper.wrap.bind(wrapper),
  };
}

// ============================================================================
// Button Loading
// ============================================================================

/**
 * Button-specific loading states
 */
export function useButtonLoading(): {
  /** Check if a button is loading */
  isLoading: (key: string) => boolean;
  /** Set a button's loading state */
  setLoading: (key: string, loading: boolean) => void;
  /** Get all loading button keys */
  loadingButtons: Ref<string[]>;
  /** Clear all loading states */
  clear: () => void;
  /** Create a button loading handler */
  createHandler: <T>(
    key: string,
    fn: () => Promise<T>
  ) => () => Promise<T>;
} {
  const controller = createButtonLoadingController();
  const loadingButtons = ref<string[]>([]);

  const unsubscribe = controller.subscribe((buttons) => {
    loadingButtons.value = buttons;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  function createHandler<T>(key: string, fn: () => Promise<T>) {
    return async () => {
      controller.setLoading(key, true);
      try {
        return await fn();
      } finally {
        controller.setLoading(key, false);
      }
    };
  }

  return {
    isLoading: controller.isLoading.bind(controller),
    setLoading: controller.setLoading.bind(controller),
    loadingButtons,
    clear: controller.clear.bind(controller),
    createHandler,
  };
}

// ============================================================================
// Table Loading
// ============================================================================

/**
 * Table-specific loading states
 */
export function useTableLoading(): {
  /** Reactive table loading state */
  state: DeepReadonly<Ref<TableLoadingState>>;
  /** Whether any loading is happening */
  isLoading: Ref<boolean>;
  /** Whether initial load is happening */
  isInitialLoading: Ref<boolean>;
  /** Whether loading more items */
  isLoadingMore: Ref<boolean>;
  /** Whether refreshing */
  isRefreshing: Ref<boolean>;
  /** Total items count */
  total: Ref<number>;
  /** Loaded items count */
  loaded: Ref<number>;
  /** Start initial loading */
  startInitialLoad: () => void;
  /** Start loading more */
  startLoadMore: () => void;
  /** Start refresh */
  startRefresh: () => void;
  /** Finish loading */
  finish: (loaded: number, total: number) => void;
  /** Set error state */
  error: () => void;
} {
  const controller = createTableLoadingController();
  const state = ref<TableLoadingState>(controller.getState());
  const isLoading = ref(false);
  const isInitialLoading = ref(false);
  const isLoadingMore = ref(false);
  const isRefreshing = ref(false);
  const total = ref(0);
  const loaded = ref(0);

  const unsubscribe = controller.subscribe((newState) => {
    state.value = newState;
    isLoading.value = newState.isLoading;
    isInitialLoading.value = newState.isInitialLoading;
    isLoadingMore.value = newState.isLoadingMore;
    isRefreshing.value = newState.isRefreshing;
    total.value = newState.total;
    loaded.value = newState.loaded;
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    state: readonly(state),
    isLoading,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    total,
    loaded,
    startInitialLoad: controller.startInitialLoad.bind(controller),
    startLoadMore: controller.startLoadMore.bind(controller),
    startRefresh: controller.startRefresh.bind(controller),
    finish: controller.finish.bind(controller),
    error: controller.error.bind(controller),
  };
}
