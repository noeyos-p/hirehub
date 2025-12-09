import api from './api';

export interface CoverLetterHistory {
  id: number;
  resumeId?: number;
  resumeTitle?: string;
  inputMode: 'text' | 'essay' | 'resume';
  originalText: string;
  improvedText: string;
  createdAt: string;
}

export interface SaveCoverLetterRequest {
  resumeId?: number;
  resumeTitle?: string;
  inputMode: 'text' | 'essay' | 'resume';
  originalText: string;
  improvedText: string;
}

export const coverLetterApi = {
  // 첨삭 이력 저장
  async saveHistory(data: SaveCoverLetterRequest): Promise<CoverLetterHistory> {
    const response = await api.post('/api/cover-letter/history', data);
    return response.data;
  },

  // 첨삭 이력 목록 조회
  async getHistoryList(): Promise<CoverLetterHistory[]> {
    const response = await api.get('/api/cover-letter/history');
    return response.data;
  },

  // 첨삭 이력 상세 조회
  async getHistoryDetail(id: number): Promise<CoverLetterHistory> {
    const response = await api.get(`/api/cover-letter/history/${id}`);
    return response.data;
  },

  // 첨삭 이력 삭제
  async deleteHistory(id: number): Promise<void> {
    await api.delete(`/api/cover-letter/history/${id}`);
  },
};
