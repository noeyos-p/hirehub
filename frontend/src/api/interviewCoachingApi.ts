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

// localStorage 키
const HISTORY_STORAGE_KEY = 'interview_coaching_history';

// localStorage 헬퍼 함수
const getHistoryFromStorage = (): InterviewCoachingHistory[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('localStorage 읽기 실패:', error);
    return [];
  }
};

const saveHistoryToStorage = (history: InterviewCoachingHistory[]): void => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('localStorage 저장 실패:', error);
  }
};

export const interviewCoachingApi = {
  // 면접 연습 이력 저장
  async saveHistory(data: SaveInterviewCoachingRequest): Promise<InterviewCoachingHistory> {
    try {
      // 백엔드 API 시도
      const response = await api.post('/api/interview-coaching/history', data);
      return response.data;
    } catch (error) {
      // 백엔드 실패 시 localStorage 사용
      console.log('📦 localStorage에 저장합니다');
      const histories = getHistoryFromStorage();
      const newHistory: InterviewCoachingHistory = {
        id: Date.now(), // 임시 ID
        resumeId: data.resumeId,
        resumeTitle: data.resumeTitle,
        jobPostLink: data.jobPostLink,
        companyLink: data.companyLink,
        sessions: data.sessions,
        createdAt: new Date().toISOString(),
      };
      histories.unshift(newHistory);
      saveHistoryToStorage(histories);
      return newHistory;
    }
  },

  // 면접 연습 이력 목록 조회
  async getHistoryList(): Promise<InterviewCoachingHistory[]> {
    try {
      // 백엔드 API 시도
      console.log('🔄 백엔드 API 호출 시도: /api/interview-coaching/history');
      const response = await api.get('/api/interview-coaching/history');
      console.log('✅ 백엔드에서 데이터 가져오기 성공:', response.data);
      return response.data;
    } catch (error: any) {
      // 백엔드 실패 시 localStorage 사용
      console.error('❌ 백엔드 API 호출 실패:', error);
      console.error('상태 코드:', error.response?.status);
      console.error('에러 메시지:', error.response?.data);
      console.error('요청 URL:', error.config?.url);
      console.log('📦 localStorage에서 불러옵니다');
      return getHistoryFromStorage();
    }
  },

  // 면접 연습 이력 상세 조회
  async getHistoryDetail(id: number): Promise<InterviewCoachingHistory> {
    try {
      // 백엔드 API 시도
      const response = await api.get(`/api/interview-coaching/history/${id}`);
      return response.data;
    } catch (error) {
      // 백엔드 실패 시 localStorage 사용
      const histories = getHistoryFromStorage();
      const found = histories.find(h => h.id === id);
      if (!found) throw new Error('이력을 찾을 수 없습니다');
      return found;
    }
  },

  // 면접 연습 이력 삭제
  async deleteHistory(id: number): Promise<void> {
    try {
      // 백엔드 API 시도
      await api.delete(`/api/interview-coaching/history/${id}`);
    } catch (error) {
      // 백엔드 실패 시 localStorage 사용
      const histories = getHistoryFromStorage();
      const filtered = histories.filter(h => h.id !== id);
      saveHistoryToStorage(filtered);
    }
  },
};
