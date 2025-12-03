import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function PaymentTest() {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    api.get("/api/token-packages")
      .then((res) => {
        console.log("패키지 응답:", res.data);
        setPackages(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handlePay = async (pkg) => {
    try {
      const res = await api.post("/api/pay/ready", {
        tokenPackageId: pkg.id,
        amount: pkg.price,
        goodName: pkg.name,
        type: "READY",
      });

      window.location.href = res.data.payUrl;
    } catch (err) {
      console.error(err);
      alert("결제 준비 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="font-bold text-xl mb-4">토큰 결제 테스트</h2>

      {packages.length === 0 && <p>패키지를 불러오는 중...</p>}

      <div className="space-y-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="p-4 bg-white rounded-lg shadow border flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-lg">{pkg.name}</p>
              <p className="text-gray-600">{pkg.price.toLocaleString()}원</p>
              <p className="text-gray-400">토큰 {pkg.token_amount}개 제공</p>
            </div>

            <button
              onClick={() => handlePay(pkg)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              결제하기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
