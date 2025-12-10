import React, { useEffect, useState } from "react";
import { payApi } from "../../api/payApi";
import { CreditCardIcon, CalendarIcon, ArchiveBoxIcon } from "@heroicons/react/24/outline";

interface PaymentItem {
  id: number;
  tokenAmount?: number;
  amount: number;
  payMethod?: string;
  createdAt: string;
}

const MyPagePaymentHistory: React.FC = () => {
  const [list, setList] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await payApi.myPayments();
        setList(res.data);
      } catch (err) {
        console.error("결제 내역 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px] py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CreditCardIcon className="w-8 h-8 md:w-10 md:h-10 text-[#006AFF] mr-2" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">결제 내역</h1>
        </div>
        <p className="text-sm md:text-base text-gray-600">
          토큰 구매 내역과 결제 정보를 확인하실 수 있습니다.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006AFF]"></div>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ArchiveBoxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">결제 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">결제 일시</th>
                  <th className="px-6 py-4 font-medium">상품명</th>
                  <th className="px-6 py-4 font-medium">결제 수단</th>
                  <th className="px-6 py-4 font-medium text-right">결제 금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        {item.createdAt?.substring(0, 10)}
                        <span className="text-gray-400 mx-1">|</span>
                        {item.createdAt?.substring(11, 16)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        토큰 {item.tokenAmount ?? "-"}개
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.payMethod === "kakaopay" ? (
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                          카카오페이
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
                          카드 결제
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      {item.amount.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPagePaymentHistory;
