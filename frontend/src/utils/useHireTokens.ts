import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { tokenApi } from "../api/tokenApi";


export function useHireTokens() {
  const navigate = useNavigate();   // ← 반드시 훅 내부에 있어야 함!!!

  const [modalOpen, setModalOpen] = useState(false);
  const [neededTokens, setNeededTokens] = useState(0);
  const [resolveFunc, setResolveFunc] = useState<(value: boolean) => void>();

  // HIRE 차감
const useTokens = async (
  amount: number,
  feature: string,
  description: string
) => {
  try {
    await tokenApi.use(amount, feature, description);
    return true;
  } catch (err: any) {
    if (err.response?.status === 402) {
      setNeededTokens(amount);
      setModalOpen(true);
      return false;
    }
    throw err;
  }
};


  const handleConfirm = () => {
    setModalOpen(false);
    resolveFunc?.(false);
    navigate("/myPage/MyPageTokenPayment");  // ← 결제 페이지로 이동
  };

  const handleClose = () => {
    setModalOpen(false);
    resolveFunc?.(false);
  };

  return {
    useTokens,
    modalOpen,
    neededTokens,
    handleConfirm,
    handleClose,
  };
}
