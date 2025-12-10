import { useEffect, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";

declare global {
  interface Window {
    IMP: any;
  }
}

const tokenProducts = [
  { tokens: 10, price: 1000, color: "#7CAEF2" }, // Soft Blue
  { tokens: 30, price: 2900, color: "#66D294" }, // Soft Green
  { tokens: 50, price: 4800, color: "#FFB358" }, // Soft Orange
];

const MyPageTokenPayment = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  /** 🔑 환경변수에서 PortOne IMP 코드 */
  const IMP_KEY = import.meta.env.VITE_PORTONE_IMP_KEY;

  /** 💳 or 🟡 어떤 결제수단을 사용할지 */
  const [payMethod, setPayMethod] = useState<"card" | "kakaopay">("card");

  /** IMP 초기화 */
  useEffect(() => {
    if (!window.IMP) {
      console.error("❌ window.IMP 로드 실패");
      return;
    }

    if (!IMP_KEY) {
      console.error("❌ VITE_PORTONE_IMP_KEY 없음");
      return;
    }

    console.log("🔑 IMP.init 실행됨:", IMP_KEY);
    window.IMP.init(IMP_KEY);
  }, [IMP_KEY]);

  /** 🚀 결제 요청 */
  const requestPayment = async (price: number, tokenAmount: number) => {
    if (!user) return alert("로그인 후 이용해주세요.");
    if (loading) return;

    setLoading(true);

    try {
      const orderId = `order_${Date.now()}`;
      const { IMP } = window;

      // ⭐ 사용자가 선택한 결제수단에 따라 PG 자동 변경
      const pg = payMethod === "kakaopay" ? "kakaopay" : "html5_inicis";

      const name = `토큰 ${tokenAmount}개`;

      console.log("📡 결제 요청:", {
        pg,
        amount: price,
        buyer: user?.email,
        tokenAmount,
      });

      IMP.request_pay(
        {
          pg,
          pay_method: payMethod === "card" ? "card" : undefined,
          merchant_uid: orderId,
          name,
          amount: price,

          buyer_email: user.email,
          buyer_name: user.name,
        },
        async (rsp: any) => {
          if (rsp.success) {
            console.log("✔ 결제 성공:", rsp);

            try {
              const verifyRes = await api.post("/api/pay/verify", {
                impUid: rsp.imp_uid,
                merchantUid: rsp.merchant_uid,
                amount: rsp.paid_amount,
                tokenAmount,
              });

              console.log("✔ 서버 검증 완료:", verifyRes.data);

              alert("결제가 정상적으로 완료되었습니다!");
              window.location.reload();
            } catch (err) {
              console.error("❌ 서버 검증 실패:", err);
              alert(
                "결제 승인 후 검증에 실패했습니다.\n관리자에게 문의해주세요."
              );
            }
          } else {
            console.warn("❌ 결제 실패:", rsp);
            alert("결제가 취소되었거나 실패했습니다.");
          }

          setLoading(false);
        }
      );
    } catch (err) {
      console.error("❌ 결제 요청 오류:", err);
      alert("결제 요청 중 문제가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px] py-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">토큰 결제</h2>
      <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">원하는 토큰 상품을 선택하여 결제를 진행하세요.</p>

      {/* ====================== */}
      {/* 🔥 토큰 상품 카드 UI */}
      {/* ====================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        {tokenProducts.map((item) => (
          <div
            key={item.tokens}
            className="group flex flex-col items-center p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#006AFF]"
          >
            <div
              className="font-bold text-lg md:text-xl mb-3 transition-colors"
              style={{ color: item.color }}
            >
              ● {item.tokens} Tokens
            </div>

            <div className="text-2xl md:text-3xl font-extrabold mb-6 text-gray-900">
              {item.price.toLocaleString()}원
            </div>

            <button
              disabled={loading}
              onClick={() => requestPayment(item.price, item.tokens)}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm md:text-base shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] bg-[#006AFF]"
            >
              {loading ? "처리중..." : "구매하기"}
            </button>
          </div>
        ))}
      </div>

      {/* ====================== */}
      {/* 🟡 결제수단 선택 UI */}
      {/* ====================== */}
      <div className="mt-10 md:mt-14 border-t border-gray-100 pt-8">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">결제 수단 선택</h3>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          {/* 카드 선택 */}
          <button
            onClick={() => setPayMethod("card")}
            className={`flex items-center justify-center px-6 py-4 rounded-xl border-2 transition-all duration-200 text-sm md:text-base font-semibold ${payMethod === "card"
              ? "border-[#4A90E2] bg-[#F0F7FF] text-[#2B5F8C] shadow-sm"
              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300"
              }`}
          >
            <span className="mr-2 text-xl">💳</span> 카드 결제 (이니시스)
          </button>

          {/* 카카오페이 선택 */}
          <button
            onClick={() => setPayMethod("kakaopay")}
            className={`flex items-center justify-center px-6 py-4 rounded-xl border-2 transition-all duration-200 text-sm md:text-base font-semibold ${payMethod === "kakaopay"
              ? "border-[#F7C600] bg-[#FFFBE6] text-[#6B5700] shadow-sm"
              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300"
              }`}
          >
            <span className="mr-2 text-xl">🟡</span> 카카오페이 결제
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPageTokenPayment;
