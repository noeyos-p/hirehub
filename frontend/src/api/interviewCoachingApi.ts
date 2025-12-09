import api from './api';

export interface InterviewSession {
  question: string;
  category: string;
  answer: string;
  feedback: string;
}

export interface InterviewCoachingHistory {
  id: number;
  resumeId: number;
  resumeTitle: string;
  jobPostLink?: string;
  companyLink?: string;
  sessions: InterviewSession[];
  createdAt: string;
}

export interface SaveInterviewCoachingRequest {
  resumeId: number;
  resumeTitle: string;
  jobPostLink?: string;
  companyLink?: string;
  sessions: InterviewSession[];
}

export const interviewCoachingApi = {
  // 면접 연습 이력 저장
  async saveHistory(data: SaveInterviewCoachingRequest): Promise<InterviewCoachingHistory> {
    const response = await api.post('/api/interview-coaching/history', data);
    return response.data;
  },

  // 면접 연습 이력 목록 조회
  async getHistoryList(): Promise<InterviewCoachingHistory[]> {
    const response = await api.get('/api/interview-coaching/history');
    return response.data;
  },

  // 면접 연습 이력 상세 조회
  async getHistoryDetail(id: number): Promise<InterviewCoachingHistory> {
    const response = await api.get(`/api/interview-coaching/history/${id}`);
    return response.data;
  },

  // 면접 연습 이력 삭제
  async deleteHistory(id: number): Promise<void> {
    await api.delete(`/api/interview-coaching/history/${id}`);
  },
};
