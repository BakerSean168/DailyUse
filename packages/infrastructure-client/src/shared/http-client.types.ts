/**
 * HTTP Client Types
 *
 * Abstract HTTP client interface that adapters depend on.
 * This allows different HTTP implementations (axios, fetch, etc.)
 */

/**
 * HTTP Client Configuration
 */
export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * HTTP Request Options
 */
export interface HttpRequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * Abstract HTTP Client Interface
 *
 * Implementations:
 * - AxiosHttpClient: Uses axios (for web)
 * - FetchHttpClient: Uses native fetch
 * - IpcHttpClient: Uses Electron IPC (for desktop)
 */
export interface HttpClient {
  get<T>(url: string, options?: HttpRequestOptions): Promise<T>;
  post<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T>;
  put<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T>;
  patch<T>(url: string, data?: unknown, options?: HttpRequestOptions): Promise<T>;
  delete<T>(url: string, options?: HttpRequestOptions): Promise<T>;
}

/**
 * Type alias for HttpClient (more explicit naming)
 */
export type IHttpClient = HttpClient;
