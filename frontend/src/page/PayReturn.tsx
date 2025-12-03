import { useSearchParams } from "react-router-dom";
import api from "../api/api";
import { useEffect } from "react";

export default function PayReturn() {
  const [params] = useSearchParams();

  const tid = params.get("tid");
  const authToken = params.get("authToken");
  const orderNumber = params.get("orderNumber");

  useEffect(() => {
    if (!tid || !authToken || !orderNumber) return;

    api.post("/api/pay/approve", {
      tid,
      authToken,
      orderNumber,
      type: "APPROVE",
    })
      .then((res) => {
        alert("결제 성공! 토큰 충전 완료");
        console.log(res.data);
      })
      .catch((err) => {
        console.error(err);
        alert("승인 실패");
      });
  }, []);

  return <div className="p-4">결제 승인 처리 중...</div>;
}
