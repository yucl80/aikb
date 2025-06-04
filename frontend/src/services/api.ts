import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  Document,
  DocumentContent,
  SearchRequest,
  SearchResult,
  QuestionRequest,
  AnswerResponse,
  QueryHistory,
  PopularQuery,
  AIStats
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器 - 添加认证token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 处理认证错误
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // 认证相关
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await this.api.post<AuthResponse>('/auth/token', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await this.api.post<User>('/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/me');
    return response.data;
  }

  async updateProfile(data: { full_name?: string; bio?: string }): Promise<User> {
    const response = await this.api.put<User>('/auth/me', data);
    return response.data;
  }

  // 文档相关
  async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.api.post<Document>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getDocuments(skip = 0, limit = 100): Promise<Document[]> {
    const response = await this.api.get<Document[]>('/documents/', {
      params: { skip, limit },
    });
    return response.data;
  }

  async getDocument(id: number): Promise<Document> {
    const response = await this.api.get<Document>(`/documents/${id}`);
    return response.data;
  }

  async getDocumentContent(id: number): Promise<DocumentContent> {
    const response = await this.api.get<DocumentContent>(`/documents/${id}/content`);
    return response.data;
  }

  async deleteDocument(id: number): Promise<void> {
    await this.api.delete(`/documents/${id}`);
  }

  async updateDocumentTags(id: number, tags: string[]): Promise<void> {
    await this.api.put(`/documents/${id}/tags`, tags);
  }

  async searchDocuments(searchRequest: SearchRequest): Promise<SearchResult> {
    const response = await this.api.post<SearchResult>('/documents/search', searchRequest);
    return response.data;
  }

  // AI相关
  async askQuestion(question: QuestionRequest): Promise<AnswerResponse> {
    const response = await this.api.post<AnswerResponse>('/ai/ask', question);
    return response.data;
  }

  async getQueryHistory(limit = 20): Promise<QueryHistory[]> {
    const response = await this.api.get<QueryHistory[]>('/ai/history', {
      params: { limit },
    });
    return response.data;
  }

  async getPopularQueries(limit = 10): Promise<PopularQuery[]> {
    const response = await this.api.get<PopularQuery[]>('/ai/popular', {
      params: { limit },
    });
    return response.data;
  }

  async getAIStats(): Promise<AIStats> {
    const response = await this.api.get<AIStats>('/ai/stats');
    return response.data;
  }

  async generateSummary(text: string): Promise<{ summary: string }> {
    const response = await this.api.post<{ summary: string }>('/ai/summary', { text });
    return response.data;
  }

  async extractKeywords(text: string): Promise<{ keywords: string[] }> {
    const response = await this.api.post<{ keywords: string[] }>('/ai/keywords', { text });
    return response.data;
  }

  // 通用HTTP方法
  async get(url: string): Promise<any> {
    const response = await this.api.get(url);
    return response;
  }

  async post(url: string, data?: any): Promise<any> {
    const response = await this.api.post(url, data);
    return response;
  }

  async put(url: string, data?: any): Promise<any> {
    const response = await this.api.put(url, data);
    return response;
  }

  async delete(url: string): Promise<any> {
    const response = await this.api.delete(url);
    return response;
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; version: string }> {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;