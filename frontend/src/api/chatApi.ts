import api from './api';
import type { ChatMessage, UsersResponse } from '../types/interface';

export const chatApi = {
    getUserInfo: async (): Promise<UsersResponse | null> => {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const response = await api.get('/api/auth/me');
            return response.data;
        } catch (error) {
            console.error('사용자 정보 조회 에러:', error);
            return null;
        }
    },

    getChatHistory: async (sessionId: string, limit: number = 30): Promise<ChatMessage[]> => {
        try {
            const response = await api.get(`/api/chat/history/${sessionId}`, {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error('메시지 로드 에러:', error);
            return [];
        }
    },

    sendMessage: async (data: { sessionId: string; content: string; nickname: string; userId: number | null }) => {
        await api.post('/api/chat/send', data);
    }
};
