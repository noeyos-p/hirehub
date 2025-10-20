import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftIcon, EyeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

const BoardDetail: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="mb-8">
      <button
        onClick={() => navigate('/board')}
        className="flex items-center text-gray-500 text-sm mb-6 hover:text-gray-700"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        목록으로
      </button>

      {/* 게시글 제목 */}
      <h2 className="text-2xl font-bold text-gray-900 mb-4">퇴사가 너무 하고싶은데요</h2>

      {/* 작성자 정보 */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
        <div>
          <p className="font-medium text-gray-800">홍길동</p>
          <p>25.12.31 23:59</p>
        </div>
        <div className="flex items-center ml-4 space-x-3 text-gray-400">
          <div className="flex items-center space-x-1">
            <EyeIcon className="w-4 h-4" />
            <span>50</span>
          </div>
          <div className="flex items-center space-x-1">
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span>50</span>
          </div>
        </div>
      </div>

      {/* 본문 내용 */}
      <div className="border-t border-b border-gray-200 py-6 text-gray-800 leading-relaxed whitespace-pre-line">
        다들 출근이 너무 고통스러운데 참고 다니시는건가요?  
        먹고살아야하니까요? 요즘같이 경기 안좋고 취업 어려운데 감사하고 다녀야하는건가요  
        개인의 삶이 없는데 다녀야 할 이유를 찾는게 너무 어려워요  
        다들 그렇게 살고있는건지도 궁금합니다
      </div>

      {/* 댓글 영역 */}
      <div className="mt-8">
        <h3 className="text-md font-semibold text-gray-800 mb-4">댓글 50</h3>

        {/* 댓글 리스트 */}
        <div className="space-y-6 mb-8">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">홍길동</p>
                <p className="text-sm text-gray-800">똥 먹어본 사람 좋아요</p>
                <p className="text-xs text-gray-400 mt-1">25.12.31 23:59</p>
              </div>
            </div>
          ))}
        </div>

        {/* 댓글 입력창 */}
        <div className="flex items-center border border-gray-300 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="댓글을 남겨주세요"
            className="flex-1 text-sm outline-none"
          />
          <button className="text-sm text-gray-600 hover:text-gray-900">
            ➤
          </button>
        </div>
      </div>
    </section>
  );
};

export default BoardDetail;
