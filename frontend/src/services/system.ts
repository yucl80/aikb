import { apiService } from './api';

export interface SystemStats {
  total_documents: number;
  total_queries: number;
  total_users: number;
  storage_used: string;
}

export const systemService = {
  async getStats(): Promise<SystemStats> {
    const response = await apiService.get('/system/stats');
    return response.data;
  }
};