/**
 * @dailyuse/ui-core - Loading State Machine
 *
 * Framework-agnostic loading state management.
 */

// ============================================================================
// Types
// ============================================================================

export interface LoadingState {
  /** Whether loading is currently active */
  isLoading: boolean;
  /** Loading counter for nested loading states */
  count: number;
  /** Optional loading message */
  message?: string;
  /** Optional progress percentage (0-100) */
  progress?: number;
}

export interface LoadingController {
  /** Get current loading state */
  getState(): LoadingState;
  /** Start loading (increments counter) */
  start(message?: string): void;
  /** Stop loading (decrements counter) */
  stop(): void;
  /** Force stop all loading */
  reset(): void;
  /** Set progress (0-100) */
  setProgress(progress: number): void;
  /** Subscribe to state changes */
  subscribe(listener: (state: LoadingState) => void): () => void;
}

export interface GlobalLoadingController extends LoadingController {
  /** Show loading overlay */
  show(message?: string): void;
  /** Hide loading overlay */
  hide(): void;
}

export type LoadingListener = (state: LoadingState) => void;

// ============================================================================
// Core Implementation
// ============================================================================

/**
 * Create a loading state controller
 */
export function createLoadingController(): LoadingController {
  let state: LoadingState = {
    isLoading: false,
    count: 0,
    message: undefined,
    progress: undefined,
  };

  const listeners = new Set<LoadingListener>();

  function notify() {
    for (const listener of listeners) {
      listener(state);
    }
  }

  return {
    getState() {
      return { ...state };
    },

    start(message?: string) {
      state = {
        ...state,
        count: state.count + 1,
        isLoading: true,
        message: message ?? state.message,
        progress: undefined,
      };
      notify();
    },

    stop() {
      const newCount = Math.max(0, state.count - 1);
      state = {
        ...state,
        count: newCount,
        isLoading: newCount > 0,
        message: newCount > 0 ? state.message : undefined,
        progress: newCount > 0 ? state.progress : undefined,
      };
      notify();
    },

    reset() {
      state = {
        isLoading: false,
        count: 0,
        message: undefined,
        progress: undefined,
      };
      notify();
    },

    setProgress(progress: number) {
      state = {
        ...state,
        progress: Math.max(0, Math.min(100, progress)),
      };
      notify();
    },

    subscribe(listener: LoadingListener) {
      listeners.add(listener);
      // Call immediately with current state
      listener(state);
      // Return unsubscribe function
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/**
 * Create a global loading overlay controller (singleton pattern)
 */
export function createGlobalLoadingController(): GlobalLoadingController {
  const controller = createLoadingController();

  return {
    ...controller,

    show(message?: string) {
      controller.start(message);
    },

    hide() {
      controller.stop();
    },
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wrap an async function with loading state
 */
export function withLoading<T extends unknown[], R>(
  controller: LoadingController,
  fn: (...args: T) => Promise<R>,
  message?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    controller.start(message);
    try {
      return await fn(...args);
    } finally {
      controller.stop();
    }
  };
}

/**
 * Create a loading wrapper for async operations
 */
export function createLoadingWrapper(controller: LoadingController) {
  return {
    /**
     * Execute an async function with loading state
     */
    async run<T>(fn: () => Promise<T>, message?: string): Promise<T> {
      controller.start(message);
      try {
        return await fn();
      } finally {
        controller.stop();
      }
    },

    /**
     * Wrap a function to automatically manage loading
     */
    wrap<T extends unknown[], R>(
      fn: (...args: T) => Promise<R>,
      message?: string
    ): (...args: T) => Promise<R> {
      return withLoading(controller, fn, message);
    },
  };
}

// ============================================================================
// Button Loading State
// ============================================================================

export interface ButtonLoadingState {
  loadingButtons: Map<string, boolean>;
}

export interface ButtonLoadingController {
  /** Check if a specific button is loading */
  isLoading(key: string): boolean;
  /** Set a button's loading state */
  setLoading(key: string, loading: boolean): void;
  /** Get all loading buttons */
  getLoadingButtons(): string[];
  /** Clear all button loading states */
  clear(): void;
  /** Subscribe to state changes */
  subscribe(listener: (buttons: string[]) => void): () => void;
}

/**
 * Create a button loading state controller
 */
export function createButtonLoadingController(): ButtonLoadingController {
  const loadingButtons = new Map<string, boolean>();
  const listeners = new Set<(buttons: string[]) => void>();

  function getLoadingList(): string[] {
    return Array.from(loadingButtons.entries())
      .filter(([, loading]) => loading)
      .map(([key]) => key);
  }

  function notify() {
    const buttons = getLoadingList();
    for (const listener of listeners) {
      listener(buttons);
    }
  }

  return {
    isLoading(key: string) {
      return loadingButtons.get(key) ?? false;
    },

    setLoading(key: string, loading: boolean) {
      if (loading) {
        loadingButtons.set(key, true);
      } else {
        loadingButtons.delete(key);
      }
      notify();
    },

    getLoadingButtons() {
      return getLoadingList();
    },

    clear() {
      loadingButtons.clear();
      notify();
    },

    subscribe(listener: (buttons: string[]) => void) {
      listeners.add(listener);
      listener(getLoadingList());
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

// ============================================================================
// Table Loading State
// ============================================================================

export interface TableLoadingState {
  /** Whether the table is loading */
  isLoading: boolean;
  /** Whether initial data is being loaded */
  isInitialLoading: boolean;
  /** Whether more data is being loaded */
  isLoadingMore: boolean;
  /** Whether data is being refreshed */
  isRefreshing: boolean;
  /** Total number of items */
  total: number;
  /** Number of loaded items */
  loaded: number;
}

export interface TableLoadingController {
  /** Get current state */
  getState(): TableLoadingState;
  /** Start initial loading */
  startInitialLoad(): void;
  /** Start loading more items */
  startLoadMore(): void;
  /** Start refresh */
  startRefresh(): void;
  /** Finish loading with item counts */
  finish(loaded: number, total: number): void;
  /** Set error state */
  error(): void;
  /** Subscribe to state changes */
  subscribe(listener: (state: TableLoadingState) => void): () => void;
}

/**
 * Create a table loading state controller
 */
export function createTableLoadingController(): TableLoadingController {
  let state: TableLoadingState = {
    isLoading: false,
    isInitialLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    total: 0,
    loaded: 0,
  };

  const listeners = new Set<(state: TableLoadingState) => void>();

  function notify() {
    for (const listener of listeners) {
      listener({ ...state });
    }
  }

  return {
    getState() {
      return { ...state };
    },

    startInitialLoad() {
      state = {
        ...state,
        isLoading: true,
        isInitialLoading: true,
        isLoadingMore: false,
        isRefreshing: false,
      };
      notify();
    },

    startLoadMore() {
      state = {
        ...state,
        isLoading: true,
        isInitialLoading: false,
        isLoadingMore: true,
        isRefreshing: false,
      };
      notify();
    },

    startRefresh() {
      state = {
        ...state,
        isLoading: true,
        isInitialLoading: false,
        isLoadingMore: false,
        isRefreshing: true,
      };
      notify();
    },

    finish(loaded: number, total: number) {
      state = {
        isLoading: false,
        isInitialLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
        loaded,
        total,
      };
      notify();
    },

    error() {
      state = {
        ...state,
        isLoading: false,
        isInitialLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
      };
      notify();
    },

    subscribe(listener: (state: TableLoadingState) => void) {
      listeners.add(listener);
      listener({ ...state });
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
