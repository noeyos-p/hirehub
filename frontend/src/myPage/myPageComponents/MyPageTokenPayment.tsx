import { useEffect, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../hooks/useAuth";

declare global {
  interface Window {
    IMP: any;
  }
}

const tokenProducts = [
  { tokens: 10, price: 1000, color: "#4A90E2" },
  { tokens: 30, price: 2900, color: "#3CC757" },
  { tokens: 50, price: 4800, color: "#FF9500" },
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
    <div style={{ padding: "20px" }}>
      <h2>토큰 결제</h2>
      <p>원하는 토큰 상품을 선택하여 결제를 진행하세요.</p>

      {/* ====================== */}
      {/* 🔥 토큰 상품 카드 UI */}
      {/* ====================== */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        {tokenProducts.map((item) => (
          <div
            key={item.tokens}
            style={{
              width: "220px",
              padding: "20px",
              borderRadius: "12px",
              border: `2px solid ${item.color}`,
              background: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                marginBottom: "10px",
                color: item.color,
              }}
            >
              ● {item.tokens} Tokens
            </div>

            <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>
              {item.price.toLocaleString()}원
            </div>

            <button
              disabled={loading}
              onClick={() => requestPayment(item.price, item.tokens)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: item.color,
                color: "#fff",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              구매하기
            </button>
          </div>
        ))}
      </div>

      {/* ====================== */}
      {/* 🟡 결제수단 선택 UI */}
      {/* ====================== */}
      <h3 style={{ marginTop: "40px" }}>결제 수단 선택</h3>
      <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
        {/* 카드 선택 */}
        <button
          onClick={() => setPayMethod("card")}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: payMethod === "card" ? "2px solid #4A90E2" : "1px solid #ccc",
            background: payMethod === "card" ? "#E6F2FF" : "#fff",
            cursor: "pointer",
          }}
        >
          💳 카드 결제 (이니시스)
        </button>

        {/* 카카오페이 선택 */}
        <button
          onClick={() => setPayMethod("kakaopay")}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: payMethod === "kakaopay" ? "2px solid #F7C600" : "1px solid #ccc",
            background: payMethod === "kakaopay" ? "#FFF6C8" : "#fff",
            cursor: "pointer",
          }}
        >
          🟡 카카오페이 결제
        </button>
      </div>
    </div>
  );
};

export default MyPageTokenPayment;
