/**
 * Container Hooks - DI 容器 React Hooks
 * 
 * @module renderer/shared/infrastructure/di
 */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { IModuleContainer, ServiceIdentifier } from './types';
import { containerRegistry, getModuleContainer } from './container-registry';

// ============ Registry State Management ============

type RegistryListener = () => void;
const registryListeners = new Set<RegistryListener>();

function subscribeToRegistry(listener: RegistryListener): () => void {
  registryListeners.add(listener);
  return () => registryListeners.delete(listener);
}

function getRegistrySnapshot(): boolean {
  return containerRegistry.isInitialized;
}

/**
 * 触发注册表状态更新
 */
export function notifyRegistryChange(): void {
  registryListeners.forEach(listener => listener());
}

// ============ Hooks ============

/**
 * 获取模块容器
 * 
 * @example
 * ```typescript
 * const { container, isInitialized } = useContainer<TaskContainer>('task');
 * const taskClient = container.get(TaskTokens.TemplateClient);
 * ```
 */
export function useContainer<T extends IModuleContainer>(moduleName: string): {
  container: T | null;
  isInitialized: boolean;
  error: Error | null;
} {
  const [container, setContainer] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const isRegistryInitialized = useSyncExternalStore(
    subscribeToRegistry,
    getRegistrySnapshot
  );

  useEffect(() => {
    if (!containerRegistry.hasModule(moduleName)) {
      setContainer(null);
      return;
    }

    try {
      const moduleContainer = getModuleContainer<T>(moduleName);
      setContainer(moduleContainer);
      setError(null);

      // 如果容器尚未初始化，等待初始化
      if (!moduleContainer.isInitialized) {
        moduleContainer.initialize()
          .then(() => {
            setContainer(moduleContainer);
            notifyRegistryChange();
          })
          .catch((err) => {
            setError(err instanceof Error ? err : new Error(String(err)));
          });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setContainer(null);
    }
  }, [moduleName, isRegistryInitialized]);

  return {
    container,
    isInitialized: container?.isInitialized ?? false,
    error,
  };
}

/**
 * 获取模块服务
 * 
 * @example
 * ```typescript
 * const { service: taskClient, isReady } = useService<TaskTemplateIPCClient>(
 *   'task',
 *   TaskTokens.TemplateClient
 * );
 * ```
 */
export function useService<T>(
  moduleName: string,
  serviceId: ServiceIdentifier<T>
): {
  service: T | null;
  isReady: boolean;
  error: Error | null;
} {
  const { container, isInitialized, error: containerError } = useContainer(moduleName);
  const [service, setService] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!container || !isInitialized) {
      setService(null);
      return;
    }

    try {
      const svc = container.get<T>(serviceId);
      setService(svc);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setService(null);
    }
  }, [container, isInitialized, serviceId]);

  return {
    service,
    isReady: service !== null,
    error: error ?? containerError,
  };
}

/**
 * 获取多个服务
 * 
 * @example
 * ```typescript
 * const services = useServices('task', {
 *   templateClient: TaskTokens.TemplateClient,
 *   instanceClient: TaskTokens.InstanceClient,
 * });
 * ```
 */
export function useServices<T extends Record<string, ServiceIdentifier>>(  moduleName: string,
  serviceIds: T
): {
  services: Record<keyof T, unknown>;
  isReady: boolean;
  errors: Record<string, Error>;
} {
  const { container, isInitialized } = useContainer(moduleName);
  const [services, setServices] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, Error>>({});

  useEffect(() => {
    if (!container || !isInitialized) {
      setServices({});
      return;
    }

    const newServices: Record<string, unknown> = {};
    const newErrors: Record<string, Error> = {};

    for (const [key, serviceId] of Object.entries(serviceIds)) {
      try {
        newServices[key] = container.get(serviceId);
      } catch (err) {
        newErrors[key] = err instanceof Error ? err : new Error(String(err));
        newServices[key] = null;
      }
    }

    setServices(newServices);
    setErrors(newErrors);
  }, [container, isInitialized, serviceIds]);

  const isReady = useMemo(
    () => Object.keys(errors).length === 0 && Object.values(services).every(s => s !== null),
    [errors, services]
  );

  return {
    services: services as Record<keyof T, unknown>,
    isReady,
    errors,
  };
}

/**
 * 等待所有容器初始化完成
 * 
 * @example
 * ```typescript
 * const { isReady, errors } = useContainerReady();
 * if (!isReady) return <Loading />;
 * ```
 */
export function useContainerReady(): {
  isReady: boolean;
  isInitializing: boolean;
  errors: Error[];
  status: Record<string, boolean>;
} {
  const [isInitializing, setIsInitializing] = useState(false);
  const [errors, setErrors] = useState<Error[]>([]);
  
  const isReady = useSyncExternalStore(
    subscribeToRegistry,
    getRegistrySnapshot
  );

  const status = useMemo(() => containerRegistry.getInitializationStatus(), [isReady]);

  const initializeAll = useCallback(async () => {
    if (isReady || isInitializing) return;
    
    setIsInitializing(true);
    try {
      await containerRegistry.initializeAll();
      setErrors([]);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray((err as { errors: unknown[] }).errors)) {
        setErrors((err as { errors: Error[] }).errors);
      } else {
        setErrors([err instanceof Error ? err : new Error(String(err))]);
      }
    } finally {
      setIsInitializing(false);
      notifyRegistryChange();
    }
  }, [isReady, isInitializing]);

  useEffect(() => {
    initializeAll();
  }, [initializeAll]);

  return {
    isReady,
    isInitializing,
    errors,
    status,
  };
}

/**
 * 获取服务的工厂函数（用于按需创建）
 */
export function useServiceFactory<T>(
  moduleName: string,
  serviceId: ServiceIdentifier<T>
): () => T | null {
  const { container, isInitialized } = useContainer(moduleName);

  return useCallback(() => {
    if (!container || !isInitialized) return null;
    try {
      return container.get<T>(serviceId);
    } catch {
      return null;
    }
  }, [container, isInitialized, serviceId]);
}
