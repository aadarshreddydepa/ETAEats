import type { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { api } from './client';
import { getAccessToken, handleUnauthorized } from './refresh';
import { parseDomainError } from './errors';

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export function setupInterceptors(): void {
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetryableConfig | undefined;

      const isRefreshEndpoint = original?.url?.includes('/auth/token/refresh/');

      if (!original || error.response?.status !== 401 || original._retry || isRefreshEndpoint) {
        throw parseDomainError(error);
      }

      original._retry = true;

      try {
        const newAccess = await handleUnauthorized();
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        throw parseDomainError(error);
      }
    },
  );
}
