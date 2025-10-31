import api from './api';

export interface BoardListResponse {
  id: number;
  title: string;
  content: string;
  usersId: number;
  usersName: string;
  nickname: string;
  usersProfileImage: string | null;
  createAt: string;
  updateAt: string | null;
  views: number;
  comments: CommentResponse[];
}

export interface CommentResponse {
  id: number;
  content: string;
  usersId: number;
  usersName: string;
  nickname: string;
  usersProfileImage: string | null;
  boardId: number;
  parentCommentId: number | null;
  createAt: string;
  updateAt: string | null;
}

export interface CreateBoardRequest {
  title: string;
  content: string;
}

export interface CreateCommentRequest {
  content: string;
  boardId: number;
  parentCommentId?: number | null;
}

export const boardApi = {
  getAllBoards: async (): Promise<BoardListResponse[]> => {
    const response = await api.get('/api/board');
    return response.data;
  },

  getPopularBoards: async (): Promise<BoardListResponse[]> => {
    const response = await api.get('/api/board/popular');
    return response.data;
  },

  getBoardById: async (id: number): Promise<BoardListResponse> => {
    const response = await api.get(`/api/board/${id}`);
    return response.data;
  },

  incrementView: async (id: number): Promise<BoardListResponse> => {
    const response = await api.put(`/api/board/${id}/view`);
    return response.data;
  },

  createBoard: async (data: CreateBoardRequest): Promise<BoardListResponse> => {
    const response = await api.post('/api/board', data);
    return response.data;
  },

  // 방법 1: 쿼리 파라미터로 전달 (추천)
  searchBoards: async (keyword: string): Promise<BoardListResponse[]> => {
    console.log('🔍 검색 API 호출:', keyword);
    try {
      const response = await api.get('/api/board/search', {
        params: { 
          keyword: keyword.trim() 
        }
      });
      console.log('✅ 검색 API 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 검색 API 에러:', error.response?.data || error.message);
      throw error;
    }
  }
};

export const commentApi = {
  getCommentsByBoardId: async (boardId: number): Promise<CommentResponse[]> => {
    const response = await api.get(`/api/comment/board/${boardId}`);
    return response.data;
  },

  createComment: async (data: CreateCommentRequest): Promise<CommentResponse> => {
    const response = await api.post('/api/comment', data);
    return response.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await api.delete(`/api/comment/${commentId}`);
  }
};