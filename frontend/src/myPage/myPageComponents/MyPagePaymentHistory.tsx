import React, { useEffect, useState } from "react";
import { payApi } from "../../api/payApi";

interface PaymentItem {
  id: number;
  tokenAmount?: number;
  amount: number;
  payMethod?: string;
  createdAt: string;
}

const MyPagePaymentHistory: React.FC = () => {
  const [list, setList] = useState<PaymentItem[]>([]);

  useEffect(() => {
    (async () => {
      const res = await payApi.myPayments();
      setList(res.data);
    })();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded-lg">
      <h2 className="text-2xl font-semibold mb-6">결제 내역</h2>

      {list.length === 0 ? (
        <p className="text-gray-500">결제 내역이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {list.map((item) => (
            <div
              key={item.id}
              className="p-4 border rounded-lg bg-gray-50 flex justify-between"
            >
              <div>
                <div className="font-semibold">
                  토큰 {item.tokenAmount ?? "-"}개 구매
                </div>
                <div className="text-gray-500 text-sm">
                  결제 방식: {item.payMethod ?? "카카오페이"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{item.amount}원</div>
                <div className="text-gray-500 text-sm">
                  {item.createdAt?.substring(0, 10)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPagePaymentHistory;
