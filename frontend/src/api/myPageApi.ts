import api from './api';
import type {
    UsersResponse,
    UsersRequest,
    PagedResponse,
    FavoriteCompanyResponse,
    ApplyItem,
    ResumeItem,
    ResumeDto,
    MyProfileDto,
    JobPosts
} from '../types/interface';

export const myPageApi = {
    // MyInfo
    getMyInfo: async (): Promise<UsersResponse> => {
        const { data } = await api.get('/api/mypage/me');
        return data;
    },

    updateMyInfo: async (partial: Partial<UsersRequest>): Promise<UsersResponse> => {
        const { data } = await api.put('/api/mypage/me', partial);
        return data;
    },

    withdraw: async (): Promise<void> => {
        await api.delete('/api/mypage/withdraw');
    },

    // FavoriteCompanies
    getFavoriteCompanies: async (params: { page: number; size: number }): Promise<PagedResponse<FavoriteCompanyResponse>> => {
        const { data } = await api.get('/api/mypage/favorites/companies', { params });
        return data;
    },

    deleteFavoriteCompany: async (companyId: number): Promise<void> => {
        await api.delete(`/api/mypage/favorites/companies/${companyId}`);
    },

    getOpenPosts: async (companyId: number): Promise<any> => {
        // This function tries multiple endpoints as per original logic
        try {
            const { data } = await api.get(`/api/companies/${companyId}/jobposts`, {
                params: { size: 200 },
            });
            return data;
        } catch { }
        try {
            const { data } = await api.get(`/api/jobposts`, {
                params: { companyId, size: 200 },
            });
            return data;
        } catch { }
        try {
            const { data } = await api.get(`/api/jobposts/company/${companyId}`);
            return data;
        } catch (e) {
            console.error("채용중 공고 조회 실패:", e);
            return [];
        }
    },

    // AppliedNotices
    getApplies: async (): Promise<ApplyItem[]> => {
        const { data } = await api.get('/api/mypage/applies');
        return data;
    },

    // Resume
    getResumes: async (params: { page: number; size: number }): Promise<PagedResponse<ResumeItem>> => {
        const { data } = await api.get('/api/mypage/resumes', { params });
        return data;
    },

    createResume: async (payload: any): Promise<{ id: number }> => {
        const { data } = await api.post('/api/mypage/resumes', payload, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        });
        return data;
    },

    getResumeDetail: async (id: number): Promise<ResumeDto> => {
        const { data } = await api.get(`/api/mypage/resumes/${id}`);
        return data;
    },

    getResumeSnapshot: async (applyId: string): Promise<ResumeDto> => {
        const { data } = await api.get(`/api/mypage/applies/${applyId}/resume`);
        return data;
    },

    updateResume: async (id: number, payload: any): Promise<void> => {
        await api.put(`/api/mypage/resumes/${id}`, payload, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
        });
    },

    deleteResume: async (id: number): Promise<void> => {
        await api.delete(`/api/mypage/resumes/${id}`);
    },

    uploadResumePhoto: async (id: number, file: File): Promise<{ url?: string; idPhoto?: string }> => {
        const form = new FormData();
        form.append("file", file);
        const { data } = await api.post(`/api/mypage/resumes/${id}/photo`, form, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            withCredentials: true,
        });
        return data;
    },

    // Profile for ResumeDetail
    getMyProfile: async (): Promise<MyProfileDto> => {
        const { data } = await api.get('/api/mypage/me');
        return data;
    },

    // FavoriteNotices
    getScrapPosts: async (params: { page: number; size: number }): Promise<PagedResponse<any>> => {
        const { data } = await api.get('/api/mypage/favorites/jobposts', { params });
        return data;
    },

    deleteScrapPost: async (id: number): Promise<void> => {
        await api.delete(`/api/mypage/favorites/jobposts/${id}`);
    },

    getJobPostDetail: async (jobPostId: number): Promise<any> => {
        const { data } = await api.get(`/api/jobposts/${jobPostId}`);
        return data;
    },

    applyJob: async (payload: { jobPostId: number; resumeId: number }): Promise<void> => {
        await api.post('/api/mypage/applies', payload);
    },

    // MyPosts & EditMyPost
    getMyPosts: async (): Promise<any[]> => {
        const { data } = await api.get('/api/board/mine', { withCredentials: true });
        return data;
    },

    getBoardDetail: async (id: string): Promise<any> => {
        const { data } = await api.get(`/api/board/${id}`);
        return data;
    },

    updateBoard: async (id: string, payload: { title: string; content: string }): Promise<void> => {
        await api.put(`/api/board/${id}`, payload);
    },

    deleteBoard: async (id: number): Promise<void> => {
        await api.delete(`/api/board/${id}`);
    }
};
