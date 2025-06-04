// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  avatar_url?: string;
  bio?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// 文档相关类型
export interface Document {
  id: number;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  summary?: string;
  tags?: string[];
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface DocumentContent {
  id: number;
  title: string;
  content: string;
  summary?: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
}

export interface SearchResult {
  documents: string[];
  metadatas: any[];
  distances: number[];
  ids: string[];
}

// AI相关类型
export interface QuestionRequest {
  question: string;
}

export interface AnswerResponse {
  answer: string;
  confidence: number;
  context: any[];
  response_time: number;
  query_id: number;
}

export interface QueryHistory {
  id: number;
  question: string;
  answer: string;
  confidence_score?: number;
  response_time?: number;
  created_at: string;
}

export interface PopularQuery {
  question: string;
  count: number;
}

export interface AIStats {
  total_queries: number;
  average_response_time: number;
  average_confidence: number;
}

// 知识图谱相关类型
export interface KnowledgeNode {
  id: string;
  name: string;
  type: string;
  properties?: any;
}

export interface KnowledgeLink {
  source: string;
  target: string;
  type: string;
  confidence?: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}

// API响应类型
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// 通用类型
export interface PaginationParams {
  skip?: number;
  limit?: number;
}