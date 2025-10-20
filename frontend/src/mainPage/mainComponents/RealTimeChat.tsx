import React from 'react';

const RealTimeChat: React.FC = () => {
  return (
    <section className="">
      <h2 className="text-lg font-bold text-gray-800 mb-4">실시간 채팅</h2>
      {/* 플레이스홀더: 실제 comment/users 테이블로 채팅 구현 */}
      <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-500">
        채팅 UI 자리 (comment/users 테이블 연동 예정)
      </div>
    </section>
  );
};

export default RealTimeChat;