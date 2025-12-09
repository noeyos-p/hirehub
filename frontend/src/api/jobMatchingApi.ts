import api from './api';

export interface MatchResult {
  jobId?: number;
  jobTitle: string;
  companyName: string;
  score: number;
  grade: string;
  reasons: string[];
}

export interface JobMatchingHistory {
  id: number;
  resumeId: number;
  resumeTitle: string;
  matchResults: MatchResult[];
  createdAt: string;
}

export interface SaveJobMatchingRequest {
  resumeId: number;
  resumeTitle: string;
  matchResults: MatchResult[];
}

export const jobMatchingApi = {
  // 매칭 이력 저장
  async saveHistory(data: SaveJobMatchingRequest): Promise<JobMatchingHistory> {
    const response = await api.post('/api/job-matching/history', data);
    return response.data;
  },

  // 매칭 이력 목록 조회
  async getHistoryList(): Promise<JobMatchingHistory[]> {
    const response = await api.get('/api/job-matching/history');
    return response.data;
  },

  // 매칭 이력 상세 조회
  async getHistoryDetail(id: number): Promise<JobMatchingHistory> {
    const response = await api.get(`/api/job-matching/history/${id}`);
    return response.data;
  },

  // 매칭 이력 삭제
  async deleteHistory(id: number): Promise<void> {
    await api.delete(`/api/job-matching/history/${id}`);
  },
};
