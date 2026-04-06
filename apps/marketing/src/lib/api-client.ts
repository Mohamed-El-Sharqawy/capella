/**
 * Centralized API client for making requests to the backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  signal?: AbortSignal;
};

type NextFetchRequestConfig = {
  revalidate?: number | false;
  tags?: string[];
};

/**
 * Makes a fetch request to the API
 * @param endpoint - API endpoint (e.g., "/api/products")
 * @param options - Request options
 * @returns Response data
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, token, cache, next, signal } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit & { next?: NextFetchRequestConfig } = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  if (cache) {
    fetchOptions.cache = cache;
  }

  if (next) {
    fetchOptions.next = next;
  }

  if (signal) {
    fetchOptions.signal = signal;
  }

  const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * GET request helper
 */
export function apiGet<T = unknown>(
  endpoint: string,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "GET" });
}

/**
 * POST request helper
 */
export function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "POST", body });
}

/**
 * PUT request helper
 */
export function apiPut<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "PUT", body });
}

/**
 * PATCH request helper
 */
export function apiPatch<T = unknown>(
  endpoint: string,
  body?: unknown,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "PATCH", body });
}

/**
 * DELETE request helper
 */
export function apiDelete<T = unknown>(
  endpoint: string,
  options?: Omit<RequestOptions, "method" | "body">
): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "DELETE" });
}
