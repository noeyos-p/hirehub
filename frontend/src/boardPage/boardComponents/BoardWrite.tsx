import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { boardApi } from '../../api/boardApi';

const BoardWrite: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const isEditMode = Boolean(id);

  // 수정 모드일 때 기존 게시글 불러오기
  useEffect(() => {
    if (isEditMode && id) {
      const fetchBoard = async () => {
        try {
          setInitialLoading(true);
          const board = await boardApi.getBoardById(Number(id));
          setTitle(board.title);
          setContent(board.content);
        } catch (err) {
          console.error('게시글 조회 실패:', err);
          alert('게시글을 불러오는데 실패했습니다.');
          navigate('/board');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchBoard();
    }
  }, [isEditMode, id, navigate]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && id) {
        // 수정 모드
        const updatedBoard = await boardApi.updateBoard(Number(id), {
          title: title.trim(),
          content: content.trim()
        });

        alert('게시글이 수정되었습니다.');
        navigate(`/board/${updatedBoard.id}`);
      } else {
        // 작성 모드
        const createdBoard = await boardApi.createBoard({
          title: title.trim(),
          content: content.trim()
        });

        alert('게시글이 작성되었습니다.');
        navigate(`/board/${createdBoard.id}`);
      }
    } catch (err: any) {
      console.error(isEditMode ? '게시글 수정 실패:' : '게시글 작성 실패:', err);
      if (err.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      } else if (err.response?.status === 403) {
        alert('본인의 게시글만 수정할 수 있습니다.');
      } else {
        alert(isEditMode ? '게시글 수정에 실패했습니다.' : '게시글 작성에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        navigate('/board');
      }
    } else {
      navigate('/board');
    }
  };

  if (initialLoading) {
    return (
      <section className="mb-8 max-w-3xl mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 max-w-3xl mx-auto py-6 px-4 bg-gray-50 rounded-lg">
      <button
        onClick={() => navigate(isEditMode && id ? `/board/${id}` : '/board')}
        className="flex items-center text-gray-500 text-sm mb-6 hover:text-gray-700"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        {isEditMode ? '상세로' : '목록으로'}
      </button>

      <h2 className="text-xl font-bold text-gray-800">{isEditMode ? '게시글 수정' : '게시글 작성'}</h2>
      <br />

      {/* 제목 */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          제목
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          disabled={loading}
        />
      </div>

      {/* 내용 */}
      <div className="mb-6">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          내용
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
          rows={8}
          className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none"
          disabled={loading}
        />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-4 py-2 disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-black text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '수정' : '등록')}
        </button>
      </div>
    </section>
  );
};

export default BoardWrite;
