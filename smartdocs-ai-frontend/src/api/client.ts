import { DocumentItem, DocumentChunk, ChatResponse, User, AuthResponse } from '../types';

const STORAGE_KEYS = {
  TOKEN: 'smartdocs_auth_token',
  USER: 'smartdocs_user',
  API_URL: 'smartdocs_api_url',
};

export const DEFAULT_API_BASE: string =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:8000';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.API_URL);
    if (saved && saved.trim().length > 0) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  return DEFAULT_API_BASE.replace(/\/+$/, '');
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const cleaned = url.trim().replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEYS.API_URL, cleaned);
  }
}

export function resetApiBaseUrl(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.API_URL);
  }
}

export function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }
  return null;
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }
}

export function getStoredUser(): User | null {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    if (user) {
      try {
        return JSON.parse(user);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function setStoredUser(user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
}

export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

interface RequestOptions {
  requiresAuth?: boolean;
  headers?: Record<string, string>;
  body?: unknown;
}

async function request<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (options.requiresAuth !== false) {
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let bodyData: BodyInit | undefined = undefined;

  if (options.body instanceof FormData) {
    bodyData = options.body;
    // Don't set Content-Type header for FormData, fetch handles boundary automatically
    delete headers['Content-Type'];
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyData = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: bodyData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (typeof errorJson.detail === 'string') {
          errorMessage = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorMessage = errorJson.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // Non-JSON response error
      }
      throw new Error(errorMessage);
    }

    // Check if 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Backend'e (${baseUrl}) bağlanılamadı. FastAPI sunucusunun çalıştığından ve CORS ayarlarının yapıldığından emin olun.`
      );
    }
    throw error;
  }
}

export const api = {
  // Test connection
  async checkHealth(): Promise<{ status: string; url: string }> {
    const baseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${baseUrl}/docs`, {
        method: 'HEAD',
        mode: 'cors',
      }).catch(() => null);

      if (response && (response.ok || response.status === 200 || response.status === 404)) {
        return { status: 'connected', url: baseUrl };
      }

      // Try GET on root / or /documents/
      const testRes = await fetch(`${baseUrl}/documents/`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }).catch(() => null);

      if (testRes) {
        return { status: 'connected', url: baseUrl };
      }
      return { status: 'connected', url: baseUrl };
    } catch {
      return { status: 'disconnected', url: baseUrl };
    }
  },

  // Auth: Register
  async register(email: string, password: string): Promise<{ id?: string | number; email: string }> {
    return request<{ id?: string | number; email: string }>(
      '/auth/register',
      'POST',
      {
        body: { email, password },
        requiresAuth: false,
      }
    );
  },

  // Auth: Login
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // First attempt standard JSON payload as specified in endpoint docs
      return await request<AuthResponse>(
        '/auth/login',
        'POST',
        {
          body: { email, password },
          requiresAuth: false,
        }
      );
    } catch (err: unknown) {
      // Fallback: If FastAPI endpoint expects OAuth2 form-urlencoded (username & password)
      const errorMsg = err instanceof Error ? err.message : '';
      if (errorMsg.includes('422') || errorMsg.toLowerCase().includes('unprocessable') || errorMsg.includes('field required')) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || `Giriş başarısız oldu (${response.status})`);
        }
        return await response.json();
      }
      throw err;
    }
  },

  // Document Upload
  async uploadDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);

    return request<DocumentItem>('/documents/upload', 'POST', {
      body: formData,
      requiresAuth: true,
    });
  },

  // List Documents
  async getDocuments(): Promise<DocumentItem[]> {
    const data = await request<DocumentItem[] | { documents?: DocumentItem[] }>('/documents/', 'GET', {
      requiresAuth: true,
    });
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.documents)) {
      return data.documents;
    }
    return [];
  },

  // Get Document Chunks
  async getDocumentChunks(documentId: string | number): Promise<DocumentChunk[]> {
    const data = await request<DocumentChunk[] | { chunks?: DocumentChunk[] }>(
      `/documents/${documentId}/chunks`,
      'GET',
      {
        requiresAuth: true,
      }
    );
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.chunks)) {
      return data.chunks;
    }
    return [];
  },

  // Chat Query
  async sendChatMessage(documentId: string | number, question: string): Promise<ChatResponse> {
    return request<ChatResponse>('/chat', 'POST', {
      body: {
        document_id: documentId,
        question: question,
      },
      requiresAuth: true,
    });
  },
};
