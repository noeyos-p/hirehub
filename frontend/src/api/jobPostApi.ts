import api from './api';
import type {
    JobPostResponse,
    CompanyResponse,
    ReviewResponse,
    ResumeResponse,
    CreateReviewRequest,
    ApplyRequest
} from '../types/interface';

export const jobPostApi = {
    getJobPosts: async (): Promise<JobPostResponse[]> => {
        const response = await api.get('/api/jobposts');
        return response.data;
    },

    getJobPostById: async (id: number): Promise<JobPostResponse> => {
        const response = await api.get(`/api/jobposts/${id}`);
        return response.data;
    },

    incrementJobView: async (id: number): Promise<void> => {
        await api.post(`/api/jobposts/${id}/views`);
    },

    getCompanies: async (): Promise<CompanyResponse[]> => {
        const response = await api.get('/api/companies');
        return response.data;
    },

    getCompanyById: async (id: number): Promise<CompanyResponse> => {
        const response = await api.get(`/api/companies/${id}`);
        return response.data;
    },

    getCompanyReviews: async (companyId: number): Promise<ReviewResponse[]> => {
        const response = await api.get(`/api/reviews/company/${companyId}`);
        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data?.content && Array.isArray(response.data.content)) {
            return response.data.content;
        }
        return [];
    },

    createReview: async (data: CreateReviewRequest): Promise<void> => {
        await api.post('/api/reviews', data);
    },

    getFavoriteCompanies: async (): Promise<any[]> => {
        const response = await api.get('/api/mypage/favorites/companies?page=0&size=1000');
        return response.data.rows || response.data.content || response.data.items || [];
    },

    addFavoriteCompany: async (companyId: number): Promise<void> => {
        await api.post(`/api/mypage/favorites/companies/${companyId}`);
    },

    removeFavoriteCompany: async (companyId: number): Promise<void> => {
        await api.delete(`/api/mypage/favorites/companies/${companyId}`);
    },

    getScrappedJobs: async (): Promise<any[]> => {
        const response = await api.get('/api/mypage/favorites/jobposts?page=0&size=1000');
        return response.data.rows || response.data.content || [];
    },

    addScrapJob: async (jobId: number): Promise<void> => {
        await api.post(`/api/mypage/favorites/jobposts/${jobId}`);
    },

    removeScrapJob: async (jobId: number): Promise<void> => {
        await api.delete(`/api/mypage/favorites/jobposts/${jobId}`);
    },

    getResumes: async (): Promise<ResumeResponse[]> => {
        const response = await api.get('/api/mypage/resumes', {
            params: { page: 0, size: 50 },
        });
        return response.data?.items ?? response.data?.content ?? [];
    },

    applyToJob: async (data: ApplyRequest): Promise<void> => {
        await api.post('/api/mypage/applies', data);
    }
};
