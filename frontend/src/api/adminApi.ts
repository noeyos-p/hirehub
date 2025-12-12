import api from './api';
import type {
  AdminUser,
  AdminJob,
  AdminCompany,
  AdminReview,
  AdminAd,
  AdminPost,
  AdminComment,
  AdminResumeDto,
  AdminResponse
} from '../types/interface';

export const adminApi = {
  // User Management
  getUsers: async (params: { page: number; size: number; sortBy?: string; direction?: string; keyword?: string }): Promise<AdminResponse<AdminUser[]>> => {
    const { data } = await api.get('/api/admin/user-management', { params });
    return data;
  },

  createUser: async (payload: Omit<AdminUser, 'id' | 'createdAt'> & { password?: string }): Promise<AdminResponse<AdminUser>> => {
    const { data } = await api.post('/api/admin/user-management', payload);
    return data;
  },

  updateUser: async (id: number, payload: Partial<AdminUser>): Promise<AdminResponse<AdminUser>> => {
    const { data } = await api.put(`/api/admin/user-management/${id}`, payload);
    return data;
  },

  deleteUser: async (id: number): Promise<AdminResponse<void>> => {
    const { data } = await api.delete(`/api/admin/user-management/${id}`);
    return data;
  },

  // Job Management
  getJobs: async (params: { page: number; size: number; sortBy?: string; direction?: string; keyword?: string }): Promise<AdminResponse<AdminJob[]>> => {
    const { data } = await api.get('/api/admin/job-management', { params });
    return data;
  },

  createJob: async (payload: Omit<AdminJob, 'id'>): Promise<AdminResponse<AdminJob>> => {
    const { data } = await api.post('/api/admin/job-management', payload);
    return data;
  },

  updateJob: async (id: number, payload: Partial<AdminJob>): Promise<AdminResponse<AdminJob>> => {
    const { data } = await api.put(`/api/admin/job-management/${id}`, payload);
    return data;
  },

  deleteJob: async (id: number): Promise<AdminResponse<void>> => {
    const { data } = await api.delete(`/api/admin/job-management/${id}`);
    return data;
  },

  uploadJobImage: async (formData: FormData): Promise<any> => {
    const { data } = await api.post('/api/admin/job-management/jobpost-image', formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deleteJobImage: async (id: number): Promise<AdminResponse<void>> => {
    const { data } = await api.delete(`/api/admin/job-management/${id}/image`);
    return data;
  },

  // Company Management
  getCompanies: async (params: { page: number; size: number; sortBy?: string; direction?: string; keyword?: string }): Promise<AdminResponse<AdminCompany[]>> => {
    const { data } = await api.get('/api/admin/company-management', { params });
    return data;
  },

  createCompany: async (payload: Omit<AdminCompany, 'id'>): Promise<AdminResponse<AdminCompany>> => {
    const { data } = await api.post('/api/admin/company-management', payload);
    return data;
  },

  updateCompany: async (id: number, payload: Partial<AdminCompany>): Promise<AdminResponse<AdminCompany>> => {
    const { data } = await api.put(`/api/admin/company-management/${id}`, payload);
    return data;
  },

  deleteCompany: async (id: number): Promise<AdminResponse<void>> => {
    const { data } = await api.delete(`/api/admin/company-management/${id}`);
    return data;
  },

  uploadCompanyImage: async (id: number, formData: FormData): Promise<any> => {
    const { data } = await api.post(`/api/admin/company-management/${id}/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deleteCompanyImage: async (id: number): Promise<AdminResponse<void>> => {
    const { data } = await api.delete(`/api/admin/company-management/${id}/image`);
    return data;
  },

  // Review Management
  getReviews: async (params: { page: number; size: number; sortBy?: string; direction?: string }): Promise<AdminResponse<AdminReview[]>> => {
    const { data } = await api.get('/api/admin/reviews', { params });
    return data;
  },

  deleteReview: async (id: number): Promise<AdminResponse<void>> => {
    const { data } = await api.delete(`/api/admin/reviews/${id}`);
    return data;
  },

  updateReview: async (id: number, payload: { content: string | null; score: number }): Promise<AdminResponse<void>> => {
    const { data } = await api.put(`/api/admin/reviews/${id}`, payload);
    return data;
  },

  // Board Management
  getPosts: async (params: { page: number; size: number; sortBy?: string; direction?: string; keyword?: string }): Promise<AdminResponse<AdminPost[]>> => {
    const url = params.keyword ? '/api/admin/board-management/search' : '/api/admin/board-management';
    const { data } = await api.get(url, { params });
    return data;
  },

  createPost: async (payload: { title: string; content: string }): Promise<AdminResponse<AdminPost>> => {
    const { data } = await api.post('/api/admin/board-management', payload);
    return data;
  },

  updatePost: async (id: number, payload: { title: string; content: string }): Promise<AdminResponse<AdminPost>> => {
    const { data } = await api.put(`/api/admin/board-management/${id}`, payload);
    return data;
  },

  deletePost: async (id: number): Promise<AdminResponse<void>> => {
    const { data } = await api.delete(`/api/admin/board-management/${id}`);
    return data;
  },

  // Comment Management
  getComments: async (params: { page: number; size: number; sortBy?: string; direction?: string }): Promise<AdminResponse<AdminComment[]>> => {
    const { data } = await api.get('/api/admin/comments', { params });
    return data;
  },

  deleteComment: async (id: number): Promise<any> => {
    const { data } = await api.delete(`/api/admin/comments/${id}`);
    return data;
  },

  updateComment: async (id: number, payload: { content: string; updateAt: string }): Promise<AdminResponse<void>> => {
    const { data } = await api.put(`/api/admin/comments/${id}`, payload);
    return data;
  },

  // Resume Management
  getResumes: async (params: { page: number; size: number; sort?: string }): Promise<AdminResponse<AdminResumeDto[]>> => {
    const { data } = await api.get('/api/admin/resume-management', { params });
    return data;
  },

  getResumeDetail: async (id: number): Promise<AdminResponse<AdminResumeDto>> => {
    const { data } = await api.get(`/api/admin/resume-management/${id}`);
    return data;
  },

  // Ads Management
  getAds: async (): Promise<AdminResponse<any[]>> => {
    const { data } = await api.get('/api/admin/ads-management/ads');
    return data;
  },

  uploadAdImage: async (formData: FormData): Promise<any> => {
    const { data } = await api.post('/api/admin/ads-management/ad-image', formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  deleteAd: async (adId: number, fileUrl: string): Promise<AdminResponse<void>> => {
    const { data } = await api.delete('/api/admin/ads-management/file', {
      params: { fileUrl, adId }
    });
    return data;
  },

  // ✅ AI 봇 차단 관리
  getAiBoardControls: async (): Promise<any> => {
    const { data } = await api.get('/api/admin/ai-board-controls');
    return data;
  },

  restoreAiBoardControl: async (id: number): Promise<any> => {
    const { data } = await api.post(`/api/admin/ai-board-controls/${id}/restore`);
    return data;
  },

  deleteAiBoardControl: async (id: number): Promise<any> => {
    const { data } = await api.delete(`/api/admin/ai-board-controls/${id}`);
    return data;
  }
};
