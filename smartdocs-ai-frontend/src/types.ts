export interface User {
  id?: string | number;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  id?: string | number;
  email?: string;
}

export interface DocumentItem {
  id: string | number;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'chunked' | 'ready' | string;
  chunk_count?: number;
  created_at?: string;
  size_bytes?: number;
}

export interface DocumentChunk {
  id?: string | number;
  content?: string;
  text?: string;
  chunk_index?: number;
  page?: number;
  metadata?: Record<string, unknown>;
}

export interface SourceReference {
  id?: string | number;
  content?: string;
  text?: string;
  page?: number;
  chunk_index?: number;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: SourceReference[];
  isError?: boolean;
}

export interface ChatResponse {
  answer?: string;
  response?: string;
  sources?: SourceReference[];
  detail?: string;
}
