import React from "react";

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  needed: number; // 필요한 토큰 개수
}

const TokenModal: React.FC<TokenModalProps> = ({ isOpen, onClose, onConfirm, needed }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">HIRE 토큰 부족</h2>
        <p className="text-gray-600 mb-6">
          이 기능을 이용하려면 <strong>{needed} HIRE</strong>가 필요합니다.
          <br />
          결제를 진행하시겠습니까?
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#006AFF] text-white rounded-lg hover:bg-blue-600"
          >
            결제하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenModal;
