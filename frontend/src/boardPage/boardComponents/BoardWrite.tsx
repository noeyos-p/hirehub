import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { boardApi } from '../../api/boardApi';

const BoardWrite: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

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

      // 서버에서 토큰으로 로그인 유저 판별
      const createdBoard = await boardApi.createBoard({
        title: title.trim(),
        content: content.trim()
      });

      alert('게시글이 작성되었습니다.');
      navigate(`/board/${createdBoard.id}`);
    } catch (err: any) {
      console.error('게시글 작성 실패:', err);
      if (err.response?.status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login');
      } else {
        alert('게시글 작성에 실패했습니다.');
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

  return (
    <section className="mb-8 max-w-3xl mx-auto py-6 px-4 bg-gray-50 rounded-lg">
      <button
        onClick={() => navigate('/board')}
        className="flex items-center text-gray-500 text-sm mb-6 hover:text-gray-700"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        목록으로
      </button>

      <h2 className="text-xl font-bold text-gray-800">게시글 작성</h2>
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
          {loading ? '등록 중...' : '등록'}
        </button>
      </div>
    </section>
  );
};

export default BoardWrite;
