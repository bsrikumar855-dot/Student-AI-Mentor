import { CONFIG } from '../app/config';
import { getAuthHeaders } from './headers';
import { ApiError } from './errors';
import { z } from 'zod';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = CONFIG.API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodType<any>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(
        typeof errorData === 'object' && errorData && 'detail' in errorData
          ? String((errorData as { detail: unknown }).detail)
          : response.statusText,
        response.status,
        errorData
      );
    }

    const data = await response.json();

    if (schema) {
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        console.warn(`[Schema Mismatch] ${endpoint}:`, parsed.error);
      }
      return parsed.success ? (parsed.data as T) : (data as T);
    }

    return data as T;
  }

  public async get<T>(endpoint: string, schema?: z.ZodType<any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, schema);
  }

  public async post<T>(
    endpoint: string,
    body?: unknown,
    schema?: z.ZodType<any>
  ): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body ?? {}),
      },
      schema
    );
  }
}

export const apiClient = new ApiClient();
export default apiClient;
