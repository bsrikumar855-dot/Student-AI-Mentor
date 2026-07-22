import { z } from 'zod';

const BASE_URL = ''; // Relative path so MSW intercepts locally

interface RequestOptions extends RequestInit {
  schema?: z.ZodType<any, any, any>;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { schema, ...init } = options;
  const token = localStorage.getItem('drishta_auth_token');

  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errJson = JSON.parse(text);
      if (errJson.message) message = errJson.message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }

  const data = await response.json();

  if (schema) {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      const errorMsg = `Zod validation failure at ${path}: ${parseResult.error.message}`;
      console.error(errorMsg, parseResult.error.format());
      throw new Error(errorMsg);
    }
    return parseResult.data as T;
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, schema?: z.ZodType<T, any, any>, options?: RequestInit) =>
    request<T>(path, { method: 'GET', schema, ...options }),

  post: <T>(path: string, body?: any, schema?: z.ZodType<T, any, any>, options?: RequestInit) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      schema,
      ...options,
    }),
};
export default apiClient;
